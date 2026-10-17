// "פעילויות ואירועים" (board D-AdmActivities, overview "בקרוב"). Pure, so it is tested without a database.

export const TITLE_MAX = 60;
export const ABOUT_MAX = 600;
export const PLACE_MAX = 80;
export const MINYAN = 10;

// Core kinds every org has; a pack adds its own (bar mitzvah, wedding...) after them.
export const CORE_TYPES = [
    { value: "class", label: "שיעור" },
    { value: "meal", label: "ארוחה" },
    { value: "meeting", label: "אסיפה" },
    { value: "trip", label: "טיול" },
    { value: "general", label: "כללי" },
] as const;
export function activityTypes(pack: readonly { value: string; label: string }[]): { value: string; label: string }[] {
    const all = [...CORE_TYPES.filter((t) => t.value !== "general"), ...pack.filter((t) => t.value !== "general"), { value: "general", label: "כללי" }];
    return all.filter((t, i) => all.findIndex((x) => x.value === t.value) === i);
}
export const typeLabel = (v: string, pack: readonly { value: string; label: string }[]) => activityTypes(pack).find((t) => t.value === v)?.label ?? "כללי";

const IL = "Asia/Jerusalem";
const parts = (d: Date) => Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: IL, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d).map((p) => [p.type, p.value]));

// "2026-10-23" + "19:00" in Israel, as a moment. Daylight saving is found by asking Intl, not by a table.
export function ilToUtc(date: string, time: string): Date | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    const t = /^(\d{1,2}):(\d{2})$/.exec(time);
    if (!m || !t || +t[1] > 23 || +t[2] > 59) return null;
    const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +t[1], +t[2]);
    if (Number.isNaN(wall) || new Date(wall).getUTCDate() !== +m[3]) return null;
    let guess = wall;
    for (let i = 0; i < 2; i++) {
        const p = parts(new Date(guess));
        const shown = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
        guess += wall - shown;
    }
    return new Date(guess);
}
export const ilDateValue = (d: Date) => { const p = parts(d); return `${p.year}-${p.month}-${p.day}`; };
export const ilTimeValue = (d: Date) => { const p = parts(d); return `${p.hour}:${p.minute}`; };

const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
// The board's dates: "היום", "מחר", the weekday within the coming week, else DD.MM. With the hour when asked.
export function whenLabel(at: Date, now: Date, withTime = true): string {
    const day = (d: Date) => Date.UTC(+parts(d).year, +parts(d).month - 1, +parts(d).day);
    const diff = Math.round((day(at) - day(now)) / 86_400_000);
    const p = parts(at);
    const date = diff === 0 ? "היום" : diff === 1 ? "מחר" : diff > 1 && diff < 7 ? DAYS[new Date(day(at)).getUTCDay()] : `${p.day}.${p.month}`;
    return withTime ? `${date} ${p.hour}:${p.minute}` : date;
}

export type ActivityInput = { title: string; type: string; date: string; time: string; location: string; about: string; seats: string; signup: boolean; paid: boolean; price: string; fields: Record<string, boolean> };
export type ActivityValues = { title: string; type: string; startsAt: Date; location: string | null; description: string | null; seats: number | null; signup: boolean; priceMinor: number | null; payload: Record<string, boolean> };

export function readActivity(input: ActivityInput, types: readonly { value: string }[], packFields: readonly { key: string }[], now: Date, publishing: boolean): { ok: true; value: ActivityValues } | { ok: false; error: string } {
    const title = input.title.replace(/\s+/g, " ").trim();
    if ([...title].length < 2 || [...title].length > TITLE_MAX) return { ok: false, error: `שם הפעילות צריך להיות בין 2 ל-${TITLE_MAX} תווים.` };
    if (!types.some((t) => t.value === input.type)) return { ok: false, error: "בחרו סוג." };
    const startsAt = ilToUtc(input.date, input.time);
    if (!startsAt) return { ok: false, error: "בחרו תאריך ושעה." };
    if (publishing && startsAt.getTime() < now.getTime()) return { ok: false, error: "המועד כבר עבר. בחרו תאריך ושעה בעתיד." };
    const location = input.location.replace(/\s+/g, " ").trim();
    if ([...location].length > PLACE_MAX) return { ok: false, error: "המקום ארוך מדי." };
    const about = input.about.replace(/\r\n?/g, "\n").trim();
    if ([...about].length > ABOUT_MAX) return { ok: false, error: `התיאור ארוך מ-${ABOUT_MAX} תווים.` };
    let seats: number | null = null;
    if (input.seats.trim()) {
        seats = Number(input.seats);
        if (!Number.isInteger(seats) || seats < 1 || seats > 100_000) return { ok: false, error: "מספר המקומות צריך להיות מספר שלם, 1 ומעלה." };
    }
    let priceMinor: number | null = null;
    if (input.paid) {
        if (!input.signup) return { ok: false, error: "פעילות בתשלום צריכה הרשמה מראש, כדי שנדע את מי לחייב." };
        const n = Number(input.price.replace(/[,\s₪]/g, ""));
        if (!Number.isFinite(n) || n <= 0 || n > 100_000) return { ok: false, error: "כתבו מחיר בשקלים." };
        priceMinor = Math.round(n * 100);
    }
    const payload = Object.fromEntries(packFields.map((f) => [f.key, !!input.fields[f.key]]));
    return { ok: true, value: { title, type: input.type, startsAt, location: location || null, description: about || null, seats, signup: input.signup, priceMinor, payload } };
}

// What a member sees about room: "נשארו 4 מקומות", "מלא".
export function seatsText(seats: number | null, going: number): { full: boolean; text: string | null } {
    if (seats === null) return { full: false, text: null };
    const left = Math.max(0, seats - going);
    return { full: left === 0, text: left === 0 ? "מלא" : left === 1 ? "נשאר מקום אחד" : `נשארו ${left} מקומות` };
}
export const goingText = (n: number) => (n === 0 ? "עוד אין נרשמים" : n === 1 ? "נרשם אחד" : `${n} נרשמו`);
export const minyanText = (going: number) => (going >= MINYAN ? "יש מניין" : `חסרים ${MINYAN - going} למניין`);
