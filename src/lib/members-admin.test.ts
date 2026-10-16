import { test } from "node:test";
import assert from "node:assert/strict";
import { balanceCell, familyText, localPhone, filterCounts, householdLine, matchesSearch, memberSince, reminderBlockedUntil, reminderSummary, rowStatus, toCsv, type RowFacts } from "./members-admin.ts";

const r = (o: Partial<RowFacts>): RowFacts => ({ kind: "member", linkStatus: "active", owedMinor: 0, disputes: 0, ...o });

test("one chip per row, the most urgent first", () => {
    assert.equal(rowStatus(r({})), "active");
    assert.equal(rowStatus(r({ owedMinor: 100 })), "debt");
    assert.equal(rowStatus(r({ owedMinor: 100, disputes: 1 })), "dispute");
    assert.equal(rowStatus(r({ linkStatus: "left_with_debt", owedMinor: 100, disputes: 1 })), "left_debt");
    assert.equal(rowStatus(r({ kind: "pending" })), "pending");
});

test("filter counts overlap where the facts do", () => {
    const c = filterCounts([r({}), r({ owedMinor: 5 }), r({ owedMinor: 5, disputes: 1 }), r({ kind: "pending", linkStatus: "" }), r({ linkStatus: "left_with_debt", owedMinor: 9 })]);
    assert.deepEqual(c, { all: 5, active: 3, debt: 3, dispute: 1, pending: 1, left_debt: 1 });
});

test("household line and family size", () => {
    assert.equal(householdLine(null, "synagogue"), "יחיד");
    assert.equal(householdLine({ label: "משפחת כהן", relation: "head", isHead: true, isPayer: true }, "synagogue"), "משפחת כהן · ראש");
    assert.equal(householdLine({ label: "משפחת כהן", relation: "spouse", isHead: false, isPayer: true }, "synagogue"), "משפחת כהן · משלם");
    assert.equal(householdLine({ label: "14", relation: "tenant", isHead: false, isPayer: false }, "hoa"), "דירה 14 · שוכר");
    assert.equal(familyText(5, 2), "5 (שניים משלמים)");
    assert.equal(familyText(3, 1), "3 (משלם אחד)");
    assert.equal(familyText(1, 1), "1");
});

test("member since is a year, or this week", () => {
    const now = new Date("2026-10-16T10:00:00Z");
    assert.equal(memberSince(new Date("2026-10-14T10:00:00Z"), now), "השבוע");
    assert.equal(memberSince(new Date("2019-03-01T10:00:00Z"), now), "2019");
});

test("search finds names, homes, emails and phones in any form", () => {
    const m = { name: "דנה כהן", phone: "+972501234567", email: "Dana@x.com", home: "משפחת כהן · ראש" };
    assert.ok(matchesSearch(m, "דנה"));
    assert.ok(matchesSearch(m, "dana@"));
    assert.ok(matchesSearch(m, "050-123"));
    assert.ok(matchesSearch(m, "501234567"));
    assert.ok(!matchesSearch(m, "052"));
    assert.ok(matchesSearch(m, "  "));
});

test("one reminder a week per member", () => {
    const now = new Date("2026-10-16T10:00:00Z");
    assert.equal(reminderBlockedUntil(null, now), null);
    assert.equal(reminderBlockedUntil(new Date("2026-10-01T10:00:00Z"), now), null);
    assert.equal(reminderBlockedUntil(new Date("2026-10-14T10:00:00Z"), now)?.toISOString(), "2026-10-21T10:00:00.000Z");
    assert.equal(reminderSummary({ sent: 2, recent: 1, noDebt: 0, disputed: 0 }), "נשלחו 2 תזכורות. לחבר אחד כבר נשלחה תזכורת השבוע.");
    assert.equal(reminderSummary({ sent: 1, recent: 0, noDebt: 0, disputed: 0 }), "נשלחה תזכורת אחת.");
});

test("balance cell and CSV", () => {
    assert.deepEqual(balanceCell("pending", 0), { text: "—", owes: false });
    assert.deepEqual(balanceCell("member", 0), { text: "₪0", owes: false });
    assert.deepEqual(balanceCell("member", 60000), { text: "-₪600", owes: true });
    assert.equal(toCsv([["שם", "הערה"], ["=1+1", 'a "b"']]), '﻿שם,הערה\r\n\'=1+1,"a ""b"""');
});

test("phones are shown the local way", () => {
    assert.equal(localPhone("+972521234567"), "052-123-4567");
    assert.equal(localPhone("+97221234567"), "02-123-4567");
    assert.equal(localPhone("+14155550100"), "+14155550100");
    assert.equal(localPhone(null), null);
});
