import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session-server";
import { AdminShell } from "@/components/admin/admin-shell";
import { activityTypes, ilDateValue, ilTimeValue, minyanText } from "@/lib/activities";
import { loadActivity, loadOrgActivities, type ActivityRow } from "@/lib/activities-server";
import { membersAdmin } from "@/lib/members-server";
import { formatShekels } from "@/lib/money";
import { hebrewAgo } from "@/lib/relative-time";
import { getPack } from "@/packs";
import { ActivityForm, type FormStart } from "./activity-form";

export const metadata: Metadata = { title: "פעילויות ואירועים · PIRI" };

const tag = "inline-flex items-center whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] px-2 text-[12px] font-extrabold";
const STATUS: Record<string, { text: string; tint: string }> = {
    draft: { text: "טיוטה", tint: "#FFF1D6" },
    published: { text: "פעיל", tint: "#D7F5E8" },
    past: { text: "הסתיים", tint: "#EEEAE2" },
    cancelled: { text: "בוטל", tint: "#FFD9DE" },
};
const statusOf = (r: ActivityRow) => (r.status === "published" && r.past ? STATUS.past : STATUS[r.status]);

// "פעילויות ואירועים" (board D-AdmActivities): the table, and beside it the form for a new activity or the one
// chosen. On a phone and tablet the form takes the screen, with a way back to the table.
export default async function ActivitiesPage({ params, searchParams }: { params: Promise<{ orgId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const { orgId } = await params;
    const sp = await searchParams;
    if (!(await getSession())) redirect("/login");
    const a = await membersAdmin(orgId);
    if (!a || !a.canManage) notFound();
    const pack = getPack(a.org.packId);
    const types = activityTypes(pack.eventTypes);
    const rows = await loadOrgActivities(orgId, a.org.packId);
    const asked = typeof sp.e === "string" ? sp.e : null;
    const picked = asked && asked !== "new" ? await loadActivity(orgId, asked) : null;
    const editing = asked === "new" || !!picked;
    const href = (e: string | null) => `/orgs/${orgId}/activities${e ? `?e=${e}` : ""}`;
    const now = new Date();

    const start: FormStart | null = !editing ? null : picked
        ? {
            id: picked.id, status: picked.status, past: picked.startsAt < now,
            input: { title: picked.title, type: types.some((t) => t.value === picked.type) ? picked.type : "general", date: ilDateValue(picked.startsAt), time: ilTimeValue(picked.startsAt), location: picked.location ?? "", about: picked.description ?? "", seats: picked.seats ? String(picked.seats) : "", signup: picked.signup, paid: !!picked.priceMinor, price: picked.priceMinor ? String(picked.priceMinor / 100) : "", fields: picked.fields },
            people: picked.people.map((p) => ({ id: p.id, name: p.name, ago: hebrewAgo(p.at, now), paid: p.paid })),
            saved: sp.saved === "p" ? "הפעילות פורסמה." : sp.saved === "d" ? "נשמר כטיוטה. רק מנהלים רואים אותה." : null,
        }
        : { id: null, status: "draft", past: false, input: { title: "", type: types[0].value, date: "", time: "19:00", location: "", about: "", seats: "", signup: true, paid: false, price: "", fields: {} }, people: [], saved: null };

    const table = rows.length ? (
        <div className="overflow-hidden rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white shadow-[0_3px_0_var(--mh-ink)]">
            <table className="w-full border-collapse text-start max-md:block">
                <thead className="max-md:hidden">
                    <tr className="bg-[var(--mh-ink)] text-[13px] text-white">
                        {["תאריך", "פעילות", "סוג", "נרשמו", "סטטוס"].map((h) => <th key={h} className="px-4 py-3 text-start font-extrabold">{h}</th>)}
                    </tr>
                </thead>
                <tbody className="max-md:block">
                    {rows.map((r) => {
                        const s = statusOf(r);
                        const on = picked?.id === r.id;
                        return (
                            <tr key={r.id} className={`border-b border-[#E6E0D4] last:border-0 max-md:block ${on ? "bg-[#FFF6D1]" : "hover:bg-[var(--mh-ticket)]"} ${r.past || r.status === "cancelled" ? "text-[var(--mh-ink-soft)]" : ""}`}>
                                <td className="whitespace-nowrap px-4 py-3 font-extrabold max-md:inline-block max-md:pb-0">{r.when}</td>
                                <td className="px-4 py-3 max-md:block max-md:py-1">
                                    <Link href={href(r.id)} aria-current={on ? "true" : undefined} className="inline-flex min-h-11 items-center font-extrabold text-[var(--mh-ink)] underline-offset-4 hover:underline">{r.title}</Link>
                                    {r.priceMinor ? <span className="ms-2 text-[13px] font-bold">· <bdi>{formatShekels(r.priceMinor)}</bdi></span> : null}
                                </td>
                                <td className="px-4 py-3 font-bold max-md:inline-block max-md:py-1 max-md:pb-3">{r.typeText}</td>
                                <td className="whitespace-nowrap px-4 py-3 font-bold max-md:inline-block max-md:py-1 max-md:pb-3 max-md:before:content-['·_']">
                                    {r.signup ? <><bdi>{r.going}</bdi>{r.seats ? <span className="text-[13px] text-[var(--mh-ink-soft)]"> מתוך <bdi>{r.seats}</bdi></span> : null}</> : <span aria-label="בלי הרשמה">—</span>}
                                    {r.fields.minyan && r.signup && r.status === "published" && !r.past && <span className="ms-2 text-[12px] font-extrabold text-[#8A5A00]">{minyanText(r.going)}</span>}
                                </td>
                                <td className="px-4 py-3 max-md:inline-block max-md:py-1 max-md:pb-3"><span className={tag} style={{ background: s.tint }}>{s.text}</span></td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    ) : (
        <section className="flex flex-col items-start gap-3 rounded-[20px] border-2 border-dashed border-[var(--mh-ink)] bg-white p-5">
            <h2 className="m-0 font-display text-[22px] font-normal">עוד אין פעילויות</h2>
            <p className="m-0 max-w-[520px] font-semibold text-[var(--mh-ink-soft)]">שיעור, ארוחה, אסיפה או טיול: פותחים פעילות, והחברים רואים אותה בכרטיס שלהם ונרשמים מהאפליקציה.</p>
        </section>
    );

    return (
        <AdminShell orgId={orgId} org={a.org} me={{ ...a.me, role: a.role }} active="activities">
            <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h1 className="m-0 font-display text-[28px] leading-tight">פעילויות ואירועים</h1>
                    <span className="font-bold text-[var(--mh-ink-soft)]">סוגי הפעילות מגיעים מהערכה של {pack.name}</span>
                </span>
                {asked !== "new" && (
                    <Link href={href("new")} className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-sun)] px-[18px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                        פעילות חדשה
                    </Link>
                )}
            </header>
            {start ? (
                <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-[14px] xl:grid-cols-[minmax(0,1fr)_420px] min-[1800px]:grid-cols-[minmax(0,1fr)_500px]">
                    <div className="max-xl:hidden">{table}</div>
                    <div className="flex flex-col gap-3">
                        <Link href={href(null)} className="self-start font-bold underline xl:hidden">לכל הפעילויות</Link>
                        <ActivityForm key={start.id ?? "new"} orgId={orgId} types={types} packFields={pack.activityFields ?? []} packName={pack.name} start={start} />
                    </div>
                </div>
            ) : table}
        </AdminShell>
    );
}
