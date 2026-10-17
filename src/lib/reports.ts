// "דוחות" (board D-AdmReports). Pure, so it is tested without a database.

export const PERIODS = [
    { months: 3, label: "3 חודשים" },
    { months: 6, label: "6 חודשים" },
    { months: 12, label: "שנה" },
] as const;
export type Months = (typeof PERIODS)[number]["months"];
export const readMonths = (raw: unknown): Months => (raw === "3" ? 3 : raw === "12" ? 12 : 6);

const MONTHS = ["ינו׳", "פבר׳", "מרץ", "אפר׳", "מאי", "יוני", "יולי", "אוג׳", "ספט׳", "אוק׳", "נוב׳", "דצמ׳"];
const ilMonth = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(d).slice(0, 7);

// The last n months in Israel, oldest first, the current one included: ["2026-05", ..., "2026-10"].
export function monthKeys(now: Date, n: number): string[] {
    const [y, m] = ilMonth(now).split("-").map(Number);
    return Array.from({ length: n }, (_, i) => {
        const t = new Date(Date.UTC(y, m - 1 - (n - 1 - i), 1));
        return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
    });
}
export const monthName = (key: string) => MONTHS[Number(key.slice(5, 7)) - 1] ?? key;
// "מאי עד אוק׳ 2026", or across years "נוב׳ 2025 עד אוק׳ 2026".
export function rangeText(keys: string[]): string {
    const a = keys[0], b = keys[keys.length - 1];
    return a.slice(0, 4) === b.slice(0, 4) ? `${monthName(a)} עד ${monthName(b)} ${b.slice(0, 4)}` : `${monthName(a)} ${a.slice(0, 4)} עד ${monthName(b)} ${b.slice(0, 4)}`;
}
// The first moment of the oldest month, in Israel (midnight there is 21:00 or 22:00 UTC the day before).
export const monthStartUtc = (key: string) => {
    const guess = new Date(`${key}-01T00:00:00Z`);
    const off = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jerusalem", hour: "numeric", hourCycle: "h23" }).format(guess));
    return new Date(guess.getTime() - off * 3_600_000);
};

// What was collected in each month, by the day the money came in.
export function byMonth(keys: string[], payments: { at: Date; amountMinor: number }[]): { key: string; label: string; minor: number }[] {
    const sum = new Map(keys.map((k) => [k, 0]));
    for (const p of payments) {
        const k = ilMonth(p.at);
        if (sum.has(k)) sum.set(k, sum.get(k)! + p.amountMinor);
    }
    return keys.map((k) => ({ key: k, label: monthName(k), minor: sum.get(k)! }));
}

// The bar labels of the board: "₪850", "₪14K", "₪1.2K".
export function shortShekels(minor: number): string {
    const n = minor / 100;
    if (n < 1000) return `₪${Math.round(n)}`;
    const k = n / 1000;
    return `₪${k < 10 ? Math.round(k * 10) / 10 : Math.round(k)}K`;
}

// "שיעור גבייה": of what was due in the period (charges whose last day has passed), how much was paid.
export function collectionRate(dueMinor: number, paidMinor: number): number | null {
    if (dueMinor <= 0) return null;
    return Math.min(100, Math.round((paidMinor / dueMinor) * 100));
}

export const METHOD: Record<string, string> = { card: "כרטיס אשראי", cash: "מזומן", bank: "העברה בנקאית", standing_order: "הוראת קבע", check: "צ׳ק", other: "אחר" };
export const methodLabel = (m: string) => METHOD[m] ?? "אחר";

export const REPORTS = [
    { id: "collection", title: "דוח גבייה חודשי", line: "לפי חיוב, סטטוס ואמצעי תשלום" },
    { id: "debts", title: "חובות פתוחים", line: "לפי חבר, גיל חוב ותזכורות" },
    { id: "members", title: "רשימת חברים", line: "לפי מסלול ותווית" },
    { id: "kupa", title: "תנועות קופה", line: "לתאום מול הנהלת חשבונות" },
    { id: "receipts", title: "קבלות", line: "כל הקבלות שהופקו בתקופה" },
] as const;
export type ReportId = (typeof REPORTS)[number]["id"];
export const isReportId = (s: string): s is ReportId => REPORTS.some((r) => r.id === s);
