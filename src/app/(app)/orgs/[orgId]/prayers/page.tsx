import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session-server";
import { AdminShell } from "@/components/admin/admin-shell";
import { WeekCard } from "@/components/prayers/week-card";
import { dayLabel, shortDate, type WeekRow } from "@/lib/prayers";
import { dropOldChanges, ilToday, loadWeek, prayersAdmin } from "@/lib/prayers-server";
import { cityCandleMinutes, readCandleMinutes, restUntil } from "@/lib/zmanim";
import { CandleMinutes, PrayerForm, UpdateCard, WeekChange } from "./parts";

export const metadata: Metadata = { title: "תפילות ולוח זמנים · PIRI" };

const tag = "inline-flex items-center whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] px-2 text-[12px] font-extrabold";
const STATE: Record<WeekRow["state"], { text: string; tint: string } | null> = {
    regular: null,
    changed: { text: "שונה השבוע", tint: "#FFF1D6" },
    cancelled: { text: "אין השבוע", tint: "#FFD9DE" },
    added: { text: "רק השבוע", tint: "#E3DDFF" },
};

// "תפילות ולוח זמנים" (board D-ModSynSchedule): the regular week, typed once ("קבוע"), and this week with its
// one-time changes ("שבוע זה"). Beside it "השבוע" (parasha and Shabbat times) and "עדכון ידני" to the
// community. The form opens beside the table; on a phone and tablet it comes first.
export default async function PrayersPage({ params, searchParams }: { params: Promise<{ orgId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const { orgId } = await params;
    const sp = await searchParams;
    if (!(await getSession())) redirect("/login");
    const a = await prayersAdmin(orgId);
    if (!a) notFound();
    const today = ilToday();
    await dropOldChanges(orgId, today);
    const fixed = sp.v === "fixed";
    const { dates, rows, template, times } = await loadWeek(orgId, a.org, today);
    const asked = typeof sp.e === "string" ? sp.e : null;
    const base = `/orgs/${orgId}/prayers${fixed ? "?v=fixed" : ""}`;
    const href = (o: { e?: string | null; fixed?: boolean }) => {
        const q = new URLSearchParams({ ...((o.fixed ?? fixed) ? { v: "fixed" } : {}), ...(o.e ? { e: o.e } : {}) }).toString();
        return `/orgs/${orgId}/prayers${q ? `?${q}` : ""}`;
    };
    const candle = readCandleMinutes(a.org.settings, a.org.city);
    const resting = a.org.city ? restUntil(new Date(), a.org.city, candle.minutes) : null;
    const saved = sp.saved ? (asked?.startsWith("c-") ? "נוסף לשבוע הזה בלבד." : "נשמר בלוח הקבוע.") : null;

    // What the side opens: a new prayer, a regular one (its template, or this week's change), or one added for this week.
    const tpl = asked && !asked.startsWith("c-") && asked !== "new" ? template.find((p) => p.id === asked) ?? null : null;
    const weekRow = !fixed && tpl ? rows.find((r) => r.prayerId === tpl.id) ?? null : null;
    const once = asked?.startsWith("c-") ? rows.find((r) => r.state === "added" && r.changeId === asked.slice(2)) ?? null : null;
    const editing = asked === "new" || !!tpl || !!once;
    const on = (r: { key: string; prayerId?: string | null; changeId?: string | null }) => (r.prayerId ? r.prayerId === tpl?.id : !!once && r.changeId === once.changeId);

    const list = fixed
        ? template.map((p) => ({ key: p.id, link: p.id, prayerId: p.id, changeId: null, day: dayLabel(p.day), date: null as string | null, name: p.name, time: p.time, was: null as string | null, place: p.place, state: null as (typeof STATE)[WeekRow["state"]] }))
        : rows.map((r) => {
            const p = r.prayerId ? template.find((x) => x.id === r.prayerId) : null;
            return { key: r.key, link: r.state === "added" ? `c-${r.changeId}` : r.prayerId!, prayerId: r.prayerId, changeId: r.changeId, day: dayLabel(r.day), date: r.date, name: r.name, time: r.time, was: p && p.time !== r.time ? p.time : null, place: r.place, state: STATE[r.state] };
        });

    const table = list.length ? (
        <div className="overflow-hidden rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white shadow-[0_3px_0_var(--mh-ink)]">
            <table className="w-full border-collapse text-start max-md:block">
                <thead className="max-md:hidden">
                    <tr className="bg-[var(--mh-ink)] text-[13px] text-white">
                        {["יום", "תפילה", "שעה", "מקום", ...(fixed ? [] : ["השבוע"])].map((h) => <th key={h} className="px-4 py-3 text-start font-extrabold">{h}</th>)}
                    </tr>
                </thead>
                <tbody className="max-md:block">
                    {list.map((r, i) => {
                        const picked = on(r);
                        const newDay = i === 0 || list[i - 1].day !== r.day;
                        const off = r.state?.text === "אין השבוע";
                        // Every row keeps the same columns. On a phone: the time, then the prayer with its place below, then
                        // the tag. A tag or an old time never moves the time or the name off their line.
                        return (
                            <tr key={r.key} className={`border-[#E6E0D4] max-md:grid max-md:grid-cols-[72px_minmax(0,1fr)_auto] max-md:items-center max-md:gap-x-3 max-md:px-4 ${newDay ? "border-t-2 first:border-t-0" : "border-t"} ${picked ? "bg-[#FFF6D1]" : "hover:bg-[var(--mh-ticket)]"}`}>
                                <td className={`w-[130px] whitespace-nowrap px-4 py-3 font-extrabold max-md:order-none max-md:col-span-3 max-md:w-auto max-md:px-0 max-md:pb-0 ${newDay ? "" : "max-md:hidden"}`}>
                                    <span className={newDay ? "" : "invisible"}>{r.day}{r.date && <span className="ms-2 text-[13px] font-bold text-[var(--mh-ink-soft)]"><bdi>{shortDate(r.date)}</bdi></span>}</span>
                                </td>
                                <td className="px-4 py-3 max-md:order-2 max-md:px-0 max-md:py-1">
                                    <Link href={href({ e: r.link })} aria-current={picked ? "true" : undefined} className="flex min-h-11 flex-col justify-center font-extrabold underline-offset-4 hover:underline">
                                        <span className={off ? "line-through decoration-2" : ""}>{r.name}</span>
                                        {r.place && <span className="text-[14px] font-bold text-[var(--mh-ink-soft)] md:hidden">{r.place}</span>}
                                    </Link>
                                </td>
                                <td className="w-[130px] whitespace-nowrap px-4 py-3 max-md:order-1 max-md:w-auto max-md:self-start max-md:px-0 max-md:pt-[10px] max-md:pb-2">
                                    <span className="flex flex-col items-start leading-tight">
                                        <bdi className={`text-[18px] font-extrabold tabular-nums ${off ? "text-[var(--mh-ink-soft)] line-through" : ""}`}>{r.time}</bdi>
                                        {r.was && !off && <s className="text-[13px] font-bold tabular-nums text-[var(--mh-ink-soft)]"><bdi>{r.was}</bdi></s>}
                                    </span>
                                </td>
                                <td className="px-4 py-3 font-bold text-[var(--mh-ink-soft)] max-md:hidden">{r.place ?? "—"}</td>
                                <td className={`w-[130px] px-4 py-3 max-md:order-3 max-md:w-auto max-md:px-0 ${fixed ? "hidden" : ""}`}>
                                    {r.state && <span className={tag} style={{ background: r.state.tint }}>{r.state.text}</span>}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    ) : (
        <section className="flex flex-col items-start gap-3 rounded-[20px] border-2 border-dashed border-[var(--mh-ink)] bg-white p-5">
            <h2 className="m-0 font-display text-[22px] font-normal">עוד אין תפילות בלוח</h2>
            <p className="m-0 max-w-[520px] font-semibold text-[var(--mh-ink-soft)]">מקלידים פעם אחת את השבוע הרגיל: שחרית, מנחה, ערבית וקבלת שבת, עם השעה והמקום. כל שבוע הוא חוזר מעצמו, ושינוי לשבוע אחד נעשה ב&quot;שבוע זה&quot;.</p>
            <Link href={href({ e: "new", fixed: true })} className="font-extrabold underline">להוספת התפילה הראשונה</Link>
        </section>
    );

    const form = asked === "new" ? (
        <PrayerForm key="new" orgId={orgId} id={null} oneTimeId={null} start={{ day: String(new Date(`${today}T12:00:00Z`).getUTCDay()), name: "", time: "", place: "" }} week={fixed ? null : dates} today={today} back={base} saved={null} />
    ) : once ? (
        <PrayerForm key={once.key} orgId={orgId} id={null} oneTimeId={once.changeId} start={{ day: String(once.day), name: once.name, time: once.time, place: once.place ?? "", date: once.date }} week={dates} today={today} back={base} saved={saved} />
    ) : tpl && weekRow ? (
        <WeekChange key={tpl.id + weekRow.state} orgId={orgId} prayerId={tpl.id} changeId={weekRow.changeId} date={weekRow.date}
            title={`${tpl.name}, ${dayLabel(tpl.day)} ${shortDate(weekRow.date)}`} regular={`${tpl.time}${tpl.place ? `, ${tpl.place}` : ""}`}
            start={{ cancelled: weekRow.state === "cancelled", time: weekRow.time, place: weekRow.place ?? "" }} fixedHref={href({ e: tpl.id, fixed: true })} />
    ) : tpl ? (
        <PrayerForm key={tpl.id} orgId={orgId} id={tpl.id} oneTimeId={null} start={{ day: String(tpl.day), name: tpl.name, time: tpl.time, place: tpl.place ?? "" }} week={null} today={today} back={base} saved={saved} />
    ) : null;

    return (
        <AdminShell orgId={orgId} org={a.org} me={{ ...a.me, role: a.role }} active="prayers">
            <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="flex min-w-0 flex-1 max-sm:basis-full flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h1 className="m-0 font-display text-[28px] leading-tight">לוח תפילות</h1>
                    <span className={`${tag} bg-[#E3DDFF]`}>בית כנסת</span>
                    <span className="font-bold text-[var(--mh-ink-soft)]">שבוע רגיל, נערך פעם אחת וחוזר</span>
                </span>
                <nav aria-label="תצוגה" className="flex gap-2">
                    {[{ f: false, t: "שבוע זה" }, { f: true, t: "קבוע" }].map((x) => (
                        <Link key={x.t} href={href({ fixed: x.f })} aria-current={fixed === x.f ? "page" : undefined}
                            className={`inline-flex min-h-11 items-center rounded-full border-2 border-[var(--mh-ink)] px-4 font-extrabold transition-colors ${fixed === x.f ? "bg-[var(--mh-ink)] text-white" : "bg-white hover:bg-[var(--mh-ticket)]"}`}>{x.t}</Link>
                    ))}
                </nav>
                {asked !== "new" && (
                    <Link href={href({ e: "new" })} className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-[var(--mh-ink)] bg-white px-[18px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                        תפילה
                    </Link>
                )}
            </header>
            {!fixed && <p className="-mt-1 m-0 font-bold text-[var(--mh-ink-soft)]">השבוע שבין <bdi>{shortDate(dates[0])}</bdi> ל-<bdi>{shortDate(dates[6])}</bdi>. לחיצה על תפילה משנה אותה לשבוע הזה בלבד.</p>}
            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-[14px] xl:grid-cols-[minmax(0,1fr)_400px] min-[1800px]:grid-cols-[minmax(0,1fr)_480px]">
                <div className={editing ? "max-xl:order-2" : ""}>{table}</div>
                <div className="flex flex-col gap-[14px]">
                    {form && (
                        <>
                            <Link href={href({})} className="self-start font-bold underline xl:hidden">לכל הלוח</Link>
                            {form}
                        </>
                    )}
                    <div className={`flex flex-col gap-[14px] ${editing ? "max-xl:hidden" : ""}`}>
                        <WeekCard times={times} city={a.org.city} settingsHref={`/orgs/${orgId}/settings`}>
                            {times && <CandleMinutes orgId={orgId} minutes={candle.minutes} own={candle.own && candle.minutes !== cityCandleMinutes(a.org.city)} cityMinutes={cityCandleMinutes(a.org.city)} />}
                        </WeekCard>
                        <UpdateCard orgId={orgId} resting={resting} />
                    </div>
                </div>
            </div>
        </AdminShell>
    );
}
