"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { endSession, getSession } from "@/lib/auth/session-server";
import { MAX_ATTEMPTS_PER_CODE, codeMatches } from "@/lib/auth/code";
import { normalizeContact, type ContactKind } from "@/lib/auth/contact";
import { joinOrRequest } from "@/lib/join-server";
import { readJoinOpen, readPublicText, shortLine } from "@/lib/org-settings";

async function requireUser() {
    const s = await getSession();
    if (!s) redirect("/login");
    return s;
}

export type OrgHit = { id: string; name: string; city: string | null; packId: string; line: string | null; open: boolean };

// Only orgs that chose to be found (visibility "listed", decided 13.10.2026: hidden by default).
export async function searchOrgs(q: string, packId?: string): Promise<OrgHit[]> {
    await requireUser();
    const text = q.trim();
    if (text.length < 2 && !packId) return [];
    const found = await db.organization.findMany({
        where: {
            visibility: "listed",
            status: "active",
            ...(packId ? { packId } : {}),
            ...(text.length >= 2
                ? { OR: text.split(/\s+/).map((w) => ({ OR: [{ name: { contains: w, mode: "insensitive" as const } }, { city: { contains: w, mode: "insensitive" as const } }] })) }
                : {}),
        },
        select: { id: true, name: true, city: true, packId: true, settings: true },
        take: 20,
        orderBy: { name: "asc" },
    });
    // The invitation sentence from "הגדרות הארגון", cut short as on the board.
    return found.map(({ settings, ...o }) => ({ ...o, line: readPublicText(settings).tagline ? shortLine(readPublicText(settings).tagline) : null, open: readJoinOpen(settings) }));
}

// Joining from search: a request an admin approves, or a membership at once when the owner opened joining.
export async function requestJoin(orgId: string): Promise<{ ok: boolean; orgName?: string; joined?: boolean }> {
    const { userId } = await requireUser();
    const org = await db.organization.findFirst({ where: { id: orgId, visibility: "listed", status: "active" } });
    if (!org) return { ok: false };
    const member = await db.orgUser.findUnique({ where: { orgId_userId: { orgId, userId } } });
    const open = await db.joinRequest.findFirst({ where: { orgId, userId, status: "pending" } });
    const how = !member && !open ? await joinOrRequest(org, userId, "search", null) : null;
    if (how === "joined") revalidatePath("/wallet");
    return { ok: true, orgName: org.name, joined: how === "joined" };
}

export async function logout() {
    await endSession();
    redirect("/");
}

export async function revokeSession(id: string) {
    const { userId, sessionId } = await requireUser();
    await db.authSession.updateMany({ where: { id, userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await db.securityEvent.create({ data: { userId, kind: "session_revoked" } });
    if (id === sessionId) await logout();
    revalidatePath("/settings/devices");
}

export async function revokeOtherSessions() {
    const { userId, sessionId } = await requireUser();
    await db.authSession.updateMany({ where: { userId, revokedAt: null, NOT: { id: sessionId } }, data: { revokedAt: new Date() } });
    await db.securityEvent.create({ data: { userId, kind: "session_revoked" } });
    revalidatePath("/settings/devices");
}

// Adds a backup contact after its code is verified (the code itself is sent by requestCode in the login actions).
export async function addContact(kind: ContactKind, raw: string, code: string): Promise<{ ok: boolean; error?: "wrong" | "taken" }> {
    const { userId } = await requireUser();
    const value = normalizeContact(kind, raw);
    if (!value) return { ok: false, error: "wrong" };
    const ch = await db.contactChallenge.findFirst({ where: { kind, value, consumedAt: null }, orderBy: { createdAt: "desc" } });
    const secret = process.env.SESSION_SECRET ?? "";
    if (!ch || ch.expiresAt <= new Date() || ch.attempts >= MAX_ATTEMPTS_PER_CODE || !codeMatches(code, value, ch.codeHash, secret)) {
        if (ch) await db.contactChallenge.update({ where: { id: ch.id }, data: { attempts: { increment: 1 } } });
        return { ok: false, error: "wrong" };
    }
    await db.contactChallenge.update({ where: { id: ch.id }, data: { consumedAt: new Date(), userId } });
    const taken = await db.userContact.findUnique({ where: { kind_value: { kind, value } } });
    if (taken && taken.userId !== userId) return { ok: false, error: "taken" };
    if (!taken) await db.userContact.create({ data: { userId, kind, value } });
    revalidatePath("/settings");
    return { ok: true };
}
