"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { allocate, chargeView, ilDate, isRecordMethod, methodLabel, NOTE_MAX, openCharges, TITLE_MAX } from "@/lib/billing/account";
import { chargeInclude, ensureMember, memberCharges, nextReceiptNo, settleLeaver, toChargeIn } from "@/lib/billing/member-money";
import { emailOf } from "@/lib/billing/pay-server";
import { sendEmail } from "@/lib/email";
import { formatShekels, shekelsToMinor } from "@/lib/money";
import { notifyMember } from "@/lib/notify-server";

// Who may handle the org's money: its owner, admins and treasurer.
async function moneyAdmin(orgId: string) {
    const session = await getSession();
    if (!session) return null;
    const link = await db.orgUser.findFirst({ where: { orgId, userId: session.userId, role: { in: ["owner", "admin", "treasurer"] }, status: "active" }, include: { org: true } });
    if (!link || link.org.status !== "active" || link.org.packId === "celebration") return null;
    return { userId: session.userId, org: link.org };
}

// Tells a member by email, when they have one. Other channels wait for the messages service
// (docs/waiting-for-services.he.md).
async function tellMember(memberId: string, subject: string, text: string) {
    const link = await db.orgUser.findUnique({ where: { memberId }, include: { user: { include: { contacts: true } } } });
    const email = link ? emailOf(link.user.contacts) : null;
    if (email) await sendEmail(email, subject, text).catch(() => undefined);
}

