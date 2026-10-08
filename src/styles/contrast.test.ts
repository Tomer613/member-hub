// Guards the design tokens: any color change that breaks a text/background pair fails `npm test`.
// Add every new text-on-background pairing here in the same change that introduces it (docs/accessibility.he.md).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { contrastRatio, onColor } from "../lib/color.ts";

const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");

function token(name: string): string {
    const m = css.match(new RegExp(`${name}:\\s*(#[0-9A-Fa-f]{6})`));
    assert.ok(m, `token ${name} not found as a hex color in tokens.css`);
    return m[1];
}

const ink = token("--mh-ink");
const soft = token("--mh-ink-soft");
const danger = token("--mh-danger");
const bg = token("--mh-bg");
const surface = token("--mh-surface");
const ticket = token("--mh-ticket");

// [label, foreground, background, minimum]
const pairs: Array<[string, string, string, number]> = [
    ["ink on background", ink, bg, 4.5],
    ["ink on surface", ink, surface, 4.5],
    ["ink on ticket", ink, ticket, 4.5],
    ["secondary text on background", soft, bg, 4.5],
    ["secondary text on surface", soft, surface, 4.5],
    ["secondary text on ticket", soft, ticket, 4.5],
    ["danger text on surface", danger, surface, 4.5],
    ["danger text on ticket", danger, ticket, 4.5],
    ["white on danger button", "#FFFFFF", danger, 4.5],
    // Non-text: the focus ring (ink) against the background and the surface.
    ["focus ring on background", ink, bg, 3],
    ["focus ring on surface", ink, surface, 3],
];

for (const [label, fg, back, min] of pairs) {
    test(`contrast: ${label}`, () => {
        const r = contrastRatio(fg, back);
        assert.ok(r >= min, `${label}: ${r.toFixed(2)} < ${min} (${fg} on ${back})`);
    });
}

test("every org palette color gets readable text", () => {
    for (const name of ["violet", "orange", "green", "pink", "sky"]) {
        const c = token(`--mh-org-${name}`);
        assert.ok(contrastRatio(onColor(c), c) >= 4.5, `org ${name} ${c}`);
    }
});

test("status chip backgrounds keep ink text readable", () => {
    for (const c of ["#D7F5E8", "#FFD84A", "#CFF0FC", "#E3DDFF", "#FFDCD3"]) {
        assert.ok(contrastRatio(ink, c) >= 4.5, c);
    }
});
