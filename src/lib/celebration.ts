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
    // Buttons for guests who replied: the active WhatsApp group and a shared photo album (no photo hosting here).
    links: { whatsapp: string | null; album: string | null };
    // phone: the honoree's number (E.164). Signed in with it, the invitation shows as inactive and is never saved.
    surprise: { on: boolean; honoree: string | null; phone: string | null };
    // "שאלה משלכם": one question the organizer adds for those coming, answered freely or from a few options.
    question: Question | null;
};
export type Question = { text: string; options: string[] };

export const EMPTY_CELEBRATION: CelebrationSettings = {
    startsAt: null,
    place: null,
    city: null,
    money: { mode: "none", per: "person", amountMinor: null, kidAmountMinor: null, payLink: null, goalMinor: null },
    kids: true,
    access: "link",
    invited: [],
    links: { whatsapp: null, album: null },
    surprise: { on: false, honoree: null, phone: null },
    question: null,
};

export function readCelebration(settings: unknown): CelebrationSettings {
    const c = (settings && typeof settings === "object" ? (settings as { celebration?: Partial<CelebrationSettings> }).celebration : null) ?? {};
    return {
        ...EMPTY_CELEBRATION,
        ...c,
        money: { ...EMPTY_CELEBRATION.money, ...(c.money ?? {}) },
        surprise: { ...EMPTY_CELEBRATION.surprise, ...(c.surprise ?? {}) },
        links: { ...EMPTY_CELEBRATION.links, ...(c.links ?? {}) },
    };
}

export const isRsvpStatus = (v: unknown): v is RsvpStatus => v === "yes" || v === "maybe" || v === "no";

export { formatShekels, shekelsToMinor } from "./money.ts";

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

// A WhatsApp group invite link (https://chat.whatsapp.com/...). Anything else is refused.
export function cleanWhatsAppGroup(raw: string): string | null {
    const v = cleanPayLink(raw);
    return v && new URL(v).hostname === "chat.whatsapp.com" ? v : null;
}

// After the event (decided with Tommy 14.10.2026): a week later the celebration moves to the folded
// "חגיגות שהיו" in the wallet but stays open, so the organizer can still chase payments and guests can pay.
// It locks by itself once every payment is in: right away when there is no money, and for "each gives what
// they like" once the goal is reached (Tommy 15.10.2026; with no goal only the organizer closes it). A payment
// still waiting for the organizer's confirmation keeps it open. The organizer can close it at any time.
export const PAST_AFTER_DAYS = 7;
export type Stage = "upcoming" | "past" | "closed";
type PayRow = { status: string; people: number; kids: number; paid: string; paidMinor?: number | null };

export function isPast(startsAt: string | null, now: Date): boolean {
    if (!startsAt) return false;
    const t = Date.parse(startsAt);
    return Number.isFinite(t) && now.getTime() - t >= PAST_AFTER_DAYS * 86_400_000;
}

// Every "coming" reply that owes money has had it confirmed by the organizer.
export function allPaid(money: CelebrationSettings["money"], rows: PayRow[]): boolean {
    if (money.mode === "none") return true;
    if (rows.some((r) => r.paid === "claimed")) return false;
    if (money.mode === "free") return !!money.goalMinor && rows.reduce((n, r) => n + (r.paid === "confirmed" ? r.paidMinor ?? 0 : 0), 0) >= money.goalMinor;
    return rows.every((r) => r.status !== "yes" || !amountOwed(money, r.people, r.kids) || r.paid === "confirmed");
}

export function celebrationStage(c: CelebrationSettings, orgStatus: string, rows: PayRow[], now: Date): Stage {
    if (orgStatus === "closed") return "closed";
    if (!isPast(c.startsAt, now)) return "upcoming";
    return allPaid(c.money, rows) ? "closed" : "past";
}

// A guest who said "coming" and still owes keeps the card in the wallet's main area ("נשאר לשלם").
export function stillOwes(money: CelebrationSettings["money"], row: PayRow | null): boolean {
    return !!row && row.status === "yes" && row.paid !== "confirmed" && !!amountOwed(money, row.people, row.kids);
}

// "לחגוג שוב": the same date and time a year later (Feb 29 falls back to Feb 28).
export function nextYear(startsAt: string | null): string | null {
    const m = startsAt?.match(/^(\d{4})-(\d{2})-(\d{2})(T.*)?$/);
    if (!m) return null;
    const y = +m[1] + 1;
    const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const d = m[2] === "02" && m[3] === "29" && !leap ? "28" : m[3];
    return `${y}-${m[2]}-${d}${m[4] ?? ""}`;
}

// "שאלה משלכם" (decided with Tommy 14.10.2026): one question, shown to whoever answers "coming" or "maybe".
// No options means a short free answer; otherwise two to six options to pick from. Answering is optional.
export const QUESTION_MAX = 120;
export const ANSWER_MAX = 200;
export const OPTION_MAX = 40;
export const MAX_OPTIONS = 6;

const oneLine = (v: string) => v.replace(/\s+/g, " ").trim();

export function cleanQuestion(text: string, options: string[]): { question: Question } | { error: string } {
    const t = oneLine(text);
    if (t.length < 3) return { error: "כתבו את השאלה" };
    if (t.length > QUESTION_MAX) return { error: `השאלה ארוכה מדי (עד ${QUESTION_MAX} תווים)` };
    const list = [...new Set(options.map(oneLine).filter(Boolean))];
    if (list.some((o) => o.length > OPTION_MAX)) return { error: `כל אפשרות עד ${OPTION_MAX} תווים` };
    if (list.length === 1) return { error: "צריך לפחות שתי אפשרויות" };
    if (list.length > MAX_OPTIONS) return { error: `עד ${MAX_OPTIONS} אפשרויות` };
    return { question: { text: t, options: list } };
}

export function cleanAnswer(q: Question | null, raw: string): string | null {
    if (!q) return null;
    const v = oneLine(raw);
    if (!v) return null;
    if (q.options.length) return q.options.includes(v) ? v : null;
    return v.slice(0, ANSWER_MAX);
}

// How many picked each option, in the organizer's order. Answers to an older version of the question
// that match no option are left out here, but still show next to the guest's name.
export function answerCounts(q: Question, answers: (string | null)[]): { option: string; count: number }[] {
    return q.options.map((option) => ({ option, count: answers.filter((a) => a === option).length }));
}
