"use server";

import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";

// The admin's half of a join request (joining is always two-sided). Approving creates the person's
// record in the org (Member) and their membership (OrgUser), so the card appears in their wallet.

async function requireAdmin(orgId: string) {
    const s = await getSession();
    if (!s) redirect("/login");
    const link = await db.orgUser.findFirst({ where: { orgId, userId: s.userId, role: { in: ["owner", "admin"] }, status: "active", org: { status: "active" } } });
    if (!link) notFound();
    return s.userId;
}

async function approveOne(orgId: string, requestId: string, adminId: string) {
    const req = await db.joinRequest.findFirst({ where: { id: requestId, orgId, status: "pending" }, include: { user: { include: { contacts: true } } } });
    if (!req) return;
    const { user } = req;
    const phone = user.contacts.find((c) => c.kind === "phone")?.value ?? null;
    const email = user.contacts.find((c) => c.kind === "email")?.value ?? null;
    await db.$transaction(async (tx) => {
        const existing = await tx.orgUser.findUnique({ where: { orgId_userId: { orgId, userId: user.id } } });
        if (existing) {
            await tx.orgUser.update({ where: { id: existing.id }, data: { status: "active", leftAt: null } });
        } else {
            const member = await tx.member.create({ data: { orgId, firstName: user.firstName ?? "", lastName: user.lastName ?? "", phone, email } });
            await tx.orgUser.create({ data: { orgId, userId: user.id, role: "member", memberId: member.id } });
        }
        await tx.joinRequest.update({ where: { id: req.id }, data: { status: "approved", decidedById: adminId, decidedAt: new Date() } });
    });
}

export async function approveRequest(orgId: string, requestId: string): Promise<void> {
    const adminId = await requireAdmin(orgId);
    await approveOne(orgId, requestId, adminId);
    revalidatePath(`/orgs/${orgId}/requests`);
}

export async function approveAll(orgId: string): Promise<void> {
    const adminId = await requireAdmin(orgId);
    const pending = await db.joinRequest.findMany({ where: { orgId, status: "pending" }, select: { id: true }, take: 500 });
    for (const r of pending) await approveOne(orgId, r.id, adminId);
    revalidatePath(`/orgs/${orgId}/requests`);
}

// The person sees only that the request was not approved, never the reason (it stays with the admins).
export async function declineRequest(orgId: string, requestId: string, reason: string): Promise<void> {
    const adminId = await requireAdmin(orgId);
    const note = reason.trim().slice(0, 300) || null;
    await db.joinRequest.updateMany({
        where: { id: requestId, orgId, status: "pending" },
        data: { status: "rejected", decidedById: adminId, decidedAt: new Date(), adminNotes: note },
    });
    revalidatePath(`/orgs/${orgId}/requests`);
}
