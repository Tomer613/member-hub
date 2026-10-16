"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { ensureMember, listedMember } from "@/lib/billing/member-money";

// The plan and labels the admin chose when inviting take effect once the person accepts (boards D-MAdmInvite,
// D-AdmImport3). A plan is added only when the member has no current subscription.
async function applyInvitationChoices(inv: { orgId: string; planId: string | null; labelIds: string[]; invitedById: string }, linkId: string) {
    if (!inv.planId && !inv.labelIds.length) return;
    const m = await ensureMember(linkId);
    const plan = inv.planId ? await db.plan.findFirst({ where: { id: inv.planId, orgId: inv.orgId, isActive: true } }) : null;
    if (plan && !(await db.subscription.findFirst({ where: { orgId: inv.orgId, memberId: m.id, status: { in: ["active", "frozen"] } } }))) {
        const day = new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date())}T00:00:00Z`);
        await db.subscription.create({ data: { orgId: inv.orgId, planId: plan.id, memberId: m.id, startsOn: day } });
    }
    const labels = inv.labelIds.length ? await db.membershipLabel.findMany({ where: { id: { in: inv.labelIds }, orgId: inv.orgId, assignment: "manual" }, select: { id: true } }) : [];
    for (const l of labels) {
        await db.memberLabel.upsert({ where: { labelId_memberId: { labelId: l.id, memberId: m.id } }, create: { orgId: inv.orgId, labelId: l.id, memberId: m.id, assignedById: inv.invitedById }, update: {} });
    }
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
