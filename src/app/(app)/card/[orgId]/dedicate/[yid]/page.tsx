import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session-server";
import { orgLook } from "@/lib/billing/pay-server";
import { activityMember } from "@/lib/activities-server";
import { formatShekels } from "@/lib/money";
import { MemberHeader } from "@/components/card/member-header";
import { dedicationFor } from "@/lib/yahrzeit-server";
import { DedicateForm } from "./dedicate-form";

export const metadata: Metadata = { title: "הקדשה · PIRI" };

// "להקדשה" from the yahrzeit reminder (synagogue-tools 19): a gentle invitation, not a demand. The family picks
// one dedication the gabbai offers; it becomes a charge in their card, paid like any other.
export default async function DedicatePage({ params }: { params: Promise<{ orgId: string; yid: string }> }) {
    const { orgId, yid } = await params;
    if (!(await getSession())) redirect(`/login?next=/card/${orgId}/dedicate/${yid}`);
    const m = await activityMember(orgId);
    if (!m) notFound();
    const d = await dedicationFor(orgId, yid, m.link.memberId);
    if (!d) notFound();
    const look = orgLook(m.link.org, m.link.cardColor);
    const when = d.next.inDays === 0 ? "היום" : d.next.inDays === 1 ? "מחר" : `ב-${d.date}`;
    return (
        <main className="min-h-dvh bg-[var(--mh-bg)]">
            <MemberHeader back={`/card/${orgId}`} backLabel="חזרה לכרטיס" title="הקדשה" org={look} />
            <div className="mx-auto flex max-w-[760px] flex-col gap-[14px] px-4 py-5 min-[1800px]:[zoom:1.3]">
                <section className="flex flex-col gap-2 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 text-center shadow-[0_3px_0_var(--mh-ink)] md:p-6">
                    <span aria-hidden="true" className="mx-auto grid size-14 place-items-center rounded-full border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-tint-sun)]">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c1.5 2.5 3 3.6 3 6a3 3 0 0 1-6 0c0-2.4 1.5-3.5 3-6zM9 13h6v9H9zM6 22h12" /></svg>
                    </span>
                    <h1 className="m-0 font-display text-[26px] leading-tight">לעילוי נשמת {d.y.deceasedName}</h1>
                    <p className="m-0 font-bold text-[var(--mh-ink-soft)]">היארצייט חל {when}, {d.hebrew}.</p>
                    <p className="m-0 font-semibold">אם תרצו, אפשר להקדיש משהו בבית הכנסת ביום הזה. זו הזמנה, לא חובה.</p>
                </section>
                {d.given ? (
                    <section className="flex flex-col items-start gap-3 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-[#D7F5E8] p-4 shadow-[0_3px_0_var(--mh-ink)] md:p-5">
                        <b className="text-[18px]">כבר הקדשתם: {d.given.purpose}</b>
                        <span className="font-semibold">תודה. החיוב של <bdi>{formatShekels(d.given.amountMinor)}</bdi> נמצא בכרטיס, ואפשר לשלם אותו מהארנק.</span>
                        <Link href={`/pay/${orgId}`} className="inline-flex min-h-11 items-center rounded-full border-2 border-[var(--mh-ink)] px-[18px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px" style={{ background: look.color, color: look.fg }}>לתשלום</Link>
                    </section>
                ) : <DedicateForm orgId={orgId} yid={yid} items={d.items} color={look.color} ink={look.fg} />}
            </div>
        </main>
    );
}
