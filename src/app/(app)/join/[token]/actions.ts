"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";

// Opening the org's join link sends a request; an admin approves it (joining is always two-sided).
export async function requestJoinByLink(token: string) {
    const s = await getSession();
    if (!s) redirect(`/login?next=${encodeURIComponent(`/join/${token}`)}`);
    const org = await db.organization.findFirst({ where: { joinToken: token, status: "active" } });
    if (!org) redirect(`/join/${encodeURIComponent(token)}`);
    const member = await db.orgUser.findUnique({ where: { orgId_userId: { orgId: org.id, userId: s.userId } } });
    const open = await db.joinRequest.findFirst({ where: { orgId: org.id, userId: s.userId, status: "pending" } });
    if (!member && !open) await db.joinRequest.create({ data: { orgId: org.id, userId: s.userId } });
    redirect(`/join/${encodeURIComponent(token)}`);
}
