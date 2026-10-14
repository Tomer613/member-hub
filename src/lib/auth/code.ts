import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

// One-time sign-in codes. Only an HMAC of the code is stored (keyed with SESSION_SECRET), so a database
// leak does not reveal live codes, and comparison is constant-time.

export const CODE_LENGTH = 6;
export const CODE_TTL_MS = 10 * 60 * 1000;
export const RESEND_AFTER_MS = 30 * 1000;
export const MAX_ATTEMPTS_PER_CODE = 5;

export function generateCode(): string {
    return String(randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, "0");
}

export function hashCode(code: string, contactValue: string, secret: string): string {
    return createHmac("sha256", secret).update(`${contactValue}:${code}`).digest("hex");
}

export function codeMatches(code: string, contactValue: string, storedHash: string, secret: string): boolean {
    if (!/^\d{6}$/.test(code)) return false;
    const a = Buffer.from(hashCode(code, contactValue, secret), "hex");
    const b = Buffer.from(storedHash, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
}
