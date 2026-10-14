import assert from "node:assert/strict";
import test from "node:test";
import { contrastRatio, onColor } from "./color.ts";
import { DEFAULT_COLOR, PALETTE, cleanCity, cleanName, initialOf, isLogoDataUrl, parsePhoneList, randomToken, wizardSteps } from "./org-setup.ts";

test("collecting outside the system skips the account step", () => {
    assert.deepEqual(wizardSteps("system"), ["name", "type", "look", "collection", "account", "invite"]);
    assert.deepEqual(wizardSteps("manual"), ["name", "type", "look", "collection", "invite"]);
    assert.deepEqual(wizardSteps("none"), ["name", "type", "look", "collection", "invite"]);
});

test("every type's default color is in the palette and readable", () => {
    for (const c of Object.values(DEFAULT_COLOR)) {
        assert.ok((PALETTE as readonly string[]).includes(c), c);
        assert.ok(contrastRatio(onColor(c), c) >= 4.5, c);
    }
});

test("names and cities are trimmed and bounded", () => {
    assert.equal(cleanName("  אור   חדש "), "אור חדש");
    assert.equal(cleanName("א"), null);
    assert.equal(cleanName("א".repeat(61)), null);
    assert.equal(cleanCity("  "), null);
    assert.equal(cleanCity(" מודיעין "), "מודיעין");
    assert.equal(initialOf(" אור חדש"), "א");
});

test("only small inline images are accepted as a logo", () => {
    assert.ok(isLogoDataUrl("data:image/webp;base64,AAAA"));
    assert.ok(!isLogoDataUrl("data:image/svg+xml;base64,AAAA"));
    assert.ok(!isLogoDataUrl("https://example.com/a.png"));
    assert.ok(!isLogoDataUrl(`data:image/png;base64,${"A".repeat(200_001)}`));
});

test("pasted phone lists are normalized, deduplicated and bad entries reported", () => {
    const r = parsePhoneList("050-1234567\n0501234567, +972521112222; 123\n\n");
    assert.deepEqual(r.phones, ["+972501234567", "+972521112222"]);
    assert.deepEqual(r.invalid, ["123"]);
});

test("tokens use the safe alphabet and the requested length", () => {
    const t = randomToken(12);
    assert.equal(t.length, 12);
    assert.match(t, /^[a-hjkmnp-z2-9]+$/);
});
