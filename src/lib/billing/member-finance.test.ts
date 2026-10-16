import { test } from "node:test";
import assert from "node:assert/strict";
import { debtState, paymentsThisYear } from "./member-finance.ts";

test("debtState counts only charges past their last day", () => {
    const now = new Date("2026-10-16T09:00:00Z");
    const open = [
        { id: "a", due: new Date("2026-10-16T00:00:00Z"), leftMinor: 100 }, // today: not yet a debt
        { id: "b", due: new Date("2026-10-15T00:00:00Z"), leftMinor: 250 },
        { id: "c", due: new Date("2026-12-01T00:00:00Z"), leftMinor: 999 },
    ];
    assert.deepEqual(debtState(open, now), { owes: true, owedMinor: 250, count: 1, ids: ["b"] });
    assert.equal(debtState([open[0]], now).owes, false);
});

test("paymentsThisYear uses the Israeli calendar year", () => {
    const now = new Date("2026-10-16T09:00:00Z");
    assert.equal(paymentsThisYear([new Date("2026-01-01T00:30:00Z"), new Date("2025-12-31T22:30:00Z"), new Date("2025-12-31T20:00:00Z")], now), 2);
});
