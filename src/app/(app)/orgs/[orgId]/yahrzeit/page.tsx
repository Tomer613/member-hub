import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session-server";
import { AdminShell } from "@/components/admin/admin-shell";
import { readDedications, readRemindDays, readRules } from "@/lib/yahrzeit";
import { hasDonations } from "@/lib/donations-server";
import { familyOptions, loadYahrzeits, sendDueYahrzeitReminders, yahrzeitAdmin } from "@/lib/yahrzeit-server";
import { DedicationSettings, RemindSettings, YahrzeitForm } from "./parts";

export const metadata: Metadata = { title: "יארצייט · PIRI" };

const tag = "inline-flex items-center whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] px-2 text-[12px] font-extrabold";
const TINT = { sent: "#D7F5E8", soon: "#FFF1D6", planned: "#FFFFFF", off: "#EEEAE2" } as const;

// "יארצייט" (board D-ModSynYahrzeit), one of the synagogue's own tools: who is remembered, when the day falls
// this year by the Hebrew date, and the reminder to the family. The form and the reminder settings sit beside
// the table; on a phone and tablet they come first.
export default async function YahrzeitPage({ params, searchParams }: { params: Promise<{ orgId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const { orgId } = await params;
    const sp = await searchParams;
    if (!(await getSession())) redirect("/login");
    const a = await yahrzeitAdmin(orgId);
    if (!a) notFound();
    await sendDueYahrzeitReminders(orgId);
    const all = sp.f === "all";
    const [rows, families] = await Promise.all([loadYahrzeits(orgId, a.org.settings), familyOptions(orgId)]);
    const shown = all ? rows : rows.filter((r) => r.next && r.next.inDays <= 30);
    const asked = typeof sp.e === "string" ? sp.e : null;
    const picked = asked && asked !== "new" ? rows.find((r) => r.id === asked) ?? null : null;
    const editing = asked === "new" || !!picked;
    const href = (o: { e?: string | null; f?: boolean }) => `/orgs/${orgId}/yahrzeit?${new URLSearchParams({ ...(o.e ? { e: o.e } : {}), ...((o.f ?? all) ? { f: "all" } : {}) })}`;

    const table = shown.length ? (
        <div className="overflow-hidden rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white shadow-[0_3px_0_var(--mh-ink)]">
            <table className="w-full border-collapse text-start max-md:block">
                <thead className="max-md:hidden">
                    <tr className="bg-[var(--mh-ink)] text-[13px] text-white">
                        {["לזכר", "תאריך עברי", "השנה", "משפחה", "תזכורת"].map((h) => <th key={h} className="px-4 py-3 text-start font-extrabold">{h}</th>)}
                    </tr>
                </thead>
                <tbody className="max-md:block">
                    {shown.map((r) => {
                        const on = picked?.id === r.id;
                        return (
                            <tr key={r.id} className={`border-b border-[#E6E0D4] last:border-0 max-md:block ${on ? "bg-[#FFF6D1]" : "hover:bg-[var(--mh-ticket)]"}`}>
                                <td className="px-4 py-3 max-md:block max-md:pb-0">
                                    <Link href={href({ e: r.id })} aria-current={on ? "true" : undefined} className="inline-flex min-h-11 flex-col justify-center font-extrabold underline-offset-4 hover:underline">
                                        {r.name}
                                        <span className="text-[13px] font-bold text-[var(--mh-ink-soft)]">{r.relationText} של {r.member}</span>
                                    </Link>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 font-bold max-md:inline-block max-md:py-1">{r.hebrew}</td>
                                <td className="whitespace-nowrap px-4 py-3 font-bold max-md:inline-block max-md:py-1 max-md:before:content-['·_']">
                                    <bdi>{r.date}</bdi>
                                    {r.next && r.next.inDays <= 7 && <span className="ms-2 text-[12px] font-extrabold text-[#8A5A00]">{r.next.inDays === 0 ? "היום" : r.next.inDays === 1 ? "מחר" : `בעוד ${r.next.inDays} ימים`}</span>}
                                </td>
                                <td className="px-4 py-3 font-bold max-md:block max-md:py-1">{r.family}</td>
                                <td className="px-4 py-3 max-md:block max-md:pb-3 max-md:pt-1">
                                    <span className={tag} style={{ background: TINT[r.reminder.state] }}>{r.reminder.text}</span>
                                    {r.announce && <span className={`${tag} ms-2 bg-[#E3DDFF]`}>לקהל</span>}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    ) : (
        <section className="flex flex-col items-start gap-3 rounded-[20px] border-2 border-dashed border-[var(--mh-ink)] bg-white p-5">
            <h2 className="m-0 font-display text-[22px] font-normal">{rows.length ? "אין יארצייט ב-30 הימים הקרובים" : "עוד אין יארצייט"}</h2>
            <p className="m-0 max-w-[520px] font-semibold text-[var(--mh-ink-soft)]">{rows.length ? `יש ${rows.length === 1 ? "יארצייט אחד" : `${rows.length} יארצייטים`} ברשימה, בתאריכים רחוקים יותר.` : "מוסיפים לזכר מי, את התאריך העברי ואת המשפחה. כל שנה התאריך מחושב מחדש, והמשפחה מקבלת תזכורת לפני."}</p>
            {rows.length > 0 && <Link href={href({ f: true })} className="font-extrabold underline">להציג הכל</Link>}
        </section>
    );

    return (
        <AdminShell orgId={orgId} org={a.org} me={{ ...a.me, role: a.role }} active="yahrzeit">
            <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="flex min-w-0 flex-1 max-sm:basis-full flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h1 className="m-0 font-display text-[28px] leading-tight">יארצייט</h1>
                    <span className={`${tag} bg-[#E3DDFF]`}>בית כנסת</span>
                    <span className="font-bold text-[var(--mh-ink-soft)]">לפי התאריך העברי, מחושב מחדש כל שנה</span>
                </span>
                <nav aria-label="תקופה" className="flex gap-2">
                    {[{ f: false, t: "30 ימים" }, { f: true, t: "הכל" }].map((x) => (
                        <Link key={x.t} href={href({ e: asked, f: x.f })} aria-current={all === x.f ? "page" : undefined}
                            className={`inline-flex min-h-11 items-center rounded-full border-2 border-[var(--mh-ink)] px-4 font-extrabold transition-colors ${all === x.f ? "bg-[var(--mh-ink)] text-white" : "bg-white hover:bg-[var(--mh-ticket)]"}`}>{x.t}</Link>
                    ))}
                </nav>
                {asked !== "new" && (
                    <Link href={href({ e: "new" })} className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-sun)] px-[18px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                        הוספה
                    </Link>
                )}
            </header>
            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-[14px] xl:grid-cols-[minmax(0,1fr)_400px] min-[1800px]:grid-cols-[minmax(0,1fr)_480px]">
                <div className={editing ? "max-xl:order-2" : ""}>{table}</div>
                <div className="flex flex-col gap-[14px]">
                    {editing && (
                        <>
                            <Link href={href({})} className="self-start font-bold underline xl:hidden">לכל הרשימה</Link>
                            <YahrzeitForm key={picked?.id ?? "new"} orgId={orgId} id={picked?.id ?? null} families={families} saved={picked && sp.saved ? "היארצייט נוסף." : null}
                                start={picked ? { name: picked.name, relation: picked.relation, day: String(picked.day), month: picked.month, memberId: picked.memberId, notes: picked.notes ?? "", remind: picked.remind, announce: picked.announce }
                                    : { name: "", relation: "father", day: "1", month: "תשרי", memberId: "", notes: "", remind: true, announce: false }} />
                        </>
                    )}
                    <div className={`flex flex-col gap-[14px] ${editing ? "max-xl:hidden" : ""}`}><RemindSettings orgId={orgId} days={readRemindDays(a.org.settings)} rules={readRules(a.org.settings)} />{hasDonations(a.org.packId) && <DedicationSettings orgId={orgId} {...readDedications(a.org.settings)} />}</div>
                </div>
            </div>
        </AdminShell>
    );
}
