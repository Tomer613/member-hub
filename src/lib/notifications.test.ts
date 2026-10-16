import { test } from "node:test";
import assert from "node:assert/strict";
import { closedText, dayGroup, inFilter, readNoteFilter, senderName } from "./notifications.ts";

const at = (s: string) => new Date(s);
const now = at("2026-10-16T09:00:00Z");

test("day groups follow Israel time", () => {
    assert.equal(dayGroup(at("2026-10-15T22:30:00Z"), now), "היום"); // 01:30 on the 16th in Israel
    assert.equal(dayGroup(at("2026-10-15T12:00:00Z"), now), "אתמול");
    assert.equal(dayGroup(at("2026-10-13T12:00:00Z"), now), "לפני 3 ימים");
    assert.equal(dayGroup(at("2026-10-08T12:00:00Z"), now), "לפני שבוע");
    assert.equal(dayGroup(at("2026-09-01T12:00:00Z"), now), "01.09.2026");
});

test("filters: open actions and unread updates, and what was closed", () => {
    const action = { kind: "action", readAt: null, doneAt: null };
    const update = { kind: "update", readAt: null, doneAt: null };
    const read = { kind: "update", readAt: now, doneAt: null };
    const done = { kind: "action", readAt: now, doneAt: now };
    assert.deepEqual([action, update, read, done].map((n) => inFilter(n, "all")), [true, true, false, false]);
    assert.deepEqual([action, update, read, done].map((n) => inFilter(n, "action")), [true, false, false, false]);
    assert.deepEqual([action, update, read, done].map((n) => inFilter(n, "update")), [false, true, false, false]);
    assert.deepEqual([action, update, read, done].map((n) => inFilter(n, "done")), [false, false, true, true]);
    // An action that was read but not handled still waits.
    assert.equal(inFilter({ kind: "action", readAt: now, doneAt: null }, "action"), true);
    assert.equal(readNoteFilter("nope"), "all");
    assert.equal(closedText(done), "טופל 16.10");
    assert.equal(closedText(read), "נקרא 16.10");
});

test("the sender: the org, a house committee with its kind, or the wallet", () => {
    assert.equal(senderName(null), "ארנק");
    assert.equal(senderName({ name: "שדרות האמורים 62", packId: "hoa" }), "ועד בית · שדרות האמורים 62");
    assert.equal(senderName({ name: "ועד בית רחוב הגפן 12", packId: "hoa" }), "ועד בית רחוב הגפן 12");
    assert.equal(senderName({ name: "FitZone", packId: "gym" }), "FitZone");
});
