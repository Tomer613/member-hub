"use client";

import Link from "next/link";
import { useId, useState, useTransition, type ReactNode } from "react";
import { TAG_ICON } from "@/components/labels/stamp";
import { onColor } from "@/lib/color";
import { avatarPastel } from "@/lib/members-admin";
import { filterActive, fullDetails, inRequestFilter, NO_FILTER, NOTE_MAX, REQUEST_SOURCES, REQUEST_TABS, sourceLabel, type RequestFilter, type RequestRow, type RequestSource, type RequestTab } from "@/lib/requests-admin";
import { approveRequests, declineRequest, type RequestResult } from "./actions";

type Plan = { id: string; name: string };
type Label = { id: string; name: string; color: string };
type Open = { kind: "approve" | "decline"; id: string } | { kind: "bulk"; scope: "all" | "shown" } | null;

const frame = "rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white shadow-[0_3px_0_var(--mh-ink)]";
const btn = "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] px-[18px] text-[15px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none disabled:opacity-60";
const chip = (on: boolean) => `inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] px-4 text-[15px] font-extrabold transition-colors ${on ? "bg-[var(--mh-ink)] text-white" : "bg-white hover:bg-[var(--mh-ticket)]"}`;
const count = "inline-flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-[#FF8A6B] px-1 text-[11px] text-[var(--mh-ink)]";
const approveLabel = (n: number) => (n === 1 ? "לאשר בקשה אחת" : `לאשר ${n} בקשות`);
const COLS = "lg:grid lg:grid-cols-[minmax(0,1.5fr)_150px_minmax(0,1.4fr)_110px_220px] lg:items-center lg:gap-4";

