import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { ilDate, moneySummary } from "@/lib/billing/account";
import { ensureMember, memberCharges } from "@/lib/billing/member-money";
import { orgLook } from "@/lib/billing/pay-server";
import { debtState, paymentsThisYear } from "@/lib/billing/member-finance";
import { formatShekels } from "@/lib/money";
import { paymentsMode, savedMethods } from "@/lib/payments/provider";
import { OrgDot, StatusTag } from "@/components/pay/parts";

export const metadata: Metadata = { title: "כספים בארגון · PIRI" };

const panel = "overflow-hidden rounded-[20px] border-[2.5px] border-[var(--mh-ink)] shadow-[0_4px_0_var(--mh-ink)]";
const payBtn = "inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-sun)] px-[18px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none";

// "כספים" in one org (board D-MemberFinance): is anything owed, what is open and what waits for the org, and
// the money settings and history. A charge whose date has not come yet is open but is not a debt.
export default async function MemberFinancePage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    const session = await getSession();
    if (!session) redirect(`/login?next=/card/${orgId}/money`);
    const link = await db.orgUser.findUnique({ where: { orgId_userId: { orgId, userId: session.userId } }, include: { org: true } });
    if (!link || link.org.status === "setup" || link.org.packId === "celebration" || !["active", "left_with_debt"].includes(link.status)) notFound();
    const member = await ensureMember(link.id);
    const [charges, sub, paid, methods] = await Promise.all([
        memberCharges(orgId, member.id),
        db.subscription.findFirst({ where: { orgId, memberId: member.id, status: "active" }, include: { plan: true } }),
        db.payment.findMany({ where: { orgId, memberId: member.id, status: "succeeded" }, select: { receivedAt: true } }),
        savedMethods(),
    ]);
    const look = orgLook(link.org, link.cardColor);
    const money = moneySummary(charges);
    const debt = debtState(money.open, new Date());
    const waiting = charges.filter((c) => c.state === "pending");
    // "החיוב הבא" is the soonest charge not yet late; late ones are the debt above it.
    const next = money.open.find((c) => !debt.ids.includes(c.id)) ?? null;
    const method = methods[0] ? `${methods[0].label}${paymentsMode() === "test" ? " · בדיקה" : ""}` : "עוד לא נשמר";
    const year = paymentsThisYear(paid.map((p) => p.receivedAt), new Date());
    const rows: { label: string; sub: string; href: string | null; tag?: string }[] = [
        { label: "חיוב אוטומטי", sub: "כבוי. ייפתח כשנחבר את ספק התשלומים", href: null, tag: "כבוי" },
        { label: "אמצעי תשלום לארגון זה", sub: methods[0] ? `ברירת מחדל (${method})` : "בוחרים בזמן התשלום", href: null },
        { label: "היסטוריה וקבלות", sub: year === 0 ? "אין תשלומים השנה" : year === 1 ? "תשלום אחד השנה" : `${year} תשלומים השנה`, href: `/pay/history?org=${orgId}` },
        { label: "דיווח על תשלום ידני", sub: money.open.length ? "שילמתם בהעברה או במזומן?" : "אין כרגע חיוב פתוח לדווח עליו", href: money.open.length ? `/pay/${orgId}/report` : null },
    ];

    return (
        <main className="min-h-dvh bg-[var(--mh-bg)]">
            <header className="sticky top-0 z-20 border-b-[2.5px] border-[var(--mh-ink)]" style={{ background: look.color, color: look.fg }}>
                <div className="mx-auto flex max-w-[1100px] items-center gap-3 px-4 py-3 min-[1800px]:[zoom:1.4]">
                    <Link href={`/card/${orgId}`} aria-label="חזרה לכרטיס" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-[var(--mh-ink)] bg-white text-[var(--mh-ink)] transition-transform hover:scale-105">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
                    </Link>
                    <span className="flex min-w-0 flex-1 flex-col">
                        <h1 className="m-0 font-display text-[24px] leading-tight">כספים</h1>
                        <span className="truncate text-[13px] font-bold">{link.org.name}{sub ? ` · ${sub.plan.name}` : ""}</span>
                    </span>
                    <OrgDot org={look} size={40} />
                </div>
            </header>

            <div className="mx-auto grid max-w-[1100px] grid-cols-[minmax(0,1fr)] items-start gap-[14px] px-4 py-5 lg:grid-cols-2 lg:gap-6 min-[1800px]:[zoom:1.4]">
                <div className="flex flex-col gap-[14px]">
                    <section className={`${panel} bg-[var(--mh-ticket)]`} aria-labelledby="state">
                        <div className="flex min-h-[64px] items-center gap-3 border-b-2 border-[var(--mh-ink)] px-4 py-2" style={{ background: debt.owes ? "#FFE9E6" : "var(--mh-tint-ok)" }}>
                            <h2 id="state" className="m-0 flex-1 font-display text-[24px] font-normal leading-tight">{debt.owes ? <>חוב פתוח <bdi>{formatShekels(debt.owedMinor)}</bdi></> : "אין חוב פתוח"}</h2>
                            <span className="grid h-[34px] w-[34px] place-items-center rounded-full border-2 border-[var(--mh-ink)] bg-white" aria-hidden="true">
                                {debt.owes
                                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C4223B" strokeWidth="3" strokeLinecap="round"><path d="M12 6v8M12 18h.01" /></svg>
                                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--mh-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>}
                            </span>
                        </div>
                        <dl className="m-0 flex flex-col gap-[10px] px-4 py-[14px]">
                            {debt.owes && <Line label="מועד התשלום עבר">{debt.count === 1 ? "חיוב אחד" : `${debt.count} חיובים`}</Line>}
                            <Line label="החיוב הבא">{next ? `${formatShekels(next.leftMinor)} · ${ilDate(next.due)}` : debt.owes ? "אין חיוב נוסף" : "אין חיוב פתוח"}</Line>
                            <Line label="אמצעי תשלום">{method}</Line>
                            <Line label="חיוב אוטומטי">כבוי</Line>
                        </dl>
                        {debt.owes && (
                            <div className="px-4 pb-4">
                                <Link href={`/pay/${orgId}?c=${debt.ids.join(",")}`} className={`${payBtn} w-full`}><span>לתשלום החוב <bdi>{formatShekels(debt.owedMinor)}</bdi></span></Link>
                            </div>
                        )}
                    </section>

                    {money.open.length > 0 && (
                        <section className={`${panel} bg-white`} aria-labelledby="open-h">
                            <h2 id="open-h" className="m-0 border-b-2 border-[var(--mh-ink)] px-4 py-3 font-display text-[19px] font-normal">{money.open.length === 1 ? "חיוב פתוח" : "חיובים פתוחים"}</h2>
                            <ul className="m-0 list-none p-0">
                                {money.open.map((c) => (
                                    <li key={c.id} className="flex flex-wrap items-center gap-3 border-b border-[#E6E0D4] px-4 py-3 last:border-0">
                                        <span className="flex min-w-0 flex-1 flex-col">
                                            <b className="truncate">{c.description}</b>
                                            <span className="text-[13px] font-bold text-[var(--mh-ink-soft)]">עד <bdi>{ilDate(c.due)}</bdi>{c.leftMinor < c.amountMinor ? ` · שולם חלק` : ""}</span>
                                        </span>
                                        <bdi className="font-extrabold">{formatShekels(c.leftMinor)}</bdi>
                                        <Link href={`/pay/${orgId}?c=${c.id}`} className={payBtn}>לתשלום</Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {waiting.length > 0 && (
                        <section className={`${panel} bg-white`} aria-labelledby="wait-h">
                            <h2 id="wait-h" className="m-0 border-b-2 border-[var(--mh-ink)] px-4 py-3 font-display text-[19px] font-normal">ממתין לאישור הארגון</h2>
                            <ul className="m-0 list-none p-0">
                                {waiting.map((c) => (
                                    <li key={c.id} className="flex items-center gap-3 border-b border-[#E6E0D4] px-4 py-3 last:border-0">
                                        <b className="min-w-0 flex-1 truncate">{c.description}</b>
                                        <bdi className="font-extrabold">{formatShekels(c.amountMinor)}</bdi>
                                        <StatusTag status="pending" />
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>

                <section className={`${panel} bg-white`} aria-labelledby="manage-h">
                    <h2 id="manage-h" className="m-0 border-b-2 border-[var(--mh-ink)] px-4 py-3 font-display text-[19px] font-normal">ניהול</h2>
                    <ul className="m-0 list-none p-0">
                        {rows.map((r) => {
                            const inner = (
                                <>
                                    <span className="flex min-w-0 flex-1 flex-col">
                                        <b>{r.label}</b>
                                        <span className="text-[13px] font-bold text-[var(--mh-ink-soft)]">{r.sub}</span>
                                    </span>
                                    {r.tag && <span className="rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-ticket)] px-2 text-[12px] font-extrabold">{r.tag}</span>}
                                    {r.href && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 transition-transform duration-200 group-hover:-translate-x-[3px]"><path d="M15 6l-6 6 6 6" /></svg>}
                                </>
                            );
                            return (
                                <li key={r.label} className="border-b border-[#E6E0D4] last:border-0">
                                    {r.href
                                        ? <Link href={r.href} className="group flex min-h-[64px] items-center gap-3 px-4 py-2 hover:bg-[var(--mh-ticket)]">{inner}</Link>
                                        : <div className="flex min-h-[64px] items-center gap-3 px-4 py-2 opacity-70">{inner}</div>}
                                </li>
                            );
                        })}
                    </ul>
                </section>
            </div>
        </main>
    );
}

function Line({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex items-baseline justify-between gap-3">
            <dt className="text-[14px] font-bold text-[var(--mh-ink-soft)]">{label}</dt>
            <dd className="m-0 text-end text-[15px] font-extrabold"><bdi>{children}</bdi></dd>
        </div>
    );
}
