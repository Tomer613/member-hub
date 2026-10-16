import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { greeting, groupChips } from "@/lib/wallet";
import { loadWallet } from "@/lib/wallet-server";
import { Card, WalletStack } from "@/components/wallet/wallet-stack";
import { WalletNav } from "@/components/wallet/wallet-nav";
import { SettingsButton } from "../settings-button";
import { WalletEmpty } from "./wallet-empty";

export const metadata: Metadata = { title: "הארנק · PIRI" };

// The wallet (approved board D-Wallet): a greeting with what is waiting, "החברויות שלי" with "סידור הארנק"
// and the card count, filter chips by group, the stack of cards in the member's order, and the archive link.
export default async function WalletPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const session = await getSession();
    if (!session) redirect("/login?next=/wallet");
    const sp = await searchParams;
    const now = new Date();
    const { user, items, waiting, archived, notes } = await loadWallet(session.userId, now);

    // An org whose setup wizard was left in the middle stays out of the wallet until it is opened.
    const unfinished = await db.orgUser.findFirst({ where: { userId: session.userId, role: "owner", org: { status: "setup" } }, include: { org: true }, orderBy: { createdAt: "desc" } });

    const current = items.filter((x) => x.current).map((x) => x.view);
    const past = items.filter((x) => !x.current).map((x) => x.view);
    const notice = items.length === 0
        ? archived ? "אין כרטיסים פעילים בארנק. מה שהוסתר או הסתיים נמצא בארכיון." : "שמחים שהצטרפתם! בואו נמלא את הארנק."
        : waiting.length
          ? `${waiting.slice(0, 2).join(". ")}.${waiting.length > 2 ? ` ועוד ${waiting.length - 2} דברים.` : ""}`
          : "הכול רגוע. אין מה לטפל כרגע.";

    return (
        <main className="min-h-dvh bg-[var(--mh-sun)] pb-24 lg:pb-10">
            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-4 pt-5 md:px-[clamp(16px,3vw,40px)] lg:gap-4">
                <section aria-label="ברכה והודעה" className="mx-1 flex items-start gap-3 rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-white p-[14px] ps-4 shadow-[0_4px_0_var(--mh-ink)] md:mx-0">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <h2 className="m-0 font-display text-[22px] font-normal leading-[1.1]">{greeting(user.firstName, now, waiting.length > 0)}</h2>
                        <p className="m-0 text-[15px] font-bold leading-[1.3]">{notice}</p>
                    </div>
                    <SettingsButton needsBackup={user.contacts.length < 2} />
                </section>
                {unfinished && (
                    <Link href="/orgs/new" className="flex min-h-[60px] items-center justify-between gap-3 rounded-[20px] border-[2.5px] border-dashed border-[var(--mh-ink)] bg-white px-4 font-extrabold">
                        <span>להמשיך בפתיחת {unfinished.org.name}</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
                    </Link>
                )}
                {items.length === 0 && !archived ? (
                    <div className="flex w-full max-w-[560px] flex-col gap-3 self-center">
                        <WalletEmpty openJoin={sp.join === "1"} />
                        <Link href="/scan" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-[var(--mh-ink)] bg-white px-5 font-extrabold shadow-[0_3px_0_var(--mh-ink)] transition-transform hover:-translate-y-px">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16" /></svg>
                            סריקת קוד של ארגון
                        </Link>
                        <WalletNav notes={notes} />
                    </div>
                ) : (
                    <>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="m-0 font-display text-[30px] font-normal leading-[1.05]">החברויות שלי</h1>
                            <Link href="/scan" aria-label="סריקת קוד" className="ms-auto inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-white shadow-[0_3px_0_var(--mh-ink)] transition-transform duration-200 hover:-translate-y-px hover:rotate-6 lg:ms-0">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16" /></svg>
                            </Link>
                            {items.length > 1 && (
                                <Link href="/wallet/arrange" aria-label="סידור הארנק" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-ink)] text-[var(--mh-sun)] shadow-[0_3px_0_rgba(30,22,51,0.35)] transition-transform duration-200 hover:-rotate-12 hover:scale-105 lg:ms-0">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 6h10M4 12h16M4 18h7M18 3l3 3-3 3M15 15l3 3 3-3" /></svg>
                                </Link>
                            )}
                            <span className={`inline-flex h-[50px] w-[50px] shrink-0 -rotate-[8deg] flex-col items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-org-orange)] shadow-[0_3px_0_var(--mh-ink)] lg:ms-0`}>
                                <b className="font-display text-[22px] font-normal leading-none"><bdi>{current.length}</bdi></b>
                                <span className="text-[9px] font-extrabold">כרטיסים</span>
                            </span>
                            <span className="hidden lg:ms-auto lg:block" />
                            <WalletNav notes={notes} />
                        </div>
                        {current.length > 0 && <WalletStack cards={current} chips={groupChips(current.map((c) => c.group))} />}
                        {past.length > 0 && (
                            <details className="group mt-2" open={current.length === 0}>
                                <summary className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-[18px] border-2 border-dashed border-[var(--mh-ink)] bg-white/60 px-4 font-extrabold marker:content-none md:max-w-[480px]">
                                    <span>חגיגות שהיו <span className="text-[var(--mh-ink-soft)]">(<bdi>{past.length}</bdi>)</span></span>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform duration-200 group-open:rotate-180"><path d="M6 9l6 6 6-6" /></svg>
                                </summary>
                                <ul className="m-0 grid list-none gap-3 p-0 pt-3 opacity-90 md:grid-cols-2 xl:grid-cols-3 min-[1800px]:grid-cols-4">
                                    {past.map((c, i) => <Card key={c.id} card={c} i={i} stacked={false} />)}
                                </ul>
                            </details>
                        )}
                        {archived > 0 && (
                            <Link href="/wallet/archive" className="group mt-2 flex min-h-[60px] items-center gap-3 rounded-[18px] border-2 border-dashed border-[var(--mh-ink)] bg-[var(--mh-ticket)] px-4 md:max-w-[480px]">
                                <span className="flex flex-1 flex-col">
                                    <b>ארכיון (<bdi>{archived}</bdi>)</b>
                                    <span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">חברויות שהסתיימו או שהוסתרו</span>
                                </span>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform duration-200 group-hover:-translate-x-[3px]"><path d="M15 6l-6 6 6 6" /></svg>
                            </Link>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
