import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanLabelName, grantedText, labelTilt, walletLabel, type HeldLabel } from "./labels.ts";

const l = (name: string, since: string, how: HeldLabel["how"] = "manual", plan: string | null = null): HeldLabel => ({ id: name, name, color: "#5EE0C0", since: new Date(since), how, plan });

test("a label keeps one tilt between -5 and 4 degrees", () => {
    for (const id of ["a", "clx1", "zz9", "label-with-a-long-id"]) {
        const t = labelTilt(id);
        assert.ok(t >= -5 && t <= 4, String(t));
        assert.equal(labelTilt(id), t);
    }
});

test("names are trimmed to 14 characters", () => {
    assert.equal(cleanLabelName("  מתנדב   מוביל  "), "מתנדב מוביל");
    assert.equal(cleanLabelName("א".repeat(20)).length, 14);
});

test("the wallet shows the newest label and how many more", () => {
    assert.equal(walletLabel([]), null);
    const w = walletLabel([l("תומך", "2025-01-01"), l("מתנדב", "2026-03-01"), l("מייסד", "2024-01-01")]);
    assert.equal(w?.name, "מתנדב");
    assert.equal(w?.more, 2);
    assert.equal(w?.all, "תוויות: מתנדב, תומך ומייסד");
    assert.equal(walletLabel([l("תומך", "2025-01-01")])?.all, "תווית: תומך");
});

test("the stamp explains when and how it was given", () => {
    assert.equal(grantedText(l("x", "2025-03-10T10:00:00Z")), "הוענקה ב-03.2025, ידנית");
    assert.equal(grantedText(l("x", "2025-03-10T10:00:00Z", "auto_plan", "מנוי שנתי")), "הוענקה ב-03.2025, אוטומטית, בזכות מנוי שנתי");
});
