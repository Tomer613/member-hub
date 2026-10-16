// The admin's member list and member file (boards D-Admin, D-AdmMember): statuses, filters, the household
// line, search, and the reminder limit. Pure, so it is tested without a database.

export const MEMBER_FILTERS = [
    { id: "all", label: "הכל" },
    { id: "active", label: "פעילים" },
    { id: "debt", label: "בחוב" },
    { id: "dispute", label: "במחלוקת" },
    { id: "pending", label: "ממתינים לאישור" },
    { id: "left_debt", label: "עזבו עם חוב" },
] as const;
export type MemberFilter = (typeof MEMBER_FILTERS)[number]["id"];
export const readMemberFilter = (v: unknown): MemberFilter => (MEMBER_FILTERS.some((f) => f.id === v) ? (v as MemberFilter) : "all");

// What a row is, before it is drawn. A pending row is a join request; it has no money yet.
export type RowFacts = { kind: "member" | "pending"; linkStatus: string; owedMinor: number; disputes: number };
export type RowStatus = "active" | "debt" | "dispute" | "pending" | "left_debt";

// One chip per row, the one that needs the admin most: left with a debt, then a dispute, then a debt.
export function rowStatus(r: RowFacts): RowStatus {
    if (r.kind === "pending") return "pending";
    if (r.linkStatus === "left_with_debt") return "left_debt";
    if (r.disputes > 0) return "dispute";
    if (r.owedMinor > 0) return "debt";
    return "active";
}

// Status chip colors (board D-Admin): debt yellow, active light green, pending light purple, dispute light
// blue. "Left with a debt" takes the pink of the wallet chip. Always with the word.
export const STATUS_CHIP: Record<RowStatus, { label: string; bg: string }> = {
    active: { label: "פעיל", bg: "#D7F5E8" },
    debt: { label: "חוב", bg: "#FFD84A" },
    dispute: { label: "מחלוקת", bg: "#CFF0FC" },
    pending: { label: "ממתין", bg: "#E3DDFF" },
    left_debt: { label: "עזב עם חוב", bg: "#FFDCD3" },
};

export function inMemberFilter(f: MemberFilter, r: RowFacts): boolean {
    switch (f) {
        case "all": return true;
        case "active": return r.kind === "member" && r.linkStatus === "active";
        case "debt": return r.kind === "member" && r.owedMinor > 0;
        case "dispute": return r.kind === "member" && r.disputes > 0;
        case "pending": return r.kind === "pending";
        case "left_debt": return r.kind === "member" && r.linkStatus === "left_with_debt";
    }
}

export function filterCounts(rows: RowFacts[]): Record<MemberFilter, number> {
    const out = {} as Record<MemberFilter, number>;
    for (const f of MEMBER_FILTERS) out[f.id] = rows.filter((r) => inMemberFilter(f.id, r)).length;
    return out;
}

// Five pastel avatar backgrounds, taken in turn (board D-Admin).
export const AVATAR_PASTELS = ["#E3DDFF", "#FFDCD3", "#FFD9E8", "#CFF0FC", "#D7F5E8"] as const;
export const avatarPastel = (i: number) => AVATAR_PASTELS[((i % 5) + 5) % 5];
export const initial = (name: string) => [...name.trim()][0] ?? "?";

// "Member since": the year, or "השבוע" for someone who joined in the last seven days.
export function memberSince(since: Date, now: Date): string {
    if (now.getTime() - since.getTime() < 7 * 86_400_000) return "השבוע";
    return new Intl.DateTimeFormat("en", { timeZone: "Asia/Jerusalem", year: "numeric" }).format(since);
}

const RELATION_WORD: Record<string, string> = { owner: "בעלים", tenant: "שוכר", spouse: "בן/בת זוג", child: "ילד", member: "חבר" };

// The second line of the name cell: "משפחת כהן · ראש", "משפחת כהן · משלם", "דירה 14 · שוכר", or "יחיד".
export function householdLine(home: { label: string; relation: string; isHead: boolean; isPayer: boolean } | null, packId: string): string {
    if (!home) return "יחיד";
    const place = packId === "hoa" ? `דירה ${home.label}` : home.label;
    const role = home.isHead ? "ראש" : home.isPayer ? "משלם" : RELATION_WORD[home.relation] ?? "חבר";
    return `${place} · ${role}`;
}

