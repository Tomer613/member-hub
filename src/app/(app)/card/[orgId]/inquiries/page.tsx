import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session-server";
import { orgLook } from "@/lib/billing/pay-server";
import { memberStatus, STATUS_TINT } from "@/lib/inquiries";
import { inquiryMember, memberInquiries } from "@/lib/inquiries-server";
import { bigBtn, MemberHeader } from "@/components/card/member-header";

export const metadata: Metadata = { title: "הפניות שלי · PIRI" };

// "הפניות שלי" in one org (boards D-InquiryList, D-InquiryEmpty).
export default async function MyInquiriesPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    if (!(await getSession())) redirect(`/login?next=/card/${orgId}/inquiries`);
    const m = await inquiryMember(orgId);
    if (!m) notFound();
    const look = orgLook(m.link.org, m.link.cardColor);
    const list = await memberInquiries(orgId, m.userId);
    return (
        <main className="min-h-dvh bg-[var(--mh-bg)]">
            <MemberHeader back={`/card/${orgId}`} backLabel="חזרה לכרטיס" title="הפניות שלי" org={look} />
            <div className="mx-auto flex max-w-[760px] flex-col gap-[14px] px-4 py-5 min-[1800px]:[zoom:1.3]">
                {list.length ? (
                    <>
                        <ul className="m-0 flex list-none flex-col gap-3 p-0">
                            {list.map((r) => (
                                <li key={r.id}>
                                    <Link href={`/card/${orgId}/inquiries/${r.id}`} className="group flex items-center gap-3 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_3px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-[2px]">
                                        <span className="flex min-w-0 flex-1 flex-col gap-1">
                                            <span className="flex flex-wrap items-center gap-2">
                                                <b className="text-[17px]">{r.kindText}</b>
                                                {r.number && <bdi className="text-[13px] font-bold text-[var(--mh-ink-soft)]">#{r.number}</bdi>}
                                                <span className="rounded-full border-2 border-[var(--mh-ink)] px-2 text-[12px] font-extrabold" style={{ background: STATUS_TINT[r.status === "replied" || r.status === "new" ? "new" : r.status] }}>{memberStatus(r.status)}</span>
                                            </span>
                                            <span className="truncate font-semibold text-[var(--mh-ink-soft)]">{r.line}</span>
                                        </span>
                                        <span className="shrink-0 text-[13px] font-bold text-[var(--mh-ink-soft)]">{r.ago}</span>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 transition-transform duration-200 group-hover:-translate-x-[3px]"><path d="M15 6l-6 6 6 6" /></svg>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <p className="m-0 text-center text-[14px] font-bold text-[var(--mh-ink-soft)]">רק אתם וההנהלה רואים את הפניות שלכם.</p>
                    </>
                ) : (
                    <section className="flex flex-col items-center gap-3 rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-white px-5 py-8 text-center shadow-[0_4px_0_var(--mh-ink)]">
                        <h2 className="m-0 font-display text-[24px] font-normal">עוד אין פניות</h2>
                        <p className="m-0 max-w-[420px] font-semibold text-[var(--mh-ink-soft)]">יש שאלה או בקשה להנהלה? אפשר לכתוב כאן, והתשובה תגיע לאותו מקום.</p>
                    </section>
                )}
                <Link href={`/card/${orgId}/inquiries/new`} className={`${bigBtn} self-center`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                    <span>פנייה חדשה</span>
                </Link>
            </div>
        </main>
    );
}
