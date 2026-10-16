import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { AdminShell } from "@/components/admin/admin-shell";
import { EMPTY_CHARGE, readChargeInput } from "@/lib/billing/charge-plan";
import { loadRecipients } from "@/lib/billing/charge-server";
import { orgLook } from "@/lib/billing/pay-server";
import { membersAdmin } from "@/lib/members-server";
import { ChargeForm } from "./charge-form";

export const metadata: Metadata = { title: "חיוב חדש · PIRI" };

// "חיוב חדש" (board D-AdmCharge). Opened from the money page, from a draft (?draft=), or from a member file
// (?for=<membership>), where it starts addressed to that member alone.
export default async function NewChargePage({ params, searchParams }: {
    params: Promise<{ orgId: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { orgId } = await params;
    const sp = await searchParams;
    if (!(await getSession())) redirect("/login");
    const a = await membersAdmin(orgId);
    if (!a) notFound();
    const [recipients, plans, labels, draft] = await Promise.all([
        loadRecipients(orgId),
        db.plan.findMany({ where: { orgId, isActive: true }, select: { id: true, name: true }, orderBy: { amountMinor: "asc" } }),
        db.membershipLabel.findMany({ where: { orgId }, select: { id: true, name: true, color: true }, orderBy: { name: "asc" } }),
        typeof sp.draft === "string" ? db.chargeDraft.findFirst({ where: { id: sp.draft, orgId } }) : null,
    ]);
    const forLink = typeof sp.for === "string" && recipients.some((r) => r.linkId === sp.for) ? sp.for : null;
    const start = draft ? readChargeInput(draft.data) : forLink ? { ...EMPTY_CHARGE, audience: { to: "picked" as const, linkIds: [forLink] } } : EMPTY_CHARGE;
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
    return (
        <AdminShell orgId={orgId} org={a.org} me={{ ...a.me, role: a.role }} active="money">
            <nav aria-label="מיקום" className="text-[14px] font-bold"><Link href={`/orgs/${orgId}/money`} className="underline">כספים וחיובים</Link> <span aria-hidden="true">‹</span> חיוב חדש</nav>
            <ChargeForm orgId={orgId} org={orgLook(a.org)} today={today} start={start} draftId={draft?.id ?? null} recipients={recipients} plans={plans} labels={labels} />
        </AdminShell>
    );
}
