import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { AdminShell } from "@/components/admin/admin-shell";
import { chargeView, ilDate, ilShortDate, methodLabel } from "@/lib/billing/account";
import { readChargeInput } from "@/lib/billing/charge-plan";
import { kupaNumbers, loadMovements } from "@/lib/billing/kupa-server";
import { chargeInclude, toChargeIn } from "@/lib/billing/member-money";
import { onColor } from "@/lib/color";
import { membersAdmin } from "@/lib/members-server";
import { formatShekels } from "@/lib/money";
import { hebrewAgo } from "@/lib/relative-time";
import { StatusTag } from "@/components/pay/parts";
import { DraftDelete, Movements, RecordForm, ReviewButtons, VoidButton } from "./forms";

export const metadata: Metadata = { title: "כספים וחיובים · PIRI" };

const panel = "flex flex-col gap-3 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_3px_0_var(--mh-ink)] md:p-5";
const btn = "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] px-[18px] text-[15px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none";

// "הקופה" (board D-AdmKupa), with what the admin acts on every day: drafts, members' reports waiting for
// approval, and open charges with "רישום תשלום". A new charge has its own screen (D-AdmCharge).
export default async function MoneyPage({ params, searchParams }: { params: Promise<{ orgId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const { orgId } = await params;
    const forLink = (await searchParams).for;
    if (typeof forLink === "string") redirect(`/orgs/${orgId}/money/new?for=${encodeURIComponent(forLink)}`);
    if (!(await getSession())) redirect("/login");
    const a = await membersAdmin(orgId);
    if (!a) notFound();
    const color = a.org.brandColor ?? "#5B3DF5";
    const [nums, movements, drafts, charges, reports] = await Promise.all([
        kupaNumbers(orgId),
        loadMovements(orgId),
        db.chargeDraft.findMany({ where: { orgId }, orderBy: { updatedAt: "desc" } }),
        db.charge.findMany({ where: { orgId, voidedAt: null }, include: { ...chargeInclude, member: { select: { firstName: true, lastName: true } }, pledge: { select: { anonymous: true } } }, orderBy: { dueOn: "asc" } }),
        db.payment.findMany({ where: { orgId, status: "pending", source: "report" }, include: { member: true, allocations: { include: { charge: { select: { description: true, pledge: { select: { anonymous: true } } } } } } }, orderBy: { createdAt: "asc" } }),
    ]);
    const name = (m: { firstName: string; lastName: string } | null) => (m ? `${m.firstName} ${m.lastName}`.trim() : "חבר/ה");
    const open = charges.flatMap((c) => {
        const v = chargeView(toChargeIn(c));
        // "בעילום שם" (synagogue-tools 33): staff screens show neither who nor what.
        const anon = !!c.pledge?.anonymous;
        return v && v.state !== "paid" ? [{ ...v, who: anon ? "בעילום שם" : name(c.member), description: anon ? "תרומה" : v.description, untouched: v.leftMinor === v.amountMinor }] : [];
    });
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
    const now = new Date();
    const tiles = [
        { k: "יתרה בקופה", v: nums.balanceMinor, bar: color, line: "מה שהארגון צבר ועדיין לא הוצא" },
        { k: "זמינה למשיכה", v: nums.availableMinor, bar: "#00B67A", line: "אחרי שהספק אישר" },
        { k: "בדרך לקופה", v: nums.transitMinor, bar: "#FFD84A", line: "תשלומים שנגבו וטרם הועברו" },
        { k: "חובות פתוחים", v: nums.owedMinor, bar: "#C4223B", line: nums.owers === 1 ? "חבר אחד" : `${nums.owers} חברים` },
    ];
    return (
        <AdminShell orgId={orgId} org={a.org} me={{ ...a.me, role: a.role }} active="money">
            <header className="flex flex-wrap items-center gap-3">
                <span className="flex flex-col">
                    <h1 className="m-0 font-display text-[28px] leading-tight">הקופה</h1>
                    <span className="font-bold text-[var(--mh-ink-soft)]">יתרה מנוהלת אצל ספק התשלומים</span>
                </span>
                <Link href={`/orgs/${orgId}/money/new`} className={`${btn} ms-auto`} style={{ background: color, color: onColor(color) }}>יצירת חיוב</Link>
            </header>
            <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 xl:grid-cols-4" aria-label="מספרי הקופה">
                {tiles.map((t) => (
                    <li key={t.k} className="flex flex-col gap-1 overflow-hidden rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white px-3 pb-3 pt-[18px] shadow-[0_3px_0_var(--mh-ink)] md:px-4" style={{ backgroundImage: `linear-gradient(${t.bar}, ${t.bar})`, backgroundSize: "100% 8px", backgroundRepeat: "no-repeat" }}>
                        <span className="text-[13px] font-extrabold text-[var(--mh-ink-soft)]">{t.k}</span>
                        <bdi className="font-display text-[clamp(22px,2.2vw,30px)] leading-tight">{formatShekels(t.v)}</bdi>
                        <span className="text-[12.5px] font-semibold text-[var(--mh-ink-soft)]">{t.line}</span>
                    </li>
                ))}
            </ul>

            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-[14px] xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="flex min-w-0 flex-col gap-[14px]">
                    {drafts.length > 0 && (
                        <section className={panel} aria-labelledby="drafts">
                            <h2 id="drafts" className="m-0 font-display text-[20px]">טיוטות של חיובים</h2>
                            <ul className="m-0 flex list-none flex-col p-0">
                                {drafts.map((d) => {
                                    const x = readChargeInput(d.data);
                                    return (
                                        <li key={d.id} className="flex flex-wrap items-center gap-3 border-b-[1.5px] border-[var(--mh-line-soft)] py-2 last:border-0">
                                            <span className="flex min-w-[180px] flex-1 flex-col">
                                                <b>{x.title || "בלי כותרת"}{x.amount ? <> · <bdi>₪{x.amount}</bdi></> : null}</b>
                                                <span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">נשמרה {hebrewAgo(d.updatedAt, now)}</span>
                                            </span>
                                            <Link href={`/orgs/${orgId}/money/new?draft=${d.id}`} className={`${btn} bg-[var(--mh-sun)]`}>להמשך</Link>
                                            <DraftDelete orgId={orgId} draftId={d.id} />
                                        </li>
                                    );
                                })}
                            </ul>
                        </section>
                    )}

                    {reports.length > 0 && (
                        <section className={panel} aria-labelledby="reports">
                            <h2 id="reports" className="m-0 font-display text-[20px]">דיווחים שמחכים לאישור</h2>
                            <ul className="m-0 flex list-none flex-col gap-2 p-0">
                                {reports.map((r) => (
                                    <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-[16px] border-2 border-[var(--mh-ink)] bg-[var(--mh-ticket)] p-3">
                                        <span className="flex min-w-[200px] flex-1 flex-col">
                                            <b>{r.allocations.some((x) => x.charge.pledge?.anonymous) ? "בעילום שם" : name(r.member)} · <bdi>{formatShekels(r.amountMinor)}</bdi></b>
                                            <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">{r.allocations.map((x) => (x.charge.pledge?.anonymous ? "תרומה" : x.charge.description)).join(", ")} · {methodLabel(r.method, null)} · <bdi>{ilDate(r.receivedAt)}</bdi></span>
                                            {r.note && <span className="text-[14px] font-semibold">״{r.note}״</span>}
                                            {r.proof && <a href={r.proof} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center self-start font-extrabold underline">לאישור שצורף</a>}
                                        </span>
                                        <ReviewButtons paymentId={r.id} />
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <section className={panel} aria-labelledby="open">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h2 id="open" className="m-0 font-display text-[20px]">חיובים פתוחים</h2>
                            <span className="text-[14px] font-extrabold">{open.length === 1 ? "חיוב אחד" : `${open.length} חיובים`} · <bdi>{formatShekels(open.reduce((t, v) => t + v.leftMinor, 0))}</bdi></span>
                        </div>
                        {!open.length && <p className="m-0 font-semibold text-[var(--mh-ink-soft)]">אין חיובים פתוחים.</p>}
                        <ul className="m-0 flex max-h-[560px] list-none flex-col overflow-y-auto p-0">
                            {open.map((v) => (
                                <li key={v.id} className="flex flex-col gap-2 border-b-[1.5px] border-[var(--mh-line-soft)] py-3 last:border-0">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="flex min-w-[180px] flex-1 flex-col">
                                            <b>{v.who}</b>
                                            <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">{v.description} · עד <bdi>{ilShortDate(v.due)}</bdi></span>
                                        </span>
                                        <span className="flex flex-col items-end gap-1">
                                            <bdi className="font-extrabold">{formatShekels(v.leftMinor)}</bdi>
                                            <StatusTag status={v.state === "pending" ? "pending" : "unpaid"} />
                                        </span>
                                    </div>
                                    {v.state === "open" && (
                                        <div className="flex flex-wrap items-start gap-2">
                                            <RecordForm chargeId={v.id} who={v.who} left={formatShekels(v.leftMinor)} leftValue={(v.leftMinor / 100).toString()} today={today} />
                                            {v.untouched && <VoidButton chargeId={v.id} />}
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <Movements orgId={orgId} rows={movements.map((m) => ({ ...m, at: ilShortDate(m.at), amount: formatShekels(m.amountMinor) }))} />
                </div>

                <aside className="flex flex-col gap-[14px] xl:sticky xl:top-4" aria-label="משיכה">
                    <section className={panel} aria-labelledby="out-title">
                        <h2 id="out-title" className="m-0 font-display text-[20px]">משיכה</h2>
                        <label className="flex flex-col gap-1">
                            <span className="text-[15px] font-extrabold">סכום</span>
                            <input disabled inputMode="decimal" dir="ltr" placeholder="₪0" className="min-h-12 rounded-[14px] border-2 border-[var(--mh-ink)] bg-[#F4F1EA] px-3 text-end text-[16px] font-bold" />
                        </label>
                        <div className="flex flex-col gap-1">
                            <span className="text-[15px] font-extrabold">לאן</span>
                            <span className="rounded-[14px] border-2 border-dashed border-[var(--mh-ink)] px-3 py-2 text-[14px] font-semibold">חשבון הבנק של הארגון יוגדר כשנחבר את ספק התשלומים.</span>
                        </div>
                        <button type="button" disabled aria-disabled="true" className={`${btn} bg-white opacity-60`}>משיכה</button>
                        <p className="m-0 rounded-[14px] bg-[var(--mh-ticket)] p-3 text-[13.5px] font-semibold">הספק מעביר ביום עסקים הבא. משיכה גדולה מ־₪20,000 דורשת אישור של עוד מורשה. המשיכה תיפתח כשנחבר את ספק התשלומים.</p>
                    </section>
                </aside>
            </div>
        </AdminShell>
    );
}
