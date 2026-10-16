import { test } from "node:test";
import assert from "node:assert/strict";
import { parseScan, shortLink } from "./scan.ts";

const H = ["piri.app", "localhost:3000"];

test("our links lead to their page", () => {
    assert.deepEqual(parseScan("https://piri.app/join/abcd2345", H), { kind: "go", to: "/join/abcd2345" });
    assert.deepEqual(parseScan("https://piri.app/j/abcd2345", H), { kind: "go", to: "/join/abcd2345" });
    assert.deepEqual(parseScan("http://localhost:3000/c/xyz98765/", H), { kind: "go", to: "/c/xyz98765" });
    assert.deepEqual(parseScan("piri.app/p/k7m2q9", H), { kind: "go", to: "/p/k7m2q9" });
    assert.deepEqual(parseScan("https://piri.app/login?invite=tok12345", H), { kind: "go", to: "/invite/tok12345" });
    assert.deepEqual(parseScan("  /invite/tok12345 ", H), { kind: "go", to: "/invite/tok12345" });
});

test("other links and texts are not followed", () => {
    assert.deepEqual(parseScan("https://evil.example/join/abcd2345", H), { kind: "foreign" });
    assert.deepEqual(parseScan("https://piri.app/settings", H), { kind: "foreign" });
    assert.deepEqual(parseScan("javascript:alert(1)", H), { kind: "foreign" });
    assert.deepEqual(parseScan("שלום עולם", H), { kind: "foreign" });
    assert.deepEqual(parseScan("   ", H), { kind: "empty" });
});

test("a typed code is looked up, an entry code is for the door", () => {
    assert.deepEqual(parseScan("ABcd2345", H), { kind: "code", code: "abcd2345" });
    assert.deepEqual(parseScan("piri1.abc.123.sig", H), { kind: "entry" });
    assert.equal(shortLink("https://piri.app", "/p/k7m2q9"), "piri.app/p/k7m2q9");
});
