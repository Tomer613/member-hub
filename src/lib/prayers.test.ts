import { test } from "node:test";
import assert from "node:assert/strict";
import { readPrayer, readUpdate, weekDates, weekView } from "./prayers.ts";

test("reading a prayer", () => {
    const r = readPrayer({ day: "6", name: " מנחה ", time: "17:45", place: "בית המדרש" });
    assert.ok(r.ok && r.value.day === 6 && r.value.name === "מנחה" && r.value.place === "בית המדרש");
    assert.equal(readPrayer({ day: "7", name: "מנחה", time: "17:45", place: "" }).ok, false);
    assert.equal(readPrayer({ day: "1", name: "מ", time: "17:45", place: "" }).ok, false);
    assert.equal(readPrayer({ day: "1", name: "מנחה", time: "25:00", place: "" }).ok, false);
    const p = readPrayer({ day: "0", name: "שחרית", time: "06:30", place: "" });
    assert.ok(p.ok && p.value.place === null);
});

test("the week runs Sunday to Shabbat", () => {
    // 17.10.2026 is a Shabbat.
    assert.deepEqual(weekDates("2026-10-17"), ["2026-10-11", "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17"]);
    assert.equal(weekDates("2026-10-18")[0], "2026-10-18");
});

test("this week with its changes", () => {
    const dates = weekDates("2026-10-14");
    const prayers = [
        { id: "a", day: 6, name: "מנחה", time: "17:45", place: "בית המדרש" },
        { id: "b", day: 0, name: "שחרית", time: "06:30", place: null },
        { id: "c", day: 0, name: "ערבית", time: "19:00", place: null },
    ];
    const rows = weekView(prayers, [
        { id: "x", prayerId: "a", date: "2026-10-17", cancelled: false, name: null, time: "17:15", place: null },
        { id: "y", prayerId: "c", date: "2026-10-11", cancelled: true, name: null, time: null, place: null },
        { id: "z", prayerId: null, date: "2026-10-15", cancelled: false, name: "סליחות", time: "05:30", place: "היכל" },
        { id: "old", prayerId: "b", date: "2026-10-04", cancelled: true, name: null, time: null, place: null },
    ], dates);
    assert.deepEqual(rows.map((r) => `${r.day} ${r.time} ${r.name} ${r.state}`), [
        "0 06:30 שחרית regular", "0 19:00 ערבית cancelled", "4 05:30 סליחות added", "6 17:15 מנחה changed",
    ]);
    assert.equal(rows[3].place, "בית המדרש");
});

test("manual update", () => {
    assert.equal(readUpdate("  ").ok, false);
    assert.equal(readUpdate("א".repeat(301)).ok, false);
    assert.ok(readUpdate(" מנחה בבית המדרש ").ok);
});
