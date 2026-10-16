import { db } from "@/lib/db";

// The plan and labels an admin picks when inviting or approving someone (boards D-MAdmInvite, D-AdmImport3,
// D-AdmRequests). Only an active plan and manual labels of this org count. A plan is added only when the
// member has no current subscription, so an earlier choice is never replaced by accident.
export async function applyJoinChoices(orgId: string, memberId: string, choices: { planId: string | null; labelIds: string[] }, byUserId: string): Promise<void> {
    if (!choices.planId && !choices.labelIds.length) return;
    const plan = choices.planId ? await db.plan.findFirst({ where: { id: choices.planId, orgId, isActive: true }, select: { id: true } }) : null;
    if (plan && !(await db.subscription.findFirst({ where: { orgId, memberId, status: { in: ["active", "frozen"] } } }))) {
        const day = new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date())}T00:00:00Z`);
        await db.subscription.create({ data: { orgId, planId: plan.id, memberId, startsOn: day } });
    }
    const labels = choices.labelIds.length ? await db.membershipLabel.findMany({ where: { id: { in: choices.labelIds }, orgId, assignment: "manual" }, select: { id: true } }) : [];
    for (const l of labels) {
        await db.memberLabel.upsert({ where: { labelId_memberId: { labelId: l.id, memberId } }, create: { orgId, labelId: l.id, memberId, assignedById: byUserId }, update: {} });
    }
}