export function RequestsBoard({ orgId, color, tab, counts, rows, plans, labels }: {
    orgId: string; color: string; tab: RequestTab; counts: Record<RequestTab, number>;
    rows: RequestRow[]; plans: Plan[]; labels: Label[];
}) {
    const [f, setF] = useState<RequestFilter>(NO_FILTER);
    const [open, setOpen] = useState<Open>(null);
    const [note, setNote] = useState<RequestResult | null>(null);
    const [busy, start] = useTransition();
    const shown = rows.filter((r) => inRequestFilter(r, f));
    const listedCount = rows.filter((r) => r.listed).length;
    const fullCount = rows.filter(fullDetails).length;
    const pending = tab === "pending";
    const choosing = plans.length > 0 || labels.length > 0;

    const run = (job: () => Promise<RequestResult>) => {
        setNote(null);
        start(async () => {
            const r = await job();
            setNote(r);
            if (r.ok) setOpen(null);
        });
    };
    const approve = (ids: string[] | "all", choice = { planId: "", labelIds: [] as string[] }) => run(() => approveRequests(orgId, ids, choice));
    const askApprove = (id: string) => (choosing ? setOpen({ kind: "approve", id }) : approve([id]));
    const askBulk = (scope: "all" | "shown") => (choosing ? setOpen({ kind: "bulk", scope }) : approve(scope === "all" ? "all" : shown.map((r) => r.id)));

    return (
        <div className="flex flex-col gap-[14px]">
            <header className="flex flex-wrap items-center gap-3">
                <span className="flex flex-col">
                    <h1 className="m-0 font-display text-[28px] leading-tight">בקשות הצטרפות</h1>
                    <span className="font-bold text-[var(--mh-ink-soft)]">{counts.pending === 0 ? "אין בקשות שמחכות" : counts.pending === 1 ? "בקשה אחת ממתינה" : `${counts.pending} ממתינות`}</span>
                </span>
                {pending && rows.length > 1 && (
                    <button type="button" disabled={busy} onClick={() => askBulk("all")} className={`${btn} ms-auto bg-white`}>לאשר הכול ({rows.length})</button>
                )}
            </header>

            {note?.ok && <p role="status" className="m-0 rounded-[14px] border-2 border-[var(--mh-ink)] bg-[#D7F5E8] px-4 py-2 font-extrabold">{note.ok}</p>}
            {note?.error && <p role="alert" className="m-0 rounded-[14px] border-2 border-[#C4223B] bg-[#FFE9E6] px-4 py-2 font-extrabold text-[#B0182F]">{note.error}</p>}

            {open?.kind === "bulk" && (
                <Choices plans={plans} labels={labels} busy={busy} color={color}
                    title={open.scope === "all" ? `אישור כל ${rows.length} הבקשות` : shown.length === 1 ? "אישור הבקשה שמוצגת" : `אישור ${shown.length} הבקשות שמוצגות`}
                    action={approveLabel(open.scope === "all" ? rows.length : shown.length)}
                    onCancel={() => setOpen(null)} onApprove={(c) => approve(open.scope === "all" ? "all" : shown.map((r) => r.id), c)} />
            )}

            <section className={`${frame} flex flex-col gap-3 p-4`} aria-labelledby="req-title">
                <div className="flex flex-wrap items-center gap-3">
                    <h2 id="req-title" className="m-0 text-[15px] font-extrabold text-[var(--mh-ink-soft)]">
                        {pending ? `מוצגות ${shown.length} מתוך ${rows.length} ממתינות` : `${shown.length} ${tab === "approved" ? "שאושרו" : "שנדחו"}`}
                    </h2>
                    <nav aria-label="מצב הבקשות" className="ms-auto flex flex-wrap gap-2">
                        {REQUEST_TABS.map((t) => (
                            <Link key={t.key} href={t.key === "pending" ? `/orgs/${orgId}/requests` : `/orgs/${orgId}/requests?tab=${t.key}`} aria-current={tab === t.key ? "page" : undefined} className={chip(tab === t.key)}>
                                {t.label} <bdi className="opacity-80">{counts[t.key]}</bdi>
                            </Link>
                        ))}
                    </nav>
                </div>

                {rows.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="flex min-h-11 w-full items-center gap-2 rounded-full border-2 border-[var(--mh-ink)] bg-white px-3 sm:w-auto sm:min-w-[260px]">
                            <span className="sr-only">חיפוש</span>
                            <input type="search" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder="חיפוש לפי שם, טלפון או הערה" className="min-w-0 flex-1 bg-transparent py-2 text-[15px] font-semibold outline-none" />
                        </label>
                        <button type="button" aria-pressed={!filterActive(f)} onClick={() => setF(NO_FILTER)} className={chip(!filterActive(f))}>הכול <bdi className="opacity-80">{rows.length}</bdi></button>
                        <label className={`${chip(!!f.source)} relative pe-9`}>
                            <span className="sr-only">מקור הבקשה</span>
                            <select value={f.source} onChange={(e) => setF({ ...f, source: e.target.value as RequestSource | "" })} className="cursor-pointer appearance-none bg-transparent font-extrabold outline-none">
                                <option value="">מקור: הכול</option>
                                {REQUEST_SOURCES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                            </select>
                            <svg className="pointer-events-none absolute end-3" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
                        </label>
                        {pending && (
                            <button type="button" aria-pressed={f.listed} onClick={() => setF({ ...f, listed: !f.listed })} className={chip(f.listed)}>
                                כבר ברשימה{listedCount > 0 && <span className={count}>{listedCount}</span>}
                            </button>
                        )}
                        <button type="button" aria-pressed={f.full} onClick={() => setF({ ...f, full: !f.full })} className={chip(f.full)}>פרטים מלאים <bdi className="opacity-80">{fullCount}</bdi></button>
                    </div>
                )}

                {!rows.length ? (
                    <div className="rounded-[18px] border-2 border-dashed border-[var(--mh-ink)] bg-[var(--mh-ticket)] p-6 text-center">
                        <b className="text-[18px]">{pending ? "אין בקשות שמחכות" : tab === "approved" ? "עוד לא אושרו בקשות" : "לא נדחו בקשות"}</b>
                        {pending && <p className="m-0 mt-1 font-semibold text-[var(--mh-ink-soft)]">כשמישהו יבקש להצטרף מקוד הארגון או מהחיפוש באפליקציה, הבקשה תופיע כאן. <Link href={`/orgs/${orgId}/members/add`} className="font-extrabold underline">להוספת חברים</Link></p>}
                    </div>
                ) : (
                    <div role="table" aria-label="בקשות הצטרפות" className="flex flex-col">
                        <div role="row" className={`hidden min-h-9 border-b-2 border-[var(--mh-ink)] text-[13px] font-extrabold text-[var(--mh-ink-soft)] ${COLS}`}>
                            <span role="columnheader">מבקש/ת</span><span role="columnheader">מקור</span><span role="columnheader">הערה מהמבקש</span><span role="columnheader">{pending ? "מתי" : "הוחלט"}</span><span role="columnheader">{pending ? "פעולה" : "על ידי"}</span>
                        </div>
                        {!shown.length && <p className="m-0 p-5 font-bold text-[var(--mh-ink-soft)]">אין בקשות שמתאימות לסינון הזה.</p>}
                        {shown.map((r) => (
                            <Row key={r.id} orgId={orgId} r={r} tab={tab} busy={busy}
                                open={open && open.kind !== "bulk" && open.id === r.id ? open.kind : null}
                                onApprove={() => askApprove(r.id)} onDecline={() => setOpen({ kind: "decline", id: r.id })} onCancel={() => setOpen(null)}
                                approvePanel={<Choices plans={plans} labels={labels} busy={busy} color={color} title={`אישור הבקשה של ${r.name.split(" ")[0]}`} action="לאשר את הבקשה" onCancel={() => setOpen(null)} onApprove={(c) => approve([r.id], c)} />}
                                onDeclineSend={(t) => run(() => declineRequest(orgId, r.id, t))} />
                        ))}
                    </div>
                )}
            </section>

            {pending && rows.length > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                    <p className="m-0 min-w-0 flex-1 basis-[300px] text-[14px] font-bold text-[var(--mh-ink-soft)]">{choosing ? "בוחרים מסלול ותוויות בעת האישור, ודחייה נשלחת בנוסח נעים." : "דחייה נשלחת בנוסח נעים."} המבקשים לא רואים פרטים של חברים אחרים לעולם.</p>
                    {filterActive(f) && shown.length > 0 && shown.length < rows.length && (
                        <button type="button" disabled={busy} onClick={() => askBulk("shown")} className={btn} style={{ background: color, color: onColor(color) }}>{shown.length === 1 ? "לאשר את התוצאה" : `לאשר את ${shown.length} התוצאות`}</button>
                    )}
                </div>
            )}
        </div>
    );
}

