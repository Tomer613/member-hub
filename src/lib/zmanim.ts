// "השבוע" in "תפילות ולוח זמנים" (board D-ModSynSchedule): this week's parasha, holidays and Shabbat and
// holiday times, worked out in the app by Hebcal (Tommy's choice, 17.10.2026) for the org's city
// (hebrew-calendar C3). Pure, so it is tested without a database. Hebcal is GPL licensed, so it runs on the
// server only: no client component may import this file (the client takes its constants from prayers.ts).
import { HebrewCalendar, Location, flags, type Event } from "@hebcal/core";
export { CANDLE_MINUTES, cityCandleMinutes, readCandleMinutes } from "./prayers.ts";

// Where each city on the setup wizard's list is (il-cities.ts), to the hundredth of a degree: close enough
// for times to the minute. A city not on the list has no times until the admin picks one from it.
const CITIES: Record<string, [number, number]> = {
    "אופקים": [31.31, 34.62], "אור יהודה": [32.03, 34.85], "אור עקיבא": [32.51, 34.92], "אילת": [29.56, 34.95], "אלעד": [32.05, 34.95],
    "אריאל": [32.10, 35.17], "אשדוד": [31.79, 34.65], "אשקלון": [31.67, 34.57], "באר יעקב": [31.94, 34.84], "באר שבע": [31.25, 34.79],
    "בית שאן": [32.50, 35.50], "בית שמש": [31.75, 34.99], "ביתר עילית": [31.70, 35.12], "בני ברק": [32.08, 34.83], "בת ים": [32.02, 34.75],
    "גבעת שמואל": [32.08, 34.85], "גבעתיים": [32.07, 34.81], "גדרה": [31.81, 34.78], "גן יבנה": [31.79, 34.71], "דימונה": [31.07, 35.03],
    "הוד השרון": [32.15, 34.89], "הרצליה": [32.16, 34.84], "זכרון יעקב": [32.57, 34.95], "חדרה": [32.43, 34.92], "חולון": [32.02, 34.78],
    "חיפה": [32.79, 34.99], "טבריה": [32.79, 35.53], "טירת כרמל": [32.76, 34.97], "יבנה": [31.88, 34.74], "יהוד-מונוסון": [32.03, 34.89],
    "יקנעם עילית": [32.66, 35.11], "ירוחם": [30.99, 34.93], "ירושלים": [31.77, 35.22], "כפר יונה": [32.32, 34.94], "כפר סבא": [32.18, 34.91],
    "כרמיאל": [32.92, 35.30], "לוד": [31.95, 34.89], "מבשרת ציון": [31.80, 35.15], "מגדל העמק": [32.68, 35.24], "מודיעין עילית": [31.93, 35.04],
    "מודיעין-מכבים-רעות": [31.90, 35.01], "מעלה אדומים": [31.78, 35.30], "מעלות-תרשיחא": [33.02, 35.27], "מצפה רמון": [30.61, 34.80], "נהריה": [33.01, 35.10],
    "נס ציונה": [31.93, 34.80], "נצרת": [32.70, 35.30], "נשר": [32.77, 35.04], "נתיבות": [31.42, 34.59], "נתניה": [32.32, 34.86],
    "עכו": [32.93, 35.08], "עפולה": [32.61, 35.29], "ערד": [31.26, 35.21], "פרדס חנה-כרכור": [32.47, 34.97], "פתח תקווה": [32.09, 34.89],
    "צפת": [32.96, 35.50], "קצרין": [32.99, 35.69], "קריית אונו": [32.06, 34.86], "קריית ארבע": [31.53, 35.12], "קריית אתא": [32.81, 35.11],
    "קריית ביאליק": [32.83, 35.09], "קריית גת": [31.61, 34.77], "קריית ים": [32.85, 35.07], "קריית מוצקין": [32.84, 35.08], "קריית מלאכי": [31.73, 34.75],
    "קריית שמונה": [33.21, 35.57], "ראש העין": [32.10, 34.95], "ראש פינה": [32.97, 35.54], "ראשון לציון": [31.97, 34.79], "רחובות": [31.89, 34.81],
    "רמלה": [31.93, 34.87], "רמת גן": [32.08, 34.81], "רמת השרון": [32.15, 34.84], "רעננה": [32.18, 34.87], "שדרות": [31.52, 34.60],
    "שוהם": [32.00, 34.95], "תל אביב-יפו": [32.08, 34.78],
};
export const hasCityTimes = (city: string | null | undefined) => !!city && city in CITIES;

