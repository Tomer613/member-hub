import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { AdminShell } from "@/components/admin/admin-shell";
import { holderCounts } from "@/lib/labels-server";
import { membersAdmin } from "@/lib/members-server";
import { LabelsAdmin } from "./labels-admin";

export const metadata: Metadata = { title: "תוויות · PIRI" };

// The org's labels (board D-AdmLabels): the list with the stamp, how many hold it, who sees it and how it is
// given, and the editor beside it.
export default async function LabelsPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    const session = await getSession();
    if (!session) redirect("/login");
    const a = await membersAdmin(orgId);
    // Labels are managed by the owner and admins; the treasurer does not see this item in the menu.
    if (!a || !a.canManage || a.org.status !== "active" || a.org.packId === "celebration") notFound();
    const link = { org: a.org };
    const [labels, counts, plans, links] = await Promise.all([
        db.membershipLabel.findMany({ where: { orgId }, include: { plan: { select: { name: true } }, holders: { include: { member: { select: { firstName: true, lastName: true } } }, orderBy: { since: "asc" } } }, orderBy: { createdAt: "asc" } }),
        holderCounts(orgId),
        db.plan.findMany({ where: { orgId, isActive: true }, select: { id: true, name: true }, orderBy: { createdAt: "asc" } }),
        db.orgUser.findMany({ where: { orgId, status: "active", role: { not: "guest" } }, include: { user: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: "asc" } }),
    ]);
    const full = (f: string | null, l: string | null) => `${f ?? ""} ${l ?? ""}`.trim() || "חבר/ה";
    return (
        <AdminShell orgId={orgId} org={a.org} me={{ ...a.me, role: a.role }} active="labels">
                <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h1 className="m-0 font-display text-[28px] leading-tight">תוויות</h1>
                </header>
                <LabelsAdmin
                    orgId={orgId}
                    orgName={link.org.name}
                    labels={labels.map((l) => ({
                        id: l.id,
                        name: l.name,
                        color: l.color,
                        visibility: l.visibility,
                        assignment: l.assignment,
                        planId: l.planId,
                        plan: l.plan?.name ?? null,
                        count: counts.get(l.id) ?? 0,
                        holders: l.assignment === "manual" ? l.holders.map((h) => ({ memberId: h.memberId, name: full(h.member.firstName, h.member.lastName) })) : [],
                    }))}
                    plans={plans}
                    members={links.map((m) => ({ linkId: m.id, memberId: m.memberId, name: full(m.user.firstName, m.user.lastName) }))}
                />
        </AdminShell>
    );
}
