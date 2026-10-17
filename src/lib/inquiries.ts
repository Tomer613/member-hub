// "פניות" (boards D-InquiryList/New/Sent/View/Closed/Empty, D-AdmInquiries, D-AdmInquiry). Pure, so it is
// tested without a database. One table for every org type: a pack only adds kinds and their fields.
import type { RequestKindDef } from "../packs/types.ts";

export const BODY_MAX = 2000;
export const FIRST_NUMBER = 1001;
export const AUTO_CLOSE_DAYS = 14;

export const CORE_KINDS = [
    { kind: "details", label: "שינוי פרטים" },
    { kind: "charge", label: "מחלוקת על חיוב" },
    { kind: "general", label: "שאלה כללית" },
    { kind: "other", label: "אחר" },
] as const;

export type InquiryStatus = "new" | "answered" | "replied" | "closed";
export const isInquiryStatus = (v: unknown): v is InquiryStatus => v === "new" || v === "answered" || v === "replied" || v === "closed";

// The kinds a member can pick: the core four, then the pack's own.
// A pack's own "general inquiry" is the core "שאלה כללית", so it is not listed twice.
export function inquiryKinds(pack: readonly RequestKindDef[]): { kind: string; label: string; core: boolean }[] {
    return [...CORE_KINDS.map((k) => ({ ...k, core: true })), ...pack.filter((k) => k.kind !== "general_inquiry").map((k) => ({ kind: k.kind, label: k.label, core: false }))];
}
export const kindLabel = (kind: string, pack: readonly RequestKindDef[]) => inquiryKinds(pack).find((k) => k.kind === kind)?.label ?? "פנייה";

// The org sees who must act: a new inquiry or a member's reply. The member sees whether there is an answer.
export const ADMIN_STATUS: Record<InquiryStatus, string> = { new: "חדשה", answered: "נענתה", replied: "תגובה חדשה", closed: "נסגרה" };
export const memberStatus = (s: InquiryStatus) => (s === "answered" ? "נענתה" : s === "closed" ? "נסגרה" : "בטיפול");
export const STATUS_TINT: Record<InquiryStatus, string> = { new: "#FFD84A", answered: "#D7F5E8", replied: "#FFD9E8", closed: "#EDE6D6" };

export const ADMIN_FILTERS = [
    { id: "all", label: "הכל" },
    { id: "new", label: "חדשות" },
    { id: "open", label: "בטיפול" },
    { id: "closed", label: "נסגרו" },
] as const;
export type AdminFilter = (typeof ADMIN_FILTERS)[number]["id"];
export const readAdminFilter = (v: unknown): AdminFilter => (ADMIN_FILTERS.some((f) => f.id === v) ? (v as AdminFilter) : "all");
// "חדשות" is what waits for the org: never answered, or the member wrote again.
export function inAdminFilter(s: InquiryStatus, f: AdminFilter): boolean {
    if (f === "all") return true;
    if (f === "new") return s === "new" || s === "replied";
    if (f === "open") return s === "answered";
    return s === "closed";
}
export const waitsForOrg = (s: InquiryStatus) => s === "new" || s === "replied";

export const nextNumber = (max: number | null | undefined) => (max && max >= FIRST_NUMBER ? max + 1 : FIRST_NUMBER);

export function cleanBody(raw: unknown): string {
    return String(raw ?? "").replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

// A new inquiry. The words are optional (board D-InquiryNew: "אפשר לפרט, או להשאיר ריק"), except for "אחר",
// which says nothing on its own. A pack kind needs its required fields.
export function readNewInquiry(input: { kind: unknown; body: unknown; fields?: Record<string, unknown> }, pack: readonly RequestKindDef[]):
    { ok: true; kind: string; body: string; payload: Record<string, string | number> } | { ok: false; error: string } {
    const kind = String(input.kind ?? "");
    const def = pack.find((k) => k.kind === kind && k.kind !== "general_inquiry");
    if (!def && !CORE_KINDS.some((k) => k.kind === kind)) return { ok: false, error: "בחרו על מה הפנייה." };
    const body = cleanBody(input.body);
    if ([...body].length > BODY_MAX) return { ok: false, error: `הפירוט ארוך מ-${BODY_MAX} תווים.` };
    if (kind === "other" && !body) return { ok: false, error: "כתבו כמה מילים על מה הפנייה." };
    const payload: Record<string, string | number> = {};
    for (const f of def?.fields ?? []) {
        const raw = String(input.fields?.[f.key] ?? "").trim().slice(0, 200);
        if (!raw) {
            if (f.required) return { ok: false, error: `מלאו את "${f.label}".` };
            continue;
        }
        if (f.type === "number") {
            const n = Number(raw.replace(/[,\s₪]/g, ""));
            if (!Number.isFinite(n)) return { ok: false, error: `"${f.label}" צריך להיות מספר.` };
            payload[f.key] = n;
        } else payload[f.key] = raw;
    }
    return { ok: true, kind, body, payload };
}

// The pack fields as lines to show ("אירוע: בר מצווה").
export function payloadLines(kind: string, payload: unknown, pack: readonly RequestKindDef[]): { label: string; value: string }[] {
    const def = pack.find((k) => k.kind === kind);
    const p = (payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {}) as Record<string, unknown>;
    return (def?.fields ?? []).flatMap((f) => (p[f.key] === undefined || p[f.key] === "" ? [] : [{ label: f.label, value: String(p[f.key]) }]));
}

// The line under the kind in a list: what the member wrote first, or the pack fields.
export function previewLine(body: string | null, lines: { value: string }[], max = 70): string {
    const text = (body ?? "").split("\n")[0].trim() || lines.map((l) => l.value).join(" · ");
    const chars = [...text];
    return chars.length > max ? `${chars.slice(0, max - 1).join("").trimEnd()}…` : text || "בלי פירוט";
}

// An answered inquiry nobody wrote in for 14 days closes by itself.
export const autoCloseBefore = (now: Date) => new Date(now.getTime() - AUTO_CLOSE_DAYS * 86_400_000);

// What the member sees as the writer of an answer: the first name and the role, as the admin board promises.
export const staffSignature = (firstName: string | null | undefined, role: string) => `${firstName?.trim() || "ההנהלה"} · ${role}`;
