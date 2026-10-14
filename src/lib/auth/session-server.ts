import { cookies, headers } from "next/headers";
import { db } from "../db";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS, createSessionToken, verifySessionToken } from "../session";
import { cityFromHeaders, describeUserAgent } from "./device";
import { SLIDING_IDLE_MS, sessionPlan } from "./session-plan";

// Server-side session handling. The cookie is a signed hint; AuthSession in the database is the authority,
// so a device disconnected elsewhere is out on its next request.

const TOUCH_EVERY_MS = 24 * 60 * 60 * 1000;

export async function requestInfo() {
    const h = await headers();
    const ua = h.get("user-agent");
    const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || null;
    return { ua, ip, city: cityFromHeaders((n) => h.get(n)), ...describeUserAgent(ua) };
}

export async function startSession(userId: string, remember: boolean) {
    const info = await requestInfo();
    const now = new Date();
    const plan = sessionPlan(info.kind, remember);
    const session = await db.authSession.create({
        data: {
            userId,
            kind: plan.kind,
            deviceKind: info.kind,
            label: info.label,
            city: info.city,
            ip: info.ip,
            expiresAt: new Date(now.getTime() + plan.lifetimeMs),
        },
    });
    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
    const token = await createSessionToken({ sub: userId, sid: session.id, name: user.firstName, orgId: null, role: null, mustChangePassword: false, sliding: plan.kind === "sliding" });
    const { maxAge: _ignored, ...rest } = SESSION_COOKIE_OPTIONS;
    void _ignored;
    (await cookies()).set(SESSION_COOKIE_NAME, token, plan.persistCookie ? { ...rest, maxAge: Math.floor(plan.lifetimeMs / 1000) } : rest);
    await db.securityEvent.create({ data: { userId, kind: "login", ip: info.ip, city: info.city, userAgent: info.ua } });
    return session;
}

export interface CurrentSession {
    userId: string;
    sessionId: string;
}

// Returns null when signed out, expired or disconnected. Renews sliding sessions at most once a day.
export async function getSession(): Promise<CurrentSession | null> {
    const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    const payload = await verifySessionToken(token);
    if (!payload?.sid) return null;
    const s = await db.authSession.findUnique({ where: { id: payload.sid } });
    const now = new Date();
    if (!s || s.userId !== payload.sub || s.revokedAt || s.expiresAt <= now) return null;
    if (s.kind === "sliding" && now.getTime() - s.lastSeenAt.getTime() > TOUCH_EVERY_MS) {
        await db.authSession.update({ where: { id: s.id }, data: { lastSeenAt: now, expiresAt: new Date(now.getTime() + SLIDING_IDLE_MS) } });
    }
    return { userId: s.userId, sessionId: s.id };
}

export async function endSession() {
    const current = await getSession();
    if (current) await db.authSession.update({ where: { id: current.sessionId }, data: { revokedAt: new Date() } });
    (await cookies()).delete(SESSION_COOKIE_NAME);
}
