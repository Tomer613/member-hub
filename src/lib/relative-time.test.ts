import assert from "node:assert/strict";
import test from "node:test";
import { hebrewAgo } from "./relative-time.ts";

test("short Hebrew 'how long ago'", () => {
    const now = new Date("2026-10-14T12:00:00Z");
    const ago = (ms: number) => hebrewAgo(new Date(now.getTime() - ms), now);
    assert.equal(ago(10_000), "עכשיו");
    assert.equal(ago(60_000), "לפני דקה");
    assert.equal(ago(5 * 60_000), "לפני 5 דקות");
    assert.equal(ago(2 * 3600_000), "לפני שעתיים");
    assert.equal(ago(26 * 3600_000), "אתמול");
    assert.equal(ago(5 * 86400_000), "לפני 5 ימים");
    assert.equal(ago(65 * 86400_000), "לפני חודשיים");
});
