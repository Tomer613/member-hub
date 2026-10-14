import assert from "node:assert/strict";
import test from "node:test";
import { normalizePhone, normalizeEmail, maskContact } from "./contact.ts";
import { generateCode, hashCode, codeMatches } from "./code.ts";
import { applyEvent, limitsForKey, secondsLocked, lockDurationMs, MAX_FAILURES_PER_WINDOW, MAX_SENDS_PER_WINDOW, STRIKE_RESET_MS, WINDOW_MS } from "./throttle.ts";
import { FIXED_MS, REMEMBERED_COMPUTER_MS, SLIDING_IDLE_MS, sessionPlan } from "./session-plan.ts";
import { describeUserAgent } from "./device.ts";

test("phones normalize to E.164 with the default country", () => {
    assert.equal(normalizePhone("050-123-4567"), "+972501234567");
    assert.equal(normalizePhone("+1 (415) 555-0100"), "+14155550100");
    assert.equal(normalizePhone("00972501234567"), "+972501234567");
    assert.equal(normalizePhone("12"), null);
    assert.equal(normalizePhone("abc"), null);
});

test("emails are trimmed and lower-cased", () => {
    assert.equal(normalizeEmail("  Dana@Example.COM "), "dana@example.com");
    assert.equal(normalizeEmail("not-an-email"), null);
});

test("masking keeps only what lets a person recognize the contact", () => {
    assert.equal(maskContact("phone", "+972501234567"), "050‑•••‑4567");
    assert.equal(maskContact("email", "dana@example.com"), "d•••@example.com");
});

test("codes are six digits and only the right one matches", () => {
    const code = generateCode();
    assert.match(code, /^\d{6}$/);
    const h = hashCode(code, "+972501234567", "s");
    assert.ok(codeMatches(code, "+972501234567", h, "s"));
    assert.ok(!codeMatches(code, "+972501234568", h, "s"), "bound to the contact");
    assert.ok(!codeMatches("12345", "+972501234567", h, "s"));
});

test("lockout grows 1, 5, 30 minutes and does not depend on whether an account exists", () => {
    assert.equal(lockDurationMs(1), 60_000);
    assert.equal(lockDurationMs(2), 300_000);
    assert.equal(lockDurationMs(3), 1_800_000);
    assert.equal(lockDurationMs(9), 1_800_000);
    let now = new Date("2026-10-13T10:00:00Z");
    let s = null as ReturnType<typeof applyEvent> | null;
    for (let i = 0; i < MAX_FAILURES_PER_WINDOW; i++) s = applyEvent(s, "failure", now);
    assert.equal(secondsLocked(s, now), 60);
    now = new Date(now.getTime() + 61_000);
    for (let i = 0; i < MAX_FAILURES_PER_WINDOW; i++) s = applyEvent(s, "failure", now);
    assert.equal(secondsLocked(s, now), 300);
});

test("too many code requests lock too, and old strikes are forgiven after a day", () => {
    const now = new Date("2026-10-13T10:00:00Z");
    let s = null as ReturnType<typeof applyEvent> | null;
    for (let i = 0; i <= MAX_SENDS_PER_WINDOW; i++) s = applyEvent(s, "send", now);
    assert.ok(secondsLocked(s, now) > 0);
    const later = new Date(now.getTime() + STRIKE_RESET_MS + WINDOW_MS + 1);
    s = applyEvent(s, "send", later);
    assert.equal(s.strikes, 0);
});

test("user agents become short, recognizable labels", () => {
    assert.deepEqual(describeUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit Version/17.0 Mobile Safari/604.1"), { kind: "phone", label: "iPhone · Safari" });
    assert.deepEqual(describeUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0 Safari/537.36"), { kind: "computer", label: "מחשב Windows · Chrome" });
    assert.equal(describeUserAgent(null).kind, "computer");
});

import { destinationAfterLogin, safePath } from "./destination.ts";

test("after sign-in people land where they meant to go, and never on another site", () => {
    assert.equal(destinationAfterLogin({ invite: "abcDEF123" }), "/invite/abcDEF123");
    assert.equal(destinationAfterLogin({ intent: "open" }), "/orgs/new");
    assert.equal(destinationAfterLogin({ intent: "join" }), "/wallet?join=1");
    assert.equal(destinationAfterLogin({ next: "/settings/devices" }), "/settings/devices");
    assert.equal(destinationAfterLogin({ next: "//evil.example" }), "/wallet");
    assert.equal(safePath("https://evil.example"), null);
});

import { timeAgoHe } from "./relative-time.ts";

test("device activity reads naturally in Hebrew", () => {
    const now = new Date("2026-10-13T12:00:00Z");
    assert.equal(timeAgoHe(new Date("2026-10-13T11:58:00Z"), now), "פעיל עכשיו");
    assert.equal(timeAgoHe(new Date("2026-10-13T09:00:00Z"), now), "לפני 3 שעות");
    assert.equal(timeAgoHe(new Date("2026-10-11T12:00:00Z"), now), "לפני יומיים");
});

test("a shared network address is never locked by wrong codes, only by many code requests", () => {
    const now = new Date("2026-10-13T10:00:00Z");
    let s = null as ReturnType<typeof applyEvent> | null;
    for (let i = 0; i < 20; i++) s = applyEvent(s, "failure", now, limitsForKey("ip:1.2.3.4"));
    assert.equal(secondsLocked(s, now), 0);
    for (let i = 0; i < 30; i++) s = applyEvent(s, "send", now, limitsForKey("ip:1.2.3.4"));
    assert.equal(secondsLocked(s, now), 0);
    s = applyEvent(s, "send", now, limitsForKey("ip:1.2.3.4"));
    assert.ok(secondsLocked(s, now) > 0);
});

test("session length: phone slides 180 days, remembered computer 30 days, otherwise 12 hours", () => {
    assert.deepEqual(sessionPlan("phone", false), { kind: "sliding", lifetimeMs: SLIDING_IDLE_MS, persistCookie: true });
    assert.equal(sessionPlan("tablet", true).kind, "sliding");
    assert.deepEqual(sessionPlan("computer", true), { kind: "fixed", lifetimeMs: REMEMBERED_COMPUTER_MS, persistCookie: true });
    assert.deepEqual(sessionPlan("computer", false), { kind: "fixed", lifetimeMs: FIXED_MS, persistCookie: false });
    assert.equal(REMEMBERED_COMPUTER_MS, 30 * 24 * 60 * 60 * 1000);
});
