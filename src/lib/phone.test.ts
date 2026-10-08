import { test } from "node:test";
import assert from "node:assert/strict";
import { toWhatsAppNumber } from "./phone.ts";

test("local Israeli number gets the country code", () => {
    assert.equal(toWhatsAppNumber("050-1234567"), "972501234567");
});
test("already international numbers are kept", () => {
    assert.equal(toWhatsAppNumber("+972 50-123-4567"), "972501234567");
    assert.equal(toWhatsAppNumber("00972501234567"), "972501234567");
});
test("another country via the parameter", () => {
    assert.equal(toWhatsAppNumber("07911 123456", "44"), "447911123456");
});
