import { test } from "node:test";
import assert from "node:assert/strict";
import { chargeTitle, inFilter, installmentDates, pledgeStatus, readFilter, readPledge, splitAmount, type PledgeInput } from "./donations.ts";

const base: PledgeInput = { memberId: "m1", kind: "pledge", purpose: "תיקון ספר תורה", amount: "1800", installments: "3", first: "2026-10-20", note: "", paidNow: false, method: "cash", notify: true };
const today = "2026-10-17";

test("split adds up exactly", () => {
    assert.deepEqual(splitAmount(180000, 3), [60000, 60000, 60000]);
    assert.deepEqual(splitAmount(100001, 3), [33335, 33333, 33333]);
    assert.equal(splitAmount(100001, 3).reduce((a, b) => a + b, 0), 100001);
});

test("monthly dates keep the day, or the month's last", () => {
    assert.deepEqual(installmentDates("2026-10-20", 3), ["2026-10-20", "2026-11-20", "2026-12-20"]);
    assert.deepEqual(installmentDates("2027-01-31", 3), ["2027-01-31", "2027-02-28", "2027-03-31"]);
    assert.deepEqual(installmentDates("2026-12-15", 2), ["2026-12-15", "2027-01-15"]);
});

test("titles", () => {
    assert.equal(chargeTitle("aliyah", "שמחת תורה", 0, 1), "עלייה · שמחת תורה");
    assert.equal(chargeTitle("pledge", "קידוש", 1, 3), "נדר · קידוש (2 מתוך 3)");
});

test("reading the form", () => {
    const r = readPledge(base, today);
    assert.ok(r.ok && r.value.amountMinor === 180000 && r.value.installments === 3);
    assert.equal(readPledge({ ...base, memberId: "" }, today).ok, false);
    assert.equal(readPledge({ ...base, kind: "x" }, today).ok, false);
    assert.equal(readPledge({ ...base, purpose: "א" }, today).ok, false);
    assert.equal(readPledge({ ...base, amount: "0.5" }, today).ok, false);
    assert.equal(readPledge({ ...base, installments: "13" }, today).ok, false);
    assert.equal(readPledge({ ...base, first: "2026-10-01" }, today).ok, false);
    assert.equal(readPledge({ ...base, paidNow: true }, today).ok, false);
    const paid = readPledge({ ...base, paidNow: true, installments: "1", first: "" }, today);
    assert.ok(paid.ok && paid.value.first === today);
});

test("status from the charges", () => {
    const now = new Date("2026-10-17T12:00:00Z");
    const d = (iso: string) => new Date(`${iso}T00:00:00Z`);
    assert.equal(pledgeStatus([{ leftMinor: 0, due: d("2026-10-01") }], false, now), "paid");
    assert.equal(pledgeStatus([{ leftMinor: 100, due: d("2026-10-01") }], false, now), "late");
    assert.equal(pledgeStatus([{ leftMinor: 100, due: d("2026-10-30") }], false, now), "open");
    assert.equal(pledgeStatus([{ leftMinor: 0, due: d("2026-10-01") }, { leftMinor: 100, due: d("2026-11-01") }], false, now), "installments");
    assert.equal(pledgeStatus([], true, now), "cancelled");
    assert.equal(pledgeStatus([{ leftMinor: 0, due: d("2026-10-01") }], true, now), "cancelled");
    assert.equal(inFilter("installments", "open"), true);
    assert.equal(inFilter("paid", "open"), false);
    assert.equal(inFilter("open", "late"), false);
    assert.equal(readFilter("late"), "late");
    assert.equal(readFilter("x"), "all");
});
