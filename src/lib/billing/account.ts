// A member's money in one org, as the member sees it (boards D-Badge, D-PayCharge, D-PayHistory).
// Pure functions shared by the card, the payment screens and their tests. Amounts are agorot.
import { formatShekels } from "../money.ts";

// A payment counts against a charge only once it succeeded. A member's report waits as "pending"
// until the org confirms it (board D-PayManualSent).
export type AllocIn = { amountMinor: number; status: string };
export type ChargeIn = {
    id: string;
    description: string;
    amountMinor: number;
    dueOn: Date | null;
    createdAt: Date;
    voidedAt: Date | null;
    allocations: AllocIn[];
};
export type ChargeState = "open" | "pending" | "paid";
export type ChargeView = { id: string; description: string; amountMinor: number; leftMinor: number; due: Date; state: ChargeState };

export const DUE_AFTER_DAYS = 14;

export function dueDate(c: Pick<ChargeIn, "dueOn" | "createdAt">): Date {
    return c.dueOn ?? new Date(c.createdAt.getTime() + DUE_AFTER_DAYS * 86_400_000);
}

export function chargeView(c: ChargeIn): ChargeView | null {
    if (c.voidedAt) return null;
    const sum = (s: string) => c.allocations.filter((a) => a.status === s).reduce((t, a) => t + a.amountMinor, 0);
    const left = Math.max(0, c.amountMinor - sum("succeeded"));
    const state: ChargeState = left === 0 ? "paid" : sum("pending") >= left ? "pending" : "open";
    return { id: c.id, description: c.description, amountMinor: c.amountMinor, leftMinor: left, due: dueDate(c), state };
}

export function chargeViews(charges: ChargeIn[]): ChargeView[] {
    return charges.map(chargeView).filter((v): v is ChargeView => v !== null);
}

// What is still to pay, the soonest due first.
export function openCharges(views: ChargeView[]): ChargeView[] {
    return views.filter((v) => v.state === "open").sort((a, b) => a.due.getTime() - b.due.getTime());
}

export type MoneySummary = { openMinor: number; open: ChargeView[]; pending: number };
export function moneySummary(views: ChargeView[]): MoneySummary {
    const open = openCharges(views);
    return { openMinor: open.reduce((t, v) => t + v.leftMinor, 0), open, pending: views.filter((v) => v.state === "pending").length };
}

// The notice row under the card: shown only when something waits (board D-Badge).
export function noticeText(s: MoneySummary): string | null {
    if (s.open.length === 1) return `${s.open[0].description} · ${formatShekels(s.open[0].leftMinor)}`;
    if (s.open.length > 1) return `${s.open.length} חיובים פתוחים · ${formatShekels(s.openMinor)}`;
    if (s.pending > 0) return s.pending === 1 ? "הדיווח על התשלום ממתין לאישור הארגון" : `${s.pending} דיווחים על תשלום ממתינים לאישור`;
    return null;
}

// The status line on the money tile.
export function moneyTileText(s: MoneySummary): string {
    if (s.openMinor > 0) return `${formatShekels(s.openMinor)} לתשלום`;
    if (s.pending > 0) return "ממתין לאישור הארגון";
    return "הכול שולם";
}

// One payment covers the chosen charges, the soonest due first.
export function allocate(amountMinor: number, charges: Pick<ChargeView, "id" | "leftMinor">[]): { chargeId: string; amountMinor: number }[] {
    const out: { chargeId: string; amountMinor: number }[] = [];
    let left = amountMinor;
    for (const c of charges) {
        if (left <= 0) break;
        const part = Math.min(left, c.leftMinor);
        if (part > 0) out.push({ chargeId: c.id, amountMinor: part });
        left -= part;
    }
    return out;
}

// Dates as on the boards, in Israel time: 15.11.2026, 15.11, 15.11.2026 · 18:05, "אוקטובר 2026".
const parts = (d: Date) => {
    const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jerusalem", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d);
    const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
    return { d: g("day"), m: g("month"), y: g("year"), h: g("hour"), min: g("minute") };
};
export const ilDate = (d: Date) => {
    const p = parts(d);
    return `${p.d}.${p.m}.${p.y}`;
};
export const ilShortDate = (d: Date) => {
    const p = parts(d);
    return `${Number(p.d)}.${Number(p.m)}`;
};
export const ilDateTime = (d: Date) => {
    const p = parts(d);
    return `${p.d}.${p.m}.${p.y} · ${p.h}:${p.min}`;
};
export const ilMonthTitle = (d: Date) => new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", month: "long", year: "numeric" }).format(d);

// "0418" on the card.
export const memberNumber = (n: number) => String(n).padStart(4, "0");

// How the member paid outside the app (board D-PayManual).
export const REPORT_METHODS = [
    { id: "bank", label: "העברה בנקאית" },
    { id: "cash", label: "מזומן" },
    { id: "check", label: "שיק" },
    { id: "other", label: "אחר" },
] as const;
export type ReportMethod = (typeof REPORT_METHODS)[number]["id"];
export const isReportMethod = (v: unknown): v is ReportMethod => REPORT_METHODS.some((m) => m.id === v);
// How a payment the org received is recorded by an admin (board D-MAdmPayRecord).
export const RECORD_METHODS = [
    { id: "cash", label: "מזומן" },
    { id: "bank", label: "העברה" },
    { id: "check", label: "צ׳ק" },
    { id: "bit", label: "ביט / פייבוקס" },
] as const;
export const isRecordMethod = (v: unknown): v is (typeof RECORD_METHODS)[number]["id"] => RECORD_METHODS.some((m) => m.id === v);
export const methodLabel = (method: string, cardLabel: string | null) =>
    method === "card"
        ? (cardLabel ?? "כרטיס אשראי")
        : (REPORT_METHODS.find((m) => m.id === method)?.label ?? RECORD_METHODS.find((m) => m.id === method)?.label ?? (method === "standing_order" ? "הוראת קבע" : "אחר"));
export const TITLE_MAX = 80;
export const NOTE_MAX = 300;

// The next renewal of a monthly or yearly subscription, counted from its start (gym: "מתחדש ב").
export function nextRenewal(startsOn: Date, interval: string, now: Date): Date | null {
    const step = interval === "month" ? 1 : interval === "year" ? 12 : 0;
    if (!step) return null;
    const d = new Date(startsOn);
    while (d <= now) d.setUTCMonth(d.getUTCMonth() + step);
    return d;
}

// The end of the card's bottom row (board D-Badge): the next payment, or the renewal, or nothing owed.
export function nextLine(packId: string, s: MoneySummary, renewal: Date | null): { label: string; value: string } {
    if (s.open.length) return { label: "התשלום הבא", value: ilShortDate(s.open[0].due) };
    if (renewal) return { label: packId === "gym" ? "מתחדש ב" : "התשלום הבא", value: ilShortDate(renewal) };
    return { label: "תשלומים", value: s.pending ? "בבדיקה" : "הכול שולם" };
}

// What the card shows as the member's "number": in a house committee the flat ("דירה 4"), which is how
// neighbours know each other; elsewhere the member number ("מספר חבר 0418").
export function accountShown(packId: string, homeLabel: string | null, number: number): { label: string; value: string } {
    if (packId === "hoa" && homeLabel) return { label: "דירה", value: homeLabel };
    return { label: "מספר חבר", value: memberNumber(number) };
}
