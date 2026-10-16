import { test } from "node:test";
import assert from "node:assert/strict";
import { audienceText, firstLine, pickMsgRecipients, readMessageInput, remindLabel } from "./messages-admin.ts";

const people = [
    { linkId: "a", planIds: ["p1"], labelIds: [], owes: true },
    { linkId: "b", planIds: [], labelIds: ["l1"], owes: false },
    { linkId: "c", planIds: ["p1"], labelIds: ["l1"], owes: false },
];

test("pickMsgRecipients covers every audience", () => {
    assert.equal(pickMsgRecipients(people, { to: "all" }).length, 3);
    assert.deepEqual(pickMsgRecipients(people, { to: "debt" }).map((r) => r.linkId), ["a"]);
    assert.deepEqual(pickMsgRecipients(people, { to: "plan", planId: "p1" }).map((r) => r.linkId), ["a", "c"]);
    assert.deepEqual(pickMsgRecipients(people, { to: "label", labelId: "l1" }).map((r) => r.linkId), ["b", "c"]);
    assert.deepEqual(pickMsgRecipients(people, { to: "picked", linkIds: ["b", "zz"] }).map((r) => r.linkId), ["b"]);
});

test("readMessageInput is safe and dislike follows reactions", () => {
    const m = readMessageInput({ title: 5, body: "שלום", audience: { to: "plan" }, reactable: false, dislike: true });
    assert.equal(m.title, "");
    assert.deepEqual(m.audience, { to: "all" });
    assert.equal(m.dislike, false);
    assert.equal(readMessageInput(null).email, true);
});

test("audience and preview texts", () => {
    assert.equal(audienceText({ to: "picked", linkIds: ["a"] }, { picked: ["דנה"], group: null }), "אישית לדנה");
    assert.equal(audienceText({ to: "label", labelId: "l" }, { picked: [], group: "מתנדבים" }), "לפי תווית: מתנדבים");
    assert.equal(firstLine("שורה ראשונה\nשנייה"), "שורה ראשונה");
    assert.equal(firstLine("א".repeat(80), 10), `${"א".repeat(9)}…`);
    assert.equal(remindLabel(1), "שליחת תזכורת לאחד שלא קרא");
});
