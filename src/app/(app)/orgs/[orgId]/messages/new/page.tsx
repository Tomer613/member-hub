import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { AdminShell } from "@/components/admin/admin-shell";
import { orgLook } from "@/lib/billing/pay-server";
import { EMPTY_MESSAGE, readMessageInput } from "@/lib/messages-admin";
import { loadMsgRecipients } from "@/lib/messages-server";
import { membersAdmin } from "@/lib/members-server";
import { ComposeForm } from "./compose-form";

export const metadata: Metadata = { title: "הודעה לחברים · PIRI" };

// "הודעה לחברים" (boards D-AdmMessage and D-AdmCompose, merged into one screen). Opened from "הודעות", from a
// draft (?draft=), or from a member file (?for=<membership>), where it starts as a personal message.
export default async function NewMessagePage({ params, searchParams }: {
    params: Promise<{ orgId: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { orgId } = await params;
    const sp = await searchParams;
    if (!(await getSession())) redirect("/login");
    const a = await membersAdmin(orgId);
    if (!a) notFound();
    const [recipients, plans, labels, draft] = await Promise.all([
        loadMsgRecipients(orgId),
        db.plan.findMany({ where: { orgId, isActive: true }, select: { id: true, name: true }, orderBy: { amountMinor: "asc" } }),
        db.membershipLabel.findMany({ where: { orgId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
        typeof sp.draft === "string" ? db.channelPost.findFirst({ where: { id: sp.draft, orgId, status: "draft" } }) : null,
    ]);
    const forLink = typeof sp.for === "string" && recipients.some((r) => r.linkId === sp.for) ? sp.for : null;
    const start = draft
        ? readMessageInput({ title: draft.title, body: draft.body, audience: draft.audience, email: draft.channels.includes("email"), reactable: draft.reactable, dislike: draft.dislike })
        : forLink ? { ...EMPTY_MESSAGE, audience: { to: "picked" as const, linkIds: [forLink] } } : EMPTY_MESSAGE;
    return (
        <AdminShell orgId={orgId} org={a.org} me={{ ...a.me, role: a.role }} active="messages">
            <nav aria-label="מיקום" className="text-[14px] font-bold"><Link href={`/orgs/${orgId}/messages`} className="underline">הודעות</Link> <span aria-hidden="true">‹</span> הודעה לחברים</nav>
            <ComposeForm
                orgId={orgId}
                org={orgLook(a.org)}
                start={start}
                draftId={draft?.id ?? null}
                recipients={recipients.map((r) => ({ linkId: r.linkId, name: r.name, planIds: r.planIds, labelIds: r.labelIds, owes: r.owes }))}
                plans={plans}
                labels={labels}
            />
        </AdminShell>
    );
}