const dayOf = (raw: string) => (/^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00Z`) : null);
const todayIL = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());

export type ChargeFormState = { error?: string; done?: string; title?: string; amount?: string; due?: string; note?: string; to?: string; picked?: string[] };

// A new charge to members (board D-AdmCharge). One Charge per member. A sent charge is never deleted, only
// cancelled.
export async function createCharges(_prev: ChargeFormState, form: FormData): Promise<ChargeFormState> {
    const orgId = String(form.get("orgId") ?? "");
    const title = String(form.get("title") ?? "").trim();
    const amountRaw = String(form.get("amount") ?? "");
    const dueRaw = String(form.get("due") ?? "");
    const note = String(form.get("note") ?? "").trim();
    const to = String(form.get("to") ?? "all");
    const picked = form.getAll("members").map(String);
    const typed = { title, amount: amountRaw, due: dueRaw, note, to, picked };
    const a = await moneyAdmin(orgId);
    if (!a) return { ...typed, error: "אין לך הרשאה לחייב בארגון הזה." };
    if (!title || title.length > TITLE_MAX) return { ...typed, error: "כתבו כותרת קצרה לחיוב." };
    const amount = shekelsToMinor(amountRaw);
    if (!amount) return { ...typed, error: "הסכום לא תקין." };
    const due = dayOf(dueRaw);
    if (!due || dueRaw < todayIL()) return { ...typed, error: "תאריך התשלום צריך להיות היום או אחריו." };
    if (note.length > NOTE_MAX) return { ...typed, error: "ההסבר ארוך מדי." };
    const links = await db.orgUser.findMany({
        where: { orgId, status: "active", role: { not: "guest" }, ...(to === "picked" ? { id: { in: picked } } : {}) },
        select: { id: true },
    });
    if (!links.length) return { ...typed, error: to === "picked" ? "בחרו לפחות חבר אחד." : "אין עדיין חברים פעילים." };
    const notify = form.get("notify") === "on";
    for (const l of links) {
        const m = await ensureMember(l.id);
        const c = await db.charge.create({ data: { orgId, memberId: m.id, kind: "one_time", description: title, note: note || null, amountMinor: amount, dueOn: due } });
        await notifyMember(m.id, { orgId, kind: "action", topic: "charge", refId: c.id, text: `${title} · ${formatShekels(amount)}, לתשלום עד ${ilDate(due)}`, href: `/pay/${orgId}`, actionLabel: "לתשלום" });
        if (notify) await tellMember(m.id, `חיוב חדש מ${a.org.name}: ${title}`, `${title}\nסכום: ${formatShekels(amount)}\nלתשלום עד ${ilDate(due)}${note ? `\n${note}` : ""}\nאפשר לשלם בכרטיס החבר שבארנק.`);
    }
    revalidatePath(`/orgs/${orgId}/money`);
    revalidatePath(`/orgs/${orgId}/members`, "layout");
    return { done: links.length === 1 ? "החיוב נשלח לחבר אחד." : `החיוב נשלח ל-${links.length} חברים.` };
}

export type RecordState = { error?: string; done?: boolean };

// A payment the org received outside the app, recorded by an admin (board D-MAdmPayRecord). It covers the
// chosen charge first and then the member's other open charges.
export async function recordPayment(_prev: RecordState, form: FormData): Promise<RecordState> {
    const chargeId = String(form.get("chargeId") ?? "");
    const charge = await db.charge.findUnique({ where: { id: chargeId }, include: chargeInclude });
    if (!charge?.memberId) return { error: "החיוב לא נמצא." };
    const a = await moneyAdmin(charge.orgId);
    if (!a) return { error: "אין לך הרשאה." };
    const amount = shekelsToMinor(String(form.get("amount") ?? ""));
    const method = String(form.get("method") ?? "cash");
    const date = dayOf(String(form.get("date") ?? "")) ?? new Date();
    const note = String(form.get("note") ?? "").trim().slice(0, NOTE_MAX);
    if (!amount) return { error: "הסכום לא תקין." };
    if (!isRecordMethod(method)) return { error: "בחרו איך שולם." };
    const open = openCharges(await memberCharges(charge.orgId, charge.memberId));
    const first = open.find((c) => c.id === chargeId);
    if (!first) return { error: "החיוב הזה כבר שולם או בוטל." };
    const order = [first, ...open.filter((c) => c.id !== chargeId)];
    const owed = order.reduce((t, c) => t + c.leftMinor, 0);
    if (amount > owed) return { error: `הסכום גבוה מהחוב הפתוח (${formatShekels(owed)}).` };
    const parts = allocate(amount, order);
    let paymentId = "";
    for (let attempt = 0; ; attempt++) {
        try {
            await db.$transaction(async (tx) => {
                const receiptNo = await nextReceiptNo(tx, charge.orgId);
                ({ id: paymentId } = await tx.payment.create({
                    data: {
                        orgId: charge.orgId, memberId: charge.memberId, amountMinor: amount, method, source: "manual", status: "succeeded", receivedAt: date, note: note || null, receiptNo, reviewedById: a.userId, reviewedAt: new Date(),
                        allocations: { create: parts.map((p) => ({ orgId: charge.orgId, chargeId: p.chargeId, amountMinor: p.amountMinor })) },
                    },
                }));
            });
            break;
        } catch (e) {
            if (attempt < 4 && e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
            throw e;
        }
    }
    await settleLeaver(charge.orgId, charge.memberId);
    await notifyMember(charge.memberId, { orgId: charge.orgId, kind: "update", topic: "payment", refId: paymentId, text: `נרשם תשלום של ${formatShekels(amount)} (${methodLabel(method, null)}). הקבלה שמורה בארנק.`, href: `/pay/receipt/${paymentId}` });
    if (form.get("notify") === "on") await tellMember(charge.memberId, `${a.org.name} קיבל את התשלום`, `נרשם תשלום של ${formatShekels(amount)} (${methodLabel(method, null)}) מתאריך ${ilDate(date)}.\nהקבלה שמורה בארנק, בהיסטוריית התשלומים.`);
    revalidatePath(`/orgs/${charge.orgId}/money`);
    revalidatePath(`/orgs/${charge.orgId}/members`, "layout");
    return { done: true };
}

// Confirms or turns down a member's "שילמתי מחוץ לאפליקציה" report.
export async function reviewReport(paymentId: string, ok: boolean): Promise<void> {
    const pay = await db.payment.findUnique({ where: { id: paymentId }, include: { allocations: { select: { chargeId: true } } } });
    if (!pay || pay.status !== "pending" || pay.source !== "report") return;
    const a = await moneyAdmin(pay.orgId);
    if (!a) return;
    for (let attempt = 0; ; attempt++) {
        try {
            await db.$transaction(async (tx) => {
                const receiptNo = ok ? await nextReceiptNo(tx, pay.orgId) : null;
                await tx.payment.update({ where: { id: pay.id, status: "pending" }, data: { status: ok ? "succeeded" : "rejected", receiptNo, reviewedById: a.userId, reviewedAt: new Date() } });
            });
            break;
        } catch (e) {
            if (attempt < 4 && e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
            throw e;
        }
    }
    if (ok) await settleLeaver(pay.orgId, pay.memberId);
    await notifyMember(pay.memberId, ok
        ? { orgId: pay.orgId, kind: "update", topic: "report", refId: pay.id, text: `התשלום של ${formatShekels(pay.amountMinor)} אושר. הקבלה שמורה בארנק.`, href: `/pay/receipt/${pay.id}` }
        : { orgId: pay.orgId, kind: "action", topic: "charge", refId: pay.allocations[0]?.chargeId ?? null, text: `הדיווח על תשלום של ${formatShekels(pay.amountMinor)} לא אושר, והחיוב חזר להיות פתוח.`, href: `/pay/${pay.orgId}`, actionLabel: "לתשלום" });
    if (pay.memberId) {
        await tellMember(
            pay.memberId,
            ok ? `${a.org.name} אישר את התשלום` : `${a.org.name} לא אישר את הדיווח על התשלום`,
            ok ? `התשלום של ${formatShekels(pay.amountMinor)} אושר. הקבלה שמורה בארנק.` : `הדיווח על ${formatShekels(pay.amountMinor)} לא אושר, והחיוב חזר להיות פתוח. אפשר לשלם בכרטיס החבר או לדבר עם הארגון.`,
        );
    }
    revalidatePath(`/orgs/${pay.orgId}/money`);
    revalidatePath(`/orgs/${pay.orgId}/members`, "layout");
}

// Cancels a charge that nothing was paid on yet.
export async function voidCharge(chargeId: string): Promise<void> {
    const charge = await db.charge.findUnique({ where: { id: chargeId }, include: chargeInclude });
    if (!charge || charge.voidedAt) return;
    const a = await moneyAdmin(charge.orgId);
    if (!a) return;
    const v = chargeView(toChargeIn(charge));
    if (!v || v.leftMinor !== v.amountMinor || v.state !== "open") return;
    await db.charge.update({ where: { id: chargeId }, data: { voidedAt: new Date() } });
    await settleLeaver(charge.orgId, charge.memberId);
    revalidatePath(`/orgs/${charge.orgId}/money`);
    revalidatePath(`/orgs/${charge.orgId}/members`, "layout");
}
