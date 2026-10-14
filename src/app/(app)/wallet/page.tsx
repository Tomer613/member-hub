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
        include: { contacts: true, orgUsers: { where: { status: { in: ["active", "left_with_debt"] } }, include: { org: true }, orderBy: { walletOrder: "asc" } } },
    });

    return (
        <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col gap-3 bg-[var(--mh-sun)] px-4 py-[18px]">
            <header className="flex items-center justify-between gap-3 rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_4px_0_var(--mh-ink)]">
                <div>
                    <h1 className="m-0 text-[22px]">שלום {user.firstName}</h1>
                    {user.orgUsers.length === 0 && <p className="m-0 text-[15px] font-semibold">שמחים שהצטרפתם! בואו נמלא את הארנק.</p>}
                </div>
                <SettingsButton needsBackup={user.contacts.length < 2} />
            </header>
            {user.orgUsers.length === 0 ? (
                <WalletEmpty openJoin={sp.join === "1"} />
            ) : (
                // The full wallet (stacked cards, approved board D-Wallet) is the next screen to build.
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {user.orgUsers.map((m) => (
                        <li key={m.id} className="rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-ticket)] p-4 font-extrabold shadow-[var(--mh-shadow)]">{m.org.name}</li>
                    ))}
                </ul>
            )}
        </main>
    );
}
