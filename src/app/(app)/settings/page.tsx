import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { maskContact, type ContactKind } from "@/lib/auth/contact";
import { logout } from "../actions";
import { AddContact } from "./add-contact";

export const metadata: Metadata = { title: "הגדרות · PIRI" };

const box = "flex flex-col gap-3 rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_4px_0_var(--mh-ink)]";

export default async function SettingsPage() {
    const session = await getSession();
    if (!session) redirect("/login?next=/settings");
    const contacts = await db.userContact.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "asc" } });
    const needsBackup = contacts.length < 2;
    const hasEmail = contacts.some((c) => c.kind === "email");

    return (
        <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col gap-[14px] bg-[var(--mh-sun)] px-4 py-[18px]">
            <Link href="/wallet" className="inline-flex min-h-11 items-center self-start rounded-full border-2 border-[var(--mh-ink)] bg-white px-[14px] text-sm font-extrabold">לארנק</Link>
            <h1 className="m-0 text-[30px]">הגדרות</h1>

            <section className={box} aria-labelledby="methods">
                <h2 id="methods" className="m-0 text-[20px]">אמצעי התחברות</h2>
                <p className="m-0 text-sm font-semibold text-[var(--mh-ink-soft)]">קודי כניסה נשלחים לאמצעים האלה.</p>
                <ul className="m-0 flex list-none flex-col p-0">
                    {contacts.map((c) => (
                        <li key={c.id} className="border-b-2 border-[var(--mh-line-soft)] py-3 last:border-b-0">
                            <b dir="ltr" className="block text-start [unicode-bidi:isolate]">{maskContact(c.kind as ContactKind, c.value)}</b>
                            <span className="text-sm font-semibold text-[var(--mh-ink-soft)]">{c.kind === "phone" ? "טלפון" : "מייל"} · מאומת{c.isPrimary ? " · ראשי" : ""}</span>
                        </li>
                    ))}
                </ul>
            </section>

            <section className={`${box} ${needsBackup ? "bg-[var(--mh-tint-sun)]" : ""}`} aria-labelledby="backup">
                <h2 id="backup" className="m-0 text-[20px]">{needsBackup ? "כדאי להוסיף אמצעי גיבוי" : "הוספת אמצעי התחברות"}</h2>
                {needsBackup && <p className="m-0 text-sm font-semibold">אם הטלפון יאבד, תוכלו להיכנס דרכו. אפשר מייל, או מספר של בן משפחה.</p>}
                <AddContact suggestEmail={!hasEmail} />
            </section>

            <Link href="/settings/devices" className={`${box} flex-row items-center justify-between font-extrabold`}>
                מכשירים מחוברים
                <span aria-hidden="true">‹</span>
            </Link>

            <form action={logout}>
                <button type="submit" className="min-h-11 font-extrabold underline">יציאה</button>
            </form>
        </main>
    );
}
