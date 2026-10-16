import { randomBytes } from "node:crypto";

// Card payments go through a licensed processor that holds the card details; we never see or keep them.
// The processor is not chosen yet (VERIFY, docs/waiting-for-services.he.md, "תשלומים"). Until it is
// connected, development runs on a built-in test processor with two test cards, one that goes through and
// one the bank declines, so the whole flow can be tried end to end. No money moves in test mode.

export type SavedMethod = { id: string; label: string; sub: string };
export type PayOutcome = { ok: true; provider: string; txId: string; cardLabel: string } | { ok: false; reason: string };

const TEST_METHODS: SavedMethod[] = [
    { id: "test-ok", label: "Visa ••4242", sub: "כרטיס בדיקה" },
    { id: "test-declined", label: "Visa ••0002", sub: "כרטיס בדיקה שהבנק דוחה" },
];

export type PaymentsMode = "test" | "off";
export function paymentsMode(): PaymentsMode {
    return process.env.NODE_ENV !== "production" || process.env.PAYMENTS_TEST_MODE === "1" ? "test" : "off";
}

// The member's saved methods at the processor. In test mode: the two test cards.
export async function savedMethods(): Promise<SavedMethod[]> {
    return paymentsMode() === "test" ? TEST_METHODS : [];
}

export async function chargeCard(methodId: string, amountMinor: number): Promise<PayOutcome> {
    if (paymentsMode() !== "test") return { ok: false, reason: "התשלום בכרטיס עוד לא פתוח" };
    const m = TEST_METHODS.find((t) => t.id === methodId);
    if (!m || amountMinor <= 0) return { ok: false, reason: "אמצעי התשלום לא נמצא" };
    if (m.id === "test-declined") return { ok: false, reason: "הבנק לא אישר את התשלום" };
    return { ok: true, provider: "test", txId: `T${randomBytes(5).toString("hex").toUpperCase()}`, cardLabel: m.label };
}
