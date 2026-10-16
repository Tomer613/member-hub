import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { chargeViews, ilDate, ilMonthTitle, ilShortDate } from "@/lib/billing/account";
import { chargeInclude, memberChargeWhere, toChargeIn } from "@/lib/billing/member-money";
import { orgLook } from "@/lib/billing/pay-server";
import { formatShekels } from "@/lib/money";
import { OrgDot, PayHeader, PayScreen, StatusTag, RECEIPT, type OrgLook } from "@/components/pay/parts";

export const metadata: Metadata = { title: "היסטוריית תשלומים · PIRI" };

type Item = { key: string; at: Date; org: OrgLook; orgId: string; title: string; sub: string; amount: number; status: "unpaid" | "paid" | "refunded" | "pending" | "rejected"; href: string | null };

// Payment history across all the member's orgs (board D-PayHistory): what is still open and what was paid,
// by month, the newest first. A chip per org filters.
export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ org?: string }> }) {
    const { org: only } = await searchParams;
    const session = await getSession();
    if (!session) redirect("/login?next=/pay/history");
    const links = await db.orgUser.findMany({
        where: { userId: session.userId, memberId: { not: null }, role: { not: "guest" }, status: { in: ["active", "left_with_debt"] }, org: { status: { not: "setup" }, packId: { not: "celebration" } } },
        include: { org: true },
        orderBy: { createdAt: "asc" },
    });
    const items: Item[] = [];
    for (const l of links) {
        if (only && l.orgId !== only) continue;
        const look = orgLook(l.org, l.cardColor);
        const [charges, payments] = await Promise.all([
            db.charge.findMany({ where: await memberChargeWhere(l.orgId, l.memberId!), include: chargeInclude }),
            db.payment.findMany({ where: { orgId: l.orgId, memberId: l.memberId!, status: { in: ["succeeded", "refunded", "pending", "rejected"] } }, include: { allocations: { include: { charge: { select: { description: true } } } } } }),
        ]);
        for (const c of chargeViews(charges.map(toChargeIn)).filter((v) => v.state === "open")) {
            items.push({ key: c.id, at: c.due, org: look, orgId: l.orgId, title: c.description, sub: `עד ${ilShortDate(c.due)} · ${l.org.name}`, amount: c.leftMinor, status: "unpaid", href: `/pay/${l.orgId}?c=${c.id}` });
        }
        for (const p of payments) {
            const status = p.status === "succeeded" ? "paid" : (p.status as Item["status"]);
            items.push({
                key: p.id,
                at: p.receivedAt,
                org: look,
                orgId: l.orgId,
                title: p.allocations.map((a) => a.charge.description).join(", ") || "תשלום",
                sub: `${l.org.name} · ${ilShortDate(p.receivedAt)}`,
                amount: p.status === "refunded" ? -p.amountMinor : p.amountMinor,
                status,
                href: status === "paid" || status === "refunded" ? `/pay/receipt/${p.id}?from=history` : `/pay/r/${p.id}`,
            });
        }
    }
    items.sort((a, b) => b.at.getTime() - a.at.getTime());
    const months: { title: string; rows: Item[] }[] = [];
    for (const it of items) {
        const title = ilMonthTitle(it.at);
        const last = months[months.length - 1];
        if (last?.title === title) last.rows.push(it);
        else months.push({ title, rows: [it] });
    }
    const chip = (on: boolean) => `inline-flex min-h-10 items-center rounded-full border-2 border-[var(--mh-ink)] px-4 text-[15px] font-extrabold ${on ? "bg-[var(--mh-ink)] text-white" : "bg-white hover:bg-[var(--mh-ticket)]"}`;
    return (
        <PayScreen wide>
            <PayHeader back={only ? `/card/${only}` : "/wallet"} title="היסטוריית תשלומים" />
            {links.length > 1 && (
                <nav aria-label="סינון" className="flex flex-wrap gap-2">
                    <Link href="/pay/history" aria-current={!only ? "true" : undefined} className={chip(!only)}>הכל</Link>
                    {links.map((l) => <Link key={l.orgId} href={`/pay/history?org=${l.orgId}`} aria-current={only === l.orgId ? "true" : undefined} className={chip(only === l.orgId)}>{l.org.name}</Link>)}
                </nav>
            )}
            {!months.length && (
                <p className="m-0 rounded-[18px] border-2 border-[var(--mh-ink)] bg-white p-4 text-[16px] font-bold">אין עדיין חיובים או תשלומים. כשהארגון ישלח חיוב, הוא יופיע כאן.</p>
            )}
            <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
                {months.map((m) => (
                    <section key={m.title} className="flex flex-col gap-2">
                        <h2 className="m-0 font-display text-[19px] font-normal">{m.title}</h2>
                        <ul className="m-0 list-none overflow-hidden rounded-[18px] border-2 border-[var(--mh-ink)] bg-white p-0 shadow-[0_3px_0_var(--mh-ink)]">
                            {m.rows.map((r) => (
                                <li key={r.key} className="flex min-h-[68px] items-center gap-3 border-b-2 border-[var(--mh-line-soft)] px-3 py-2 last:border-b-0">
                                    <OrgDot org={r.org} />
                                    <span className="flex min-w-0 flex-1 flex-col">
                                        <b className="text-[15px] leading-tight">{r.title}{r.status === "refunded" ? " (זיכוי)" : ""}</b>
                                        <span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">{r.sub}</span>
                                    </span>
                                    <span className="flex flex-col items-end gap-1">
                                        <bdi className="text-[15px] font-extrabold">{formatShekels(r.amount)}</bdi>
                                        <StatusTag status={r.status} />
                                    </span>
                                    {r.status === "unpaid" && r.href ? (
                                        <Link href={r.href} className="inline-flex min-h-11 items-center rounded-[22px] border-2 border-[var(--mh-ink)] bg-[var(--mh-sun)] px-4 text-[15px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform hover:-translate-y-px">לתשלום</Link>
                                    ) : r.href && (r.status === "paid" || r.status === "refunded") ? (
                                        <Link href={r.href} aria-label={`קבלה: ${r.title}, ${ilDate(r.at)}`} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-white transition-transform hover:-translate-y-px">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={RECEIPT} /></svg>
                                        </Link>
                                    ) : r.href ? (
                                        <Link href={r.href} aria-label={`פרטי הדיווח: ${r.title}`} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-white">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
                                        </Link>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </PayScreen>
    );
}
