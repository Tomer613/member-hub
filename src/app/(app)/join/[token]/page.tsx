import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { OrgCard } from "@/components/org-card";
import { requestJoinByLink } from "./actions";

export const metadata: Metadata = { title: "הצטרפות · PIRI" };

const shell = "mx-auto flex min-h-dvh max-w-[480px] flex-col justify-center gap-[14px] bg-[var(--mh-sun)] px-4 py-[18px]";

// Where an org's shared join link lands. The person asks to join and the org's admins approve.
export default async function JoinLinkPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    // A celebration's link opens its invitation, where guests reply without signing in.
    if (await db.organization.findFirst({ where: { joinToken: token, packId: "celebration" }, select: { id: true } })) redirect(`/c/${token}`);
    const session = await getSession();
    if (!session) redirect(`/login?next=${encodeURIComponent(`/join/${token}`)}`);
    const org = await db.organization.findFirst({ where: { joinToken: token, status: "active" } });
    if (!org)
        return (
            <main className={shell}>
                <h1 className="m-0 text-[30px]">הקישור כבר לא פעיל</h1>
                <p className="m-0 font-semibold">אפשר לבקש מהארגון קישור חדש.</p>
                <Link href="/wallet" className="font-extrabold underline">לארנק</Link>
            </main>
        );
    const member = await db.orgUser.findUnique({ where: { orgId_userId: { orgId: org.id, userId: session.userId } } });
    const open = await db.joinRequest.findFirst({ where: { orgId: org.id, userId: session.userId, status: "pending" } });
    const last = await db.joinRequest.findFirst({ where: { orgId: org.id, userId: session.userId }, orderBy: { createdAt: "desc" } });
    const declined = !member && !open && last?.status === "rejected";
    const color = org.brandColor ?? "#5B3DF5";

    return (
        <main className={shell}>
            <h1 className="m-0 text-[30px]">{member ? "אתם כבר חברים כאן" : open ? "הבקשה נשלחה" : declined ? "הבקשה לא אושרה" : "בקשה להצטרף"}</h1>
            <OrgCard name={org.name} city={org.city} color={color} logo={org.logoUrl} />
            {member ? (
                <Link href="/wallet" className="flex min-h-[52px] items-center justify-center rounded-full border-[2.5px] border-[var(--mh-ink)] bg-white text-[18px] font-extrabold shadow-[var(--mh-shadow)]">לארנק</Link>
            ) : declined ? (
                <>
                    <p className="m-0 font-semibold">{org.name} לא אישרו את בקשת ההצטרפות.</p>
                    <Link href="/wallet" className="flex min-h-[52px] items-center justify-center rounded-full border-[2.5px] border-[var(--mh-ink)] bg-white text-[18px] font-extrabold shadow-[var(--mh-shadow)]">הבנתי</Link>
                </>
            ) : open ? (
                <>
                    <p className="m-0 font-semibold">כשמנהלי הארגון יאשרו, הכרטיס יופיע בארנק שלכם.</p>
                    <Link href="/wallet" className="font-extrabold underline">לארנק</Link>
                </>
            ) : (
                <>
                    <p className="m-0 font-semibold">מנהלי הארגון יקבלו את הבקשה ויאשרו אותה. אחרי האישור הכרטיס יופיע בארנק.</p>
                    <form action={requestJoinByLink.bind(null, token)} className="flex flex-col gap-3">
                        <label className="flex flex-col gap-1">
                            <span className="text-[14px] font-extrabold">כמה מילים עליכם <span className="font-semibold text-[var(--mh-ink-soft)]">(לא חובה)</span></span>
                            <textarea name="message" rows={3} maxLength={300} placeholder="למשל: גרים בדירה 4 מאז הקיץ" className="rounded-[14px] border-2 border-[var(--mh-ink)] bg-white px-[14px] py-3 font-semibold outline-none placeholder:text-[var(--mh-ink-soft)] focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)]" />
                        </label>
                        <button className="min-h-[52px] w-full rounded-full border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-org-violet)] text-[18px] font-extrabold text-white shadow-[var(--mh-shadow)]">לבקש להצטרף</button>
                    </form>
                    <Link href="/wallet" className="min-h-11 self-center content-center font-extrabold underline">לא עכשיו</Link>
                </>
            )}
        </main>
    );
}
