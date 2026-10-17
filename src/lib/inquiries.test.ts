import { test } from "node:test";
import assert from "node:assert/strict";
import { autoCloseBefore, inAdminFilter, inquiryKinds, kindLabel, memberStatus, nextNumber, payloadLines, previewLine, readNewInquiry, staffSignature } from "./inquiries.ts";

const pack = [{ kind: "aliyah", label: "בקשת עלייה", fields: [{ key: "parsha", label: "פרשה", type: "text" as const, required: true }, { key: "amount", label: "סכום", type: "number" as const }] }];

test("kinds: the core four, then the pack's", () => {
    assert.deepEqual(inquiryKinds(pack).map((k) => k.kind), ["details", "charge", "general", "other", "aliyah"]);
    assert.equal(kindLabel("aliyah", pack), "בקשת עלייה");
    assert.equal(kindLabel("gone", pack), "פנייה");
    assert.deepEqual(inquiryKinds([...pack, { kind: "general_inquiry", label: "פנייה כללית", fields: [] }]).map((k) => k.kind), ["details", "charge", "general", "other", "aliyah"]);
});

test("readNewInquiry checks the kind, the words for 'אחר', and the pack fields", () => {
    assert.equal(readNewInquiry({ kind: "x", body: "" }, pack).ok, false);
    assert.deepEqual(readNewInquiry({ kind: "general", body: "  שלום  \n\n\n\nעוד " }, pack), { ok: true, kind: "general", body: "שלום\n\nעוד", payload: {} });
    assert.equal(readNewInquiry({ kind: "other", body: " " }, pack).ok, false);
    assert.deepEqual(readNewInquiry({ kind: "aliyah", body: "", fields: { parsha: "" } }, pack), { ok: false, error: 'מלאו את "פרשה".' });
    assert.deepEqual(readNewInquiry({ kind: "aliyah", body: "", fields: { parsha: "נח", amount: "₪1,200" } }, pack), { ok: true, kind: "aliyah", body: "", payload: { parsha: "נח", amount: 1200 } });
    assert.equal(readNewInquiry({ kind: "aliyah", body: "", fields: { parsha: "נח", amount: "הרבה" } }, pack).ok, false);
});

test("statuses and filters", () => {
    assert.equal(memberStatus("new"), "בטיפול");
    assert.equal(memberStatus("replied"), "בטיפול");
    assert.equal(memberStatus("answered"), "נענתה");
    assert.equal(inAdminFilter("replied", "new"), true);
    assert.equal(inAdminFilter("answered", "new"), false);
    assert.equal(inAdminFilter("answered", "open"), true);
    assert.equal(inAdminFilter("closed", "all"), true);
});

test("numbers start at 1001", () => {
    assert.equal(nextNumber(null), 1001);
    assert.equal(nextNumber(1041), 1042);
});

test("preview, payload lines, signature and the 14 days", () => {
    assert.deepEqual(payloadLines("aliyah", { parsha: "נח", amount: 5 }, pack), [{ label: "פרשה", value: "נח" }, { label: "סכום", value: "5" }]);
    assert.equal(previewLine("", [{ value: "נח" }]), "נח");
    assert.equal(previewLine(null, []), "בלי פירוט");
    assert.equal(previewLine("א".repeat(80), [], 10), "אאאאאאאאא…");
    assert.equal(staffSignature("מיכה", "מנהל"), "מיכה · מנהל");
    assert.equal(autoCloseBefore(new Date("2026-10-17T10:00:00Z")).toISOString(), "2026-10-03T10:00:00.000Z");
});
