import { normalizePhone } from "./auth/contact.ts";

// Rules of the "open an organization" wizard (decided with Tommy 14.10.2026, docs/open-questions.he.md,
// "אשף פתיחת ארגון: מסך אחר מסך"). Pure functions, so the client screens and the server actions agree.

export type StepKey = "name" | "type" | "look" | "collection" | "account" | "invite" | "when" | "money" | "access";
export type Collection = "system" | "manual" | "none";
export type PackChoice = "synagogue" | "hoa" | "gym" | "club" | "celebration" | "generic";

export const STEP_LABELS: Record<StepKey, string> = {
    name: "השם",
    type: "סוג הארגון",
    look: "הכרטיס",
    collection: "גבייה",
    account: "חשבון לקבלת כסף",
    invite: "הזמנת חברים",
    when: "מתי ואיפה",
    money: "כסף",
    access: "שליחת ההזמנה",
};

// Manual reporting and "no money" skip the account screen, and the step bar shortens with it.
// A celebration takes its own short path after the type: when and where, money, who can come in.
export function wizardSteps(collection: Collection, packId?: string | null): StepKey[] {
    if (packId === "celebration") return ["name", "type", "when", "money", "access"];
    const all: StepKey[] = ["name", "type", "look", "collection", "account", "invite"];
    return collection === "system" ? all : all.filter((s) => s !== "account");
}

export const PALETTE = ["#5B3DF5", "#FF5A36", "#00B67A", "#FF5C9E", "#18B8F0", "#1E1633"] as const;

// One swatch is already picked on the card screen, matched to the type, so the admin can simply continue.
export const DEFAULT_COLOR: Record<PackChoice, string> = {
    synagogue: "#5B3DF5",
    hoa: "#00B67A",
    gym: "#FF5A36",
    club: "#FF5C9E",
    celebration: "#FF5A36",
    generic: "#18B8F0",
};

export const isPackChoice = (v: unknown): v is PackChoice =>
    v === "synagogue" || v === "hoa" || v === "gym" || v === "club" || v === "celebration" || v === "generic";
export const isCollection = (v: unknown): v is Collection => v === "system" || v === "manual" || v === "none";
export const isPaletteColor = (v: unknown): v is string => typeof v === "string" && (PALETTE as readonly string[]).includes(v);

export const NAME_MAX = 60;
export const CITY_MAX = 40;

export function cleanName(raw: string): string | null {
    const v = raw.replace(/\s+/g, " ").trim();
    return v.length >= 2 && v.length <= NAME_MAX ? v : null;
}

export function cleanCity(raw: string): string | null {
    const v = raw.replace(/\s+/g, " ").trim();
    return v.length <= CITY_MAX ? v || null : null;
}

// The first letter shown on the card when there is no logo.
export function initialOf(name: string): string {
    return Array.from(name.trim())[0] ?? "";
}

// Logos are resized in the browser to a 256x256 image and kept inline until file storage exists.
export const LOGO_MIN_PX = 256;
export const LOGO_MAX_CHARS = 200_000;
export function isLogoDataUrl(v: unknown): v is string {
    return typeof v === "string" && v.length <= LOGO_MAX_CHARS && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(v);
}

// Pasted list of numbers for "invite by phone": any separator, duplicates removed, bad entries reported back.
export function parsePhoneList(raw: string, max = 500): { phones: string[]; invalid: string[] } {
    const phones: string[] = [];
    const invalid: string[] = [];
    for (const part of raw.split(/[\n,;]+/)) {
        const t = part.trim();
        if (!t) continue;
        const n = normalizePhone(t);
        if (!n) invalid.push(t);
        else if (!phones.includes(n)) phones.push(n);
        if (phones.length >= max) break;
    }
    return { phones, invalid };
}

// Unguessable tokens for slugs and join links (base32, no look-alike letters).
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export function randomToken(length: number, bytes: Uint8Array = crypto.getRandomValues(new Uint8Array(length))): string {
    let out = "";
    for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
    return out;
}
