import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { chargeView, ilDate, methodLabel } from "@/lib/billing/account";
import { chargeInclude, nextReceiptNo, settleLeaver, toChargeIn } from "@/lib/billing/member-money";
import { emailOf } from "@/lib/billing/pay-server";
import { ANON, chargeTitle, installmentDates, kindLabel, pledgeStatus, splitAmount, type PledgeStatus, type PledgeValues } from "@/lib/donations";
import { sendEmail } from "@/lib/email";
import { membersAdmin } from "@/lib/members-server";
import { formatShekels } from "@/lib/money";
import { monthStartUtc } from "@/lib/reports";
import { notifyMember } from "@/lib/notify-server";
import { getPack } from "@/packs";

export const hasDonations = (packId: string) => (getPack(packId).modules as readonly string[]).includes("donations");

// "תרומות ונדרים" is money: the owner, admins and the treasurer of an org whose type has it (a synagogue).
export async function donationsAdmin(orgId: string) {
    const a = await membersAdmin(orgId);
    return a && hasDonations(a.org.packId) ? a : null;
}

// Who sees the name behind "בעילום שם" (synagogue-tools 33): the treasurer, or the owner when the org has none.
export async function seesAnonymous(orgId: string, role: string): Promise<boolean> {
    if (role === "treasurer") return true;
    if (role !== "owner") return false;
    return !(await db.orgUser.count({ where: { orgId, role: "treasurer", status: "active" } }));
}

export type PledgePart = { id: string; title: string; amountMinor: number; leftMinor: number; due: string; state: "open" | "pending" | "paid" | "voided" };
export type PledgeRow = {
    id: string; memberId: string; name: string; kind: string; kindText: string; purpose: string; amountMinor: number; paidMinor: number;
    installments: number; status: PledgeStatus; note: string | null; at: Date; parts: PledgePart[]; anonymous: boolean; realName: string | null;
};

// The board's table, the newest first, with each pledge's charges (one, or one per installment).
export async function loadPledges(orgId: string, seeAnon: boolean): Promise<PledgeRow[]> {
    const list = await db.pledge.findMany({
        where: { orgId },
        include: { member: { select: { firstName: true, lastName: true } }, charges: { include: chargeInclude, orderBy: { dueOn: "asc" } } },
        orderBy: { createdAt: "desc" },
        take: 500,
    });
    return list.map((p) => {
        const parts: PledgePart[] = p.charges.map((c) => {
            const v = chargeView(toChargeIn(c));
            return { id: c.id, title: c.description, amountMinor: c.amountMinor, leftMinor: v?.leftMinor ?? 0, due: ilDate(v?.due ?? c.createdAt), state: v ? v.state : "voided" };
        });
        const live = p.charges.map((c) => chargeView(toChargeIn(c))).filter((v) => v !== null);
        const real = `${p.member.firstName} ${p.member.lastName}`.trim() || "חבר/ה";
        return {
            id: p.id, memberId: p.memberId, name: p.anonymous ? ANON : real, anonymous: p.anonymous, realName: !p.anonymous || seeAnon ? real : null, kind: p.kind, kindText: kindLabel(p.kind), purpose: p.purpose,
            amountMinor: p.amountMinor, paidMinor: live.reduce((t, v) => t + v.amountMinor - v.leftMinor, 0), installments: p.installments,
            status: pledgeStatus(live, !!p.cancelledAt), note: p.note, at: p.createdAt, parts,
        };
    });
}

// The two numbers beside the table: what is still owed on pledges, and what came in this month for them.
export async function pledgeNumbers(orgId: string, rows: PledgeRow[]) {
    const now = new Date();
    const ym = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit" }).format(now);
    const from = monthStartUtc(ym);
    const month = await db.paymentAllocation.aggregate({
        where: { orgId, charge: { pledgeId: { not: null } }, payment: { status: "succeeded", receivedAt: { gte: from } } },
        _sum: { amountMinor: true },
    });
    const openMinor = rows.filter((r) => r.status !== "cancelled").reduce((t, r) => t + r.parts.reduce((s, p) => s + (p.state === "voided" ? 0 : p.leftMinor), 0), 0);
    return { openMinor, monthMinor: month._sum.amountMinor ?? 0 };
}

const firstOf = (iso: string) => new Date(`${iso}T00:00:00Z`);

