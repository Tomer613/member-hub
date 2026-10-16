import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanPublicText, readPublicText, readSection, shortLine, TAGLINE_MAX } from "./org-settings.ts";

test("readSection falls back to the org details", () => {
    assert.equal(readSection("public"), "public");
    assert.equal(readSection("look"), "look");
    assert.equal(readSection("nope"), "details");
    assert.equal(readSection(undefined), "details");
});

test("readPublicText ignores what is not text", () => {
    assert.deepEqual(readPublicText({ tagline: "שלום", about: 4 }), { tagline: "שלום", about: "" });
    assert.deepEqual(readPublicText(null), { tagline: "", about: "" });
});

test("cleanPublicText folds spaces and checks the length", () => {
    assert.deepEqual(cleanPublicText({ tagline: "  בית   כנסת\nקהילתי ", about: "שורה\r\n\r\n\r\n\r\nעוד  שורה " }), { ok: true, value: { tagline: "בית כנסת קהילתי", about: "שורה\n\nעוד שורה" } });
    assert.equal(cleanPublicText({ tagline: "א".repeat(TAGLINE_MAX), about: "" }).ok, true);
    assert.equal(cleanPublicText({ tagline: "א".repeat(TAGLINE_MAX + 1), about: "" }).ok, false);
});

test("shortLine cuts at a word", () => {
    assert.equal(shortLine("קצר"), "קצר");
    assert.equal(shortLine("בית כנסת קהילתי בלב השכונה. מזמינים אתכם להצטרף לתפילות", 30), "בית כנסת קהילתי בלב השכונה.…");
    assert.equal(shortLine("מזמינים להצטרף לתפילות, לשיעורים ולאירועים", 26), "מזמינים להצטרף לתפילות…");
});
