import { db } from "@/lib/db";
import type { HeldLabel } from "@/lib/labels";

// The labels a member holds in an org: given by hand, or automatically through an active subscription to
// the plan a label is tied to. "forMember" leaves out labels only admins see.
export async function heldLabels(orgId: string, memberId: string, forMember: boolean): Promise<HeldLabel[]> {
    const vis = forMember ? { visibility: "all" } : {};
    const [manual, subs] = await Promise.all([
        db.memberLabel.findMany({ where: { orgId, memberId, label: { assignment: "manual", ...vis } }, include: { label: true } }),
        db.subscription.findMany({
            where: { orgId, memberId, status: "active", plan: { labels: { some: { assignment: "auto_plan", ...vis } } } },
            include: { plan: { include: { labels: { where: { assignment: "auto_plan", ...vis } } } } },
        }),
    ]);
    const out = new Map<string, HeldLabel>();
    for (const m of manual) out.set(m.labelId, { id: m.labelId, name: m.label.name, color: m.label.color, since: m.since, how: "manual", plan: null });
    for (const s of subs) for (const l of s.plan.labels) if (!out.has(l.id)) out.set(l.id, { id: l.id, name: l.name, color: l.color, since: s.startsOn, how: "auto_plan", plan: s.plan.name });
    return [...out.values()];
}

// How many members hold each label of the org.
export async function holderCounts(orgId: string): Promise<Map<string, number>> {
    const [manual, auto] = await Promise.all([
        db.memberLabel.groupBy({ by: ["labelId"], where: { orgId, label: { assignment: "manual" } }, _count: true }),
        db.membershipLabel.findMany({ where: { orgId, assignment: "auto_plan", planId: { not: null } }, select: { id: true, planId: true } }),
    ]);
    const counts = new Map(manual.map((m) => [m.labelId, m._count]));
    for (const l of auto) {
        const subs = await db.subscription.findMany({ where: { orgId, planId: l.planId!, status: "active", memberId: { not: null } }, distinct: ["memberId"], select: { memberId: true } });
        counts.set(l.id, subs.length);
    }
    return counts;
}
