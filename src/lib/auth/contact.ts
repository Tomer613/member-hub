import { toWhatsAppNumber } from "../phone.ts";

// Normalizes what a person typed into the value stored in UserContact / ContactChallenge:
// E.164 for phones ("+972501234567"), lower case for emails. Returns null when it cannot be a valid contact.

export type ContactKind = "phone" | "email";

export function normalizePhone(raw: string, defaultCallingCode = "972"): string | null {
    const trimmed = raw.trim();
    if (!/^[+\d][\d\s\-().]*$/.test(trimmed)) return null;
    const digits = trimmed.startsWith("+") ? trimmed.replace(/\D/g, "") : toWhatsAppNumber(trimmed, defaultCallingCode);
    // E.164 allows up to 15 digits; anything under 8 is not a reachable number.
    if (digits.length < 8 || digits.length > 15 || digits.startsWith("0")) return null;
    return `+${digits}`;
}

export function normalizeEmail(raw: string): string | null {
    const v = raw.trim().toLowerCase();
    if (v.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return null;
    return v;
}

export function normalizeContact(kind: ContactKind, raw: string, defaultCallingCode = "972"): string | null {
    return kind === "phone" ? normalizePhone(raw, defaultCallingCode) : normalizeEmail(raw);
}

// For "we sent a code to ...": shows enough to recognize the contact without exposing it on screen.
export function maskContact(kind: ContactKind, value: string): string {
    if (kind === "email") {
        const [user, domain] = value.split("@");
        return `${user.slice(0, 1)}•••@${domain}`;
    }
    // Local Israeli format for +972 numbers, international otherwise.
    const local = value.startsWith("+972") ? `0${value.slice(4)}` : value;
    return `${local.slice(0, 3)}‑•••‑${local.slice(-4)}`;
}
