import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { answerInvitation } from "./actions";

export const metadata: Metadata = { title: "הזמנה · PIRI" };

const shell = "mx-auto flex min-h-dvh max-w-[480px] flex-col justify-center gap-[14px] bg-[var(--mh-sun)] px-4 py-[18px]";
const box = "flex flex-col gap-3 rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_4px_0_var(--mh-ink)]";

// Where an invite link lands after sign-in. The full consent screen (approved board D-Join: which
// fields the org will see) comes with the membership screens; this page covers accept / not now.
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const session = await getSession();
    if (!session) redirect(`/login?invite=${encodeURIComponent(token)}`);
    const inv = await db.invitation.findUnique({ where: { linkToken: token }, include: { org: true } });

    if (!inv || inv.status !== "pending" || inv.expiresAt < new Date())
        return (
            <main className={shell}>
                <h1 className="m-0 text-[30px]">ההזמנה כבר לא בתוקף</h1>
                <p className="m-0 font-semibold">אפשר לבקש מהארגון הזמנה חדשה.</p>
                <Link href="/wallet" className="font-extrabold underline">לארנק</Link>
            </main>
        );

    const mine = await db.userContact.findUnique({ where: { kind_value: { kind: inv.kind, value: inv.value } } });
    if (mine?.userId !== session.userId)
        return (
            <main className={shell}>
                <h1 className="m-0 text-[30px]">ההזמנה נשלחה {inv.kind === "phone" ? "למספר אחר" : "למייל אחר"}</h1>
                <p className="m-0 font-semibold">היכנסו עם {inv.kind === "phone" ? "המספר" : "המייל"} שאליו נשלחה ההזמנה, או הוסיפו אותו בהגדרות תחת אמצעי התחברות.</p>
                <Link href="/settings" className="font-extrabold underline">להגדרות</Link>
            </main>
        );

    return (
        <main className={shell}>
            <h1 className="m-0 text-[30px]">הוזמנתם להצטרף</h1>
            <section className={box}>
                <b className="text-[20px]">{inv.org.name}</b>
                <p className="m-0 font-semibold text-[var(--mh-ink-soft)]">אחרי ההצטרפות הכרטיס יופיע בארנק.</p>
                <form action={answerInvitation.bind(null, token, true)}>
                    <button className="min-h-[52px] w-full rounded-full border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-sun)] text-[18px] font-extrabold shadow-[var(--mh-shadow)]">מצטרפים</button>
                </form>
                <form action={answerInvitation.bind(null, token, false)}>
                    <button className="min-h-11 w-full font-extrabold underline">לא עכשיו</button>
                </form>
            </section>
        </main>
    );
}
