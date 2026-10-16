import assert from "node:assert/strict";
import test from "node:test";
import { EMPTY_CELEBRATION, answerCounts, cleanAnswer, cleanQuestion, celebrationStage, nextYear, stillOwes, cleanGuestName, cleanWhatsAppGroup, localPhone, mayEnter, collectionTarget, guestLabel, isHonoree, amountOwed, cleanPayLink, formatShekels, formatWhen, readCelebration, shekelsToMinor, totals } from "./celebration.ts";

const money = (m: Partial<typeof EMPTY_CELEBRATION.money>) => ({ ...EMPTY_CELEBRATION.money, ...m });

test("amount owed per person, with an optional kid price, or per family", () => {
    assert.equal(amountOwed(money({ mode: "fixed", amountMinor: 10000 }), 5, 4), 50000);
    assert.equal(amountOwed(money({ mode: "fixed", amountMinor: 10000, kidAmountMinor: 4000 }), 5, 4), 26000);
    assert.equal(amountOwed(money({ mode: "fixed", per: "family", amountMinor: 30000 }), 5, 4), 30000);
    assert.equal(amountOwed(money({ mode: "free" }), 2, 0), null);
    assert.equal(amountOwed(money({ mode: "none" }), 2, 0), null);
});

test("shekel amounts and pay links are validated", () => {
    assert.equal(shekelsToMinor("120"), 12000);
    assert.equal(shekelsToMinor("₪1,200.5"), 120050);
    assert.equal(shekelsToMinor("abc"), null);
    assert.equal(shekelsToMinor("0"), null);
    assert.equal(formatShekels(12000), "₪120");
    assert.equal(cleanPayLink("https://www.bitpay.co.il/app/me/X"), "https://www.bitpay.co.il/app/me/X");
    assert.equal(cleanPayLink("javascript:alert(1)"), null);
    assert.equal(cleanPayLink("http://pay.example"), null);
});

test("dates read in Hebrew", () => {
    assert.equal(formatWhen("2026-11-05T20:00"), "יום חמישי, 5.11 בשעה 20:00");
    assert.equal(formatWhen("2026-11-07"), "יום שבת, 7.11");
    assert.equal(formatWhen(null), null);
});

test("totals count people, kids and confirmed money", () => {
    const t = totals([
        { status: "yes", people: 5, kids: 4, paid: "confirmed", paidMinor: 26000 },
        { status: "yes", people: 2, kids: 0, paid: "claimed", paidMinor: 20000 },
        { status: "maybe", people: 3, kids: 1, paid: "none", paidMinor: null },
        { status: "no", people: 1, kids: 0, paid: "none", paidMinor: null },
    ]);
    assert.deepEqual(t, { coming: 7, kids: 4, maybe: 3, no: 1, replies: 4, paidMinor: 26000, claimed: 1 });
});

test("missing settings fall back to defaults", () => {
    assert.equal(readCelebration({}).access, "link");
    assert.equal(readCelebration({ celebration: { money: { mode: "fixed" } } }).money.per, "person");
});

test("guest names are cleaned and shown to others by first name", () => {
    assert.equal(cleanGuestName("  דנה   כהן "), "דנה כהן");
    assert.equal(cleanGuestName("ד"), null);
    assert.equal(guestLabel("דנה כהן", 3), "דנה +2");
    assert.equal(guestLabel("יוסי", 1), "יוסי");
});

test("the honoree's phone hides a surprise party, and only while it is a surprise", () => {
    const c = { ...EMPTY_CELEBRATION, surprise: { on: true, honoree: "נועה", phone: "+972501234567" } };
    assert.ok(isHonoree(c, ["+972501234567"]));
    assert.ok(!isHonoree(c, ["+972521112222"]));
    assert.ok(!isHonoree({ ...c, surprise: { ...c.surprise, on: false } }, ["+972501234567"]));
    assert.equal(readCelebration({ celebration: { startsAt: "2026-11-05" } }).kids, true);
});

test("the bar fills toward what everyone coming owes, or toward the organizer's goal", () => {
    assert.equal(collectionTarget(money({ mode: "fixed", amountMinor: 10000 }), [{ people: 2, kids: 0 }, { people: 1, kids: 0 }]), 30000);
    assert.equal(collectionTarget(money({ mode: "free", goalMinor: 120000 }), []), 120000);
    assert.equal(collectionTarget(money({ mode: "free" }), []), null);
    assert.equal(collectionTarget(money({ mode: "none", goalMinor: 5 }), []), null);
});

test("an invited-only celebration opens to the invited phones and the organizers", () => {
    const c = { ...EMPTY_CELEBRATION, access: "invited" as const, invited: ["+972501234567"] };
    assert.ok(mayEnter(c, ["+972501234567"], false));
    assert.ok(!mayEnter(c, ["+972521112222"], false));
    assert.ok(!mayEnter(c, [], false));
    assert.ok(mayEnter(c, [], true));
    assert.ok(mayEnter(EMPTY_CELEBRATION, [], false));
});

