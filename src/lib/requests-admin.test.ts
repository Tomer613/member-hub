import { test } from "node:test";
import assert from "node:assert/strict";
import { filterActive, fullDetails, inRequestFilter, NO_FILTER, readRequestTab, sourceLabel, type RequestRow } from "./requests-admin.ts";

const row = (o: Partial<RequestRow>): RequestRow => ({ id: "r", name: "דנה כהן", phone: "052-123-4567", email: null, note: null, source: "link", listed: false, when: "", decidedBy: null, adminNote: null, linkId: null, ...o });

test("tabs and sources read safely", () => {
    assert.equal(readRequestTab("approved"), "approved");
    assert.equal(readRequestTab("x"), "pending");
    assert.equal(sourceLabel("search"), "חיפוש באפליקציה");
    assert.equal(sourceLabel(null), "קישור הצטרפות");
});

test("full details need two names, a phone and an email", () => {
    assert.equal(fullDetails(row({ email: "d@x.com" })), true);
    assert.equal(fullDetails(row({})), false);
    assert.equal(fullDetails(row({ name: "דנה", email: "d@x.com" })), false);
});

test("filters combine, and search reads names, phones and notes", () => {
    const r = row({ note: "גרים ברחוב הרב קוק", listed: true });
    assert.equal(filterActive(NO_FILTER), false);
    assert.equal(inRequestFilter(r, NO_FILTER), true);
    assert.equal(inRequestFilter(r, { ...NO_FILTER, source: "search" }), false);
    assert.equal(inRequestFilter(row({ source: null }), { ...NO_FILTER, source: "link" }), true);
    assert.equal(inRequestFilter(r, { ...NO_FILTER, listed: true }), true);
    assert.equal(inRequestFilter(row({}), { ...NO_FILTER, listed: true }), false);
    assert.equal(inRequestFilter(r, { ...NO_FILTER, q: "0521234" }), true);
    assert.equal(inRequestFilter(r, { ...NO_FILTER, q: "קוק" }), true);
    assert.equal(inRequestFilter(r, { ...NO_FILTER, q: "לוי" }), false);
});
