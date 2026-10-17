import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session-server";
import { orgLook } from "@/lib/billing/pay-server";
import { DAYS, shortDate } from "@/lib/prayers";
import { ilToday, loadWeek, prayersMember } from "@/lib/prayers-server";
import { MemberHeader } from "@/components/card/member-header";
import { WeekCard } from "@/components/prayers/week-card";

export const metadata: Metadata = { title: "תפילות · PIRI" };

const NOTE = { changed: { text: "שונה השבוע", tint: "#FFF1D6" }, cancelled: { text: "אין השבוע", tint: "#FFD9DE" }, added: { text: "רק השבוע", tint: "#E3DDFF" } } as const;

// "תפילות" in the member's card: this week's prayers with the gabbai's changes, day by day, and the week's
// parasha and Shabbat times. There is no member board for it, so it follows the card's other screens.
export default async function MemberPrayersPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    if (!(await getSession())) redirect(`/login?next=/card/${orgId}/prayers`);
    const m = await prayersMember(orgId);
    if (!m) notFound();
    const look = orgLook(m.link.org, m.link.cardColor);
    const today = ilToday();
    const { dates, rows, times } = await loadWeek(orgId, m.link.org, today);
    const days = dates.map((date, i) => ({ date, i, rows: rows.filter((r) => r.day === i) })).filter((d) => d.rows.length);
    return (
        <main className="min-h-dvh bg-[var(--mh-bg)]">
            <MemberHeader back={`/card/${orgId}`} backLabel="חזרה לכרטיס" title="תפילות" org={look} max="max-w-[1100px]" />
            <div className="mx-auto grid max-w-[1100px] grid-cols-[minmax(0,1fr)] items-start gap-[14px] px-4 py-5 md:grid-cols-[minmax(0,1fr)_340px] min-[1800px]:[zoom:1.3]">
                <div className="flex flex-col gap-[14px] max-md:order-2">
                    {days.length ? (
                        <ul className="m-0 grid list-none grid-cols-[minmax(0,1fr)] gap-[14px] p-0 lg:grid-cols-2">
                            {days.map((d) => {
                                const now = d.date === today;
                                return (
                                    <li key={d.date} className={`flex flex-col gap-2 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_3px_0_var(--mh-ink)] ${d.date < today ? "opacity-70" : ""}`}>
                                        <h2 className="m-0 flex items-baseline gap-2 text-[18px] font-extrabold">
                                            {d.i === 6 ? "שבת" : `יום ${DAYS[d.i]}`}
                                            <span className="text-[14px] font-bold text-[var(--mh-ink-soft)]"><bdi>{shortDate(d.date)}</bdi></span>
                                            {now && <span className="rounded-full border-2 border-[var(--mh-ink)] px-2 text-[12px] font-extrabold" style={{ background: look.color, color: look.fg }}>היום</span>}
                                        </h2>
                                        <ul className="m-0 flex list-none flex-col p-0">
                                            {d.rows.map((r) => {
                                                const off = r.state === "cancelled";
                                                const note = r.state === "regular" ? null : NOTE[r.state];
                                                return (
                                                    <li key={r.key} className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-start gap-x-3 border-t border-[#E6E0D4] py-2 first:border-0">
                                                        <bdi className={`text-[18px] font-extrabold leading-tight tabular-nums ${off ? "text-[var(--mh-ink-soft)] line-through" : ""}`}>{r.time}</bdi>
                                                        <span className="flex min-w-0 flex-col leading-tight">
                                                            <b className={off ? "line-through" : ""}>{r.name}</b>
                                                            {r.place && <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">{r.place}</span>}
                                                        </span>
                                                        <span>{note && <span className="whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] px-2 text-[12px] font-extrabold" style={{ background: note.tint }}>{note.text}</span>}</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <section className="flex flex-col items-center gap-3 rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-white px-5 py-8 text-center shadow-[0_4px_0_var(--mh-ink)]">
                            <h2 className="m-0 font-display text-[24px] font-normal">לוח התפילות עוד לא פורסם</h2>
                            <p className="m-0 max-w-[420px] font-semibold text-[var(--mh-ink-soft)]">כשהגבאי יקליד את זמני התפילות, הם יופיעו כאן, עם כל שינוי של השבוע.</p>
                        </section>
                    )}
                </div>
                <WeekCard times={times} city={m.link.org.city} settingsHref={null} />
            </div>
        </main>
    );
}
