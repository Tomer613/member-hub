import { db } from "../db";
import { applyEvent, limitsForKey, secondsLocked, type ThrottleState } from "./throttle";

// Database side of the sign-in throttle. Keys: "phone:+972...", "email:a@b.c", "ip:1.2.3.4".

async function load(key: string): Promise<ThrottleState | null> {
    return db.authThrottle.findUnique({ where: { key } });
}

export async function lockedSeconds(keys: string[], now = new Date()): Promise<number> {
    const rows = await db.authThrottle.findMany({ where: { key: { in: keys } } });
    return Math.max(0, ...rows.map((r) => secondsLocked(r, now)));
}

// Records an event on every key and returns how long the caller is now locked out (0 if not).
export async function record(keys: string[], event: "send" | "failure" | "success", now = new Date()): Promise<number> {
    let locked = 0;
    for (const key of keys) {
        const next = applyEvent(await load(key), event, now, limitsForKey(key));
        const data = { sends: next.sends, failures: next.failures, windowStart: next.windowStart, strikes: next.strikes, lockedUntil: next.lockedUntil };
        await db.authThrottle.upsert({ where: { key }, create: { key, ...data }, update: data });
        locked = Math.max(locked, secondsLocked(next, now));
    }
    return locked;
}
