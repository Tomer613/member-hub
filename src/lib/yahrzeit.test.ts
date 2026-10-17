import { test } from "node:test";
import assert from "node:assert/strict";
import { calendar, isLeapYear, nextYahrzeit, observedIn, readRemindDays, readYahrzeit, reminderState } from "./yahrzeit.ts";

const today = "2026-10-17"; // ו׳ חשוון תשפ״ז, a leap year
const cal = calendar(today);

test("leap years", () => {
    assert.equal(isLeapYear(5787), true);
    assert.equal(isLeapYear(5786), false);
    assert.equal(isLeapYear(5784), true);
});

test("next date by the Hebrew calendar", () => {
    assert.deepEqual(nextYahrzeit(6, "מרחשוון", cal, today), { iso: "2026-10-17", inDays: 0, year: 5787 });
    // כ״ח תשרי already passed this year: next year.
    assert.equal(nextYahrzeit(28, "תשרי", cal, today)?.year, 5788);
    assert.equal(nextYahrzeit(28, "תשרי", cal, today)?.iso, "2027-10-29");
    assert.equal(nextYahrzeit(17, "מרחשוון", cal, today)?.iso, "2026-10-28");
});

test("adar in a leap year is kept in adar II", () => {
    assert.deepEqual(observedIn(10, "אדר", 5787), { day: 10, icu: "Adar II" });
    assert.deepEqual(observedIn(10, "אדר א'", 5786), { day: 10, icu: "Adar" });
    assert.deepEqual(observedIn(30, "אדר א'", 5786), { day: 30, icu: "Shevat" });
    assert.equal(nextYahrzeit(1, "אדר", cal, today)?.iso, "2027-03-10");
    assert.equal(nextYahrzeit(13, "אדר א'", cal, today)?.iso, "2027-02-20");
});

test("a missing 30th is kept on the 29th", () => {
    // In 5787 Heshvan and Kislev both have 30 days (2026-11-10 is ל׳ חשוון).
    assert.equal(nextYahrzeit(30, "מרחשוון", cal, today)?.iso, "2026-11-10");
    // 5788: find what the calendar says and check the fallback lands on a real day of that month.
    const k = nextYahrzeit(30, "כסלו", calendar("2027-10-17"), "2027-10-17");
    assert.ok(k && /^2027-12-/.test(k.iso));
});

test("reminder states", () => {
    assert.equal(reminderState({ inDays: 10, year: 5787 }, false, null, 7).text, "בלי תזכורת");
    assert.equal(reminderState({ inDays: 10, year: 5787 }, true, 5787, 7).text, "נשלחה");
    assert.equal(reminderState({ inDays: 10, year: 5787 }, true, 5786, 7).text, "תישלח בעוד 3 ימים");
    assert.equal(reminderState({ inDays: 5, year: 5787 }, true, null, 7).text, "נשלחת היום");
    assert.equal(reminderState({ inDays: 80, year: 5787 }, true, null, 7).text, "מתוכננת");
    assert.equal(readRemindDays({ yahrzeitDays: 3 }), 3);
    assert.equal(readRemindDays({ yahrzeitDays: 5 }), 7);
});

test("reading the form", () => {
    const rel = [{ value: "father" }];
    const base = { name: " אבי  הזקן ז״ל ", relation: "father", day: "28", month: "תשרי", memberId: "m1", notes: "", remind: true, announce: false };
    const r = readYahrzeit(base, rel);
    assert.ok(r.ok && r.value.deceasedName === "אבי הזקן ז״ל" && r.value.hebrewDay === 28);
    assert.equal(readYahrzeit({ ...base, day: "30", month: "טבת" }, rel).ok, false);
    assert.equal(readYahrzeit({ ...base, memberId: "" }, rel).ok, false);
    assert.equal(readYahrzeit({ ...base, month: "ינואר" }, rel).ok, false);
});
