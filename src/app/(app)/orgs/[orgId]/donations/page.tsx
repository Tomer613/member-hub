import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session-server";
import { AdminShell } from "@/components/admin/admin-shell";
import { onColor } from "@/lib/color";
import { FILTERS, inFilter, readFilter, STATUS_TEXT } from "@/lib/donations";
import { donationsAdmin, loadPledges, pledgeNumbers, type PledgeRow } from "@/lib/donations-server";
import { formatShekels } from "@/lib/money";
import { familyOptions } from "@/lib/yahrzeit-server";
import { RecordForm } from "../money/forms";
import { CancelPledge, PledgeForm } from "./parts";

export const metadata: Metadata = { title: "תרומות ונדרים · PIRI" };

const panel = "flex flex-col gap-4 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_3px_0_var(--mh-ink)] md:p-5";
const tag = "inline-flex min-h-6 items-center whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] px-[10px] text-[12.5px] font-extrabold";
const PART: Record<string, { text: string; tint: string }> = {
    paid: { text: "שולם", tint: "#D7F5E8" },
    pending: { text: "ממתין לאישור", tint: "#E3DDFF" },
    open: { text: "פתוח", tint: "#FFFFFF" },
    voided: { text: "בוטל", tint: "#EEEAE2" },
};
const SAVED: Record<string, string> = { "1": "החיוב נוצר בכרטיס החבר.", paid: "נרשם כשולם, והקבלה נשמרה בארנק של החבר." };
const ilDay = (plus = 0) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date(Date.now() + plus * 86_400_000));

