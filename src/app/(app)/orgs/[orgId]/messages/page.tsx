import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session-server";
import { AdminShell } from "@/components/admin/admin-shell";
import { ReactionIcon } from "@/components/channel/reaction-icon";
import { onColor } from "@/lib/color";
import { avatarPastel } from "@/lib/members-admin";
import { reactedText, readByText, readReaderFilter, remindLabel } from "@/lib/messages-admin";
import { loadMessage, loadMessageList } from "@/lib/messages-server";
import { membersAdmin } from "@/lib/members-server";
import { REACTIONS } from "@/lib/reactions";
import { DraftRemove, RemindButton } from "./parts";

export const metadata: Metadata = { title: "הודעות · PIRI" };

const panel = "flex flex-col gap-3 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_3px_0_var(--mh-ink)] md:p-5";
const btn = "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] px-[18px] text-[15px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none";
const chip = "inline-flex min-h-8 items-center rounded-full border-2 border-[var(--mh-ink)] px-3 text-[14px] font-extrabold";

// "הודעות" (board D-AdmMessages): sent messages and drafts on one side, and the chosen message with who read it
// and how they reacted. On a phone the list and the message take turns.
export default async function MessagesPage({ params, searchParams }: { params: Promise<{ orgId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const { orgId } = await params;
    const sp = await searchParams;
    if (!(await getSession())) redirect("/login");
    const a = await membersAdmin(orgId);
    if (!a) notFound();
    const color = a.org.brandColor ?? "#5B3DF5";
    const list = await loadMessageList(orgId);
    const asked = typeof sp.m === "string" ? sp.m : null;
    const firstSent = list.find((m) => !m.draft)?.id ?? null;
    const msg = await (asked ?? firstSent ? loadMessage(orgId, (asked ?? firstSent)!) : null);
    const filter = readReaderFilter(sp.f);
    const rows = msg ? (filter === "unread" ? msg.rows.filter((r) => !r.readAgo) : msg.rows) : [];
    const unread = msg ? msg.rows.length - msg.read : 0;
    const href = (m: string | null, f = filter) => `/orgs/${orgId}/messages?${new URLSearchParams({ ...(m ? { m } : {}), ...(f === "unread" ? { f } : {}) })}`;

    return (
        <AdminShell orgId={orgId} org={a.org} me={{ ...a.me, role: a.role }} active="messages">
            <header className="flex flex-wrap items-center gap-3">
                <h1 className="m-0 font-display text-[28px] leading-tight">הודעות</h1>
                {msg && (
                    <Link href={href(msg.id, filter === "unread" ? "all" : "unread")} aria-pressed={filter === "unread"} className={`${btn} ms-auto ${filter === "unread" ? "bg-[var(--mh-ink)] text-white" : "bg-white"} ${asked ? "" : "max-lg:hidden"}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 5h18l-7 8v6l-4 2v-8z" /></svg>
                        {filter === "unread" ? "מסנן: לא קראו" : "להציג רק מי שלא קרא"}
                    </Link>
                )}
            </header>

            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-[14px] lg:grid-cols-[340px_minmax(0,1fr)]">
                <nav aria-label="הודעות שנשלחו" className={`flex flex-col gap-2 ${asked ? "max-lg:hidden" : ""}`}>
                    {<Link href={`/orgs/${orgId}/messages/new`} className={`${btn} w-full`} style={{ background: color, color: onColor(color) }}>+ הודעה חדשה</Link>}
                    {!list.length && <p className="m-0 rounded-[16px] border-2 border-dashed border-[var(--mh-ink)] bg-white p-4 font-bold">עוד לא נשלחו הודעות. הודעה שתשלחו תופיע אצל החברים בכרטיס שבארנק.</p>}
                    <ul className="m-0 flex list-none flex-col gap-2 p-0">
                        {list.map((m) => {
                            const on = !m.draft && m.id === msg?.id;
                            return (
                                <li key={m.id} className={`flex items-center gap-2 rounded-[16px] border-2 border-[var(--mh-ink)] p-3 ${on ? "bg-[#FFF6D1] shadow-[0_3px_0_var(--mh-ink)]" : "bg-white"}`}>
                                    <Link href={m.draft ? `/orgs/${orgId}/messages/new?draft=${m.id}` : href(m.id)} aria-current={on ? "true" : undefined} className="flex min-h-11 min-w-0 flex-1 flex-col justify-center rounded-[10px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)]">
                                        <b className="truncate">{m.title}</b>
                                        <span className="truncate text-[13px] font-bold text-[var(--mh-ink-soft)]">{m.draft ? "טיוטה · להמשך כתיבה" : m.line}</span>
                                    </Link>
                                    {m.draft && <DraftRemove orgId={orgId} id={m.id} />}
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {msg ? (
                    <section className={`flex flex-col gap-[14px] ${asked ? "" : "max-lg:hidden"}`} aria-labelledby="msg-title">
                        <Link href={href(null)} className="self-start font-bold underline lg:hidden">לכל ההודעות</Link>
                        <div className={panel}>
                            <h2 id="msg-title" className="m-0 font-display text-[22px] leading-tight">{msg.title}</h2>
                            <span className="font-bold text-[var(--mh-ink-soft)]">{msg.sent}</span>
                            <p className="m-0 whitespace-pre-line rounded-[14px] bg-[var(--mh-ticket)] p-3 font-semibold leading-relaxed">{msg.body}</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={chip} style={{ background: "#D7F5E8" }}>{readByText(msg.read, msg.rows.length)}</span>
                                {msg.reactable && <span className={chip} style={{ background: "#E3DDFF" }}>{reactedText(msg.reacted)}</span>}
                                {msg.channels.includes("email") && <span className="text-[13px] font-bold text-[var(--mh-ink-soft)]">נשלחה באפליקציה ובמייל</span>}
                            </div>
                            {unread > 0 && <RemindButton orgId={orgId} id={msg.id} label={remindLabel(unread)} done={msg.reminded} />}
                            {msg.reactable && (
                                <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-2 p-0" aria-label="סיכום תגובות">
                                    {REACTIONS.map((r) => {
                                        const n = msg.counts.find((c) => c.kind === r.kind)?.count ?? 0;
                                        return (
                                            <li key={r.kind} className={`flex items-center gap-1 font-extrabold ${n ? "" : "opacity-40"}`} aria-label={`${r.label}: ${n}`}>
                                                <ReactionIcon kind={r.kind} /><bdi aria-hidden="true">{n}</bdi>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        <div className={panel}>
                            <h3 className="m-0 font-display text-[19px]">{filter === "unread" ? "מי עוד לא קרא" : "מי קרא"}</h3>
                            {!rows.length ? (
                                <p className="m-0 font-bold">{filter === "unread" ? "כולם קראו." : "אין נמענים."}</p>
                            ) : (
                                <table className="w-full border-collapse text-start">
                                    <thead>
                                        <tr className="border-b-2 border-[var(--mh-ink)] text-[13px] text-[var(--mh-ink-soft)]">
                                            <th className="py-2 text-start font-extrabold">חבר/ה</th>
                                            <th className="py-2 text-start font-extrabold">נקראה</th>
                                            {msg.reactable && <th className="py-2 text-start font-extrabold">תגובה</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((r) => (
                                            <tr key={r.userId} className="border-b border-[#E6E0D4] last:border-0">
                                                <td className="py-2">
                                                    <span className="flex min-w-0 items-center gap-2">
                                                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-[var(--mh-ink)] font-extrabold" style={{ background: avatarPastel([...r.name].reduce((n, c) => n + c.charCodeAt(0), 0)) }} aria-hidden="true">{[...r.name][0]}</span>
                                                        <b className="truncate">{r.name}</b>
                                                    </span>
                                                </td>
                                                <td className="py-2 font-bold">{r.readAgo ?? <span className={chip} style={{ background: "#FFE9E6" }}>לא נקראה</span>}</td>
                                                {msg.reactable && (
                                                    <td className="py-2">
                                                        {r.reaction ? <span className="inline-flex" aria-label={REACTIONS.find((x) => x.kind === r.reaction)?.label}><ReactionIcon kind={r.reaction} size={24} /></span> : <span aria-label="בלי תגובה">—</span>}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            <p className="m-0 rounded-[14px] bg-[var(--mh-ticket)] p-3 text-[14px] font-bold">רק ההנהלה רואה מי קרא ומי הגיב. החברים רואים אייקוני תגובה עם מספרים, בלי שמות.</p>
                        </div>
                    </section>
                ) : (
                    list.length > 0 && <p className="m-0 font-bold max-lg:hidden">בחרו הודעה מהרשימה.</p>
                )}
            </div>
        </AdminShell>
    );
}
