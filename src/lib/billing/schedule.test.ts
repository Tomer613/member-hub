// Run with: npm test   (node's built-in runner with type stripping, Node 22.6+)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
    baseFeeForMonth, computeMonthlyCharges, occupancyFractions, snapFraction, fractionLabel,
    type FeeSchedule,
} from "./schedule.ts";

const d = (s: string) => new Date(`${s}T00:00:00Z`);

// Same shape as the HOA project's config.yaml general fund, in agorot.
const schedule: FeeSchedule = {
    defaultFeeMinor: 27500,
    changes: { "2024-08": 23000, "2024-12": 19500, "2025-10": 27500 },
    routineSpecials: { "2025-09": 6500 },
};

test("fee schedule picks the latest change at or before the month", () => {
    assert.equal(baseFeeForMonth(schedule, "2024-08"), 23000);
    assert.equal(baseFeeForMonth(schedule, "2024-11"), 23000);
    assert.equal(baseFeeForMonth(schedule, "2024-12"), 19500);
    assert.equal(baseFeeForMonth(schedule, "2025-09"), 19500);
    assert.equal(baseFeeForMonth(schedule, "2026-03"), 27500);
    assert.equal(baseFeeForMonth(schedule, "2024-01"), 27500); // before any change: default
});

test("snapFraction rounds to the nearest clean fraction", () => {
    assert.equal(snapFraction(0.30), 1 / 3);
    assert.equal(snapFraction(0.9), 1);
    assert.equal(snapFraction(0.1), 0.0);
    assert.equal(fractionLabel(1 / 3), "1/3");
    assert.equal(fractionLabel(1), "");
});

test("single full-month tenant owes the whole fee", () => {
    const f = occupancyFractions([{ id: "a", from: d("2024-01-01"), to: null }], "2026-10");
    assert.deepEqual([...f], [["a", 1]]);
});

test("tenant turnover mid-month: fractions always add up to exactly one", () => {
    // October has 31 days. Old tenant leaves on the 10th (10 days), new one enters on the 11th (21 days).
    const f = occupancyFractions(
        [
            { id: "old", from: d("2023-01-01"), to: d("2026-10-10") },
            { id: "new", from: d("2026-10-11"), to: null },
        ],
        "2026-10",
    );
    const sum = [...f.values()].reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1) < 1e-9);
    assert.equal(f.get("old"), 1 / 3);
    assert.ok(Math.abs((f.get("new") ?? 0) - 2 / 3) < 1e-9);
});

test("gap month (nobody lived there) yields no fractions", () => {
    const f = occupancyFractions([{ id: "a", from: d("2026-12-01"), to: null }], "2026-10");
    assert.equal(f.size, 0);
});

test("computeMonthlyCharges splits the fee and the total matches one monthly fee", () => {
    const lines = computeMonthlyCharges({
        month: "2026-10", displayName: "ועד בית", monthLabel: "10/26", schedule,
        occupants: [
            { id: "old", from: d("2023-01-01"), to: d("2026-10-10") },
            { id: "new", from: d("2026-10-11"), to: null },
        ],
    });
    assert.equal(lines.reduce((s, l) => s + l.amountMinor, 0), 27500);
    assert.deepEqual(lines.map((l) => l.amountMinor).sort((a, b) => a - b), [9167, 18333]);
    assert.ok(lines.some((l) => l.description.endsWith("(1/3)")));
});

test("routine special adds a separate labelled line in its month only", () => {
    const withSpecial = computeMonthlyCharges({
        month: "2025-09", displayName: "ועד בית", monthLabel: "09/25", schedule,
        specialLabels: { "2025-09": "מעליות - תוספת" },
        occupants: [{ id: "a", from: d("2024-01-01"), to: null }],
    });
    assert.deepEqual(withSpecial.map((l) => [l.kind, l.amountMinor]), [["recurring", 19500], ["special", 6500]]);
    assert.equal(withSpecial[1].description, "מעליות - תוספת");
    const without = computeMonthlyCharges({
        month: "2025-10", displayName: "ועד בית", monthLabel: "10/25", schedule,
        occupants: [{ id: "a", from: d("2024-01-01"), to: null }],
    });
    assert.equal(without.length, 1);
});
