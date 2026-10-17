import { test } from "node:test";
import assert from "node:assert/strict";
import { activityTypes, ilDateValue, ilTimeValue, ilToUtc, minyanText, readActivity, seatsText, whenLabel, type ActivityInput } from "./activities.ts";

test("types: core first, the pack's after, 'כללי' last and once", () => {
    assert.deepEqual(activityTypes([{ value: "brit", label: "ברית" }, { value: "general", label: "כללי" }]).map((t) => t.value), ["class", "meal", "meeting", "trip", "brit", "general"]);
});

test("ilToUtc keeps Israel wall time in summer and winter", () => {
    assert.equal(ilToUtc("2026-07-10", "19:00")!.toISOString(), "2026-07-10T16:00:00.000Z");
    assert.equal(ilToUtc("2026-12-10", "19:00")!.toISOString(), "2026-12-10T17:00:00.000Z");
    assert.equal(ilToUtc("2026-02-30", "19:00"), null);
    assert.equal(ilToUtc("2026-12-10", "25:00"), null);
    const d = ilToUtc("2026-12-10", "06:05")!;
    assert.equal(ilDateValue(d), "2026-12-10");
    assert.equal(ilTimeValue(d), "06:05");
});

test("whenLabel: today, tomorrow, weekday, date", () => {
    const now = new Date("2026-10-17T09:00:00Z"); // Saturday
    assert.equal(whenLabel(ilToUtc("2026-10-17", "20:00")!, now), "היום 20:00");
    assert.equal(whenLabel(ilToUtc("2026-10-18", "06:00")!, now), "מחר 06:00");
    assert.equal(whenLabel(ilToUtc("2026-10-23", "19:00")!, now, false), "שישי");
    assert.equal(whenLabel(ilToUtc("2026-11-02", "19:00")!, now, false), "02.11");
});

const base: ActivityInput = { title: "ארוחת שבת קהילתית", type: "meal", date: "2026-10-23", time: "19:00", location: "", about: "", seats: "80", signup: true, paid: true, price: "₪45", fields: { minyan: true, other: true } };
const types = activityTypes([]);
const now = new Date("2026-10-17T09:00:00Z");

test("readActivity", () => {
    const r = readActivity(base, types, [{ key: "minyan" }], now, true);
    assert.equal(r.ok, true);
    if (r.ok) {
        assert.equal(r.value.priceMinor, 4500);
        assert.equal(r.value.seats, 80);
        assert.deepEqual(r.value.payload, { minyan: true });
    }
    assert.equal(readActivity({ ...base, paid: true, signup: false }, types, [], now, true).ok, false);
    assert.equal(readActivity({ ...base, seats: "0" }, types, [], now, true).ok, false);
    assert.equal(readActivity({ ...base, date: "2026-10-01" }, types, [], now, true).ok, false);
    assert.equal(readActivity({ ...base, date: "2026-10-01" }, types, [], now, false).ok, true);
    assert.equal(readActivity({ ...base, type: "x" }, types, [], now, true).ok, false);
});

test("seats and minyan", () => {
    assert.deepEqual(seatsText(null, 4), { full: false, text: null });
    assert.deepEqual(seatsText(5, 4), { full: false, text: "נשאר מקום אחד" });
    assert.deepEqual(seatsText(5, 5), { full: true, text: "מלא" });
    assert.equal(minyanText(7), "חסרים 3 למניין");
    assert.equal(minyanText(11), "יש מניין");
});