const SMALL = ["", "אחד", "שניים", "שלושה", "ארבעה", "חמישה"];
// "5 (שניים משלמים)", "3 (משלם אחד)", "1".
export function familyText(count: number, payers: number): string {
    if (count <= 1 || payers === 0) return String(Math.max(count, 1));
    const p = payers === 1 ? "משלם אחד" : `${SMALL[payers] ?? payers} משלמים`;
    return `${count} (${p})`;
}

const digits = (s: string) => s.replace(/\D/g, "");
// Search by name, phone, email or household. A phone matches with or without the leading 0 or +972.
export function matchesSearch(r: { name: string; phone: string | null; email: string | null; home: string }, raw: string): boolean {
    const q = raw.trim().toLowerCase();
    if (!q) return true;
    if (r.name.toLowerCase().includes(q) || r.home.toLowerCase().includes(q) || (r.email ?? "").toLowerCase().includes(q)) return true;
    const d = digits(q);
    if (d.length < 3 || !r.phone) return false;
    const p = digits(r.phone);
    const local = p.startsWith("972") ? `0${p.slice(3)}` : p;
    const want = d.startsWith("972") ? `0${d.slice(3)}` : d;
    return local.includes(want) || p.includes(d);
}

// The anti-harassment limit (ux-spec 7): one debt reminder per member per week, in one place.
export const REMINDER_GAP_DAYS = 7;
export function reminderBlockedUntil(lastSent: Date | null, now: Date): Date | null {
    if (!lastSent) return null;
    const next = new Date(lastSent.getTime() + REMINDER_GAP_DAYS * 86_400_000);
    return next > now ? next : null;
}

// How a reminder batch went, in one sentence for the admin.
export function reminderSummary(r: { sent: number; recent: number; noDebt: number; disputed: number }): string {
    const parts: string[] = [];
    parts.push(r.sent === 0 ? "לא נשלחו תזכורות" : r.sent === 1 ? "נשלחה תזכורת אחת" : `נשלחו ${r.sent} תזכורות`);
    const skipped: string[] = [];
    if (r.recent) skipped.push(r.recent === 1 ? "לחבר אחד כבר נשלחה תזכורת השבוע" : `ל-${r.recent} חברים כבר נשלחה תזכורת השבוע`);
    if (r.disputed) skipped.push(r.disputed === 1 ? "חוב אחד במחלוקת" : `${r.disputed} חובות במחלוקת`);
    if (r.noDebt) skipped.push(r.noDebt === 1 ? "לחבר אחד אין חוב" : `ל-${r.noDebt} חברים אין חוב`);
    return skipped.length ? `${parts[0]}. ${skipped.join(", ")}.` : `${parts[0]}.`;
}

// The balance cell: what the member owes as a minus, zero in ink, and a dash for a pending request.
export function balanceCell(kind: RowFacts["kind"], owedMinor: number): { text: string; owes: boolean } {
    if (kind === "pending") return { text: "—", owes: false };
    if (owedMinor <= 0) return { text: "₪0", owes: false };
    const n = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 2 }).format(owedMinor / 100);
    return { text: `-₪${n}`, owes: true };
}

// CSV for "ייצוא", with a BOM so Excel opens Hebrew correctly; cells that start like a formula are quoted
// with a leading apostrophe.
export function toCsv(rows: string[][]): string {
    const cell = (v: string) => {
        const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
        return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
    };
    return "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
}

// An E.164 Israeli number as people write it: +972521234567 -> 052-123-4567. Other numbers stay as they are.
export function localPhone(e164: string | null): string | null {
    if (!e164) return null;
    const m = /^\+972(5\d)(\d{3})(\d{4})$/.exec(e164) ?? /^\+972([2-9])(\d{3})(\d{4})$/.exec(e164);
    return m ? `0${m[1]}-${m[2]}-${m[3]}` : e164;
}

export const MESSAGE_MAX = 500;
export const DISPUTE_REASON_MAX = 300;
