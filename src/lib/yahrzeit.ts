// "יארצייט" (board D-ModSynYahrzeit): when the anniversary falls this year, by the Hebrew date. Pure, so it is
// tested without a database. The Hebrew calendar comes from Intl (ICU), not from our own tables.
import { getHebrewDayLabel, HEBREW_MONTHS } from "../packs/synagogue/yahrzeit.ts";

export const NAME_MAX = 60;
export const NOTES_MAX = 300;
export const REMIND_DAYS = [1, 3, 7, 14] as const;
export const DEFAULT_REMIND_DAYS = 7;
export const readRemindDays = (settings: unknown): number => {
    const v = settings && typeof settings === "object" && !Array.isArray(settings) ? (settings as Record<string, unknown>).yahrzeitDays : undefined;
    return typeof v === "number" && (REMIND_DAYS as readonly number[]).includes(v) ? v : DEFAULT_REMIND_DAYS;
};

// Our month names (as stored) and ICU's English ones.
const ICU: Record<string, string> = {
    "תשרי": "Tishri", "מרחשוון": "Heshvan", "כסלו": "Kislev", "טבת": "Tevet", "שבט": "Shevat", "אדר": "Adar",
    "אדר א'": "Adar I", "אדר ב'": "Adar II", "ניסן": "Nisan", "אייר": "Iyar", "סיוון": "Sivan", "תמוז": "Tamuz", "אב": "Av", "אלול": "Elul",
};
export const isHebrewMonth = (m: string) => (HEBREW_MONTHS as readonly string[]).includes(m);
export const hebrewLabel = (day: number, month: string) => `${getHebrewDayLabel(day)} ${month}`;

// A year of 13 months: 3, 6, 8, 11, 14, 17 and 19 of the 19-year cycle.
export const isLeapYear = (y: number) => (7 * y + 1) % 19 < 7;

const fmt = new Intl.DateTimeFormat("en-u-ca-hebrew", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });
type Day = { iso: string; day: number; month: string; year: number };
function hebrewOf(iso: string): Day {
    const p = Object.fromEntries(fmt.formatToParts(new Date(`${iso}T12:00:00Z`)).map((x) => [x.type, x.value]));
    return { iso, day: Number(p.day), month: p.month, year: Number(p.year) };
}

// The Israeli calendar days around today, each with its Hebrew date: enough to know every month's length in
// this Hebrew year and the next.
export function calendar(today: string, back = 400, ahead = 420): Day[] {
    const start = Date.parse(`${today}T00:00:00Z`);
    const out: Day[] = [];
    for (let i = -back; i <= ahead; i++) out.push(hebrewOf(new Date(start + i * 86_400_000).toISOString().slice(0, 10)));
    return out;
}

// The rule for dates a year may not have (kept in docs/open-questions.he.md):
// - Plain "אדר" in a leap year is kept in אדר ב׳; "אדר א׳" or "אדר ב׳" in a regular year is kept in אדר.
// - A 30th the month does not have this year is kept on the 29th, the day before the next month starts.
//   ל׳ אדר א׳ in a regular year (there is no such day at all) is kept on ל׳ שבט.
export function observedIn(day: number, month: string, year: number): { day: number; icu: string } {
    const leap = isLeapYear(year);
    if (month === "אדר א'" && day === 30 && !leap) return { day: 30, icu: "Shevat" };
    const icu = month === "אדר" ? (leap ? "Adar II" : "Adar") : month.startsWith("אדר") && !leap ? "Adar" : ICU[month];
    return { day, icu };
}

// The next day it is kept, today included: the Israeli date, how many days away, and the Hebrew year.
export function nextYahrzeit(day: number, month: string, cal: Day[], today: string): { iso: string; inDays: number; year: number } | null {
    const t = cal.findIndex((d) => d.iso === today);
    if (t < 0) return null;
    for (const year of [cal[t].year, cal[t].year + 1]) {
        const want = observedIn(day, month, year);
        let i = cal.findIndex((d) => d.year === year && d.month === want.icu && d.day === want.day);
        if (i < 0 && want.day === 30) i = cal.findIndex((d) => d.year === year && d.month === want.icu && d.day === 29);
        if (i >= t) return { iso: cal[i].iso, inDays: i - t, year };
    }
    return null;
}

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
// "03.11" as on the board, and the weekday for messages.
export const shortDate = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
export const weekday = (iso: string) => DAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()];

export type ReminderState = "off" | "sent" | "soon" | "planned";
// "נשלחה", "תישלח בעוד 3 ימים", "מתוכננת" (board D-ModSynYahrzeit).
export function reminderState(next: { inDays: number; year: number }, remind: boolean, remindedFor: number | null, daysBefore: number): { state: ReminderState; text: string } {
    if (!remind) return { state: "off", text: "בלי תזכורת" };
    if (remindedFor === next.year) return { state: "sent", text: "נשלחה" };
    const wait = next.inDays - daysBefore;
    if (wait <= 0) return { state: "soon", text: "נשלחת היום" };
    if (wait <= 30) return { state: "soon", text: wait === 1 ? "תישלח מחר" : `תישלח בעוד ${wait} ימים` };
    return { state: "planned", text: "מתוכננת" };
}
export const dueForReminder = (next: { inDays: number; year: number }, remind: boolean, remindedFor: number | null, daysBefore: number) =>
    remind && remindedFor !== next.year && next.inDays <= daysBefore;

export type YahrzeitInput = { name: string; relation: string; day: string; month: string; memberId: string; notes: string; remind: boolean; announce: boolean };
export function readYahrzeit(input: YahrzeitInput, relations: readonly { value: string }[]): { ok: true; value: { deceasedName: string; relation: string; hebrewDay: number; hebrewMonth: string; memberId: string; notes: string | null; remind: boolean; announce: boolean } } | { ok: false; error: string } {
    const name = input.name.replace(/\s+/g, " ").trim();
    if ([...name].length < 2 || [...name].length > NAME_MAX) return { ok: false, error: `כתבו לזכר מי, עד ${NAME_MAX} תווים.` };
    if (!relations.some((r) => r.value === input.relation)) return { ok: false, error: "בחרו קרבה." };
    const day = Number(input.day);
    if (!Number.isInteger(day) || day < 1 || day > 30) return { ok: false, error: "בחרו יום בחודש העברי." };
    if (!isHebrewMonth(input.month)) return { ok: false, error: "בחרו חודש עברי." };
    if (day === 30 && ["טבת", "אייר", "תמוז", "אלול", "אדר", "אדר ב'"].includes(input.month)) return { ok: false, error: `בחודש ${input.month} יש תמיד 29 ימים.` };
    if (!input.memberId) return { ok: false, error: "בחרו את המשפחה שתקבל את התזכורת." };
    const notes = input.notes.trim();
    if ([...notes].length > NOTES_MAX) return { ok: false, error: `ההערה ארוכה מ-${NOTES_MAX} תווים.` };
    return { ok: true, value: { deceasedName: name, relation: input.relation, hebrewDay: day, hebrewMonth: input.month, memberId: input.memberId, notes: notes || null, remind: input.remind, announce: input.announce } };
}
