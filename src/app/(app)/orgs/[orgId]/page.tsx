import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { CopyLink } from "@/components/copy-link";
import { OrgCard } from "@/components/org-card";
import { CelebrationView } from "./celebration-view";

export const metadata: Metadata = { title: "סקירה · PIRI" };

const box = "flex flex-col gap-3 rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-white p-[clamp(16px,2vw,24px)] shadow-[0_4px_0_var(--mh-ink)]";

// First version of the admin overview ("סקירה"), where setup continues after the wizard: the tasks still
// open and the join link. The full overview (approved board D-AdmOverview) comes with the admin screens.
export default async function OrgOverviewPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    const session = await getSession();
    if (!session) redirect("/login");
    const link = await db.orgUser.findFirst({
        where: { orgId, userId: session.userId, role: { in: ["owner", "admin"] }, status: "active" },
        include: { org: true },
    });
    if (!link) notFound();
    const org = link.org;
    if (org.status === "setup") redirect("/orgs/new");
    if (org.packId === "celebration") {
        const rsvps = await db.rsvp.findMany({ where: { orgId } });
        const ids = rsvps.flatMap((r) => (r.userId ? [r.userId] : []));
        const contacts = ids.length ? await db.userContact.findMany({ where: { userId: { in: ids }, kind: "phone" }, select: { userId: true, value: true } }) : [];
        const byPhone = Object.fromEntries(contacts.map((c) => [c.value, rsvps.find((r) => r.userId === c.userId)?.id ?? ""]));
        return <CelebrationView org={org} rsvps={rsvps} replyByPhone={byPhone} />;
    }
    const settings = (org.settings ?? {}) as { collection?: string; account?: string; inviteWith?: string };
    const [requests, invites, members] = await Promise.all([
        db.joinRequest.count({ where: { orgId, status: "pending" } }),
        db.invitation.count({ where: { orgId, status: "pending" } }),
        db.orgUser.count({ where: { orgId, status: "active" } }),
    ]);

    return (
        <main className="min-h-dvh bg-[var(--mh-sun)]">
            <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-4 px-[clamp(12px,3vw,32px)] py-[clamp(14px,2.5vw,28px)]">
                <header className="flex flex-wrap items-baseline justify-between gap-3">
                    <h1 className="m-0 font-display text-[clamp(26px,2.6vw,34px)]">סקירה</h1>
                    <Link href="/wallet" className="min-h-10 content-center font-extrabold underline">לארנק</Link>
                </header>
                <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,1fr)]">
                    <section className={box}>
                        <h2 className="m-0 font-display text-[24px]">הארגון פתוח. מה נשאר לעשות</h2>
                        <ul className="m-0 flex list-none flex-col gap-2 p-0">
                            {requests > 0 && (
                                <Task title={requests === 1 ? "בקשת הצטרפות אחת מחכה" : `${requests} בקשות הצטרפות מחכות`} line="מי שנכנס בקישור מחכה לאישור שלכם.">
                                    <Link href={`/orgs/${orgId}/requests`} className="inline-flex min-h-11 items-center self-start rounded-full border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-sun)] px-5 font-extrabold shadow-[var(--mh-shadow)]">לבקשות</Link>
                                </Task>
                            )}
                            {settings.collection === "system" && (
                                <Task title="להשלים את פרטי החשבון לקבלת כסף" line="עד אז הגבייה דרך המערכת מחכה. החיבור לספק התשלומים עוד בבנייה." soon />
                            )}
                            {settings.inviteWith === "import" && <Task title="לייבא את רשימת החברים מקובץ" line="מסך הייבוא עוד בבנייה." soon />}
                            <Task title="להזמין חברים" line="שולחים את קישור ההצטרפות, ומאשרים את מי שמבקש.">
                                {org.joinToken && <CopyLink path={`/join/${org.joinToken}`} />}
                            </Task>
                        </ul>
                    </section>
                    <aside className="flex flex-col gap-4">
                        <OrgCard name={org.name} city={org.city} color={org.brandColor ?? "#5B3DF5"} logo={org.logoUrl} />
                        <div className={box}>
                            <Stat k="חברים פעילים" v={members} />
                            <Stat k="בקשות הצטרפות שמחכות" v={requests} href={`/orgs/${orgId}/requests`} />
                            <Stat k="הזמנות שעוד לא נענו" v={invites} />
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
}

function Task({ title, line, soon = false, children }: { title: string; line: string; soon?: boolean; children?: ReactNode }) {
    return (
        <li className="flex flex-col gap-2 rounded-[18px] border-2 border-[var(--mh-ink)] bg-[var(--mh-ticket)] p-[14px]">
            <span className="flex flex-wrap items-center gap-2">
                <b className="text-[18px]">{title}</b>
                {soon && <span className="rounded-full border-2 border-[var(--mh-ink)] bg-white px-2 text-[12px] font-extrabold">בקרוב</span>}
            </span>
            <span className="font-semibold text-[var(--mh-ink-soft)]">{line}</span>
            {children}
        </li>
    );
}

function Stat({ k, v, href }: { k: string; v: number; href?: string }) {
    return (
        <div className="flex items-center justify-between gap-3 border-b-2 border-[var(--mh-line-soft)] pb-2 last:border-0 last:pb-0">
            {href ? <Link href={href} className="font-semibold text-[var(--mh-ink-soft)] underline">{k}</Link> : <span className="font-semibold text-[var(--mh-ink-soft)]">{k}</span>}
            <b className="font-display text-[22px]"><bdi>{v}</bdi></b>
        </div>
    );
}
