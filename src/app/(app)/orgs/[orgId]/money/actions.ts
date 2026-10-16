"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { allocate, chargeView, ilDate, isRecordMethod, methodLabel, NOTE_MAX, openCharges } from "@/lib/billing/account";
import { pickRecipients, readChargeInput, type ChargeInput } from "@/lib/billing/charge-plan";
import { loadRecipients } from "@/lib/billing/charge-server";
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

export type ChargeResult = { ok?: string; error?: string; draftId?: string };

function checkCharge(input: ChargeInput): string | null {
    if (!input.title.trim()) return "כתבו כותרת קצרה לחיוב.";
    if (!shekelsToMinor(input.amount)) return "הסכום לא תקין.";
    if (!input.due || input.due < todayIL()) return "תאריך התשלום צריך להיות היום או אחריו.";
    return null;
}

// "שליחה לחברים" (board D-AdmCharge): one Charge per member. A sent charge is never deleted, only cancelled.
export async function sendCharge(orgId: string, raw: unknown, draftId?: string): Promise<ChargeResult> {
    const a = await moneyAdmin(orgId);
    if (!a) return { error: "אין לך הרשאה לחייב בארגון הזה." };
    const input = readChargeInput(raw);
    const bad = checkCharge(input);
    if (bad) return { error: bad };
    const to = pickRecipients(await loadRecipients(orgId), input.audience);
    if (!to.length) return { error: input.audience.to === "picked" ? "בחרו לפחות חבר אחד." : "אין חברים שמתאימים לבחירה הזו." };
    const amount = shekelsToMinor(input.amount)!;
    const due = dayOf(input.due)!;
    const title = input.title.trim();
    const note = input.note.trim();
    for (const r of to) {
        const m = await ensureMember(r.linkId);
        const c = await db.charge.create({ data: { orgId, memberId: m.id, kind: input.kind, description: title, note: note || null, amountMinor: amount, dueOn: due, allowPartial: input.partial, remindAuto: input.remind, createdById: a.userId } });
        await notifyMember(m.id, { orgId, kind: "action", topic: "charge", refId: c.id, text: `${title} · ${formatShekels(amount)}, לתשלום עד ${ilDate(due)}`, href: `/pay/${orgId}`, actionLabel: "לתשלום" });
        if (input.notify) await tellMember(m.id, `חיוב חדש מ${a.org.name}: ${title}`, `${title}\nסכום: ${formatShekels(amount)}\nלתשלום עד ${ilDate(due)}${note ? `\n${note}` : ""}\nאפשר לשלם בכרטיס החבר שבארנק.`);
    }
    if (draftId) await db.chargeDraft.deleteMany({ where: { id: draftId, orgId } });
    revalidatePath(`/orgs/${orgId}`, "layout");
    return { ok: to.length === 1 ? "החיוב נשלח לחבר אחד." : `החיוב נשלח ל-${to.length} חברים.` };
}

// "שמירה כטיוטה": nothing is sent; the draft waits on the money page.
export async function saveChargeDraft(orgId: string, raw: unknown, draftId?: string): Promise<ChargeResult> {
    const a = await moneyAdmin(orgId);
    if (!a) return { error: "אין לך הרשאה." };
    const input = readChargeInput(raw);
    if (!input.title.trim() && !input.amount.trim()) return { error: "כתבו לפחות כותרת או סכום כדי לשמור טיוטה." };
    const data = input as unknown as Prisma.InputJsonValue;
    const existing = draftId ? await db.chargeDraft.findFirst({ where: { id: draftId, orgId }, select: { id: true } }) : null;
    const d = existing ? await db.chargeDraft.update({ where: { id: existing.id }, data: { data } }) : await db.chargeDraft.create({ data: { orgId, data, createdById: a.userId } });
    revalidatePath(`/orgs/${orgId}/money`);
    return { ok: "הטיוטה נשמרה. היא מחכה במסך הקופה.", draftId: d.id };
}

export async function deleteChargeDraft(orgId: string, draftId: string): Promise<void> {
    if (!(await moneyAdmin(orgId))) return;
    await db.chargeDraft.deleteMany({ where: { id: draftId, orgId } });
    revalidatePath(`/orgs/${orgId}/money`);
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
    revalidatePath(`/orgs/${charge.orgId}`, "layout");
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
    revalidatePath(`/orgs/${pay.orgId}`, "layout");
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
    revalidatePath(`/orgs/${charge.orgId}`, "layout");
}
