import { createHmac, timingSafeEqual } from "node:crypto";

// The entry code on the back of the member card (board D-BadgeBack). It proves a membership and changes
// every minute, so a screenshot or a forwarded photo stops working quickly. It carries no personal details:
// only the membership id, the minute it belongs to and a signature keyed with SESSION_SECRET. The scanner
// that checks it at the door is built separately (verifyEntryCode).

export const ENTRY_WINDOW_SECONDS = 60;
const PREFIX = "piri1";

const windowOf = (now: Date) => Math.floor(now.getTime() / 1000 / ENTRY_WINDOW_SECONDS);
const sign = (membershipId: string, w: number, secret: string) => createHmac("sha256", `entry:${secret}`).update(`${membershipId}:${w}`).digest("base64url").slice(0, 22);

export function entryCode(membershipId: string, now: Date, secret: string): { code: string; secondsLeft: number } {
    const w = windowOf(now);
    const secondsLeft = (w + 1) * ENTRY_WINDOW_SECONDS - Math.floor(now.getTime() / 1000);
    return { code: `${PREFIX}.${membershipId}.${w}.${sign(membershipId, w, secret)}`, secondsLeft };
}

// The membership id when the code is genuine and from this minute or the one before (a little slack for
// a scan right at the turn of the minute), otherwise null.
export function verifyEntryCode(code: string, now: Date, secret: string): string | null {
    const [prefix, id, ws, sig] = code.split(".");
    if (prefix !== PREFIX || !id || !sig || !/^\d+$/.test(ws ?? "")) return null;
    const w = Number(ws);
    const current = windowOf(now);
    if (w !== current && w !== current - 1) return null;
    const a = Buffer.from(sig);
    const b = Buffer.from(sign(id, w, secret));
    return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}
