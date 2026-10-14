// How long a sign-in lasts, by device (decided 13.10.2026). Pure, so it can be tested.

const DAY = 24 * 60 * 60 * 1000;
export const SLIDING_IDLE_MS = 180 * DAY;
export const FIXED_MS = 12 * 60 * 60 * 1000;
// A computer with "remember" ticked stays signed in 30 days from sign-in (decided 13.10.2026).
export const REMEMBERED_COMPUTER_MS = 30 * DAY;

// Phones and tablets get the sliding session (renewed on use, ends after 180 idle days). A computer gets
// 30 fixed days when "remember" is ticked, otherwise 12 hours with a cookie that dies with the browser.
export function sessionPlan(deviceKind: string, remember: boolean): { kind: "sliding" | "fixed"; lifetimeMs: number; persistCookie: boolean } {
    if (deviceKind !== "computer") return { kind: "sliding", lifetimeMs: SLIDING_IDLE_MS, persistCookie: true };
    if (remember) return { kind: "fixed", lifetimeMs: REMEMBERED_COMPUTER_MS, persistCookie: true };
    return { kind: "fixed", lifetimeMs: FIXED_MS, persistCookie: false };
}
