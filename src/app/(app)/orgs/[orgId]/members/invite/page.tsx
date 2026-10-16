import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { AdminShell } from "@/components/admin/admin-shell";
import { membersAdmin } from "@/lib/members-server";
import { InviteForm } from "./invite-form";

export const metadata: Metadata = { title: "שליחת הזמנה · PIRI" };

// "שליחת הזמנה" to one person (board D-MAdmInvite; the desktop board for this form is missing, so it follows
// the phone one): name, phone or email, plan, labels, how to send, and a live preview of the message.
export default async function InvitePage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    if (!(await getSession())) redirect("/login");
    const a = await membersAdmin(orgId);
    if (!a?.canManage) notFound();
    const [plans, labels] = await Promise.all([
        db.plan.findMany({ where: { orgId, isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
        db.membershipLabel.findMany({ where: { orgId, assignment: "manual" }, select: { id: true, name: true, color: true }, orderBy: { name: "asc" } }),
    ]);
    return (
        <AdminShell orgId={orgId} org={a.org} me={{ ...a.me, role: a.role }} active="members">
            <nav aria-label="מיקום" className="text-[14px] font-bold">
                <Link href={`/orgs/${orgId}/members`} className="underline">חברים</Link> <span aria-hidden="true">‹</span> <Link href={`/orgs/${orgId}/members/add`} className="underline">הוספת חברים</Link> <span aria-hidden="true">‹</span> שליחת הזמנה
            </nav>
            <header className="flex flex-col gap-1">
                <h1 className="m-0 font-display text-[28px] leading-tight">שליחת הזמנה</h1>
                <p className="m-0 font-bold text-[var(--mh-ink-soft)]">לאדם מסוים</p>
            </header>
            <InviteForm orgId={orgId} orgName={a.org.name} sender={a.me.firstName?.trim() || a.org.name} color={a.org.brandColor ?? "#5B3DF5"} plans={plans} labels={labels} />
        </AdminShell>
    );
}
