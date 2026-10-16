import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { AdminShell } from "@/components/admin/admin-shell";
import { hebrewAgo } from "@/lib/relative-time";
import { localPhone } from "@/lib/members-admin";
import { knownContacts, membersAdmin } from "@/lib/members-server";
import { readRequestTab, type RequestRow } from "@/lib/requests-admin";
import { RequestsBoard } from "./request-list";

export const metadata: Metadata = { title: "בקשות הצטרפות · PIRI" };

// Join requests (boards D-AdmRequests, D-MAdmRequests): who asked, from where, their note, and approve with
// a plan and labels, or decline kindly. Filters work on what the request carries; see requests-admin.ts.
export default async function JoinRequestsPage({ params, searchParams }: {
    params: Promise<{ orgId: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { orgId } = await params;
    const tab = readRequestTab((await searchParams).tab);
    if (!(await getSession())) redirect("/login");
    const a = await membersAdmin(orgId);
    if (!a?.canManage) notFound();

    const [counts, rows, known, plans, labels] = await Promise.all([
        db.joinRequest.groupBy({ by: ["status"], where: { orgId }, _count: true }),
        db.joinRequest.findMany({
            where: { orgId, status: tab },
            include: { user: { include: { contacts: true, orgUsers: { where: { orgId }, select: { id: true } } } } },
            orderBy: tab === "pending" ? { createdAt: "asc" } : { decidedAt: "desc" },
            take: 300,
        }),
        knownContacts(orgId),
        db.plan.findMany({ where: { orgId, isActive: true }, select: { id: true, name: true }, orderBy: { amountMinor: "asc" } }),
        db.membershipLabel.findMany({ where: { orgId, assignment: "manual" }, select: { id: true, name: true, color: true }, orderBy: { name: "asc" } }),
    ]);
    const deciders = await db.user.findMany({ where: { id: { in: [...new Set(rows.flatMap((r) => (r.decidedById ? [r.decidedById] : [])))] } }, select: { id: true, firstName: true } });
    const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
    const now = new Date();
    const listedPhones = new Set(known.listed.phones);
    const listedEmails = new Set(known.listed.emails);
    const list: RequestRow[] = rows.map((r) => {
        const phone = r.user.contacts.find((c) => c.kind === "phone")?.value ?? null;
        const email = r.user.contacts.find((c) => c.kind === "email")?.value ?? null;
        return {
            id: r.id,
            name: [r.user.firstName, r.user.lastName].filter(Boolean).join(" ") || "בלי שם",
            phone: localPhone(phone),
            email,
            note: r.message,
            source: r.source,
            listed: tab === "pending" && ((!!phone && listedPhones.has(phone)) || (!!email && listedEmails.has(email))),
            when: hebrewAgo(tab === "pending" ? r.createdAt : (r.decidedAt ?? r.createdAt), now),
            decidedBy: deciders.find((d) => d.id === r.decidedById)?.firstName ?? null,
            adminNote: r.adminNotes,
            linkId: r.user.orgUsers[0]?.id ?? null,
        };
    });

    return (
        <AdminShell orgId={orgId} org={a.org} me={{ ...a.me, role: a.role }} active="requests">
            <RequestsBoard
                orgId={orgId}
                color={a.org.brandColor ?? "#5B3DF5"}
                tab={tab}
                counts={{ pending: count("pending"), approved: count("approved"), rejected: count("rejected") }}
                rows={list}
                plans={plans}
                labels={labels}
            />
        </AdminShell>
    );
}
