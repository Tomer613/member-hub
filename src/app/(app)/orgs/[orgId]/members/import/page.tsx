import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { AdminShell } from "@/components/admin/admin-shell";
import { knownContacts, membersAdmin } from "@/lib/members-server";
import { getPack } from "@/packs";
import { ImportWizard } from "./import-wizard";

export const metadata: Metadata = { title: "ייבוא חברים · PIRI" };

// "ייבוא חברים מקובץ" (boards D-AdmImport1-3): file, columns, who is invited, and sending.
export default async function ImportPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    if (!(await getSession())) redirect("/login");
    const a = await membersAdmin(orgId);
    if (!a?.canManage) notFound();
    const [known, plans, labels] = await Promise.all([
        knownContacts(orgId),
        db.plan.findMany({ where: { orgId, isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
        db.membershipLabel.findMany({ where: { orgId, assignment: "manual" }, select: { id: true, name: true, color: true }, orderBy: { name: "asc" } }),
    ]);
    return (
        <AdminShell orgId={orgId} org={a.org} me={{ ...a.me, role: a.role }} active="members">
            <nav aria-label="מיקום" className="text-[14px] font-bold">
                <Link href={`/orgs/${orgId}/members`} className="underline">חברים</Link> <span aria-hidden="true">‹</span> <Link href={`/orgs/${orgId}/members/add`} className="underline">הוספת חברים</Link> <span aria-hidden="true">‹</span> ייבוא מקובץ
            </nav>
            <ImportWizard
                orgId={orgId}
                orgName={a.org.name}
                sender={a.me.firstName?.trim() || a.org.name}
                color={a.org.brandColor ?? "#5B3DF5"}
                homeWord={getPack(a.org.packId).terms.household}
                members={{ phones: [...known.members.phones, ...known.listed.phones], emails: [...known.members.emails, ...known.listed.emails] }}
                pending={known.pending}
                plans={plans}
                labels={labels}
            />
        </AdminShell>
    );
}