// "יצירת חיוב" (board D-ModSynDonations): the pledge and its charges together, so it is never half made. When
// the money was already received (cash, a transfer, a check), it is recorded with a receipt right away.
export async function createPledge(a: { userId: string; org: { id: string; name: string } }, v: PledgeValues, method: string, ref: string | null = null): Promise<{ id: string } | { error: string; taken?: true }> {
    const orgId = a.org.id;
    const member = await db.member.findFirst({ where: { id: v.memberId, orgId }, select: { id: true } });
    if (!member) return { error: "החבר לא נמצא בארגון." };
    const amounts = splitAmount(v.amountMinor, v.installments);
    const dates = installmentDates(v.first, v.installments);
    let made: { id: string; chargeIds: string[]; paymentId: string | null } | null = null;
    for (let attempt = 0; !made; attempt++) {
        try {
            made = await db.$transaction(async (tx) => {
                const p = await tx.pledge.create({ data: { orgId, memberId: v.memberId, kind: v.kind, purpose: v.purpose, amountMinor: v.amountMinor, installments: v.installments, note: v.note, anonymous: v.anonymous, ref, createdById: a.userId } });
                const chargeIds: string[] = [];
                for (let i = 0; i < v.installments; i++) {
                    const c = await tx.charge.create({
                        data: { orgId, memberId: v.memberId, pledgeId: p.id, kind: "one_time", description: chargeTitle(v.kind, v.purpose, i, v.installments), amountMinor: amounts[i], dueOn: firstOf(dates[i]), dedupeKey: `pledge|${p.id}|${i}`, createdById: a.userId },
                        select: { id: true },
                    });
                    chargeIds.push(c.id);
                }
                let paymentId: string | null = null;
                if (v.paidNow) {
                    const receiptNo = await nextReceiptNo(tx, orgId);
                    ({ id: paymentId } = await tx.payment.create({
                        data: {
                            orgId, memberId: v.memberId, amountMinor: v.amountMinor, method, source: "manual", status: "succeeded", receivedAt: new Date(), receiptNo, reviewedById: a.userId, reviewedAt: new Date(),
                            allocations: { create: [{ orgId, chargeId: chargeIds[0], amountMinor: v.amountMinor }] },
                        },
                    }));
                }
                return { id: p.id, chargeIds, paymentId };
            });
        } catch (e) {
            // Made already from the same place (a second tap on "להקדשה").
            if (ref && e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002" && String(e.meta?.target ?? "").includes("ref")) return { error: "כבר נרשם.", taken: true };
            // Two receipts numbered at once: try again with the next number.
            if (attempt < 4 && e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
            throw e;
        }
    }
    const what = `${kindLabel(v.kind)} · ${v.purpose}`;
    if (made.paymentId) {
        await notifyMember(v.memberId, { orgId, kind: "update", topic: "payment", refId: made.paymentId, text: `נרשם תשלום של ${formatShekels(v.amountMinor)} על ${what} (${methodLabel(method, null)}). תודה! הקבלה שמורה בארנק.`, href: `/pay/receipt/${made.paymentId}` });
    } else if (v.notify) {
        const spread = v.installments > 1 ? `, ב-${v.installments} תשלומים חודשיים` : "";
        // A thank-you, not a demand (synagogue-tools 3).
        await notifyMember(v.memberId, { orgId, kind: "action", topic: "charge", refId: made.chargeIds[0], text: `תודה על ${what}, ${formatShekels(v.amountMinor)}${spread}. אפשר לשלם מהארנק כשנוח לכם`, href: `/pay/${orgId}`, actionLabel: "לתשלום עכשיו" });
        const link = await db.orgUser.findUnique({ where: { memberId: v.memberId }, include: { user: { include: { contacts: true } } } });
        const email = link ? emailOf(link.user.contacts) : null;
        if (email) await sendEmail(email, `תודה מ${a.org.name}`, `תודה על ${what}, ${formatShekels(v.amountMinor)}${spread}.\nאפשר לשלם בכרטיס החבר שבארנק, כשנוח לכם.`).catch(() => undefined);
    }
    return { id: made.id };
}

// "ביטול": the charges nothing was paid on are cancelled; what was paid stays paid, with its receipt.
export async function cancelPledge(orgId: string, id: string): Promise<{ kept: number } | { error: string }> {
    const p = await db.pledge.findFirst({ where: { id, orgId }, include: { charges: { include: chargeInclude } } });
    if (!p) return { error: "הרשומה לא נמצאה." };
    if (p.cancelledAt) return { error: "זה כבר בוטל." };
    const drop: string[] = [];
    let kept = 0;
    for (const c of p.charges) {
        const v = chargeView(toChargeIn(c));
        if (!v) continue;
        if (v.state === "open" && v.leftMinor === v.amountMinor) drop.push(c.id);
        else kept++;
    }
    if (!drop.length && !p.charges.some((c) => (chargeView(toChargeIn(c))?.leftMinor ?? 0) > 0)) return { error: "הכול כבר שולם, אין מה לבטל." };
    await db.$transaction([
        db.charge.updateMany({ where: { id: { in: drop }, orgId, voidedAt: null }, data: { voidedAt: new Date() } }),
        db.pledge.update({ where: { id }, data: { cancelledAt: new Date() } }),
    ]);
    await settleLeaver(orgId, p.memberId);
    const one = drop.length === 1;
    if (drop.length) await notifyMember(p.memberId, { orgId, kind: "update", topic: "charge", refId: id, text: `${one ? "החיוב" : "החיובים"} על "${kindLabel(p.kind)} · ${p.purpose}" ${one ? "בוטל. אין צורך לשלם אותו" : "בוטלו. אין צורך לשלם אותם"}.` });
    return { kept };
}