export type WeekTime = { date: string; kind: "candles" | "havdalah"; time: string; label: string };
export type WeekTimes = { city: string; parasha: string | null; days: { date: string; name: string }[]; times: WeekTime[] };

const hhmm = (d: Date) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
const isoOf = (e: Event) => { const g = e.getDate().greg(); return `${g.getFullYear()}-${String(g.getMonth() + 1).padStart(2, "0")}-${String(g.getDate()).padStart(2, "0")}`; };
const he = (e: Event) => e.render("he-x-NoNikud");
const local = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };

// The week's dates are Sunday to Shabbat (prayers.ts weekDates). Candle lighting comes before Shabbat and
// before each holiday, Havdalah when they end; the named days are the holidays, Rosh Chodesh and fasts.
export function weekTimes(city: string, dates: string[], candleMinutes: number): WeekTimes | null {
    const at = CITIES[city];
    if (!at) return null;
    const location = new Location(at[0], at[1], true, "Asia/Jerusalem", city, "IL");
    const events = HebrewCalendar.calendar({ start: local(dates[0]), end: local(dates[6]), location, candlelighting: true, candleLightingMins: candleMinutes, sedrot: true, il: true });
    let parasha: string | null = null;
    const days: { date: string; name: string }[] = [];
    const times: WeekTime[] = [];
    for (const e of events) {
        const f = e.getFlags();
        const date = isoOf(e);
        const t = (e as Event & { eventTime?: Date }).eventTime;
        if (f & flags.PARSHA_HASHAVUA) parasha = he(e);
        else if (t && e.getDesc() === "Candle lighting") times.push({ date, kind: "candles", time: hhmm(t), label: "הדלקת נרות" });
        else if (t && e.getDesc() === "Havdalah") times.push({ date, kind: "havdalah", time: hhmm(t), label: date === dates[6] ? "צאת שבת" : "צאת החג" });
        else if (!t && f & (flags.CHAG | flags.CHOL_HAMOED | flags.ROSH_CHODESH | flags.MAJOR_FAST | flags.MINOR_FAST | flags.MINOR_HOLIDAY | flags.SPECIAL_SHABBAT)) days.push({ date, name: he(e) });
    }
    // On Shabbat Havdalah ends Shabbat; the label above names it by the day.
    return { city, parasha, days, times };
}

// From candle lighting to Havdalah (Shabbat and holidays), when the org sends nothing (hebrew-calendar C3).
export function restUntil(now: Date, city: string, candleMinutes: number): string | null {
    const at = CITIES[city];
    if (!at) return null;
    const location = new Location(at[0], at[1], true, "Asia/Jerusalem", city, "IL");
    const start = new Date(now.getTime() - 3 * 86_400_000), end = new Date(now.getTime() + 86_400_000);
    const events = HebrewCalendar.calendar({ start, end, location, candlelighting: true, candleLightingMins: candleMinutes, il: true, noHolidays: false });
    let since: Date | null = null;
    for (const e of events) {
        const t = (e as Event & { eventTime?: Date }).eventTime;
        if (!t) continue;
        if (e.getDesc() === "Candle lighting") { if (t <= now) since = since ?? t; }
        else if (e.getDesc() === "Havdalah") { if (t <= now) since = null; else if (since) return hhmm(t); }
    }
    return null;
}
