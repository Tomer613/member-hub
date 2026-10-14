// Growing lockout for sign-in (decided 13.10.2026): after too many code requests or wrong codes, wait
// 1 minute, then 5, then 30. Pure policy; the database side lives in src/lib/auth/throttle-store.ts.

export const WINDOW_MS = 15 * 60 * 1000;
export const MAX_SENDS_PER_WINDOW = 5;
export const MAX_FAILURES_PER_WINDOW = 5;
// A network address is shared by a whole home or office, so it only caps code requests, higher,
// and one person's wrong codes never lock their neighbours out.
export const MAX_SENDS_PER_IP_WINDOW = 30;
export const LOCK_STEPS_MS = [60_000, 5 * 60_000, 30 * 60_000];
// A day without a new lock forgives earlier ones.
export const STRIKE_RESET_MS = 24 * 60 * 60 * 1000;

export interface ThrottleState {
    sends: number;
    failures: number;
    windowStart: Date;
    strikes: number;
    lockedUntil: Date | null;
    updatedAt: Date;
}

export function lockDurationMs(strikes: number): number {
    return LOCK_STEPS_MS[Math.min(Math.max(strikes, 1), LOCK_STEPS_MS.length) - 1];
}

export function secondsLocked(state: ThrottleState | null, now: Date): number {
    if (!state?.lockedUntil) return 0;
    return Math.max(0, Math.ceil((state.lockedUntil.getTime() - now.getTime()) / 1000));
}

// Applies one event and returns the next state. A lock starts when the window's limit is crossed.
export function applyEvent(
    prev: ThrottleState | null,
    event: "send" | "failure" | "success",
    now: Date,
    limits = { sends: MAX_SENDS_PER_WINDOW, failures: MAX_FAILURES_PER_WINDOW },
): ThrottleState {
    let s: ThrottleState = prev
        ? { ...prev }
        : { sends: 0, failures: 0, windowStart: now, strikes: 0, lockedUntil: null, updatedAt: now };
    if (s.strikes > 0 && now.getTime() - s.updatedAt.getTime() > STRIKE_RESET_MS) s = { ...s, strikes: 0 };
    if (now.getTime() - s.windowStart.getTime() > WINDOW_MS) s = { ...s, sends: 0, failures: 0, windowStart: now };
    if (event === "success") return { ...s, failures: 0, updatedAt: now };
    if (event === "send") s.sends += 1;
    if (event === "failure") s.failures += 1;
    if (s.sends > limits.sends || s.failures >= limits.failures) {
        const strikes = s.strikes + 1;
        return { sends: 0, failures: 0, windowStart: now, strikes, lockedUntil: new Date(now.getTime() + lockDurationMs(strikes)), updatedAt: now };
    }
    return { ...s, updatedAt: now };
}

export const IP_LIMITS = { sends: MAX_SENDS_PER_IP_WINDOW, failures: Number.POSITIVE_INFINITY };

export function limitsForKey(key: string) {
    return key.startsWith("ip:") ? IP_LIMITS : { sends: MAX_SENDS_PER_WINDOW, failures: MAX_FAILURES_PER_WINDOW };
}
