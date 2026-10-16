import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { holderCounts } from "@/lib/labels-server";
import { LabelsAdmin } from "./labels-admin";

export const metadata: Metadata = { title: "תוויות · PIRI" };

// The org's labels (board D-AdmLabels): the list with the stamp, how many hold it, who sees it and how it is
// given, and the editor beside it.
export default async function LabelsPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    const session = await getSession();
    if (!session) redirect("/login");
    const link = await db.orgUser.findFirst({ where: { orgId, userId: session.userId, role: { in: ["owner", "admin"] }, status: "active" }, include: { org: true } });
    if (!link || link.org.status !== "active" || link.org.packId === "celebration") notFound();
    const [labels, counts, plans, links] = await Promise.all([
        db.membershipLabel.findMany({ where: { orgId }, include: { plan: { select: { name: true } }, holders: { include: { member: { select: { firstName: true, lastName: true } } }, orderBy: { since: "asc" } } }, orderBy: { createdAt: "asc" } }),
        holderCounts(orgId),
        db.plan.findMany({ where: { orgId, isActive: true }, select: { id: true, name: true }, orderBy: { createdAt: "asc" } }),
        db.orgUser.findMany({ where: { orgId, status: "active", role: { not: "guest" } }, include: { user: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: "asc" } }),
    ]);
    const full = (f: string | null, l: string | null) => `${f ?? ""} ${l ?? ""}`.trim() || "חבר/ה";
    return (
        <main className="min-h-dvh bg-[var(--mh-sun)]">
            <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-[clamp(12px,3vw,32px)] py-[clamp(14px,2.5vw,28px)]">
                <header className="flex flex-wrap items-baseline justify-between gap-3">
                    <h1 className="m-0 font-display text-[clamp(26px,2.6vw,34px)]">תוויות</h1>
                    <Link href={`/orgs/${orgId}`} className="min-h-10 content-center font-extrabold underline">לסקירה</Link>
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
            </div>
        </main>
    );
}
