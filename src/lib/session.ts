import { SignJWT, jwtVerify } from "jose";

// Edge-runtime-safe session primitives (jose only), ported from d3teman. Must not import
// bcryptjs, next/headers, or Prisma, because the edge proxy imports this file.
//
// Differences from d3teman: the login (User) is global and may belong to several orgs, so the
// token carries the *active* org and the role inside it. Both are re-checked against the database
// on sensitive requests; the token is a hint for routing, never the final authority.

export const SESSION_COOKIE_NAME = "memberhub_session";

// Upper bound for the token itself. The real lifetime is AuthSession.expiresAt in the database:
// sliding sessions renew on use and end after 180 idle days; "don't remember" sessions end after 12 hours.
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 180;

export const SESSION_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
};

export interface SessionPayload {
    sub: string; // User.id
    sid: string; // AuthSession.id: lets a device be disconnected from another device
    name: string | null; // User.displayName, for the header only; contacts live in UserContact
    orgId: string | null; // active organization, null before one is chosen
    role: string | null; // role inside the active org
    mustChangePassword: boolean;
    sliding?: boolean; // phone session: the proxy re-issues the cookie on use so it never ages out while in use
    iat?: number; // set by verifySessionToken, ignored when creating
}

function getSecretKey() {
    const secret = process.env.SESSION_SECRET;
    if (!secret) throw new Error("SESSION_SECRET is not set");
    return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
    const { iat: _iat, ...claims } = payload;
    void _iat;
    return new SignJWT({ ...claims })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
        .sign(getSecretKey());
}

// Returns null instead of throwing for any invalid, expired or tampered token.
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, getSecretKey());
        if (typeof payload.sub !== "string") return null;
        return {
            sub: payload.sub,
            sid: typeof payload.sid === "string" ? payload.sid : "",
            name: typeof payload.name === "string" ? payload.name : null,
            orgId: typeof payload.orgId === "string" ? payload.orgId : null,
            role: typeof payload.role === "string" ? payload.role : null,
            mustChangePassword: !!payload.mustChangePassword,
            sliding: !!payload.sliding,
            iat: payload.iat,
        };
    } catch {
        return null;
    }
}

export const ADMIN_ROLES = new Set(["owner", "admin", "treasurer"]);
