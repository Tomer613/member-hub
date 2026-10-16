import { test } from "node:test";
import assert from "node:assert/strict";
import { EMPTY_CHARGE, kindLabel, peopleCount, pickRecipients, readChargeInput, signedAmount, type Recipient } from "./charge-plan.ts";

const people: Recipient[] = [
    { linkId: "a", name: "א", planIds: ["p1"], labelIds: ["l1"] },
    { linkId: "b", name: "ב", planIds: ["p2"], labelIds: [] },
    { linkId: "c", name: "ג", planIds: [], labelIds: ["l1"] },
];

test("recipients by audience", () => {
    assert.equal(pickRecipients(people, { to: "all" }).length, 3);
    assert.deepEqual(pickRecipients(people, { to: "plan", planId: "p1" }).map((r) => r.linkId), ["a"]);
    assert.deepEqual(pickRecipients(people, { to: "label", labelId: "l1" }).map((r) => r.linkId), ["a", "c"]);
    assert.deepEqual(pickRecipients(people, { to: "picked", linkIds: ["b", "x"] }).map((r) => r.linkId), ["b"]);
});

test("stored input is read safely", () => {
    assert.deepEqual(readChargeInput(null), EMPTY_CHARGE);
    const r = readChargeInput({ title: "דמי ועד", amount: "120", due: "2026-11-01", kind: "special", audience: { to: "plan", planId: "p1" }, notify: false, partial: true });
    assert.equal(r.kind, "special");
    assert.deepEqual(r.audience, { to: "plan", planId: "p1" });
    assert.equal(r.notify, false);
    assert.equal(r.remind, true);
    assert.equal(r.partial, true);
    assert.equal(readChargeInput({ due: "1.11.2026", kind: "x", audience: { to: "label" } }).due, "");
    assert.deepEqual(readChargeInput({ audience: { to: "label" } }).audience, { to: "all" });
});

test("labels and amounts", () => {
    assert.equal(kindLabel("special"), "חיוב מיוחד");
    assert.equal(kindLabel("recurring"), "דמי חבר");
    assert.equal(peopleCount(1), "חבר אחד");
    assert.equal(peopleCount(148), "148 חברים");
    assert.equal(signedAmount({ dir: "in" }, "₪50"), "+₪50");
    assert.equal(signedAmount({ dir: "out" }, "₪50"), "−₪50");
});
