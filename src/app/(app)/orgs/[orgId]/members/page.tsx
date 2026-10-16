import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { AdminShell } from "@/components/admin/admin-shell";
import { readMemberFilter } from "@/lib/members-admin";
import { loadMemberRows, memberMetrics, membersAdmin } from "@/lib/members-server";
import { formatShekels } from "@/lib/money";
import { MembersTable } from "./members-table";

export const metadata: Metadata = { title: "חברים · PIRI" };

// The member list (board D-Admin): numbers, filters with counts, search, choosing many with bulk actions,
// the table, and a panel with the member chosen last. The full file is D-AdmMember.
export default async function MembersPage({ params, searchParams }: {
    params: Promise<{ orgId: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { orgId } = await params;
    const sp = await searchParams;
    if (!(await getSession())) redirect("/login");
    const a = await membersAdmin(orgId);
    if (!a) notFound();
    const rows = (await loadMemberRows(orgId, a.org.packId)).sort((x, y) => x.name.localeCompare(y.name, "he"));
    const [metrics, labels] = await Promise.all([
        memberMetrics(orgId, rows),
        db.membershipLabel.findMany({ where: { orgId }, select: { id: true, name: true, color: true, assignment: true }, orderBy: { name: "asc" } }),
    ]);
    const tiles = [
        { k: "חברים פעילים", v: String(metrics.active), bar: a.org.brandColor ?? "#5B3DF5" },
        { k: "נגבה החודש", v: formatShekels(metrics.collectedMinor), bar: "#00B67A" },
        { k: "חובות פתוחים", v: formatShekels(metrics.owedMinor), bar: "#C4223B" },
        { k: "פניות פתוחות", v: String(metrics.inquiries), bar: "#18B8F0" },
        { k: "בקשות הצטרפות", v: String(metrics.joins), bar: "#FFD84A" },
    ];
    return (
        <AdminShell orgId={orgId} org={a.org} me={{ ...a.me, role: a.role }} active="members">
            <MembersTable
                orgId={orgId}
                color={a.org.brandColor ?? "#5B3DF5"}
                rows={rows}
                labels={labels}
                canManage={a.canManage}
                initialFilter={readMemberFilter(sp.f)}
                initialQuery={typeof sp.q === "string" ? sp.q.slice(0, 80) : ""}
                tiles={tiles}
            />
        </AdminShell>
    );
}
