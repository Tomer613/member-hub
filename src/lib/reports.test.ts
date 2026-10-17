import { test } from "node:test";
import assert from "node:assert/strict";
import { byMonth, collectionRate, monthKeys, monthStartUtc, rangeText, readMonths, shortShekels } from "./reports.ts";

test("months end with the current one in Israel", () => {
    assert.deepEqual(monthKeys(new Date("2026-10-17T12:00:00Z"), 6), ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]);
    assert.deepEqual(monthKeys(new Date("2026-02-10T12:00:00Z"), 3), ["2025-12", "2026-01", "2026-02"]);
    // 31.10 at 23:30 in Israel is already November there.
    assert.deepEqual(monthKeys(new Date("2026-10-31T22:30:00Z"), 1), ["2026-11"]);
});

test("range text", () => {
    assert.equal(rangeText(["2026-05", "2026-10"]), "מאי עד אוק׳ 2026");
    assert.equal(rangeText(["2025-11", "2026-10"]), "נוב׳ 2025 עד אוק׳ 2026");
});

test("a month starts at midnight in Israel", () => {
    assert.equal(monthStartUtc("2026-05").toISOString(), "2026-04-30T21:00:00.000Z");
    assert.equal(monthStartUtc("2026-12").toISOString(), "2026-11-30T22:00:00.000Z");
});

test("payments fall in their Israeli month", () => {
    const keys = ["2026-09", "2026-10"];
    const r = byMonth(keys, [{ at: new Date("2026-09-30T21:30:00Z"), amountMinor: 500 }, { at: new Date("2026-09-15T10:00:00Z"), amountMinor: 200 }, { at: new Date("2026-01-01T10:00:00Z"), amountMinor: 999 }]);
    assert.deepEqual(r.map((x) => x.minor), [200, 500]);
    assert.equal(r[1].label, "אוק׳");
});

test("short labels and rate", () => {
    assert.equal(shortShekels(85_000), "₪850");
    assert.equal(shortShekels(1_420_000), "₪14K");
    assert.equal(shortShekels(120_000), "₪1.2K");
    assert.equal(collectionRate(0, 0), null);
    assert.equal(collectionRate(10_000, 6_800), 68);
    assert.equal(readMonths("12"), 12);
    assert.equal(readMonths("x"), 6);
});
