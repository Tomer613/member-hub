// Rules of the celebration pack (decided with Tommy 14.10.2026, docs/open-questions.he.md
// 'ערכת "חגיגה ואירוע"'). Pure functions shared by the setup screens, the invitation and the organizer page.
// The event details are kept in Organization.settings.celebration.

export type MoneyMode = "none" | "fixed" | "free";
export type Per = "person" | "family";
export type Access = "link" | "invited";
export type RsvpStatus = "yes" | "maybe" | "no";

export type CelebrationSettings = {
    startsAt: string | null; // "2026-11-03T20:00" local time in the org's timezone
    place: string | null; // exact address, shown only after answering "coming"
    city: string | null; // shown to everyone
    // goalMinor: "כמה רוצים לאסוף בסך הכול?" (optional, only when each gives what they like).
    money: { mode: MoneyMode; per: Per; amountMinor: number | null; kidAmountMinor: number | null; payLink: string | null; goalMinor: number | null };
    kids: boolean; // "ילדים מוזמנים?" When off, guests are not asked how many kids and there is no kid price.
    access: Access;
    // "רק מי שהזמנתי" (decided with Tommy 15.10.2026): one shared link, and only these phones (E.164) get in,
    // after one sign-in code. A forwarded link does not help someone whose number is not on the list.
    invited: string[];
    // phone: the honoree's number (E.164). Signed in with it, the invitation shows as inactive and is never saved.
    surprise: { on: boolean; honoree: string | null; phone: string | null };
};

export const EMPTY_CELEBRATION: CelebrationSettings = {
    startsAt: null,
    place: null,
    city: null,
    money: { mode: "none", per: "person", amountMinor: null, kidAmountMinor: null, payLink: null, goalMinor: null },
    kids: true,
    access: "link",
    invited: [],
    surprise: { on: false, honoree: null, phone: null },
};

export function readCelebration(settings: unknown): CelebrationSettings {
    const c = (settings && typeof settings === "object" ? (settings as { celebration?: Partial<CelebrationSettings> }).celebration : null) ?? {};
    return {
        ...EMPTY_CELEBRATION,
        ...c,
        money: { ...EMPTY_CELEBRATION.money, ...(c.money ?? {}) },
        surprise: { ...EMPTY_CELEBRATION.surprise, ...(c.surprise ?? {}) },
    };
}

export const isRsvpStatus = (v: unknown): v is RsvpStatus => v === "yes" || v === "maybe" || v === "no";

// "120" or "120.50" typed in shekels -> agorot. Null when empty or not a sensible amount.
export function shekelsToMinor(raw: string): number | null {
    const v = raw.replace(/[₪,\s]/g, "");
    if (!/^\d{1,6}(\.\d{1,2})?$/.test(v)) return null;
    const n = Math.round(Number(v) * 100);
    return n > 0 ? n : null;
}

export function formatShekels(minor: number): string {
    const whole = minor % 100 === 0;
    return `₪${(minor / 100).toLocaleString("he-IL", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })}`;
}

// What one reply should put in. Null when the amount is up to the guest ("free") or there is no money.
export function amountOwed(money: CelebrationSettings["money"], people: number, kids: number): number | null {
    if (money.mode !== "fixed" || !money.amountMinor) return null;
    if (money.per === "family") return money.amountMinor;
    const k = Math.min(Math.max(kids, 0), people);
    return (people - k) * money.amountMinor + k * (money.kidAmountMinor ?? money.amountMinor);
}

// Only https links to a payment app or page are accepted as the organizer's pay link.
export function cleanPayLink(raw: string): string | null {
    const v = raw.trim();
    if (!v) return null;
    try {
        const u = new URL(v);
        return u.protocol === "https:" && v.length <= 300 ? u.toString() : null;
    } catch {
        return null;
    }
}

export function clampCount(n: number, min: number, max: number): number {
    return Number.isFinite(n) ? Math.min(Math.max(Math.round(n), min), max) : min;
}

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
// "יום חמישי, 3.11 בשעה 20:00" from the stored local date-time.
export function formatWhen(startsAt: string | null): string | null {
    const m = startsAt?.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/);
    if (!m) return null;
    const [, y, mo, d, h, mi] = m;
    const day = new Date(Date.UTC(+y, +mo - 1, +d)).getUTCDay();
    return `יום ${DAYS[day]}, ${+d}.${+mo}${h ? ` בשעה ${h}:${mi}` : ""}`;
}

export type Totals = { coming: number; kids: number; maybe: number; no: number; replies: number; paidMinor: number; claimed: number };
export function totals(rows: { status: string; people: number; kids: number; paid: string; paidMinor: number | null }[]): Totals {
    const t: Totals = { coming: 0, kids: 0, maybe: 0, no: 0, replies: rows.length, paidMinor: 0, claimed: 0 };
    for (const r of rows) {
        if (r.status === "yes") { t.coming += r.people; t.kids += r.kids; }
        else if (r.status === "maybe") t.maybe += r.people;
        else t.no += 1;
        if (r.paid === "confirmed") t.paidMinor += r.paidMinor ?? 0;
        if (r.paid === "claimed") t.claimed += 1;
    }
    return t;
}

export const GUEST_NAME_MAX = 40;
export const MAX_PEOPLE = 30;
export const MAX_REPLIES = 1000;

// What a guest types as their name on the invitation: trimmed, single spaces, 2-40 characters.
export function cleanGuestName(raw: string): string | null {
    const v = raw.replace(/\s+/g, " ").trim();
    return v.length >= 2 && v.length <= GUEST_NAME_MAX ? v : null;
}

// Other guests see only the first name, plus how many come with them.
export function guestLabel(name: string, people: number): string {
    const first = name.trim().split(" ")[0] ?? "";
    return people > 1 ? `${first} +${people - 1}` : first;
}

// The honoree of a surprise party must not see it: true when one of the viewer's verified phones is theirs.
export function isHonoree(c: CelebrationSettings, viewerPhones: string[]): boolean {
    return c.surprise.on && !!c.surprise.phone && viewerPhones.includes(c.surprise.phone);
}

// What the progress bar fills toward: with a fixed amount, what everyone coming should pay;
// with "any amount", the organizer's optional goal. Null means no bar.
export function collectionTarget(money: CelebrationSettings["money"], coming: { people: number; kids: number }[]): number | null {
    if (money.mode === "fixed") {
        const sum = coming.reduce((n, r) => n + (amountOwed(money, r.people, r.kids) ?? 0), 0);
        return sum > 0 ? sum : null;
    }
    return money.mode === "free" && money.goalMinor ? money.goalMinor : null;
}

export const MAX_INVITED = 500;

// Who may open an invitation: anyone when it is open to the link; otherwise the organizers and the invited phones.
export function mayEnter(c: CelebrationSettings, viewerPhones: string[], organizer: boolean): boolean {
    if (c.access === "link" || organizer) return true;
    return viewerPhones.some((p) => c.invited.includes(p));
}

// "+972501234567" -> "050-1234567" for showing an Israeli number; other countries stay as they are.
export function localPhone(e164: string): string {
    const m = e164.match(/^\+972(\d{2})(\d{7})$/);
    return m ? `0${m[1]}-${m[2]}` : e164;
}
