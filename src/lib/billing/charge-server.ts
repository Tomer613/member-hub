import { db } from "@/lib/db";
import type { Recipient } from "@/lib/billing/charge-plan";

// Everyone a charge can go to (active members, not guests), with the plans and labels they hold today:
// a plan through their own or their household's active subscription, a label by hand or through its plan.
export async function loadRecipients(orgId: string): Promise<Recipient[]> {
    const [links, subs, manual, autoLabels] = await Promise.all([
        db.orgUser.findMany({
            where: { orgId, status: "active", role: { not: "guest" } },
            select: { id: true, memberId: true, user: { select: { firstName: true, lastName: true } }, member: { select: { householdLinks: { select: { householdId: true } } } } },
            orderBy: { createdAt: "asc" },
        }),
        db.subscription.findMany({ where: { orgId, status: "active" }, select: { planId: true, memberId: true, householdId: true } }),
        db.memberLabel.findMany({ where: { orgId, label: { assignment: "manual" } }, select: { labelId: true, memberId: true } }),
        db.membershipLabel.findMany({ where: { orgId, assignment: "auto_plan", planId: { not: null } }, select: { id: true, planId: true } }),
    ]);
    return links
        .map((l) => {
            const homes = l.member?.householdLinks.map((h) => h.householdId) ?? [];
            const planIds = [...new Set(subs.filter((s) => (l.memberId && s.memberId === l.memberId) || (s.householdId && homes.includes(s.householdId))).map((s) => s.planId))];
            const labelIds = [...new Set([...manual.filter((m) => m.memberId === l.memberId).map((m) => m.labelId), ...autoLabels.filter((a) => planIds.includes(a.planId!)).map((a) => a.id)])];
            return { linkId: l.id, name: `${l.user.firstName ?? ""} ${l.user.lastName ?? ""}`.trim() || "חבר/ה", planIds, labelIds };
        })
        .sort((a, b) => a.name.localeCompare(b.name, "he"));
}
