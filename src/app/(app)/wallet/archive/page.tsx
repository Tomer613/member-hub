import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { initialOf } from "@/lib/org-setup";
import { ilDate, ilMonthTitle, moneySummary } from "@/lib/billing/account";
import { memberCharges } from "@/lib/billing/member-money";
import { formatShekels } from "@/lib/money";
import { archiveStamp, archivedOn, roleLabel } from "@/lib/wallet";
import { ArchiveActions } from "./archive-actions";

export const metadata: Metadata = { title: "ארכיון · PIRI" };

// The wallet archive (board D-WalletArchive): memberships that ended, that the member left or was removed
// from, or that they hid. A card stays here until it is deleted; a card with a debt only offers paying it.
export default async function ArchivePage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
    const session = await getSession();
    if (!session) redirect("/login?next=/wallet/archive");
    const { from } = await searchParams;
    const links = await db.orgUser.findMany({
        where: { userId: session.userId, deletedAt: null, org: { status: { not: "setup" } }, status: { not: "left_with_debt" }, OR: [{ hiddenAt: { not: null } }, { status: { in: ["left", "suspended"] } }] },
        include: { org: true },
    });
    const cards = await Promise.all(
        links.map(async (l) => {
            const debt = l.memberId && l.org.packId !== "celebration" ? moneySummary(await memberCharges(l.orgId, l.memberId)).openMinor : 0;
            const color = l.cardColor ?? l.org.brandColor ?? "#5B3DF5";
            return { l, debt, color, at: archivedOn(l) };
        }),
    );
    cards.sort((a, b) => b.at.getTime() - a.at.getTime());
    const months: { title: string; rows: typeof cards }[] = [];
    for (const c of cards) {
        const t = ilMonthTitle(c.at);
        if (months.at(-1)?.title === t) months.at(-1)!.rows.push(c);
        else months.push({ title: t, rows: [c] });
    }
    return (
        <main className="min-h-dvh bg-[var(--mh-sun)] pb-10">
            <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-3 px-4 pt-5">
                <header className="flex items-center gap-3">
                    <Link href={from === "arrange" ? "/wallet/arrange" : "/wallet"} aria-label="חזרה" className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-white shadow-[0_3px_0_var(--mh-ink)] transition-transform hover:-translate-y-px">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
                    </Link>
                    <h1 className="m-0 font-display text-[28px] font-normal">ארכיון</h1>
                </header>
                <p className="m-0 max-w-[640px] text-[15px] font-bold">חברויות שהסתיימו, שעזבתם, שהוסרתם מהן או שהסתרתם. הכרטיס נשאר כאן עד שתמחקו אותו. מהחדש לישן, לפי תאריך הארכוב.</p>
                {!cards.length && <p className="m-0 rounded-[18px] border-2 border-[var(--mh-ink)] bg-white p-4 font-bold">הארכיון ריק.</p>}
                {months.map((m) => (
                    <section key={m.title} className="flex flex-col gap-2">
                        <h2 className="m-0 font-display text-[18px] font-normal">{m.title}</h2>
                        <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2 xl:grid-cols-3">
                            {m.rows.map(({ l, debt, color, at }) => (
                                <li key={l.id} className="relative flex overflow-hidden rounded-[20px] border-2 border-[var(--mh-ink)] bg-[var(--mh-ticket)] shadow-[0_3px_0_var(--mh-ink)]">
                                    <span className="flex w-[60px] shrink-0 items-start justify-center border-e-2 border-[var(--mh-ink)] pt-3" style={{ background: color }}>
                                        <span aria-hidden="true" className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-white font-display text-[19px]" style={{ color: "var(--mh-ink)" }}>{initialOf(l.org.name) || "?"}</span>
                                    </span>
                                    <span className="flex min-w-0 flex-1 flex-col gap-2 p-3">
                                        <span className="flex flex-col pe-24">
                                            <b className="text-[17px] leading-tight">{l.org.name}</b>
                                            <span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">{roleLabel(l.role, l.org.packId)} · <bdi>{ilDate(at)}</bdi></span>
                                        </span>
                                        {debt > 0 ? (
                                            <>
                                                <span className="text-[14px] font-bold">יתרת חוב: <bdi>{formatShekels(debt)}</bdi>. אפשר למחוק את הכרטיס אחרי סילוק החוב.</span>
                                                <Link href={`/pay/${l.orgId}`} className="inline-flex min-h-11 items-center justify-center self-start rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-sun)] px-5 font-extrabold shadow-[0_3px_0_var(--mh-ink)] transition-transform hover:-translate-y-px">לתשלום החוב</Link>
                                            </>
                                        ) : (
                                            <ArchiveActions linkId={l.id} orgName={l.org.name} canRestore={!!l.hiddenAt && l.status === "active"} />
                                        )}
                                    </span>
                                    <span className="absolute end-3 top-3 -rotate-6 rounded-[8px] border-2 border-[#C4223B] bg-white px-2 text-[13px] font-extrabold text-[#C4223B]">{archiveStamp(l)}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </main>
    );
}
