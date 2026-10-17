import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session-server";
import { AdminShell } from "@/components/admin/admin-shell";
import { onColor } from "@/lib/color";
import { membersAdmin } from "@/lib/members-server";
import { formatShekels } from "@/lib/money";
import { PERIODS, rangeText, readMonths, REPORTS, shortShekels } from "@/lib/reports";
import { loadReport } from "@/lib/reports-server";

export const metadata: Metadata = { title: "דוחות · PIRI" };

const panel = "flex flex-col gap-4 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_3px_0_var(--mh-ink)] md:p-5";

// "דוחות" (board D-AdmReports): what came in month by month, the state of debts, and the reports to download.
// The owner, admins and the treasurer see it.
export default async function ReportsPage({ params, searchParams }: { params: Promise<{ orgId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const { orgId } = await params;
    const sp = await searchParams;
    if (!(await getSession())) redirect("/login");
    const a = await membersAdmin(orgId);
    if (!a) notFound();
    const months = readMonths(sp.m);
    const r = await loadReport(orgId, months);
    const color = a.org.brandColor ?? "#5B3DF5";
    const max = Math.max(...r.bars.map((b) => b.minor), 1);
    const q = months === 6 ? "" : `?m=${months}`;

    return (
        <AdminShell orgId={orgId} org={a.org} me={{ ...a.me, role: a.role }} active="reports">
            <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h1 className="m-0 font-display text-[28px] leading-tight">דוחות</h1>
                <span className="flex-1 font-bold text-[var(--mh-ink-soft)]">{rangeText(r.keys)}</span>
                <nav aria-label="תקופה" className="flex gap-2">
                    {PERIODS.map((p) => (
                        <Link key={p.months} href={`/orgs/${orgId}/reports${p.months === 6 ? "" : `?m=${p.months}`}`} aria-current={months === p.months ? "page" : undefined}
                            className={`inline-flex min-h-11 items-center rounded-full border-2 border-[var(--mh-ink)] px-4 font-extrabold transition-colors ${months === p.months ? "bg-[var(--mh-ink)] text-white" : "bg-white hover:bg-[var(--mh-ticket)]"}`}>
                            {p.label}
                        </Link>
                    ))}
                </nav>
            </header>

            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-[14px] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <section className={panel} aria-labelledby="col-h">
                    <span className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="flex flex-col">
                            <h2 id="col-h" className="m-0 font-display text-[20px]">גבייה לפי חודש</h2>
                            <span className="text-[14px] font-bold text-[var(--mh-ink-soft)]">נגבה בפועל, בשקלים, לפי יום התשלום</span>
                        </span>
                        <span className="text-[15px] font-extrabold">סך הכול <bdi>{formatShekels(r.collectedMinor)}</bdi></span>
                    </span>
                    {/* The months run right to left, oldest first, as the rest of the screen reads. Each bar shows
                        its short sum; pointing at it shows the exact one. */}
                    <div className="flex h-[220px] items-end gap-[clamp(6px,2vw,24px)] border-b-2 border-[var(--mh-ink)] px-1 min-[1800px]:h-[300px]" aria-hidden="true">
                        {r.bars.map((b, i) => {
                            const last = i === r.bars.length - 1;
                            return (
                                <div key={b.key} className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                                    <span className="relative flex w-full flex-col items-center gap-1" style={{ height: `calc(${Math.max(b.minor ? 4 : 0, (b.minor / max) * 82)}% + 22px)` }}>
                                        <span className="pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-[10px] border-2 border-[var(--mh-ink)] bg-[var(--mh-ink)] px-2 py-1 text-[13px] font-extrabold text-white opacity-0 transition-[opacity,transform] duration-150 group-hover:-translate-y-1 group-hover:opacity-100">{formatShekels(b.minor)}</span>
                                        <span className="text-[13px] font-extrabold leading-[18px] max-sm:text-[11px]">{b.minor ? shortShekels(b.minor) : "—"}</span>
                                        <span className="w-full max-w-[56px] flex-1 rounded-t-[8px] border-2 border-b-0 border-[var(--mh-ink)] transition-transform duration-200 group-hover:-translate-y-[3px]"
                                            style={{ background: last ? `repeating-linear-gradient(135deg, ${color} 0 6px, ${color}99 6px 10px)` : color, borderWidth: b.minor ? undefined : 0 }} />
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="-mt-2 flex gap-[clamp(6px,2vw,24px)] px-1" aria-hidden="true">
                        {r.bars.map((b, i) => <span key={b.key} className="min-w-0 flex-1 truncate text-center text-[13px] font-bold text-[var(--mh-ink-soft)]">{b.label}{i === r.bars.length - 1 && <span className="max-sm:hidden"> · עד היום</span>}</span>)}
                    </div>
                    <table className="sr-only">
                        <caption>גבייה לפי חודש</caption>
                        <thead><tr><th>חודש</th><th>נגבה</th></tr></thead>
                        <tbody>{r.bars.map((b) => <tr key={b.key}><td>{b.label} {b.key.slice(0, 4)}</td><td>{formatShekels(b.minor)}</td></tr>)}</tbody>
                    </table>
                    {!r.collectedMinor && <p className="m-0 rounded-[14px] bg-[var(--mh-ticket)] p-3 font-bold">עוד לא התקבלו תשלומים בתקופה הזו. כשחברים ישלמו, באפליקציה או בתשלום שתרשמו בקופה, זה יופיע כאן.</p>}
                </section>

                <section className={panel} aria-labelledby="debt-h">
                    <h2 id="debt-h" className="m-0 font-display text-[20px]">מצב חובות</h2>
                    <dl className="m-0 grid grid-cols-2 gap-3 lg:grid-cols-1 xl:grid-cols-2">
                        {[
                            { k: "חברים בחוב", v: String(r.owers), tint: "#FFD9DE" },
                            { k: "סך החוב", v: formatShekels(r.owedMinor), tint: "#FFF1D6" },
                            { k: "שיעור גבייה", v: r.rate === null ? "—" : `${r.rate}%`, tint: "#D7F5E8" },
                        ].map((x) => (
                            <div key={x.k} className="flex flex-col gap-1 rounded-[16px] border-2 border-[var(--mh-ink)] p-3 last:col-span-2 lg:last:col-span-1 xl:last:col-span-2" style={{ background: x.tint }}>
                                <dt className="text-[13px] font-extrabold">{x.k}</dt>
                                <dd className="m-0 font-display text-[28px] leading-none"><bdi>{x.v}</bdi></dd>
                            </div>
                        ))}
                    </dl>
                    <p className="m-0 text-[14px] font-bold text-[var(--mh-ink-soft)]">
                        {r.rate === null ? "שיעור הגבייה יופיע כשיגיע מועד התשלום של חיובים מהתקופה." : <>מתוך <bdi>{formatShekels(r.dueMinor)}</bdi> שמועד התשלום שלהם הגיע בתקופה, שולמו <bdi>{formatShekels(r.paidMinor)}</bdi>.</>}
                        {" "}חוב הוא רק מה שמועד התשלום שלו עבר.
                    </p>
                    <Link href={`/orgs/${orgId}/members?f=debt`} className="inline-flex min-h-11 items-center self-start rounded-full border-2 border-[var(--mh-ink)] px-[18px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px" style={{ background: color, color: onColor(color) }}>לחברים בחוב</Link>
                </section>
            </div>

            <section className={panel} aria-labelledby="exp-h">
                <span className="flex flex-wrap items-baseline gap-x-3">
                    <h2 id="exp-h" className="m-0 font-display text-[20px]">ייצוא דוחות</h2>
                    <span className="text-[14px] font-bold text-[var(--mh-ink-soft)]">קובץ CSV שנפתח באקסל. דוחות הגבייה והקבלות הם {months === 12 ? "לשנה האחרונה" : `ל-${months} החודשים האחרונים`}.</span>
                </span>
                <ul className="m-0 grid list-none grid-cols-[minmax(0,1fr)] gap-3 p-0 md:grid-cols-2 xl:grid-cols-3 min-[1800px]:grid-cols-5">
                    {REPORTS.map((x) => (
                        <li key={x.id} className="flex items-center gap-3 rounded-[16px] border-2 border-[var(--mh-ink)] p-3">
                            <span className="flex min-w-0 flex-1 flex-col">
                                <b>{x.title}</b>
                                <span className="text-[13px] font-bold text-[var(--mh-ink-soft)]">{x.line}</span>
                            </span>
                            <a href={`/orgs/${orgId}/reports/export/${x.id}${q}`} download className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border-2 border-[var(--mh-ink)] bg-white px-4 font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px hover:bg-[var(--mh-ticket)]">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
                                ייצוא
                            </a>
                        </li>
                    ))}
                </ul>
            </section>
        </AdminShell>
    );
}
