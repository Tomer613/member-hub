import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session-server";
import { orgLook } from "@/lib/billing/pay-server";
import { goingText, minyanText, seatsText } from "@/lib/activities";
import { activityMember, memberActivities } from "@/lib/activities-server";
import { formatShekels } from "@/lib/money";
import { MemberHeader } from "@/components/card/member-header";
import { SignupButton } from "./signup-button";

export const metadata: Metadata = { title: "פעילויות · PIRI" };

// "פעילויות" in the member's card: what the org opened, soonest first, and signing up. There is no member
// board for this screen, so it follows the card's other screens (messages, inquiries).
export default async function MemberActivitiesPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    if (!(await getSession())) redirect(`/login?next=/card/${orgId}/activities`);
    const m = await activityMember(orgId);
    if (!m) notFound();
    const look = orgLook(m.link.org, m.link.cardColor);
    const list = await memberActivities(orgId, m.link.org.packId, m.userId);
    return (
        <main className="min-h-dvh bg-[var(--mh-bg)]">
            <MemberHeader back={`/card/${orgId}`} backLabel="חזרה לכרטיס" title="פעילויות" org={look} max="max-w-[1100px]" />
            <div className="mx-auto flex max-w-[1100px] flex-col gap-[14px] px-4 py-5 min-[1800px]:[zoom:1.3]">
                {list.length ? (
                    <ul className="m-0 grid list-none grid-cols-[minmax(0,1fr)] gap-[14px] p-0 md:grid-cols-2">
                        {list.map((e) => {
                            const room = seatsText(e.seats, e.going);
                            const off = e.status === "cancelled";
                            return (
                                <li key={e.id} className={`flex flex-col gap-3 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_3px_0_var(--mh-ink)] md:p-5 ${off ? "opacity-75" : ""}`}>
                                    <span className="flex items-start gap-3">
                                        <span className="flex w-[64px] shrink-0 flex-col items-center rounded-[14px] border-2 border-[var(--mh-ink)] py-1 text-center" style={{ background: look.color, color: look.fg }}>
                                            <b className="text-[15px] leading-tight">{e.when.split(" ")[0]}</b>
                                            <bdi className="text-[14px] font-bold">{e.when.split(" ")[1]}</bdi>
                                        </span>
                                        <span className="flex min-w-0 flex-1 flex-col gap-1">
                                            <b className="text-[19px] leading-tight">{e.title}</b>
                                            <span className="text-[14px] font-bold text-[var(--mh-ink-soft)]">{[e.typeText, e.location].filter(Boolean).join(" · ")}</span>
                                        </span>
                                        {off && <span className="shrink-0 rounded-full border-2 border-[var(--mh-ink)] bg-[#FFD9DE] px-2 text-[12px] font-extrabold">בוטל</span>}
                                    </span>
                                    {e.description && <p className="m-0 whitespace-pre-line font-semibold">{e.description}</p>}
                                    {!off && (
                                        <span className="flex flex-wrap gap-2 text-[14px] font-extrabold">
                                            {e.priceMinor ? <span className="rounded-full bg-[#FFF1D6] px-3 py-1"><bdi>{formatShekels(e.priceMinor)}</bdi> לנרשם</span> : null}
                                            {e.signup && <span className="rounded-full bg-[var(--mh-ticket)] px-3 py-1">{goingText(e.going)}</span>}
                                            {room.text && <span className={`rounded-full px-3 py-1 ${room.full ? "bg-[#FFD9DE]" : "bg-[var(--mh-ticket)]"}`}>{room.text}</span>}
                                            {e.fields.minyan && e.signup && <span className="rounded-full bg-[#FFF1D6] px-3 py-1">{minyanText(e.going)}</span>}
                                        </span>
                                    )}
                                    <div className="mt-auto">
                                        {off ? <p className="m-0 font-bold">ההנהלה ביטלה את הפעילות.</p>
                                            : e.signup ? <SignupButton orgId={orgId} eventId={e.id} mine={e.mine} full={room.full} paid={!!e.priceMinor} />
                                            : <p className="m-0 font-bold text-[var(--mh-ink-soft)]">לא צריך להירשם. פשוט מגיעים.</p>}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <section className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-3 rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-white px-5 py-8 text-center shadow-[0_4px_0_var(--mh-ink)]">
                        <h2 className="m-0 font-display text-[24px] font-normal">אין כרגע פעילויות קרובות</h2>
                        <p className="m-0 max-w-[420px] font-semibold text-[var(--mh-ink-soft)]">כשההנהלה תפתח שיעור, ארוחה או טיול, הם יופיעו כאן ותוכלו להירשם.</p>
                    </section>
                )}
            </div>
        </main>
    );
}
