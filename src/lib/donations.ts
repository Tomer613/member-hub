// "תרומות ונדרים" (board D-ModSynDonations): an aliyah, a pledge or a donation becomes a charge on the member's
// card, or a few monthly ones. Pure, so it is tested without a database. Amounts are agorot.
import { shekelsToMinor } from "./money.ts";

export const PLEDGE_KINDS = [
    { value: "aliyah", label: "עלייה", hint: "למשל: שמחת תורה, שבת נח, מפטיר" },
    { value: "pledge", label: "נדר", hint: "למשל: תיקון ספר תורה, קידוש, לרפואה" },
    { value: "donation", label: "תרומה", hint: "למשל: כללי, בניין, ספרים" },
] as const;
export type PledgeKind = (typeof PLEDGE_KINDS)[number]["value"];
export const kindLabel = (k: string) => PLEDGE_KINDS.find((x) => x.value === k)?.label ?? "תרומה";

export const PURPOSE_MAX = 60;
export const NOTE_MAX = 300;
export const MAX_INSTALLMENTS = 12;
export const MAX_AMOUNT_MINOR = 100_000_000; // ₪1,000,000

// The whole sum in n parts that add up exactly: the agorot left over go on the first part.
export function splitAmount(totalMinor: number, n: number): number[] {
    const base = Math.floor(totalMinor / n);
    return Array.from({ length: n }, (_, i) => base + (i === 0 ? totalMinor - base * n : 0));
}

// Monthly due days from the first one, on the same day of the month or the month's last day.
export function installmentDates(firstIso: string, n: number): string[] {
    const [y, m, d] = firstIso.split("-").map(Number);
    return Array.from({ length: n }, (_, i) => {
        const month = m - 1 + i;
        const yy = y + Math.floor(month / 12);
        const mm = month % 12;
        const last = new Date(Date.UTC(yy, mm + 1, 0)).getUTCDate();
        return `${yy}-${String(mm + 1).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
    });
}

// "(2 מתוך 3)" on each installment's charge, so the member knows which one it is.
export const chargeTitle = (kind: string, purpose: string, i: number, n: number) =>
    `${kindLabel(kind)} · ${purpose}${n > 1 ? ` (${i + 1} מתוך ${n})` : ""}`;

export type PledgeInput = { memberId: string; kind: string; purpose: string; amount: string; installments: string; first: string; note: string; paidNow: boolean; method: string; notify: boolean; anonymous: boolean };
export type PledgeValues = { memberId: string; kind: PledgeKind; purpose: string; amountMinor: number; installments: number; first: string; note: string | null; paidNow: boolean; notify: boolean; anonymous: boolean };

export function readPledge(input: PledgeInput, today: string): { ok: true; value: PledgeValues } | { ok: false; error: string } {
    if (!input.memberId) return { ok: false, error: "בחרו מי תרם או נדר." };
    const kind = PLEDGE_KINDS.find((k) => k.value === input.kind)?.value;
    if (!kind) return { ok: false, error: "בחרו סוג." };
    const purpose = input.purpose.replace(/\s+/g, " ").trim();
    if ([...purpose].length < 2 || [...purpose].length > PURPOSE_MAX) return { ok: false, error: `כתבו על מה, עד ${PURPOSE_MAX} תווים.` };
    const amount = shekelsToMinor(input.amount);
    if (!amount || amount < 100) return { ok: false, error: "כתבו סכום של שקל אחד לפחות." };
    if (amount > MAX_AMOUNT_MINOR) return { ok: false, error: "הסכום גבוה מדי." };
    const n = Number(input.installments);
    if (!Number.isInteger(n) || n < 1 || n > MAX_INSTALLMENTS) return { ok: false, error: `אפשר לפרוס עד ${MAX_INSTALLMENTS} תשלומים.` };
    if (n > 1 && amount < n * 100) return { ok: false, error: "הסכום קטן מדי לפריסה כזו." };
    if (input.paidNow && n > 1) return { ok: false, error: "סכום שכבר התקבל נרשם בתשלום אחד." };
    if (!input.paidNow && (!/^\d{4}-\d{2}-\d{2}$/.test(input.first) || input.first < today)) return { ok: false, error: "תאריך התשלום צריך להיות היום או אחריו." };
    const note = input.note.trim();
    if ([...note].length > NOTE_MAX) return { ok: false, error: `ההערה ארוכה מ-${NOTE_MAX} תווים.` };
    return { ok: true, value: { memberId: input.memberId, kind, purpose, amountMinor: amount, installments: n, first: input.paidNow ? today : input.first, note: note || null, paidNow: input.paidNow, notify: input.notify, anonymous: !!input.anonymous } };
}

// Charity is an invitation, not a collection (hebrew-calendar 40), so a pledge is never "late": it is open,
// spread over installments, paid, or cancelled.
export type PledgeStatus = "paid" | "installments" | "open" | "cancelled";
export const STATUS_TEXT: Record<PledgeStatus, { text: string; tint: string }> = {
    paid: { text: "שולם", tint: "#D7F5E8" },
    installments: { text: "בתשלומים", tint: "#FFF6D1" },
    open: { text: "פתוח", tint: "#FFFFFF" },
    cancelled: { text: "בוטל", tint: "#EEEAE2" },
};

export function pledgeStatus(parts: { leftMinor: number }[], cancelled: boolean): PledgeStatus {
    if (cancelled) return "cancelled";
    if (!parts.some((p) => p.leftMinor > 0)) return "paid";
    return parts.length > 1 ? "installments" : "open";
}

export const FILTERS = [
    { value: "all", label: "הכל" },
    { value: "open", label: "פתוחים" },
    { value: "paid", label: "שולמו" },
] as const;
export type PledgeFilter = (typeof FILTERS)[number]["value"];
export const readFilter = (v: unknown): PledgeFilter => (FILTERS.some((f) => f.value === v) ? (v as PledgeFilter) : "all");
export const inFilter = (s: PledgeStatus, f: PledgeFilter) => f === "all" || (f === "paid" ? s === "paid" : s === "installments" || s === "open");

// "בעילום שם" (synagogue-tools 33).
export const ANON = "בעילום שם";

// Quick amounts for the gabbai's fast entry (synagogue-tools 3), in agorot.
export const QUICK_AMOUNTS = [1_800, 3_600, 18_000, 36_000, 50_000, 100_000];
