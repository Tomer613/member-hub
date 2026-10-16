import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { AdminShell } from "@/components/admin/admin-shell";
import { CopyLink } from "@/components/copy-link";
import { onColor } from "@/lib/color";
import { pastDue } from "@/lib/billing/kupa-server";
import { loadPosts } from "@/lib/channel-server";
import { loadMsgRecipients } from "@/lib/messages-server";
import { membersAdmin } from "@/lib/members-server";
import { formatShekels } from "@/lib/money";
import { hebrewAgo } from "@/lib/relative-time";
import { CelebrationView } from "./celebration-view";
import { RemindAll } from "./overview-parts";

export const metadata: Metadata = { title: "סקירה · PIRI" };

const panel = "flex flex-col gap-3 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_3px_0_var(--mh-ink)] md:p-5";
const btn = "inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] px-[18px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none";
const ilMonth = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(d).slice(0, 7);

// The admin overview (board D-AdmOverview): five numbers, what needs handling today, what is coming, and the
// join link. A celebration has its own organizer page instead.
export default async function OrgOverviewPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    const session = await getSession();
    if (!session) redirect("/login");
    const link = await db.orgUser.findFirst({
        where: { orgId, userId: session.userId, role: { in: ["owner", "admin", "treasurer"] }, status: "active" },
        include: { org: true },
    });
    if (!link) notFound();
    const org = link.org;
    if (org.status === "setup") redirect("/orgs/new");
    if (org.packId === "celebration") {
        if (link.role === "treasurer") notFound();
        const rsvps = await db.rsvp.findMany({ where: { orgId } });
        const ids = rsvps.flatMap((r) => (r.userId ? [r.userId] : []));
        const contacts = ids.length ? await db.userContact.findMany({ where: { userId: { in: ids }, kind: "phone" }, select: { userId: true, value: true } }) : [];
        const byPhone = Object.fromEntries(contacts.map((c) => [c.value, rsvps.find((r) => r.userId === c.userId)?.id ?? ""]));
        return <CelebrationView org={org} rsvps={rsvps} replyByPhone={byPhone} posts={await loadPosts(orgId, null)} />;
    }
    const a = await membersAdmin(orgId);
    if (!a) notFound();
    const settings = (org.settings ?? {}) as { collection?: string; account?: string; inviteWith?: string };
    const now = new Date();
    const [pending, members, reports, due, recipients, paidRecent] = await Promise.all([
        db.joinRequest.findMany({ where: { orgId, status: "pending" }, select: { createdAt: true }, orderBy: { createdAt: "asc" } }),
        db.orgUser.count({ where: { orgId, status: "active", role: { not: "guest" } } }),
        db.payment.count({ where: { orgId, status: "pending", source: "report" } }),
        pastDue(orgId),
        loadMsgRecipients(orgId),
        db.payment.findMany({ where: { orgId, status: "succeeded", receivedAt: { gte: new Date(now.getTime() - 32 * 86_400_000) } }, select: { amountMinor: true, receivedAt: true } }),
    ]);
    const collected = paidRecent.filter((p) => ilMonth(p.receivedAt) === ilMonth(now)).reduce((t, p) => t + p.amountMinor, 0);
    const debtors = recipients.filter((r) => r.owes);
    const color = org.brandColor ?? "#5B3DF5";
    const first = a.me.firstName?.trim();
    const stats = [
        { k: "חברים פעילים", v: String(members), bar: color, href: `/orgs/${orgId}/members` },
        { k: "נגבה החודש", v: formatShekels(collected), bar: "#00B67A", href: `/orgs/${orgId}/money` },
        { k: "חובות פתוחים", v: formatShekels(due.owedMinor), bar: "#C4223B", href: `/orgs/${orgId}/members?f=debt` },
        { k: "פניות פתוחות", v: "0", bar: "#18B8F0", href: null },
        { k: "בקשות הצטרפות", v: String(pending.length), bar: "#FFD84A", href: `/orgs/${orgId}/requests` },
    ];
    const tasks: ReactNode[] = [];
    if (pending.length) tasks.push(
        <Task key="req" title={pending.length === 1 ? "בקשת הצטרפות אחת" : `${pending.length} בקשות הצטרפות`} line={`הוותיקה ${hebrewAgo(pending[0].createdAt, now)}`}>
            <Link href={`/orgs/${orgId}/requests`} className={`${btn} bg-white`}>לבקשות</Link>
        </Task>,
    );
    if (debtors.length) tasks.push(
        <Task key="debt" title={debtors.length === 1 ? "חבר אחד בחוב" : `${debtors.length} חברים בחוב`} line={`${formatShekels(due.owedMinor)} סך הכול`}>
            <RemindAll orgId={orgId} linkIds={debtors.map((d) => d.linkId)} />
        </Task>,
    );
    if (reports) tasks.push(
        <Task key="rep" title={reports === 1 ? "דיווח על תשלום מחכה לאישור" : `${reports} דיווחים על תשלום מחכים לאישור`} line="חברים שילמו מחוץ לאפליקציה">
            <Link href={`/orgs/${orgId}/money`} className={`${btn} bg-white`}>לאישור</Link>
        </Task>,
    );
    if (settings.collection === "system") tasks.push(<Task key="acc" title="להשלים פרטי חשבון לקבלת כסף" line="נפתח כשנחבר את ספק התשלומים" />);

    return (
        <AdminShell orgId={orgId} org={org} me={{ ...a.me, role: a.role }} active="overview">
            <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="m-0 font-display text-[28px] leading-tight">סקירה</h1>
                <span className="font-bold text-[var(--mh-ink-soft)]">{first ? `שלום ${first}. ` : ""}הנה מה שקורה היום</span>
            </header>

            <ul aria-label="מדדים" className="m-0 grid list-none grid-cols-2 gap-[14px] p-0 sm:grid-cols-3 xl:grid-cols-5 max-sm:[&>li:last-child]:col-span-2">
                {stats.map((x) => {
                    const inner = (
                        <>
                            <span className="h-2 border-b-2 border-[var(--mh-ink)]" style={{ background: x.bar }} aria-hidden="true" />
                            <span className="flex flex-col gap-1 px-4 py-3">
                                <span className="text-[13px] font-extrabold text-[var(--mh-ink-soft)]">{x.k}</span>
                                <bdi className="font-display text-[28px] leading-none">{x.v}</bdi>
                            </span>
                        </>
                    );
                    const cls = "flex h-full flex-col overflow-hidden rounded-[18px] border-[2.5px] border-[var(--mh-ink)] bg-white shadow-[0_3px_0_var(--mh-ink)]";
                    return <li key={x.k}>{x.href ? <Link href={x.href} className={`${cls} transition-transform duration-150 hover:-translate-y-[2px]`}>{inner}</Link> : <div className={cls}>{inner}</div>}</li>;
                })}
            </ul>

            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-[14px] lg:grid-cols-2">
                <section className={panel} aria-labelledby="todo-h">
                    <h2 id="todo-h" className="m-0 font-display text-[19px]">דורש טיפול</h2>
                    {tasks.length ? <ul className="m-0 flex list-none flex-col p-0">{tasks}</ul> : <p className="m-0 rounded-[14px] bg-[var(--mh-tint-ok)] p-3 font-bold">הכול רגוע. אין כרגע משהו שמחכה לכם.</p>}
                </section>
                <div className="flex flex-col gap-[14px]">
                <section className={panel} aria-labelledby="soon-h">
                    <h2 id="soon-h" className="m-0 font-display text-[19px]">בקרוב</h2>
                    <p className="m-0 rounded-[14px] border-2 border-dashed border-[var(--mh-ink)] p-3 font-bold">כאן יופיעו שלוש הפעילויות הקרובות, עם כמה נרשמו לכל אחת, כשנבנה את כלי הפעילויות והאירועים.</p>
                </section>
                <section className={panel} aria-labelledby="join-h">
                    <h2 id="join-h" className="m-0 font-display text-[19px]">להזמין חברים</h2>
                    <span className="text-[14px] font-bold text-[var(--mh-ink-soft)]">שולחים את קישור ההצטרפות, ומאשרים את מי שמבקש.</span>
                    {org.joinToken && <CopyLink path={`/join/${org.joinToken}`} />}
                    <Link href={`/orgs/${orgId}/members/add`} className={`${btn} self-start`} style={{ background: color, color: onColor(color) }}>עוד דרכים להוסיף חברים</Link>
                </section>
                </div>
            </div>
        </AdminShell>
    );
}

function Task({ title, line, children }: { title: string; line: string; children?: ReactNode }) {
    return (
        <li className="flex flex-wrap items-center gap-3 border-b-[1.5px] border-[#EDE6D6] py-3 first:pt-0 last:border-0 last:pb-0">
            <span className="flex min-w-0 flex-1 flex-col">
                <b className="text-[16px]">{title}</b>
                <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">{line}</span>
            </span>
            {children}
        </li>
    );
}
