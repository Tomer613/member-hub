"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { notifyJoinRequest } from "@/lib/notify-server";

// Opening the org's join link sends a request; an admin approves it (joining is always two-sided).
export async function requestJoinByLink(token: string, form: FormData) {
    const s = await getSession();
    if (!s) redirect(`/login?next=${encodeURIComponent(`/join/${token}`)}`);
    const org = await db.organization.findFirst({ where: { joinToken: token, status: "active" } });
    if (!org) redirect(`/join/${encodeURIComponent(token)}`);
    const member = await db.orgUser.findUnique({ where: { orgId_userId: { orgId: org.id, userId: s.userId } } });
    const open = await db.joinRequest.findFirst({ where: { orgId: org.id, userId: s.userId, status: "pending" } });
    // After a decline the person is not offered to ask again from the same link.
    const last = await db.joinRequest.findFirst({ where: { orgId: org.id, userId: s.userId }, orderBy: { createdAt: "desc" } });
    if (!member && !open && last?.status !== "rejected") {
        // "כמה מילים עליכם": optional, up to 300 characters, seen by the admins (ux-spec 14.9).
        const note = String(form.get("message") ?? "").trim().slice(0, 300) || null;
        const req = await db.joinRequest.create({ data: { orgId: org.id, userId: s.userId, message: note } });
        await notifyJoinRequest(org.id, req.id, s.userId);
    }
    redirect(`/join/${encodeURIComponent(token)}`);
}
