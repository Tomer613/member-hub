import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { onColor } from "@/lib/color";
import { initialOf } from "@/lib/org-setup";
import { closedText, dayGroup, ilTime, inFilter, isOpen, NOTE_FILTERS, readNoteFilter, senderName } from "@/lib/notifications";
import { settleNotes } from "@/lib/notify-server";
import { FilterBar, MarkAllRead, MarkRead } from "./note-parts";

export const metadata: Metadata = { title: "הודעות · PIRI" };

// "הודעות" (boards D-Notifications, D-NotificationsDone): everything from all the orgs, grouped by day, the
// newest first. What needs doing does not jump to the top; the order is by time only.
export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ f?: string; org?: string }> }) {
    const session = await getSession();
    if (!session) redirect("/login?next=/notifications");
    const sp = await searchParams;
    const filter = readNoteFilter(sp.f);
    await settleNotes(session.userId);
    const org = sp.org ? await db.organization.findFirst({ where: { id: sp.org, orgUsers: { some: { userId: session.userId } } }, select: { id: true, name: true } }) : null;
    const all = await db.notification.findMany({
        where: { userId: session.userId, ...(org ? { orgId: org.id } : {}) },
        include: { org: { select: { name: true, packId: true, brandColor: true, logoUrl: true } } },
        orderBy: { createdAt: "desc" },
        take: 300,
    });
    const now = new Date();
    const actions = all.filter((n) => inFilter(n, "action")).length;
    const unread = all.some((n) => n.kind === "update" && !n.readAt);
    const shown = all.filter((n) => inFilter(n, filter));
    const days: { title: string; notes: typeof shown }[] = [];
    for (const n of shown) {
        const t = dayGroup(n.createdAt, now);
        if (days.at(-1)?.title === t) days.at(-1)!.notes.push(n);
        else days.push({ title: t, notes: [n] });
    }
    const empty = { all: "אין כרגע הודעות חדשות.", action: "אין כרגע משהו שמחכה לכם.", update: "אין עדכונים שלא נקראו.", done: "עוד אין כאן הודעות שהושלמו." }[filter];
    return (
        <main className="min-h-dvh bg-[var(--mh-sun)] pb-10">
            <div className="mx-auto flex w-full max-w-[820px] flex-col gap-3 px-4 pt-5 lg:[zoom:1.15] min-[1800px]:[zoom:1.45]">
                <header className="flex flex-wrap items-center gap-3">
                    <Link href="/wallet" aria-label="חזרה לארנק" className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-white shadow-[0_3px_0_var(--mh-ink)] transition-transform hover:-translate-y-px">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
                    </Link>
                    <h1 className="m-0 font-display text-[30px] font-normal leading-tight">הודעות</h1>
                    {filter !== "done" && unread && <span className="ms-auto"><MarkAllRead org={org?.id ?? null} /></span>}
                </header>
                {org && (
                    <p className="m-0 flex flex-wrap items-center gap-2 font-bold">
                        רק מ<bdi>{org.name}</bdi>
                        <Link href={`/notifications${filter === "all" ? "" : `?f=${filter}`}`} className="inline-flex min-h-11 items-center underline">להצגת הכול</Link>
                    </p>
                )}
                <FilterBar filters={NOTE_FILTERS.map((f) => ({ id: f.id, label: f.label }))} current={filter} actions={actions} org={org?.id ?? null} />
                {!days.length && <p className="m-0 rounded-[18px] border-2 border-[var(--mh-ink)] bg-white p-4 font-bold">{empty}</p>}
                {days.map((d) => (
                    <section key={d.title} aria-labelledby={`d-${d.title}`} className="flex flex-col gap-2">
                        <h2 id={`d-${d.title}`} className="m-0 mt-1 font-display text-[18px] font-normal">{d.title}</h2>
                        <ul className="m-0 flex list-none flex-col gap-3 p-0">
                            {d.notes.map((n) => {
                                const color = n.org?.brandColor ?? "#FFD84A";
                                const open = isOpen(n);
                                const body = <b className="text-[16px] leading-[1.35]">{n.text}</b>;
                                return (
                                    <li key={n.id} className={`flex overflow-hidden rounded-[20px] border-2 border-[var(--mh-ink)] shadow-[0_3px_0_var(--mh-ink)] ${open ? "bg-white" : "bg-[var(--mh-ticket)]"}`}>
                                        <span className="flex w-[60px] shrink-0 items-start justify-center border-e-2 border-[var(--mh-ink)] pt-3" style={{ background: color, color: onColor(color) }}>
                                            <span aria-hidden="true" className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--mh-ink)] bg-white font-display text-[19px] text-[var(--mh-ink)]">
                                                {n.org ? (initialOf(n.org.name) || "?") : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h18v12H3zM3 7l2-3h14l2 3M16 13h2" /></svg>}
                                            </span>
                                        </span>
                                        <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
                                            <div className="flex items-baseline justify-between gap-2 text-[14px] font-bold text-[var(--mh-ink-soft)]">
                                                <span className="truncate">{senderName(n.org)}</span>
                                                <bdi className="shrink-0">{ilTime(n.createdAt)}</bdi>
                                            </div>
                                            {n.href && open && n.kind === "update" ? <Link href={`/notifications/open/${n.id}`} className="hover:underline">{body}</Link> : body}
                                            {open ? (
                                                n.kind === "action" ? (
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        {n.href ? (
                                                            <Link href={`/notifications/open/${n.id}`} className="inline-flex min-h-11 items-center rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-sun)] px-[22px] text-[15px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none">{n.actionLabel ?? "לפרטים"}</Link>
                                                        ) : <span />}
                                                        <span className="rounded-[10px] bg-[var(--mh-ink)] px-2 py-[2px] text-[12px] font-extrabold text-white">דורש טיפול</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex"><MarkRead id={n.id} /></div>
                                                )
                                            ) : (
                                                <div className="flex justify-end"><span className="rounded-[10px] border-2 border-[var(--mh-ink)] bg-white px-2 text-[12px] font-extrabold"><bdi>{closedText(n)}</bdi></span></div>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                ))}
            </div>
        </main>
    );
}
