import assert from "node:assert/strict";
import test from "node:test";
import { cleanPost, isReaction, reactionCounts } from "./reactions.ts";

test("reaction counts keep the set's order and skip unused ones", () => {
    const rows = [{ kind: "got" }, { kind: "heart" }, { kind: "got" }, { kind: "nope" }];
    assert.deepEqual(reactionCounts(rows).map((r) => [r.kind, r.count]), [["heart", 1], ["got", 2]]);
    assert.ok(isReaction("funny"));
    assert.ok(!isReaction("angry"));
});

test("updates need a title and a body", () => {
    assert.deepEqual(cleanPost("  שינוי   שעה ", "מתחילים ב-21:00\n\n\n\nבמקום 20:00"), { title: "שינוי שעה", body: "מתחילים ב-21:00\n\nבמקום 20:00" });
    assert.ok("error" in cleanPost("א", "גוף"));
    assert.ok("error" in cleanPost("כותרת", "  "));
});
