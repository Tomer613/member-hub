import { test } from "node:test";
import assert from "node:assert/strict";
import { cityCandleMinutes, readCandleMinutes, restUntil, weekTimes } from "./zmanim.ts";
import { weekDates } from "./prayers.ts";

test("this week in Jerusalem", () => {
    const w = weekTimes("ירושלים", weekDates("2026-10-14"), 40);
    assert.ok(w);
    assert.equal(w.parasha, "פרשת נח");
    assert.deepEqual(w.times.map((t) => `${t.date} ${t.label} ${t.time}`), ["2026-10-16 הדלקת נרות 17:25", "2026-10-17 צאת שבת 18:41"]);
    assert.ok(w.days.some((d) => d.date === "2026-10-12" && d.name.includes("ראש חודש")));
    assert.equal(weekTimes("עיר שאינה ברשימה", weekDates("2026-10-14"), 18), null);
});

test("a holiday week has the holiday's times", () => {
    const w = weekTimes("תל אביב-יפו", weekDates("2026-10-01"), 18);
    assert.ok(w && w.parasha === null);
    assert.ok(w.days.some((d) => d.name.includes("שמיני עצרת")));
    assert.deepEqual(w.times.map((t) => t.label), ["הדלקת נרות", "צאת שבת"]);
});

test("candle lighting by the city's custom, or the community's", () => {
    assert.equal(cityCandleMinutes("ירושלים"), 40);
    assert.equal(cityCandleMinutes("חיפה"), 30);
    assert.equal(cityCandleMinutes("רעננה"), 18);
    assert.deepEqual(readCandleMinutes({ prayersCandleMins: 22 }, "רעננה"), { minutes: 22, own: true });
    assert.deepEqual(readCandleMinutes({ prayersCandleMins: 7 }, "ירושלים"), { minutes: 40, own: false });
});

test("nothing is sent on Shabbat", () => {
    assert.equal(restUntil(new Date("2026-10-17T09:00:00Z"), "ירושלים", 40), "18:41");
    assert.equal(restUntil(new Date("2026-10-16T14:40:00Z"), "ירושלים", 40), "18:41");
    assert.equal(restUntil(new Date("2026-10-16T13:00:00Z"), "ירושלים", 40), null);
    assert.equal(restUntil(new Date("2026-10-17T16:00:00Z"), "ירושלים", 40), null);
    assert.equal(restUntil(new Date("2026-10-15T09:00:00Z"), "ירושלים", 40), null);
});
