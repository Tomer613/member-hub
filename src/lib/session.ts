import { SignJWT, jwtVerify } from "jose";

// Edge-runtime-safe session primitives (jose only), ported from d3teman. Must not import
// bcryptjs, next/headers, or Prisma, because the edge proxy imports this file.
//
// Differences from d3teman: the login (User) is global and may belong to several orgs, so the
// token carries the *active* org and the role inside it. Both are re-checked against the database
// on sensitive requests; the token is a hint for routing, never the final authority.

export const SESSION_COOKIE_NAME = "memberhub_session";

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days

export const SESSION_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
};

export interface SessionPayload {
    sub: string; // User.id
    name: string | null; // User.displayName, for the header only; contacts live in UserContact
    orgId: string | null; // active organization, null before one is chosen
    role: string | null; // role inside the active org
    mustChangePassword: boolean;
}

function getSecretKey() {
    const secret = process.env.SESSION_SECRET;
    if (!secret) throw new Error("SESSION_SECRET is not set");
    return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
    return new SignJWT({ ...payload })
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
            name: typeof payload.name === "string" ? payload.name : null,
            orgId: typeof payload.orgId === "string" ? payload.orgId : null,
            role: typeof payload.role === "string" ? payload.role : null,
            mustChangePassword: !!payload.mustChangePassword,
        };
    } catch {
        return null;
    }
}

export const ADMIN_ROLES = new Set(["owner", "admin", "treasurer"]);