function Row({ orgId, r, tab, busy, open, onApprove, onDecline, onCancel, approvePanel, onDeclineSend }: {
    orgId: string; r: RequestRow; tab: RequestTab; busy: boolean; open: "approve" | "decline" | null;
    onApprove: () => void; onDecline: () => void; onCancel: () => void; approvePanel: ReactNode; onDeclineSend: (note: string) => void;
}) {
    const [why, setWhy] = useState("");
    const first = [...r.name][0] ?? "?";
    return (
        <div role="row" className="flex flex-col gap-3 border-b-[1.5px] border-[var(--mh-line-soft)] py-3 last:border-0">
            <div className={`flex items-start gap-3 ${COLS}`}>
                <span role="cell" className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full border-2 border-[var(--mh-ink)] text-[18px] font-extrabold lg:h-9 lg:w-9 lg:text-[16px]" style={{ background: avatarPastel([...r.name].reduce((n, c) => n + c.charCodeAt(0), 0)) }} aria-hidden="true">{first}</span>
                    <span className="flex min-w-0 flex-col gap-[2px]">
                        <b className="truncate text-[16px]">{r.name}</b>
                        {r.phone && <bdi dir="ltr" className="truncate text-end text-[13px] font-semibold">{r.phone}</bdi>}
                        <span className="text-[12.5px] font-semibold text-[var(--mh-ink-soft)] lg:hidden">{sourceLabel(r.source)} · {r.when}</span>
                        {r.listed && <span className="inline-flex w-fit items-center rounded-[10px] border-2 border-[var(--mh-ink)] bg-[#FFF6D1] px-2 text-[12px] font-extrabold">כבר ברשימה מהייבוא</span>}
                        {r.note && <span className="text-[14px] font-semibold lg:hidden">״{r.note}״</span>}
                    </span>
                </span>
                <span role="cell" className="hidden text-[14px] font-bold lg:block">{sourceLabel(r.source)}</span>
                <span role="cell" className="hidden text-[14px] font-semibold lg:block">{r.note ? r.note : <span className="text-[var(--mh-ink-soft)]">בלי הערה</span>}</span>
                <span role="cell" className="hidden text-[14px] font-semibold text-[var(--mh-ink-soft)] lg:block">{r.when}</span>
                <span role="cell" className="flex w-[104px] shrink-0 flex-col gap-2 lg:w-auto lg:flex-row lg:justify-end">
                    {tab === "pending" ? (
                        <>
                            <button type="button" disabled={busy} aria-expanded={open === "approve"} onClick={onApprove} className={`${btn} bg-[var(--mh-sun)]`}>לאשר</button>
                            <button type="button" disabled={busy} aria-expanded={open === "decline"} onClick={onDecline} className={`${btn} border-[#C4223B] bg-white text-[#B0182F] shadow-none`}>לדחות</button>
                        </>
                    ) : (
                        <span className="flex flex-col items-start gap-1 text-[13px] font-semibold lg:items-end">
                            <span>{r.decidedBy ? `${tab === "approved" ? "אושרה" : "נדחתה"} על ידי ${r.decidedBy}` : "—"}</span>
                            <span className="text-[var(--mh-ink-soft)] lg:hidden">{r.when}</span>
                            {tab === "approved" && r.linkId && <Link href={`/orgs/${orgId}/members/${r.linkId}`} className="min-h-10 content-center font-extrabold underline">לתיק החבר</Link>}
                        </span>
                    )}
                </span>
            </div>
            {tab === "rejected" && r.adminNote && <p className="m-0 rounded-[12px] bg-[var(--mh-ticket)] px-3 py-2 text-[13px] font-semibold">הערה פנימית: {r.adminNote}</p>}
            {open === "approve" && approvePanel}
            {open === "decline" && (
                <div className="flex flex-col gap-2 rounded-[16px] border-2 border-[#C4223B] bg-[#FFF4F2] p-3">
                    <b>לדחות את הבקשה של {r.name.split(" ")[0]}?</b>
                    <span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">המבקש מקבל הודעה בנוסח נעים: ״תודה שביקשתם להצטרף. הפעם הבקשה לא אושרה.״ הסיבה לא נשלחת אליו.</span>
                    <label className="flex flex-col gap-1">
                        <span className="text-[14px] font-extrabold">הערה פנימית <span className="font-semibold text-[var(--mh-ink-soft)]">(לא חובה, רק המנהלים רואים)</span></span>
                        <input value={why} maxLength={NOTE_MAX} onChange={(e) => setWhy(e.target.value)} className="min-h-11 rounded-[12px] border-2 border-[var(--mh-ink)] bg-white px-3 font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)]" />
                    </label>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" disabled={busy} onClick={() => onDeclineSend(why)} className={`${btn} border-[#C4223B] bg-[#C4223B] text-white`}>{busy ? "שולחים…" : "לדחות את הבקשה"}</button>
                        <button type="button" onClick={onCancel} className={`${btn} bg-white`}>ביטול</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// The plan and labels for whoever is approved; nothing is required.
function Choices({ plans, labels, busy, color, title, action, onApprove, onCancel }: {
    plans: Plan[]; labels: Label[]; busy: boolean; color: string; title: string; action: string;
    onApprove: (c: { planId: string; labelIds: string[] }) => void; onCancel: () => void;
}) {
    const [planId, setPlanId] = useState(plans.length === 1 ? plans[0].id : "");
    const [picked, setPicked] = useState<string[]>([]);
    const planLabel = useId();
    return (
        <section className="flex flex-col gap-3 rounded-[16px] border-2 border-[var(--mh-ink)] bg-[#FFF6D1] p-3 md:p-4" aria-label={title}>
            <b className="text-[16px]">{title}</b>
            {plans.length > 0 && (
                <div className="flex flex-col gap-2">
                    <span className="text-[14px] font-extrabold" id={planLabel}>מסלול</span>
                    <div role="radiogroup" aria-labelledby={planLabel} className="flex flex-wrap gap-2">
                        <button type="button" role="radio" aria-checked={!planId} onClick={() => setPlanId("")} className={chip(!planId)}>בלי מסלול</button>
                        {plans.map((p) => <button key={p.id} type="button" role="radio" aria-checked={planId === p.id} onClick={() => setPlanId(p.id)} className={chip(planId === p.id)}>{p.name}</button>)}
                    </div>
                </div>
            )}
            {labels.length > 0 && (
                <div className="flex flex-col gap-2">
                    <span className="text-[14px] font-extrabold">תוויות <span className="font-semibold text-[var(--mh-ink-soft)]">(לא חובה, אפשר כמה)</span></span>
                    <div className="flex flex-wrap gap-2">
                        {labels.map((l) => {
                            const on = picked.includes(l.id);
                            return (
                                <button key={l.id} type="button" aria-pressed={on} onClick={() => setPicked((x) => (on ? x.filter((y) => y !== l.id) : [...x, l.id]))} className={`inline-flex min-h-11 items-center gap-2 rounded-[12px] border-2 border-[var(--mh-ink)] px-3 font-extrabold ${on ? "shadow-[0_3px_0_var(--mh-ink)]" : "opacity-70"}`} style={{ background: l.color }}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={TAG_ICON} /></svg><bdi>{l.name}</bdi>{on && <span aria-hidden="true">✓</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
            <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy} onClick={() => onApprove({ planId, labelIds: picked })} className={btn} style={{ background: color, color: onColor(color) }}>{busy ? "מאשרים…" : action}</button>
                <button type="button" onClick={onCancel} className={`${btn} bg-white`}>ביטול</button>
            </div>
        </section>
    );
}
