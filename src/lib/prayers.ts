// "תפילות ולוח זמנים" (board D-ModSynSchedule): the regular week typed once, and this week with its one-time
// changes. Pure, so it is tested without a database. Days run 0 (Sunday) to 6 (Shabbat), times are "HH:MM".

export const DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"] as const;
export const dayLabel = (d: number) => DAYS[d] ?? "";
export const PRAYER_NAMES = ["שחרית", "מנחה", "ערבית", "מנחה וערבית", "קבלת שבת", "מוסף", "שיעור"] as const;
export const NAME_MAX = 30;
export const PLACE_MAX = 40;
export const UPDATE_MAX = 300;

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
export const isTime = (t: string) => TIME.test(t);

export type PrayerInput = { day: string; name: string; time: string; place: string };
export type PrayerValues = { day: number; name: string; time: string; place: string | null };
export function readPrayer(input: PrayerInput): { ok: true; value: PrayerValues } | { ok: false; error: string } {
    const day = Number(input.day);
    if (!Number.isInteger(day) || day < 0 || day > 6) return { ok: false, error: "בחרו יום." };
    const name = input.name.replace(/\s+/g, " ").trim();
    if ([...name].length < 2 || [...name].length > NAME_MAX) return { ok: false, error: `כתבו איזו תפילה, עד ${NAME_MAX} תווים.` };
    if (!isTime(input.time)) return { ok: false, error: "בחרו שעה." };
    const place = input.place.replace(/\s+/g, " ").trim();
    if ([...place].length > PLACE_MAX) return { ok: false, error: `שם המקום ארוך מ-${PLACE_MAX} תווים.` };
    return { ok: true, value: { day, name, time: input.time, place: place || null } };
}

// The Israeli week of a day: Sunday to Shabbat, as "YYYY-MM-DD".
export function weekDates(today: string): string[] {
    const t = Date.parse(`${today}T12:00:00Z`);
    const sunday = t - new Date(t).getUTCDay() * 86_400_000;
    return Array.from({ length: 7 }, (_, i) => new Date(sunday + i * 86_400_000).toISOString().slice(0, 10));
}
export const shortDate = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;

export type PrayerRow = { id: string; day: number; name: string; time: string; place: string | null };
export type ChangeRow = { id: string; prayerId: string | null; date: string; cancelled: boolean; name: string | null; time: string | null; place: string | null };
export type WeekRow = {
    key: string; day: number; date: string; name: string; time: string; place: string | null;
    state: "regular" | "changed" | "cancelled" | "added"; prayerId: string | null; changeId: string | null;
};

// "שבוע זה": the regular week on this week's dates, with each one-time change applied, by day and then time.
export function weekView(prayers: PrayerRow[], changes: ChangeRow[], dates: string[]): WeekRow[] {
    const rows: WeekRow[] = prayers.map((p) => {
        const date = dates[p.day];
        const c = changes.find((x) => x.prayerId === p.id && x.date === date);
        if (!c) return { key: p.id, day: p.day, date, name: p.name, time: p.time, place: p.place, state: "regular", prayerId: p.id, changeId: null };
        return {
            key: p.id, day: p.day, date, name: c.name ?? p.name, time: c.time ?? p.time, place: c.place ?? p.place,
            state: c.cancelled ? "cancelled" : "changed", prayerId: p.id, changeId: c.id,
        };
    });
    for (const c of changes) {
        const day = dates.indexOf(c.date);
        if (c.prayerId || day < 0 || !c.name || !c.time) continue;
        rows.push({ key: c.id, day, date: c.date, name: c.name, time: c.time, place: c.place, state: "added", prayerId: null, changeId: c.id });
    }
    return sortRows(rows);
}
export const sortRows = <T extends { day: number; time: string }>(rows: T[]): T[] => [...rows].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));

export const readUpdate = (text: string): { ok: true; value: string } | { ok: false; error: string } => {
    const t = text.trim();
    if ([...t].length < 3) return { ok: false, error: "כתבו מה לעדכן." };
    if ([...t].length > UPDATE_MAX) return { ok: false, error: `עד ${UPDATE_MAX} תווים.` };
    return { ok: true, value: t };
};

// Candle lighting, minutes before sunset. The custom differs by city: 40 in Jerusalem, 30 in Haifa and
// Zichron Yaakov, 18 elsewhere (as Hebcal counts it). The gabbai can choose the community's own.
export const CANDLE_MINUTES = [18, 20, 22, 30, 40] as const;
export const cityCandleMinutes = (city: string | null | undefined) => (city === "ירושלים" ? 40 : city === "חיפה" || city === "זכרון יעקב" ? 30 : 18);
export function readCandleMinutes(settings: unknown, city: string | null | undefined): { minutes: number; own: boolean } {
    const v = settings && typeof settings === "object" ? (settings as Record<string, unknown>).prayersCandleMins : undefined;
    return typeof v === "number" && (CANDLE_MINUTES as readonly number[]).includes(v) ? { minutes: v, own: true } : { minutes: cityCandleMinutes(city), own: false };
}
