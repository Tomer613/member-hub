import assert from "node:assert/strict";
import test from "node:test";
import { greeting, groupChips, groupOf, inOrg, roleLabel, walletSort } from "./wallet.ts";

test("groups come from the member's choice or the org type, and chips only when there are two", () => {
    assert.equal(groupOf("hoa", null), "home");
    assert.equal(groupOf("gym", null), "health");
    assert.equal(groupOf("celebration", null), "events");
    assert.equal(groupOf("synagogue", null), "community");
    assert.equal(groupOf("gym", "home"), "home");
    assert.equal(groupOf("gym", "nonsense"), "health");
    assert.deepEqual(groupChips(["events", "home", "home"]), ["home", "events"]);
    assert.deepEqual(groupChips(["home", "home"]), []);
});

test("roles, order and greeting", () => {
    assert.equal(roleLabel("owner", "celebration"), "מארגן/ת");
    assert.equal(roleLabel("owner", "hoa"), "מנהל/ת");
    assert.equal(roleLabel("guest", "celebration"), "אורח/ת");
    const d = (s: string) => new Date(s);
    const sorted = walletSort([
        { id: "a", isPinned: false, walletOrder: 0, createdAt: d("2026-01-01") },
        { id: "b", isPinned: true, walletOrder: 5, createdAt: d("2025-01-01") },
        { id: "c", isPinned: false, walletOrder: 0, createdAt: d("2026-05-01") },
    ]);
    assert.deepEqual(sorted.map((x) => x.id), ["b", "c", "a"]);
    assert.equal(greeting("דנה", d("2026-10-15T06:00:00Z"), false), "בוקר טוב, דנה");
    assert.equal(greeting("דנה", d("2026-10-15T17:00:00Z"), false), "ערב טוב, דנה");
    assert.equal(greeting("דנה", d("2026-10-15T17:00:00Z"), true), "הי דנה,");
});

test("the org name after ב", () => {
    assert.equal(inOrg("ועד בית"), "בוועד בית");
    assert.equal(inOrg("וויז'ן"), "בוויז'ן");
    assert.equal(inOrg("FitZone"), "ב-FitZone");
    assert.equal(inOrg("בית הכנסת"), "בבית הכנסת");
});

test("member card words", async () => {
    const { badgeWords, crowdText } = await import("./wallet.ts");
    assert.equal(badgeWords("gym").since, "מנוי מאז");
    assert.equal(crowdText(1240, "מתאמנים"), "מתוך 1,240 מתאמנים");
    assert.equal(crowdText(1, "חברים"), "הראשונים כאן");
});

test("arranging the wallet", async () => {
    const { arrange, moveTo, readSortMode, archiveStamp } = await import("./wallet.ts");
    const d = (s: string) => new Date(s);
    const c = (name: string, o: Partial<{ isPinned: boolean; walletOrder: number; lastActivity: string; attention: boolean }> = {}) => ({
        name, isPinned: o.isPinned ?? false, walletOrder: o.walletOrder ?? 0, createdAt: d("2026-01-01"), lastActivity: d(o.lastActivity ?? "2026-01-01"), attention: o.attention ?? false,
    });
    const cards = [c("בית", { walletOrder: 2, lastActivity: "2026-10-10" }), c("אור", { walletOrder: 1, attention: true }), c("גן", { walletOrder: 0, isPinned: true })];
    assert.deepEqual(arrange(cards, "manual").map((x) => x.name), ["גן", "אור", "בית"]);
    assert.deepEqual(arrange(cards, "recent").map((x) => x.name), ["גן", "בית", "אור"]);
    assert.deepEqual(arrange(cards, "name").map((x) => x.name), ["גן", "אור", "בית"]);
    assert.deepEqual(arrange([c("א"), c("ב", { attention: true })], "attention").map((x) => x.name), ["ב", "א"]);
    assert.deepEqual(moveTo(["a", "b", "c", "d"], "d", 1), ["d", "a", "b", "c"]);
    assert.deepEqual(moveTo(["a", "b", "c", "d"], "a", 3), ["b", "c", "a", "d"]);
    assert.deepEqual(moveTo(["a", "b"], "a", 99), ["b", "a"]);
    assert.deepEqual(moveTo(["a", "b"], "z", 1), ["a", "b"]);
    assert.equal(readSortMode({ walletSort: "name" }), "name");
    assert.equal(readSortMode(null), "manual");
    assert.equal(archiveStamp({ hiddenAt: d("2026-10-01"), status: "active" }), "הוסתר");
    assert.equal(archiveStamp({ hiddenAt: null, status: "left_with_debt" }), "עזבת");
});
