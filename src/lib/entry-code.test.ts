import assert from "node:assert/strict";
import test from "node:test";
import { entryCode, verifyEntryCode } from "./entry-code.ts";

test("the entry code changes every minute and only the genuine, recent one passes", () => {
    const t = new Date("2026-10-15T19:00:15Z");
    const { code, secondsLeft } = entryCode("ou_123", t, "s3cret");
    assert.equal(secondsLeft, 45);
    assert.equal(verifyEntryCode(code, t, "s3cret"), "ou_123");
    assert.equal(verifyEntryCode(code, new Date("2026-10-15T19:01:30Z"), "s3cret"), "ou_123");
    assert.equal(verifyEntryCode(code, new Date("2026-10-15T19:02:01Z"), "s3cret"), null);
    assert.equal(verifyEntryCode(code, t, "other"), null);
    assert.notEqual(entryCode("ou_123", new Date("2026-10-15T19:01:00Z"), "s3cret").code, code);
    assert.equal(verifyEntryCode(code.replace("ou_123", "ou_999"), t, "s3cret"), null);
    assert.equal(verifyEntryCode("junk", t, "s3cret"), null);
});
