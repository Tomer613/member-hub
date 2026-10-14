import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { SettingsButton } from "../settings-button";
import { WalletEmpty } from "./wallet-empty";

export const metadata: Metadata = { title: "הארנק · PIRI" };

export default async function WalletPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const session = await getSession();
    if (!session) redirect("/login?next=/wallet");
    const sp = await searchParams;
    const user = await db.user.findUniqueOrThrow({
        where: { id: session.userId },
        include: { contacts: true, orgUsers: { where: { status: { in: ["active", "left_with_debt"] }, org: { status: { not: "setup" } } }, include: { org: true }, orderBy: { walletOrder: "asc" } } },
    });

    // An org whose setup wizard was left in the middle stays out of the wallet until it is opened.
    const unfinished = await db.orgUser.findFirst({ where: { userId: session.userId, role: "owner", org: { status: "setup" } }, include: { org: true }, orderBy: { createdAt: "desc" } });

    return (
        <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col gap-3 bg-[var(--mh-sun)] px-4 py-[18px]">
            <header className="flex items-center justify-between gap-3 rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_4px_0_var(--mh-ink)]">
                <div>
                    <h1 className="m-0 text-[22px]">שלום {user.firstName}</h1>
                    {user.orgUsers.length === 0 && <p className="m-0 text-[15px] font-semibold">שמחים שהצטרפתם! בואו נמלא את הארנק.</p>}
                </div>
                <SettingsButton needsBackup={user.contacts.length < 2} />
            </header>
            {unfinished && (
                <Link href="/orgs/new" className="flex min-h-[60px] items-center justify-between gap-3 rounded-[20px] border-[2.5px] border-dashed border-[var(--mh-ink)] bg-white px-4 font-extrabold">
                    <span>להמשיך בפתיחת {unfinished.org.name}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
                </Link>
            )}
            {user.orgUsers.length === 0 ? (
                <WalletEmpty openJoin={sp.join === "1"} />
            ) : (
                // The full wallet (stacked cards, approved board D-Wallet) is the next screen to build.
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {user.orgUsers.map((m) => (
                        <li key={m.id} className="flex items-center justify-between gap-3 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-ticket)] p-4 font-extrabold shadow-[var(--mh-shadow)]">
                            {m.org.name}
                            {(m.role === "owner" || m.role === "admin") && <Link href={`/orgs/${m.org.id}`} className="min-h-10 content-center underline">ניהול</Link>}
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}
