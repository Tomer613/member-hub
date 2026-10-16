import assert from "node:assert/strict";
import test from "node:test";
import { accountShown, allocate, chargeViews, ilDate, ilDateTime, ilShortDate, memberNumber, moneySummary, moneyTileText, noticeText, payAmount } from "./account.ts";
import { formatShekels } from "../money.ts";

const day = (s: string) => new Date(`${s}T09:00:00Z`);
const charge = (id: string, amount: number, due: string, allocations: { amountMinor: number; status: string }[] = [], voided = false) => ({
    id,
    description: `חיוב ${id}`,
    amountMinor: amount,
    dueOn: day(due),
    createdAt: day("2026-10-01"),
    voidedAt: voided ? day("2026-10-02") : null,
    allocations,
});

test("a charge is paid by succeeded payments only, and a report keeps it pending", () => {
    const v = chargeViews([
        charge("a", 60000, "2026-11-15"),
        charge("b", 60000, "2026-10-15", [{ amountMinor: 20000, status: "succeeded" }]),
        charge("c", 30000, "2026-10-20", [{ amountMinor: 30000, status: "pending" }]),
        charge("d", 30000, "2026-10-20", [{ amountMinor: 30000, status: "succeeded" }]),
        charge("e", 30000, "2026-10-20", [{ amountMinor: 30000, status: "failed" }]),
        charge("f", 30000, "2026-10-20", [], true),
    ]);
    assert.deepEqual(v.map((x) => [x.id, x.state, x.leftMinor]), [["a", "open", 60000], ["b", "open", 40000], ["c", "pending", 30000], ["d", "paid", 0], ["e", "open", 30000]]);
    const s = moneySummary(v);
    assert.deepEqual(s.open.map((x) => x.id), ["b", "e", "a"]);
    assert.equal(s.openMinor, 130000);
    assert.equal(s.pending, 1);
    assert.equal(noticeText(s), "3 חיובים פתוחים · ₪1,300");
    assert.equal(moneyTileText(s), "₪1,300 לתשלום");
});

test("notice and tile when one charge, only reports, or nothing", () => {
    const one = moneySummary(chargeViews([charge("a", 60000, "2026-11-15")]));
    assert.equal(noticeText(one), "חיוב a · ₪600");
    const waiting = moneySummary(chargeViews([charge("c", 30000, "2026-10-20", [{ amountMinor: 30000, status: "pending" }])]));
    assert.equal(noticeText(waiting), "הדיווח על התשלום ממתין לאישור הארגון");
    assert.equal(moneyTileText(waiting), "ממתין לאישור הארגון");
    const none = moneySummary([]);
    assert.equal(noticeText(none), null);
    assert.equal(moneyTileText(none), "הכול שולם");
});

test("a payment covers charges in order and never more than is left", () => {
    assert.deepEqual(allocate(50000, [{ id: "a", leftMinor: 40000 }, { id: "b", leftMinor: 60000 }]), [{ chargeId: "a", amountMinor: 40000 }, { chargeId: "b", amountMinor: 10000 }]);
    assert.deepEqual(allocate(100, [{ id: "a", leftMinor: 0 }, { id: "b", leftMinor: 60000 }]), [{ chargeId: "b", amountMinor: 100 }]);
});

test("formats as on the boards", () => {
    assert.equal(formatShekels(60000), "₪600");
    assert.equal(formatShekels(60050), "₪600.50");
    assert.equal(formatShekels(-5000), "-₪50");
    assert.equal(memberNumber(418), "0418");
    assert.equal(ilDate(new Date("2026-11-15T22:30:00Z")), "16.11.2026");
    assert.equal(ilShortDate(new Date("2026-11-05T10:00:00Z")), "5.11");
    assert.equal(ilDateTime(new Date("2026-10-15T15:05:00Z")), "15.10.2026 · 18:05");
});

test("the card's next line", async () => {
    const { nextLine, nextRenewal } = await import("./account.ts");
    const now = new Date("2026-10-15T10:00:00Z");
    assert.equal(nextRenewal(new Date("2026-01-01T00:00:00Z"), "month", now)?.toISOString().slice(0, 10), "2026-11-01");
    assert.equal(nextRenewal(new Date("2025-03-10T00:00:00Z"), "year", now)?.toISOString().slice(0, 10), "2027-03-10");
    assert.equal(nextRenewal(new Date("2025-03-10T00:00:00Z"), "once", now), null);
    const open = moneySummary(chargeViews([charge("a", 60000, "2026-11-15")]));
    assert.deepEqual(nextLine("hoa", open, null), { label: "התשלום הבא", value: "15.11" });
    assert.deepEqual(nextLine("gym", moneySummary([]), new Date("2026-11-01T00:00:00Z")), { label: "מתחדש ב", value: "1.11" });
    assert.deepEqual(nextLine("hoa", moneySummary([]), null), { label: "תשלומים", value: "הכול שולם" });
});

test("the card shows the flat in a house committee, the member number elsewhere", () => {
    assert.deepEqual(accountShown("hoa", "4", 12), { label: "דירה", value: "4" });
    assert.deepEqual(accountShown("hoa", null, 12), { label: "מספר חבר", value: "0012" });
    assert.deepEqual(accountShown("gym", "4", 418), { label: "מספר חבר", value: "0418" });
});

test("part of a charge only when every chosen charge allows it", () => {
    const yes = [{ partial: true }], no = [{ partial: true }, { partial: false }];
    assert.equal(payAmount(null, 30000, no), 30000);
    assert.equal(payAmount(30000, 30000, no), 30000);
    assert.equal(payAmount(10000, 30000, no), null);
    assert.equal(payAmount(10000, 30000, yes), 10000);
    assert.equal(payAmount(50, 30000, yes), null);
    assert.equal(payAmount(40000, 30000, yes), null);
});
