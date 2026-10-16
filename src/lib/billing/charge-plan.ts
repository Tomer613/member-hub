// "חיוב חדש" and "הקופה" for admins (boards D-AdmCharge, D-AdmKupa). Pure, so it is tested without a database.
import { NOTE_MAX, TITLE_MAX } from "./account.ts";

export const CHARGE_KINDS = [
    { id: "one_time", label: "חיוב חד פעמי" },
    { id: "special", label: "חיוב מיוחד" },
] as const;
export type ChargeKind = (typeof CHARGE_KINDS)[number]["id"];
export const isChargeKind = (v: unknown): v is ChargeKind => CHARGE_KINDS.some((k) => k.id === v);
export const kindLabel = (v: string) => CHARGE_KINDS.find((k) => k.id === v)?.label ?? (v === "recurring" ? "דמי חבר" : "חיוב");

// Who gets the charge: everyone active, the holders of one plan or one label, or members picked by hand.
export type Audience = { to: "all" } | { to: "plan"; planId: string } | { to: "label"; labelId: string } | { to: "picked"; linkIds: string[] };

export type ChargeInput = {
    title: string;
    amount: string; // shekels as typed
    due: string; // YYYY-MM-DD
    kind: ChargeKind;
    note: string;
    audience: Audience;
    notify: boolean;
    remind: boolean;
    partial: boolean;
};

export const EMPTY_CHARGE: ChargeInput = { title: "", amount: "", due: "", kind: "one_time", note: "", audience: { to: "all" }, notify: true, remind: true, partial: false };

// A recipient as the form knows them: the membership, and what they hold.
export type Recipient = { linkId: string; name: string; planIds: string[]; labelIds: string[] };

export function pickRecipients(all: Recipient[], a: Audience): Recipient[] {
    switch (a.to) {
        case "all": return all;
        case "plan": return all.filter((r) => r.planIds.includes(a.planId));
        case "label": return all.filter((r) => r.labelIds.includes(a.labelId));
        case "picked": return all.filter((r) => a.linkIds.includes(r.linkId));
    }
}

// Reads a stored or posted input safely (drafts are JSON from the database, the form is from the browser).
export function readChargeInput(v: unknown): ChargeInput {
    const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
    const s = (x: unknown, max: number) => (typeof x === "string" ? x.slice(0, max) : "");
    const a = (o.audience && typeof o.audience === "object" ? o.audience : {}) as Record<string, unknown>;
    const audience: Audience =
        a.to === "plan" && typeof a.planId === "string" ? { to: "plan", planId: a.planId }
        : a.to === "label" && typeof a.labelId === "string" ? { to: "label", labelId: a.labelId }
        : a.to === "picked" && Array.isArray(a.linkIds) ? { to: "picked", linkIds: a.linkIds.filter((x): x is string => typeof x === "string").slice(0, 2000) }
        : { to: "all" };
    return {
        title: s(o.title, TITLE_MAX),
        amount: s(o.amount, 20),
        due: /^\d{4}-\d{2}-\d{2}$/.test(String(o.due)) ? String(o.due) : "",
        kind: isChargeKind(o.kind) ? o.kind : "one_time",
        note: s(o.note, NOTE_MAX),
        audience,
        notify: o.notify !== false,
        remind: o.remind !== false,
        partial: o.partial === true,
    };
}

// "למשל: מנוי שנתי · 148 חברים".
export const peopleCount = (n: number) => (n === 1 ? "חבר אחד" : `${n} חברים`);

// One line in "תנועות בקופה".
export type Movement = { id: string; at: Date; what: string; who: string; amountMinor: number; dir: "in" | "out"; status: "נקלט" | "הועבר" | "בדרך" };
export type MovementFilter = "all" | "in" | "out";
export const inMovementFilter = (m: Pick<Movement, "dir">, f: MovementFilter) => f === "all" || m.dir === f;

// "+₪50" for money in, "−₪50" (U+2212) for money out.
export const signedAmount = (m: Pick<Movement, "dir">, formatted: string) => `${m.dir === "in" ? "+" : "−"}${formatted}`;
