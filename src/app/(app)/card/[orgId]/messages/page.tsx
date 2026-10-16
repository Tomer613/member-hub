import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { orgLook } from "@/lib/billing/pay-server";
import { markMessagesRead, memberMessages } from "@/lib/messages-server";
import { PostCard } from "@/components/channel/post-card";
import { OrgDot } from "@/components/pay/parts";
import { reactOnMessage } from "../actions";

export const metadata: Metadata = { title: "הודעות מהארגון · PIRI" };

// A member's messages from one org (board D-Channel): newest first, icon reactions only, no chat. Opening the
// screen counts as reading them, for the admins' "מי קרא".
export default async function MemberMessagesPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    const session = await getSession();
    if (!session) redirect(`/login?next=/card/${orgId}/messages`);
    const link = await db.orgUser.findUnique({ where: { orgId_userId: { orgId, userId: session.userId } }, include: { org: true } });
    if (!link || link.org.packId === "celebration" || !["active", "left_with_debt"].includes(link.status)) notFound();
    const look = orgLook(link.org, link.cardColor);
    const posts = await memberMessages(orgId, session.userId);
    await markMessagesRead(orgId, session.userId);
    return (
        <main className="min-h-dvh bg-[var(--mh-bg)]">
            <header className="sticky top-0 z-20 border-b-[2.5px] border-[var(--mh-ink)]" style={{ background: look.color, color: look.fg }}>
                <div className="mx-auto flex max-w-[760px] items-center gap-3 px-4 py-3">
                    <Link href={`/card/${orgId}`} aria-label="חזרה לכרטיס" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-[var(--mh-ink)] bg-white text-[var(--mh-ink)] transition-transform hover:scale-105">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
                    </Link>
                    <span className="flex min-w-0 flex-1 flex-col">
                        <h1 className="m-0 font-display text-[24px] leading-tight">הודעות</h1>
                        <span className="truncate text-[14px] font-bold">{link.org.name}</span>
                    </span>
                    <OrgDot org={look} size={40} />
                </div>
            </header>
            <div className="mx-auto flex max-w-[760px] flex-col gap-[14px] px-4 py-5">
                {!posts.length && <p className="m-0 rounded-[20px] border-2 border-[var(--mh-ink)] bg-white p-5 text-[17px] font-bold">עוד אין הודעות מ{link.org.name}. כשההנהלה תכתוב, ההודעות יופיעו כאן.</p>}
                {posts.map((p) => <PostCard key={p.post.id} post={p.post} counts={p.counts} mine={p.mine} react={reactOnMessage.bind(null, orgId)} />)}
                <p className="m-0 rounded-[16px] border-2 border-dashed border-[var(--mh-ink)] p-4 text-center font-bold">בערוץ הזה ההנהלה כותבת. אפשר להגיב באייקון.</p>
            </div>
        </main>
    );
}
