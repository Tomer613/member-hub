"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { ensureMember, listedMember } from "@/lib/billing/member-money";
import { applyJoinChoices } from "@/lib/join-choices-server";

// The plan and labels the admin chose when inviting take effect once the person accepts.
async function applyInvitationChoices(inv: { orgId: string; planId: string | null; labelIds: string[]; invitedById: string }, linkId: string) {
    if (!inv.planId && !inv.labelIds.length) return;
    const m = await ensureMember(linkId);
    await applyJoinChoices(inv.orgId, m.id, inv, inv.invitedById);
}

// Accepting is the member's half of the two-sided join. The invitation must be addressed to one of the
// person's verified contacts, so a forwarded link cannot attach someone to another person's record.
export async function answerInvitation(token: string, accept: boolean) {
    const s = await getSession();
    if (!s) redirect(`/login?invite=${encodeURIComponent(token)}`);
    const inv = await db.invitation.findUnique({ where: { linkToken: token } });
    if (!inv || inv.status !== "pending" || inv.expiresAt < new Date()) redirect("/wallet");
    const mine = await db.userContact.findUnique({ where: { kind_value: { kind: inv.kind, value: inv.value } } });
    if (mine?.userId !== s.userId) redirect(`/invite/${encodeURIComponent(token)}`);
    if (accept) {
        const memberTaken = inv.memberId ? await db.orgUser.findUnique({ where: { memberId: inv.memberId } }) : null;
        const prepared = inv.memberId && !memberTaken ? inv.memberId : await listedMember(inv.orgId, inv.kind === "phone" ? inv.value : null, inv.kind === "email" ? inv.value : null);
        const link = await db.orgUser.upsert({
            where: { orgId_userId: { orgId: inv.orgId, userId: s.userId } },
            create: { orgId: inv.orgId, userId: s.userId, role: inv.role, memberId: prepared },
            update: { status: "active", leftAt: null },
        });
        await applyInvitationChoices(inv, link.id);
    }
    await db.invitation.update({
        where: { id: inv.id },
        data: { status: accept ? "accepted" : "declined", respondedAt: new Date(), acceptedByUserId: accept ? s.userId : null },
    });
    redirect("/wallet");
}
