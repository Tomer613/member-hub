import assert from "node:assert/strict";
import test from "node:test";
import { EMPTY_CELEBRATION, cleanGuestName, guestLabel, isHonoree, amountOwed, cleanPayLink, formatShekels, formatWhen, readCelebration, shekelsToMinor, totals } from "./celebration.ts";

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