// "תרומות ונדרים" (board D-ModSynDonations): every aliyah, pledge and donation, each one a charge on the member's
// card (or a few monthly ones). Beside the table: what is still owed, what came in this month, and the form.
export default async function DonationsPage({ params, searchParams }: { params: Promise<{ orgId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const { orgId } = await params;
    const sp = await searchParams;
    if (!(await getSession())) redirect("/login");
    const a = await donationsAdmin(orgId);
    if (!a) notFound();
    const color = a.org.brandColor ?? "#5B3DF5";
    const ink = onColor(color);
    const filter = readFilter(sp.f);
    const asked = typeof sp.e === "string" ? sp.e : null;
    const [rows, members] = await Promise.all([loadPledges(orgId), familyOptions(orgId)]);
    const nums = await pledgeNumbers(orgId, rows);
    const picked = asked && asked !== "new" ? rows.find((r) => r.id === asked) ?? null : null;
    const shown = rows.filter((r) => inFilter(r.status, filter));
    const href = (o: { e?: string | null; f?: string }) => {
        const q = new URLSearchParams();
        const f = o.f ?? filter;
        if (f !== "all") q.set("f", f);
        if (o.e) q.set("e", o.e);
        const s = q.toString();
        return `/orgs/${orgId}/donations${s ? `?${s}` : ""}`;
    };
    const saved = typeof sp.saved === "string" ? (SAVED[sp.saved] ?? (/^n\d+$/.test(sp.saved) ? `נוצרו ${sp.saved.slice(1)} חיובים חודשיים בכרטיס החבר.` : null)) : null;
    // On a computer the side column is always there (the board); on a phone and tablet it opens in place of the table.
    const side = !!asked;

    const stats = (
        <div className="grid grid-cols-2 gap-[10px]">
            {[
                { v: nums.openMinor, k: "נדרים פתוחים", top: "var(--mh-sun)" },
                { v: nums.monthMinor, k: "נגבה החודש", top: "var(--mh-ok)" },
            ].map((x) => (
                <div key={x.k} className="flex min-w-0 flex-col rounded-[18px] border-[2.5px] border-t-8 border-[var(--mh-ink)] bg-white px-4 py-3 shadow-[0_3px_0_var(--mh-ink)]" style={{ borderTopColor: x.top }}>
                    <bdi className="truncate font-display text-[28px] leading-tight">{formatShekels(x.v)}</bdi>
                    <span className="font-extrabold">{x.k}</span>
                </div>
            ))}
        </div>
    );

    const table = (
        <section className={`${panel} gap-2`} aria-labelledby="dn-h">
            <div className="flex flex-wrap items-center gap-2">
                <span className="me-auto flex min-w-0 flex-col">
                    <h2 id="dn-h" className="m-0 font-display text-[19px]">נדרים ותרומות</h2>
                    <span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">כל עלייה ונדר הופכים לחיוב בכרטיס החבר</span>
                </span>
                <nav aria-label="סינון" className="flex gap-2">
                    {FILTERS.map((f) => (
                        <Link key={f.value} href={href({ f: f.value, e: picked?.id })} aria-current={filter === f.value ? "page" : undefined}
                            className={`inline-flex min-h-10 items-center rounded-full border-2 border-[var(--mh-ink)] px-3 text-[13px] font-extrabold transition-colors ${filter === f.value ? "bg-[var(--mh-sun)]" : "bg-white hover:bg-[var(--mh-ticket)]"}`}>{f.label}</Link>
                    ))}
                </nav>
                <Link href={href({ e: "new" })} className="inline-flex min-h-10 items-center gap-[6px] rounded-full border-2 border-[var(--mh-ink)] px-[18px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none" style={{ background: color, color: ink }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                    נדר
                </Link>
            </div>
            {shown.length ? (
                <table className="w-full border-collapse text-start max-md:block">
                    <thead className="max-md:hidden">
                        <tr className="border-b-2 border-[var(--mh-ink)] text-[13px] text-[var(--mh-ink-soft)]">
                            {["תורם", "סוג", "מה", "סכום", "סטטוס"].map((h) => <th key={h} className={`px-3 py-2 font-extrabold ${h === "סכום" ? "text-end" : "text-start"}`}>{h}</th>)}
                        </tr>
                    </thead>
                    <tbody className="max-md:block">
                        {shown.map((r) => {
                            const s = STATUS_TEXT[r.status];
                            const on = picked?.id === r.id;
                            return (
                                <tr key={r.id} className={`border-b-[1.5px] border-[#EDE6D6] font-semibold last:border-0 max-md:flex max-md:flex-wrap max-md:items-center max-md:gap-x-2 max-md:py-2 ${on ? "bg-[#FFF6D1]" : "hover:bg-[var(--mh-ticket)]"} ${r.status === "cancelled" ? "text-[var(--mh-ink-soft)]" : ""}`}>
                                    <td className="px-3 py-1 max-md:basis-full max-md:px-1 max-md:py-0">
                                        <Link href={href({ e: r.id })} aria-current={on ? "true" : undefined} className="inline-flex min-h-10 items-center font-extrabold text-[var(--mh-ink)] underline-offset-4 hover:underline">{r.name}</Link>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-1 max-md:px-1 max-md:py-0">{r.kindText}</td>
                                    <td className="px-3 py-1 max-md:px-1 max-md:py-0 max-md:before:content-['·_']">{r.purpose}</td>
                                    <td className="whitespace-nowrap px-3 py-1 text-end max-md:me-auto max-md:px-1 max-md:py-0 max-md:before:content-['·_']"><bdi><b>{formatShekels(r.amountMinor)}</b></bdi></td>
                                    <td className="px-3 py-1 max-md:px-1 max-md:py-0"><span className={tag} style={{ background: s.tint }}>{s.text}</span></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            ) : (
                <p className="m-0 rounded-[14px] bg-[var(--mh-ticket)] p-3 font-bold">
                    {rows.length ? "אין כאן כלום בסינון הזה." : "עוד אין נדרים ותרומות. כשתרשמו עלייה, נדר או תרומה, הם יופיעו כאן, והחבר יראה את החיוב בכרטיס שלו."}
                </p>
            )}
        </section>
    );

    return (
        <AdminShell orgId={orgId} org={a.org} me={{ ...a.me, role: a.role }} active="donations">
            <header className="flex flex-wrap items-center gap-3">
                <h1 className="m-0 font-display text-[28px] leading-tight">תרומות ונדרים</h1>
                <span className="flex-1" />
                <span className="inline-flex min-h-[22px] items-center whitespace-nowrap rounded-full border-2 border-dashed border-[var(--mh-ink)] bg-[#E3DDFF] px-[9px] text-[12px] font-extrabold">בית כנסת</span>
            </header>
            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-[14px] xl:grid-cols-[minmax(0,1fr)_380px] min-[1800px]:grid-cols-[minmax(0,1fr)_460px]">
                <div className={`flex min-w-0 flex-col gap-[14px] ${side ? "max-xl:hidden" : ""}`}>
                    <div className="xl:hidden">{stats}</div>
                    {table}
                </div>
                <div className={`flex min-w-0 flex-col gap-[14px] ${side ? "" : "max-xl:hidden"}`}>
                    <Link href={href({ e: null })} className="self-start font-bold underline xl:hidden">לכל הנדרים והתרומות</Link>
                    <div className="max-xl:hidden">{stats}</div>
                    {picked ? <Detail orgId={orgId} r={picked} saved={saved} /> : (
                        <PledgeForm key={asked ?? "side"} orgId={orgId} members={members} today={ilDay()} first={ilDay(14)} color={color} ink={ink} />
                    )}
                </div>
            </div>
        </AdminShell>
    );
}

// One pledge: its charges, recording a payment that came outside the app, and cancelling.
function Detail({ orgId, r, saved }: { orgId: string; r: PledgeRow; saved: string | null }) {
    const s = STATUS_TEXT[r.status];
    const firstOpen = r.status === "cancelled" ? null : r.parts.find((p) => p.state === "open");
    const what = `ה${r.kindText} "${r.purpose}"`;
    return (
        <section className={panel} aria-labelledby="pd-h">
            <div className="flex flex-wrap items-start gap-2">
                <span className="me-auto flex min-w-0 flex-col">
                    <h2 id="pd-h" className="m-0 font-display text-[22px] leading-tight">{r.kindText} · {r.purpose}</h2>
                    <span className="font-bold text-[var(--mh-ink-soft)]">{r.name}</span>
                </span>
                <span className={tag} style={{ background: s.tint }}>{s.text}</span>
            </div>
            {saved && <p role="status" className="m-0 rounded-[14px] bg-[#D7F5E8] p-3 font-bold text-[#00573A]">{saved}</p>}
            <dl className="m-0 grid grid-cols-2 gap-3">
                <div className="flex flex-col"><dt className="text-[13px] font-extrabold text-[var(--mh-ink-soft)]">סכום</dt><dd className="m-0 font-display text-[24px]"><bdi>{formatShekels(r.amountMinor)}</bdi></dd></div>
                <div className="flex flex-col"><dt className="text-[13px] font-extrabold text-[var(--mh-ink-soft)]">שולם</dt><dd className="m-0 font-display text-[24px]"><bdi>{formatShekels(r.paidMinor)}</bdi></dd></div>
            </dl>
            <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label="החיובים">
                {r.parts.map((p) => {
                    const t = PART[p.state];
                    return (
                        <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[14px] border-2 border-[var(--mh-ink)] px-3 py-2">
                            <span className="flex min-w-0 flex-1 flex-col">
                                <b className="text-[15px]">{r.installments > 1 ? p.title.slice(p.title.lastIndexOf("(") + 1, -1) : "תשלום אחד"}</b>
                                <span className="text-[13px] font-bold text-[var(--mh-ink-soft)]">עד {p.due}{p.state === "open" && p.leftMinor < p.amountMinor ? <> · נשארו <bdi>{formatShekels(p.leftMinor)}</bdi></> : null}</span>
                            </span>
                            <bdi className="font-extrabold">{formatShekels(p.amountMinor)}</bdi>
                            <span className={tag} style={{ background: t.tint }}>{t.text}</span>
                        </li>
                    );
                })}
            </ul>
            {r.note && <p className="m-0 rounded-[14px] bg-[var(--mh-ticket)] p-3 font-semibold"><b>הערה: </b>{r.note}</p>}
            {firstOpen && (
                <div className="flex flex-col gap-2">
                    <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">שילמו במזומן, בהעברה או בצ׳ק? רושמים כאן, והחבר מקבל קבלה בארנק.</span>
                    <RecordForm chargeId={firstOpen.id} who={r.name} left={formatShekels(firstOpen.leftMinor)} leftValue={String(firstOpen.leftMinor / 100)} today={ilDay()} />
                </div>
            )}
            {r.status !== "cancelled" && r.status !== "paid" && <CancelPledge orgId={orgId} id={r.id} what={what} />}
        </section>
    );
}
