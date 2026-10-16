import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { chargeView, ilDate, ilShortDate, methodLabel } from "@/lib/billing/account";
import { chargeInclude, toChargeIn } from "@/lib/billing/member-money";
import { orgLook } from "@/lib/billing/pay-server";
import { formatShekels } from "@/lib/money";
import { StatusTag } from "@/components/pay/parts";
import { ChargeForm, RecordForm, ReviewButtons, VoidButton } from "./forms";

export const metadata: Metadata = { title: "כספים וחיובים · PIRI" };

const box = "flex flex-col gap-3 rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-white p-[clamp(16px,2vw,24px)] shadow-[0_4px_0_var(--mh-ink)]";

// The org's money, first version (boards D-AdmCharge, D-MAdmPayRecord): reports waiting for approval,
// open charges with "רישום תשלום", recent payments, and a new charge.
export default async function MoneyPage({ params, searchParams }: { params: Promise<{ orgId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const { orgId } = await params;
    const forLink = (await searchParams).for;
    const session = await getSession();
    if (!session) redirect("/login");
    const link = await db.orgUser.findFirst({ where: { orgId, userId: session.userId, role: { in: ["owner", "admin", "treasurer"] }, status: "active" }, include: { org: true } });
    if (!link || link.org.status !== "active" || link.org.packId === "celebration") notFound();
    const org = link.org;
    const [members, charges, reports, recent] = await Promise.all([
        db.orgUser.findMany({ where: { orgId, status: "active", role: { not: "guest" } }, include: { user: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: "asc" } }),
        db.charge.findMany({ where: { orgId, voidedAt: null }, include: { ...chargeInclude, member: { select: { firstName: true, lastName: true } } }, orderBy: { dueOn: "asc" } }),
        db.payment.findMany({ where: { orgId, status: "pending", source: "report" }, include: { member: true, allocations: { include: { charge: { select: { description: true } } } } }, orderBy: { createdAt: "asc" } }),
        db.payment.findMany({ where: { orgId, status: { in: ["succeeded", "refunded"] } }, include: { member: true, allocations: { include: { charge: { select: { description: true } } } } }, orderBy: { receivedAt: "desc" }, take: 15 }),
    ]);
    const name = (m: { firstName: string; lastName: string } | null) => (m ? `${m.firstName} ${m.lastName}`.trim() : "חבר/ה");
    const views = charges.flatMap((c) => {
        const v = chargeView(toChargeIn(c));
        return v && v.state !== "paid" ? [{ ...v, who: name(c.member), untouched: v.leftMinor === v.amountMinor }] : [];
    });
    const openTotal = views.filter((v) => v.state === "open").reduce((t, v) => t + v.leftMinor, 0);
    const look = orgLook(org);
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
    return (
        <main className="min-h-dvh bg-[var(--mh-sun)]">
            <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-[clamp(12px,3vw,32px)] py-[clamp(14px,2.5vw,28px)]">
                <header className="flex flex-wrap items-baseline justify-between gap-3">
                    <h1 className="m-0 font-display text-[clamp(26px,2.6vw,34px)]">כספים וחיובים</h1>
                    <Link href={`/orgs/${orgId}`} className="min-h-10 content-center font-extrabold underline">לסקירה</Link>
                </header>
                <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(340px,1fr)]">
                    <div className="flex flex-col gap-4">
                        {reports.length > 0 && (
                            <section className={box} aria-labelledby="reports">
                                <h2 id="reports" className="m-0 font-display text-[22px]">דיווחים שמחכים לאישור</h2>
                                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                                    {reports.map((r) => (
                                        <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-[16px] border-2 border-[var(--mh-ink)] bg-[var(--mh-ticket)] p-3">
                                            <span className="flex min-w-[200px] flex-1 flex-col">
                                                <b>{name(r.member)} · <bdi>{formatShekels(r.amountMinor)}</bdi></b>
                                                <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">{r.allocations.map((x) => x.charge.description).join(", ")} · {methodLabel(r.method, null)} · <bdi>{ilDate(r.receivedAt)}</bdi></span>
                                                {r.note && <span className="text-[14px] font-semibold">״{r.note}״</span>}
                                                {r.proof && <a href={r.proof} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center self-start font-extrabold underline">לאישור שצורף</a>}
                                            </span>
                                            <ReviewButtons paymentId={r.id} />
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                        <section className={box} aria-labelledby="open">
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <h2 id="open" className="m-0 font-display text-[22px]">חיובים פתוחים</h2>
                                <span className="font-extrabold">סה״כ פתוח: <bdi>{formatShekels(openTotal)}</bdi></span>
                            </div>
                            {!views.length && <p className="m-0 font-semibold text-[var(--mh-ink-soft)]">אין חיובים פתוחים. חיוב חדש יוצרים בטופס שבצד.</p>}
                            <ul className="m-0 flex list-none flex-col p-0">
                                {views.map((v) => (
                                    <li key={v.id} className="flex flex-col gap-2 border-b-2 border-[var(--mh-line-soft)] py-3 last:border-0">
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
                        <section className={box} aria-labelledby="recent">
                            <h2 id="recent" className="m-0 font-display text-[22px]">תשלומים אחרונים</h2>
                            {!recent.length && <p className="m-0 font-semibold text-[var(--mh-ink-soft)]">עוד לא התקבלו תשלומים.</p>}
                            <ul className="m-0 flex list-none flex-col p-0">
                                {recent.map((p) => (
                                    <li key={p.id} className="flex flex-wrap items-center gap-3 border-b-2 border-[var(--mh-line-soft)] py-2 last:border-0">
                                        <span className="flex min-w-[180px] flex-1 flex-col">
                                            <b>{name(p.member)}</b>
                                            <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">{p.allocations.map((x) => x.charge.description).join(", ")} · {methodLabel(p.method, p.cardLabel)} · <bdi>{ilDate(p.receivedAt)}</bdi>{p.receiptNo ? <> · קבלה <bdi>{p.receiptNo}</bdi></> : null}</span>
                                        </span>
                                        <bdi className="font-extrabold">{formatShekels(p.amountMinor)}</bdi>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>
                    <ChargeForm orgId={orgId} org={look} today={today} forLink={typeof forLink === "string" && members.some((m) => m.id === forLink) ? forLink : undefined} members={members.map((m) => ({ id: m.id, name: `${m.user.firstName ?? ""} ${m.user.lastName ?? ""}`.trim() || "חבר/ה" }))} />
                </div>
            </div>
        </main>
    );
}