test("Israeli numbers are shown the local way", () => {
    assert.equal(localPhone("+972501234567"), "050-1234567");
    assert.equal(localPhone("+14155550100"), "+14155550100");
});

test("only a WhatsApp group invite link is accepted for the group button", () => {
    assert.equal(cleanWhatsAppGroup(" https://chat.whatsapp.com/AbC123 "), "https://chat.whatsapp.com/AbC123");
    assert.equal(cleanWhatsAppGroup("https://evil.example/chat.whatsapp.com"), null);
    assert.equal(cleanWhatsAppGroup("http://chat.whatsapp.com/x"), null);
    assert.deepEqual(readCelebration({ celebration: {} }).links, { whatsapp: null, album: null });
});

test("a celebration moves to past a week after, and locks once every payment is in", () => {
    const c = { ...EMPTY_CELEBRATION, startsAt: "2026-11-01T20:00", money: money({ mode: "fixed" as const, amountMinor: 5000 }) };
    const rows = [{ status: "yes", people: 2, kids: 0, paid: "confirmed" }, { status: "yes", people: 1, kids: 0, paid: "claimed" }, { status: "no", people: 1, kids: 0, paid: "none" }];
    assert.equal(celebrationStage(c, "active", rows, new Date("2026-11-05T12:00")), "upcoming");
    assert.equal(celebrationStage(c, "active", rows, new Date("2026-11-09T12:00")), "past");
    rows[1].paid = "confirmed";
    assert.equal(celebrationStage(c, "active", rows, new Date("2026-11-09T12:00")), "closed");
    assert.equal(celebrationStage({ ...c, money: money({ mode: "none" }) }, "active", [], new Date("2026-11-09T12:00")), "closed");
    assert.equal(celebrationStage({ ...c, money: money({ mode: "free" }) }, "active", [], new Date("2027-11-09T12:00")), "past");
    const goal = { ...c, money: money({ mode: "free" as const, goalMinor: 30000 }) };
    const gifts = [{ status: "yes", people: 1, kids: 0, paid: "confirmed", paidMinor: 20000 }, { status: "yes", people: 1, kids: 0, paid: "claimed", paidMinor: 15000 }];
    assert.equal(celebrationStage(goal, "active", gifts, new Date("2026-11-09T12:00")), "past");
    gifts[1].paid = "confirmed";
    assert.equal(celebrationStage(goal, "active", gifts, new Date("2026-11-09T12:00")), "closed");
    assert.equal(celebrationStage(c, "closed", [], new Date("2026-10-01T12:00")), "closed");
    assert.equal(celebrationStage({ ...c, startsAt: null }, "active", [], new Date("2030-01-01")), "upcoming");
});

test("who still owes, and the same day next year", () => {
    const m = money({ mode: "fixed", amountMinor: 5000 });
    assert.equal(stillOwes(m, { status: "yes", people: 1, kids: 0, paid: "claimed" }), true);
    assert.equal(stillOwes(m, { status: "yes", people: 1, kids: 0, paid: "confirmed" }), false);
    assert.equal(stillOwes(m, { status: "maybe", people: 1, kids: 0, paid: "none" }), false);
    assert.equal(stillOwes(money({ mode: "free" }), { status: "yes", people: 1, kids: 0, paid: "none" }), false);
    assert.equal(nextYear("2026-11-20T19:00"), "2027-11-20T19:00");
    assert.equal(nextYear("2028-02-29T10:00"), "2029-02-28T10:00");
    assert.equal(nextYear(null), null);
});

test("the organizer's own question and its answers", () => {
    assert.deepEqual(cleanQuestion("  מה  תרצו לאכול? ", ["בשרי", " צמחוני ", "בשרי", ""]), { question: { text: "מה תרצו לאכול?", options: ["בשרי", "צמחוני"] } });
    assert.deepEqual(cleanQuestion("שירים שתרצו לשמוע?", []), { question: { text: "שירים שתרצו לשמוע?", options: [] } });
    assert.ok("error" in cleanQuestion("א", []));
    assert.ok("error" in cleanQuestion("מה תרצו?", ["רק אחת"]));
    assert.ok("error" in cleanQuestion("מה תרצו?", ["1", "2", "3", "4", "5", "6", "7"]));
    const food = { text: "מה תרצו לאכול?", options: ["בשרי", "צמחוני"] };
    assert.equal(cleanAnswer(food, "צמחוני"), "צמחוני");
    assert.equal(cleanAnswer(food, "פיצה"), null);
    assert.equal(cleanAnswer({ text: "שירים?", options: [] }, "  ריקוד   הדבורה "), "ריקוד הדבורה");
    assert.equal(cleanAnswer(null, "משהו"), null);
    assert.deepEqual(answerCounts(food, ["בשרי", "צמחוני", "בשרי", null, "ישן"]), [{ option: "בשרי", count: 2 }, { option: "צמחוני", count: 1 }]);
});
