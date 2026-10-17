import { db } from "@/lib/db";
import { chargeView, ilDate } from "@/lib/billing/account";
import { kindLabel } from "@/lib/billing/charge-plan";
import { pastDue } from "@/lib/billing/kupa-server";
import { chargeInclude, toChargeIn } from "@/lib/billing/member-money";
import { localPhone } from "@/lib/members-admin";
import { byMonth, collectionRate, methodLabel, monthKeys, monthStartUtc, type Months } from "@/lib/reports";

const shekels = (minor: number) => (minor / 100).toFixed(2);
const nameOf = (m: { firstName: string; lastName: string } | null | undefined, fallback?: string | null) => (m ? `${m.firstName} ${m.lastName}`.trim() : fallback) || "חבר/ה";
const ilToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

// The charges whose last day to pay falls in the period: the base of "שיעור גבייה" and of the monthly report.
async function periodCharges(orgId: string, from: Date) {
    const charges = await db.charge.findMany({
        where: { orgId, OR: [{ dueOn: { gte: from } }, { dueOn: null, createdAt: { gte: new Date(from.getTime() - 14 * 86_400_000) } }] },
        include: {
            allocations: { select: { amountMinor: true, payment: { select: { status: true, method: true } } } },
            member: { select: { firstName: true, lastName: true } },
            household: { select: { label: true } },
        },
        orderBy: [{ dueOn: "asc" }, { createdAt: "asc" }],
    });
    return charges.filter((c) => c.voidedAt || chargeView(toChargeIn(c))!.due >= from);
}

// The numbers and the bars on the screen.
export async function loadReport(orgId: string, months: Months, now = new Date()) {
    const keys = monthKeys(now, months);
    const from = monthStartUtc(keys[0]);
    const [pays, due, charges] = await Promise.all([
        db.payment.findMany({ where: { orgId, status: "succeeded", receivedAt: { gte: from } }, select: { receivedAt: true, amountMinor: true } }),
        pastDue(orgId),
        periodCharges(orgId, from),
    ]);
    const today = ilToday();
    let dueMinor = 0, paidMinor = 0;
    for (const c of charges) {
        const v = chargeView(toChargeIn(c));
        if (!v || dayKey(v.due) >= today) continue;
        dueMinor += v.amountMinor;
        paidMinor += v.amountMinor - v.leftMinor;
    }
    const bars = byMonth(keys, pays.map((p) => ({ at: p.receivedAt, amountMinor: p.amountMinor })));
    return {
        keys, bars,
        collectedMinor: bars.reduce((t, b) => t + b.minor, 0),
        owers: due.members.size + due.households.size,
        owedMinor: due.owedMinor,
        rate: collectionRate(dueMinor, paidMinor),
        dueMinor, paidMinor,
    };
}

// "דוח גבייה חודשי": each charge due in the period, what was paid and how.
export async function collectionRows(orgId: string, months: Months): Promise<string[][]> {
    const from = monthStartUtc(monthKeys(new Date(), months)[0]);
    const today = ilToday();
    const rows = (await periodCharges(orgId, from)).map((c) => {
        const v = chargeView(toChargeIn(c));
        const due = v?.due ?? c.dueOn ?? c.createdAt;
        const status = !v ? "בוטל" : v.state === "paid" ? "שולם" : v.state === "pending" ? "בתהליך" : dayKey(v.due) < today ? "בחוב" : "פתוח";
        const methods = [...new Set(c.allocations.filter((a) => a.payment.status === "succeeded").map((a) => methodLabel(a.payment.method)))].join(" | ");
        return [ilDate(due), c.member ? nameOf(c.member) : c.household ? `משק בית ${c.household.label}` : "", c.description, kindLabel(c.kind), shekels(c.amountMinor), shekels(v ? v.amountMinor - v.leftMinor : 0), shekels(v?.leftMinor ?? 0), status, methods];
    });
    return [["לתשלום עד", "חבר", "חיוב", "סוג", "סכום", "שולם", "נשאר", "סטטוס", "אמצעי תשלום"], ...rows];
}

// "חובות פתוחים": who owes past-due money, since when, and the last reminder.
export async function debtRows(orgId: string): Promise<string[][]> {
    const charges = await db.charge.findMany({
        where: { orgId, voidedAt: null },
        include: { ...chargeInclude, member: { select: { id: true, firstName: true, lastName: true, phone: true } }, household: { select: { id: true, label: true } } },
    });
    const today = ilToday();
    const owers = new Map<string, { name: string; phone: string; memberId: string | null; owed: number; count: number; oldest: Date }>();
    for (const c of charges) {
        const v = chargeView(toChargeIn(c));
        if (!v || v.state !== "open" || dayKey(v.due) >= today) continue;
        const key = c.memberId ?? (c.householdId ? `h:${c.householdId}` : null);
        if (!key) continue;
        const o = owers.get(key) ?? { name: c.member ? nameOf(c.member) : `משק בית ${c.household?.label ?? ""}`.trim(), phone: localPhone(c.member?.phone ?? null) ?? "", memberId: c.memberId, owed: 0, count: 0, oldest: v.due };
        o.owed += v.leftMinor;
        o.count++;
        if (v.due < o.oldest) o.oldest = v.due;
        owers.set(key, o);
    }
    const ids = [...owers.values()].flatMap((o) => (o.memberId ? [o.memberId] : []));
    const last = ids.length ? await db.debtReminder.groupBy({ by: ["memberId"], where: { orgId, memberId: { in: ids } }, _max: { sentAt: true }, _count: true }) : [];
    const now = new Date(`${today}T00:00:00Z`).getTime();
    const list = [...owers.values()].sort((a, b) => b.owed - a.owed);
    return [
        ["חבר", "טלפון", "חוב", "חיובים בחוב", "החוב הוותיק מ-", "ימים בחוב", "תזכורת אחרונה", "תזכורות שנשלחו"],
        ...list.map((o) => {
            const r = last.find((l) => l.memberId === o.memberId);
            return [o.name, o.phone, shekels(o.owed), String(o.count), ilDate(o.oldest), String(Math.round((now - o.oldest.getTime()) / 86_400_000)), r?._max.sentAt ? ilDate(r._max.sentAt) : "", String(r?._count ?? 0)];
        }),
    ];
}

// "קבלות": the in-app receipts numbered in the period. The official tax documents wait for the
// invoicing service (docs/waiting-for-services.he.md).
export async function receiptRows(orgId: string, months: Months): Promise<string[][]> {
    const from = monthStartUtc(monthKeys(new Date(), months)[0]);
    const pays = await db.payment.findMany({
        where: { orgId, status: "succeeded", receiptNo: { not: null }, receivedAt: { gte: from } },
        include: { member: { select: { firstName: true, lastName: true } } },
        orderBy: { receiptNo: "asc" },
    });
    return [["מספר קבלה", "תאריך", "שולם על ידי", "סכום", "אמצעי תשלום"], ...pays.map((p) => [String(p.receiptNo), ilDate(p.receivedAt), nameOf(p.member, p.payerName), shekels(p.amountMinor), methodLabel(p.method)])];
}
