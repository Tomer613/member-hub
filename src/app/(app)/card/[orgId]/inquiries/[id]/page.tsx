import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session-server";
import { orgLook } from "@/lib/billing/pay-server";
import { memberStatus, STATUS_TINT } from "@/lib/inquiries";
import { inquiryMember, loadInquiry, markInquiryRead } from "@/lib/inquiries-server";
import { bigBtn, MemberHeader } from "@/components/card/member-header";
import { Thread } from "@/components/inquiries/thread";
import { MemberReply } from "../forms";

export const metadata: Metadata = { title: "הפנייה שלי · PIRI" };

// One inquiry, the member's side (boards D-InquiryView, D-InquiryClosed).
export default async function MyInquiryPage({ params }: { params: Promise<{ orgId: string; id: string }> }) {
    const { orgId, id } = await params;
    const session = await getSession();
    if (!session) redirect(`/login?next=/card/${orgId}/inquiries/${id}`);
    const m = await inquiryMember(orgId);
    if (!m) notFound();
    const r = await loadInquiry(orgId, id, { userId: m.userId, staff: false });
    if (!r) notFound();
    await markInquiryRead(orgId, m.userId, id);
    const look = orgLook(m.link.org, m.link.cardColor);
    const closed = r.status === "closed";
    return (
        <main className="min-h-dvh bg-[var(--mh-bg)]">
            <MemberHeader back={`/card/${orgId}/inquiries`} backLabel="חזרה לפניות שלי" title="הפנייה שלי" org={look} />
            <div className="mx-auto flex max-w-[760px] flex-col gap-[14px] px-4 py-5 min-[1800px]:[zoom:1.3]">
                <section className="flex flex-col gap-3 rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-white p-5 shadow-[0_4px_0_var(--mh-ink)]" aria-labelledby="inq-h">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 id="inq-h" className="m-0 font-display text-[22px] font-normal">{r.kindText}</h2>
                        {r.number && <bdi className="font-bold text-[var(--mh-ink-soft)]">#{r.number}</bdi>}
                        <span className="rounded-full border-2 border-[var(--mh-ink)] px-2 text-[13px] font-extrabold" style={{ background: STATUS_TINT[r.status === "replied" ? "new" : r.status] }}>{memberStatus(r.status)}</span>
                    </div>
                    {r.post && <span className="font-bold text-[var(--mh-ink-soft)]">בהמשך להודעה: {r.post}</span>}
                    {r.follows && <Link href={`/card/${orgId}/inquiries/${r.follows.id}`} className="self-start font-bold underline">בהמשך לפנייה #{r.follows.number}</Link>}
                    {r.lines.length > 0 && (
                        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-[14px] bg-[var(--mh-ticket)] p-3">
                            {r.lines.map((l) => <div key={l.label} className="contents"><dt className="font-bold text-[var(--mh-ink-soft)]">{l.label}</dt><dd className="m-0 font-extrabold"><bdi>{l.value}</bdi></dd></div>)}
                        </dl>
                    )}
                    <Thread items={r.thread} mine="member" />
                </section>
                {closed ? (
                    <section className="flex flex-col items-start gap-3 rounded-[20px] border-2 border-dashed border-[var(--mh-ink)] p-4">
                        <p className="m-0 font-bold">הפנייה נסגרה ואי אפשר להגיב בה. אפשר לפתוח פנייה חדשה ולציין בה את מספר הפנייה.</p>
                        <Link href={`/card/${orgId}/inquiries/new?follows=${r.id}`} className={bigBtn}><span>פנייה חדשה בהמשך ל-<bdi>#{r.number}</bdi></span></Link>
                    </section>
                ) : (
                    <MemberReply orgId={orgId} id={r.id} />
                )}
            </div>
        </main>
    );
}
