// "כספים בארגון" for the member (board D-MemberFinance). Pure, so it is tested without a database.
import type { ChargeView } from "./account.ts";

const ilDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(d);

// A charge is a debt only once its last day to pay has passed (the board's rule, also used by the org's
// "חובות פתוחים").
export function debtState(open: Pick<ChargeView, "id" | "due" | "leftMinor" | "gift">[], now: Date): { owes: boolean; owedMinor: number; count: number; ids: string[] } {
    const today = ilDay(now);
    const late = open.filter((c) => !c.gift && c.due.toISOString().slice(0, 10) < today);
    const owedMinor = late.reduce((t, c) => t + c.leftMinor, 0);
    return { owes: owedMinor > 0, owedMinor, count: late.length, ids: late.map((c) => c.id) };
}

// "N תשלומים השנה": payments that went through in this calendar year, Israel time.
export const paymentsThisYear = (dates: Date[], now: Date) => dates.filter((d) => ilDay(d).slice(0, 4) === ilDay(now).slice(0, 4)).length;
