import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { orgLook } from "@/lib/billing/pay-server";
import { inquiryKinds, kindLabel } from "@/lib/inquiries";
import { inquiryMember } from "@/lib/inquiries-server";
import { MemberHeader } from "@/components/card/member-header";
import { getPack } from "@/packs";
import { NewInquiryForm } from "../forms";

export const metadata: Metadata = { title: "פנייה חדשה · PIRI" };

// "פנייה חדשה" (board D-InquiryNew). ?post= comes from "להשיב בפנייה" on a message, ?follows= from a closed
// inquiry ("פנייה חדשה בהמשך ל-#1031").
export default async function NewInquiryPage({ params, searchParams }: { params: Promise<{ orgId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const { orgId } = await params;
    const sp = await searchParams;
    if (!(await getSession())) redirect(`/login?next=/card/${orgId}/inquiries/new`);
    const m = await inquiryMember(orgId);
    if (!m) notFound();
    const look = orgLook(m.link.org, m.link.cardColor);
    const pack = getPack(m.link.org.packId).requestKinds;
    const [earlier, post] = await Promise.all([
        db.request.findMany({ where: { orgId, userId: m.userId }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, number: true, kind: true } }),
        typeof sp.post === "string" ? db.postRecipient.findFirst({ where: { postId: sp.post, userId: m.userId, post: { orgId } }, select: { post: { select: { id: true, title: true } } } }) : null,
    ]);
    const follows = typeof sp.follows === "string" && earlier.some((e) => e.id === sp.follows) ? sp.follows : null;
    const kinds = inquiryKinds(pack).map((k) => ({ kind: k.kind, label: k.label, fields: (pack.find((p) => p.kind === k.kind)?.fields ?? []).map((f) => ({ ...f })) }));
    return (
        <main className="min-h-dvh bg-[var(--mh-bg)]">
            <MemberHeader back={`/card/${orgId}/inquiries`} backLabel="חזרה לפניות שלי" title="פנייה חדשה" org={look} />
            <div className="mx-auto flex max-w-[760px] flex-col gap-[14px] px-4 py-5 min-[1800px]:[zoom:1.3]">
                <NewInquiryForm orgId={orgId} kinds={kinds} post={post?.post ?? null} follows={follows}
                    earlier={earlier.map((e) => ({ id: e.id, label: `${e.number ? `#${e.number} · ` : ""}${kindLabel(e.kind, pack)}` }))} />
            </div>
        </main>
    );
}
