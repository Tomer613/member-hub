import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session-server";
import { AdminShell } from "@/components/admin/admin-shell";
import { Thread } from "@/components/inquiries/thread";
import { ADMIN_FILTERS, ADMIN_STATUS, inAdminFilter, readAdminFilter, STATUS_TINT, type AdminFilter } from "@/lib/inquiries";
import { loadInquiry, loadOrgInquiries } from "@/lib/inquiries-server";
import { membersAdmin } from "@/lib/members-server";
import { avatarPastel } from "@/lib/members-admin";
import { roleLabel } from "@/lib/wallet";
import { Composer } from "./parts";

export const metadata: Metadata = { title: "פניות · PIRI" };

const panel = "flex flex-col gap-3 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_3px_0_var(--mh-ink)] md:p-5";
const tag = "inline-flex items-center whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] px-2 text-[12px] font-extrabold";
const hue = (s: string) => avatarPastel([...s].reduce((n, c) => n + c.charCodeAt(0), 0));

// "פניות" (boards D-AdmInquiries, D-AdmInquiry): the table of what members sent, and once one is chosen, the
// list beside its conversation. What waits for the org comes first. On a phone the list and the inquiry take turns.
export default async function OrgInquiriesPage({ params, searchParams }: { params: Promise<{ orgId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const { orgId } = await params;
    const sp = await searchParams;
    if (!(await getSession())) redirect("/login");
    const a = await membersAdmin(orgId);
    if (!a || a.org.packId === "celebration") notFound();
    const filter = readAdminFilter(sp.f);
    const all = await loadOrgInquiries(orgId, a.org.packId);
    const rows = all.filter((r) => inAdminFilter(r.status, filter));
    const asked = typeof sp.i === "string" ? sp.i : null;
    const inq = asked ? await loadInquiry(orgId, asked, { userId: a.userId, staff: true }) : null;
    const href = (i: string | null, f: AdminFilter = filter) => `/orgs/${orgId}/inquiries?${new URLSearchParams({ ...(i ? { i } : {}), ...(f !== "all" ? { f } : {}) })}`;
    const signer = `${a.me.firstName?.trim() || "מנהל"} · ${roleLabel(a.role, a.org.packId)}`;
    const count = (f: AdminFilter) => all.filter((r) => inAdminFilter(r.status, f)).length;

    const filters = (
        <nav aria-label="סינון פניות" className={`-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 ${inq ? "max-lg:hidden" : ""}`}>
            {ADMIN_FILTERS.map((f) => (
                <Link key={f.id} href={href(inq?.id ?? null, f.id)} aria-current={filter === f.id ? "page" : undefined}
                    className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border-2 border-[var(--mh-ink)] px-4 font-extrabold transition-colors ${filter === f.id ? "bg-[var(--mh-ink)] text-white" : "bg-white hover:bg-[var(--mh-ticket)]"}`}>
                    {f.label}<bdi className="text-[13px] opacity-80">{count(f.id)}</bdi>
                </Link>
            ))}
        </nav>
    );
    const empty = <p className="m-0 rounded-[16px] border-2 border-dashed border-[var(--mh-ink)] bg-white p-4 font-bold">{all.length ? "אין פניות בסינון הזה." : "עוד לא נשלחו פניות. חברים שולחים פנייה מהכרטיס שלהם, או בתשובה להודעה."}</p>;

    return (
        <AdminShell orgId={orgId} org={a.org} me={{ ...a.me, role: a.role }} active="inquiries">
            <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h1 className="m-0 font-display text-[28px] leading-tight">פניות</h1>
                <span className="font-bold text-[var(--mh-ink-soft)]">בקשות ושאלות שחברים שולחים מהאפליקציה</span>
            </header>
            {filters}
            {!inq ? (
                rows.length ? (
                    <div className="overflow-hidden rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white shadow-[0_3px_0_var(--mh-ink)]">
                        <table className="w-full border-collapse text-start max-md:block">
                            <thead className="max-md:hidden">
                                <tr className="bg-[var(--mh-ink)] text-[13px] text-white">
                                    {["מי", "סוג", "פירוט", "מתי", "סטטוס"].map((h) => <th key={h} className="px-4 py-3 text-start font-extrabold">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody className="max-md:block">
                                {rows.map((r) => (
                                    <tr key={r.id} className="border-b border-[#E6E0D4] last:border-0 hover:bg-[var(--mh-ticket)] max-md:block">
                                        <td className="px-4 py-3 max-md:block max-md:pb-0">
                                            <Link href={href(r.id)} className="flex min-h-11 items-center gap-2 font-extrabold underline-offset-4 hover:underline">
                                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-[var(--mh-ink)]" style={{ background: hue(r.who) }} aria-hidden="true">{[...r.who][0]}</span>
                                                <span className="truncate">{r.who}</span>
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 font-bold max-md:inline-block max-md:py-1">{r.kindText}{r.number && <>{" "}<bdi className="text-[13px] text-[var(--mh-ink-soft)]">#{r.number}</bdi></>}</td>
                                        <td className="max-w-[360px] truncate px-4 py-3 font-semibold text-[var(--mh-ink-soft)] max-md:block max-md:max-w-none max-md:py-1">{r.line}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-[14px] font-bold max-md:inline-block max-md:py-1 max-md:pb-3">{r.ago}</td>
                                        <td className="px-4 py-3 max-md:inline-block max-md:py-1 max-md:pb-3">
                                            <span className={tag} style={{ background: STATUS_TINT[r.status] }}>{ADMIN_STATUS[r.status]}</span>
                                            {r.status !== "closed" && !r.assignee && <span className="ms-2 text-[12px] font-bold text-[var(--mh-ink-soft)]">ללא מטפל</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : empty
            ) : (
                <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-[14px] lg:grid-cols-[320px_minmax(0,1fr)] min-[1800px]:grid-cols-[380px_minmax(0,1fr)]">
                    <nav aria-label="פניות" className="flex flex-col gap-2 max-lg:hidden">
                        {rows.length ? (
                            <ul className="m-0 flex list-none flex-col gap-2 p-0">
                                {rows.map((r) => {
                                    const on = r.id === inq.id;
                                    return (
                                        <li key={r.id}>
                                            <Link href={href(r.id)} aria-current={on ? "true" : undefined} className={`flex items-center gap-2 rounded-[16px] border-2 border-[var(--mh-ink)] p-3 transition-colors ${on ? "bg-[#FFF6D1] shadow-[0_3px_0_var(--mh-ink)]" : "bg-white hover:bg-[var(--mh-ticket)]"}`}>
                                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-[var(--mh-ink)]" style={{ background: hue(r.who) }} aria-hidden="true">{[...r.who][0]}</span>
                                                <span className="flex min-w-0 flex-1 flex-col">
                                                    <b className="truncate">{r.who}</b>
                                                    <span className="truncate text-[13px] font-bold text-[var(--mh-ink-soft)]">{r.kindText}{r.number ? ` #${r.number}` : ""}</span>
                                                </span>
                                                <span className={tag} style={{ background: STATUS_TINT[r.status] }}>{ADMIN_STATUS[r.status]}</span>
                                                {r.assignee && <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-[var(--mh-ink)] bg-[#E3DDFF] text-[12px] font-extrabold" aria-label={`מטפל: ${r.assignee}`}>{[...r.assignee][0]}</span>}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : empty}
                        <p className="m-0 text-[13px] font-bold text-[var(--mh-ink-soft)]">העיגול הצבעוני הוא המנהל שמטפל בפנייה: מי שענה ראשון. פנייה בלי מטפל מגיעה לכל המנהלים.</p>
                    </nav>
                    <section className="flex flex-col gap-[14px]" aria-labelledby="inq-h">
                        <Link href={href(null)} className="self-start font-bold underline lg:hidden">לכל הפניות</Link>
                        <div className={panel}>
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 id="inq-h" className="m-0 font-display text-[22px] leading-tight">{inq.kindText}</h2>
                                {inq.number && <bdi className="font-bold text-[var(--mh-ink-soft)]">#{inq.number}</bdi>}
                                <span className={tag} style={{ background: STATUS_TINT[inq.status] }}>{ADMIN_STATUS[inq.status]}</span>
                            </div>
                            <span className="font-bold text-[var(--mh-ink-soft)]">{inq.who} · נשלחה {inq.sent}{inq.assignee ? ` · מטפל: ${inq.assignee}` : " · ללא מטפל"}</span>
                            {inq.post && <span className="font-bold">בהמשך להודעה: {inq.post}</span>}
                            {inq.follows && <Link href={href(inq.follows.id)} className="self-start font-bold underline">בהמשך לפנייה #{inq.follows.number}</Link>}
                            {inq.lines.length > 0 && (
                                <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-[14px] bg-[var(--mh-ticket)] p-3">
                                    {inq.lines.map((l) => <div key={l.label} className="contents"><dt className="font-bold text-[var(--mh-ink-soft)]">{l.label}</dt><dd className="m-0 font-extrabold"><bdi>{l.value}</bdi></dd></div>)}
                                </dl>
                            )}
                            <Thread items={inq.thread} mine="org" />
                        </div>
                        {inq.status === "closed"
                            ? <p className="m-0 rounded-[16px] border-2 border-dashed border-[var(--mh-ink)] p-4 font-bold">הפנייה נסגרה. החבר יכול לפתוח פנייה חדשה בהמשך לה.</p>
                            : <Composer key={inq.id} orgId={orgId} id={inq.id} signer={signer} />}
                        <p className="m-0 text-[13px] font-bold text-[var(--mh-ink-soft)]">אפשר לדון בפנייה עד שהיא נסגרת, והחבר מגיב באותו מקום. פנייה שנענתה נסגרת גם אוטומטית אחרי 14 ימים בלי תגובה. כל תשובה והערה נשמרות עם שם המנהל שכתב אותן.</p>
                    </section>
                </div>
            )}
        </AdminShell>
    );
}
