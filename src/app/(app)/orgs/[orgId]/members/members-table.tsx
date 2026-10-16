"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition, type MouseEvent } from "react";
import { TAG_ICON } from "@/components/labels/stamp";
import { avatarPastel, balanceCell, filterCounts, initial, inMemberFilter, matchesSearch, MEMBER_FILTERS, MESSAGE_MAX, STATUS_CHIP, type MemberFilter } from "@/lib/members-admin";
import type { MemberRow } from "@/lib/members-server";
import { onColor } from "@/lib/color";
import { addLabelMany, sendMessage, sendReminders, type BulkResult } from "./actions";

type Label = { id: string; name: string; color: string; assignment: string };
type Tile = { k: string; v: string; bar: string };
type Sheet = { kind: "message" | "label"; ids: string[] } | null;

const btn = "inline-flex min-h-[38px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] px-[18px] text-[15px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none disabled:opacity-60";
const smallBtn = "inline-flex min-h-[34px] shrink-0 items-center justify-center whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] px-3 text-[14px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none disabled:opacity-60";
const frame = "flex flex-col rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white shadow-[0_3px_0_var(--mh-ink)]";
const panel = `${frame} gap-3 p-4`;
const COLS = "md:grid md:grid-cols-[28px_minmax(0,2fr)_104px_96px_72px_minmax(0,1.3fr)_56px] md:items-center md:gap-3";

const ilDay = (iso: string) => new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric" }).format(new Date(iso));

export function MembersTable({ orgId, color, rows, labels, canManage, initialFilter, initialQuery, tiles }: {
    orgId: string;
    color: string;
    rows: MemberRow[];
    labels: Label[];
    canManage: boolean;
    initialFilter: MemberFilter;
    initialQuery: string;
    tiles: Tile[];
}) {
    const [filter, setFilter] = useState<MemberFilter>(initialFilter);
    const [labelFilter, setLabelFilter] = useState("");
    const [q, setQ] = useState(initialQuery);
    const [picked, setPicked] = useState<string[]>([]);
    const [focus, setFocus] = useState<string | null>(null);
    const [sheet, setSheet] = useState<Sheet>(null);
    const [result, setResult] = useState<BulkResult | null>(null);
    const [busy, start] = useTransition();
    const sheetRef = useRef<HTMLDivElement>(null);

    const counts = useMemo(() => filterCounts(rows.map((r) => r.facts)), [rows]);
    const shown = rows.filter((r) => inMemberFilter(filter, r.facts) && matchesSearch(r, q) && (!labelFilter || r.labels.some((l) => l.id === labelFilter)));
    const pickable = shown.filter((r) => r.linkId).map((r) => r.linkId!);
    const allPicked = pickable.length > 0 && pickable.every((id) => picked.includes(id));
    const focused = rows.find((r) => r.key === focus) ?? null;
    const manual = labels.filter((l) => l.assignment === "manual");

    const toggle = (id: string, key: string) => {
        setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
        setFocus(key);
    };
    const run = (fn: () => Promise<BulkResult>, after?: () => void) => {
        setResult(null);
        start(async () => {
            const r = await fn();
            setResult(r);
            if (r.ok) after?.();
        });
    };
    const openSheet = (s: Sheet) => {
        setSheet(s);
        setResult(null);
        requestAnimationFrame(() => sheetRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    };
    const filterName = (id: MemberFilter, label: string) => (id === "all" || id === "active" ? label : `${label} · ${counts[id]}`);

    return (
        <>
            <header className="flex flex-wrap items-center gap-3">
                <h1 className="m-0 font-display text-[28px] leading-none">חברים</h1>
                <span className="inline-flex min-h-7 items-center rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-sun)] px-3 text-[14px] font-extrabold" aria-label={`${counts.all - counts.pending} חברים`}><bdi aria-hidden="true">{counts.all - counts.pending}</bdi></span>
                <label className="order-last flex min-h-[38px] w-full items-center gap-2 rounded-full border-2 border-[var(--mh-ink)] bg-white px-3 sm:order-none sm:max-w-[420px] sm:flex-1">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3" /></svg>
                    <span className="sr-only">חיפוש חברים</span>
                    <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש לפי שם, טלפון, מייל, משק בית" className="min-w-0 flex-1 bg-transparent py-2 text-[15px] font-semibold outline-none" />
                </label>
                <div className="ms-auto flex gap-2">
                    <a href={`/orgs/${orgId}/members/export`} className={`${btn} bg-white`} download>ייצוא</a>
                    <Link href={`/orgs/${orgId}/members/add`} className={btn} style={{ background: color, color: onColor(color) }}>+ הוספת חברים</Link>
                </div>
            </header>
            <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 md:grid-cols-3 xl:grid-cols-5" aria-label="מדדים">
                {tiles.map((t, i) => (
                    <li key={t.k} className={`flex flex-col overflow-hidden rounded-[18px] border-[2.5px] border-[var(--mh-ink)] bg-white px-3 pb-2 pt-[14px] shadow-[0_3px_0_var(--mh-ink)] md:gap-1 md:rounded-[20px] md:px-4 md:pb-3 md:pt-[18px] ${i === 4 ? "col-span-2 md:col-span-1" : ""}`} style={{ backgroundImage: `linear-gradient(${t.bar}, ${t.bar})`, backgroundSize: "100% 8px", backgroundRepeat: "no-repeat" }}>
                        <span className="text-[12px] font-extrabold text-[var(--mh-ink-soft)]">{t.k}</span>
                        <bdi className="font-display text-[clamp(20px,2vw,28px)] leading-tight">{t.v}</bdi>
                    </li>
                ))}
            </ul>

            <div className="flex flex-wrap items-center gap-2">
                <div role="radiogroup" aria-label="סינון חברים" className="flex flex-wrap gap-2">
                    {MEMBER_FILTERS.map((f) => {
                        const on = filter === f.id;
                        return (
                            <button key={f.id} type="button" role="radio" aria-checked={on} onClick={() => setFilter(f.id)}
                                className={`inline-flex min-h-[34px] items-center whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] px-3 text-[14px] font-extrabold transition-colors ${on ? "bg-[var(--mh-ink)] text-white" : f.id === "debt" ? "bg-[var(--mh-sun)]" : "bg-white hover:bg-[var(--mh-ticket)]"}`}>
                                {filterName(f.id, f.label)}
                            </button>
                        );
                    })}
                </div>
                {labels.length > 0 && (
                    <label className={`inline-flex min-h-[34px] items-center gap-1 rounded-full border-2 border-[var(--mh-ink)] ps-3 text-[14px] font-extrabold ${labelFilter ? "bg-[var(--mh-ink)] text-white" : "bg-[var(--mh-ticket)]"}`}>
                        <span>+ סינון לפי תווית</span>
                        <select value={labelFilter} onChange={(e) => setLabelFilter(e.target.value)} className="min-h-[30px] rounded-full bg-transparent pe-2 font-extrabold outline-none">
                            <option value="" className="text-[var(--mh-ink)]">כל התוויות</option>
                            {labels.map((l) => <option key={l.id} value={l.id} className="text-[var(--mh-ink)]">{l.name}</option>)}
                        </select>
                    </label>
                )}
                {picked.length > 0 && (
                    <div className="flex w-full flex-wrap items-center gap-2 rounded-[16px] border-2 border-[var(--mh-ink)] bg-[#FFF6D1] p-2 xl:ms-auto xl:w-auto" role="group" aria-label="פעולות על הנבחרים">
                        <b className="px-1 text-[14px]">{picked.length === 1 ? "נבחר אחד" : `${picked.length} נבחרו`}</b>
                        <button type="button" disabled={busy} onClick={() => run(() => sendReminders(orgId, picked))} className={`${smallBtn} bg-[var(--mh-sun)]`}>שליחת תזכורת חוב</button>
                        <button type="button" onClick={() => openSheet({ kind: "message", ids: picked })} className={`${smallBtn} bg-white`}>הודעה</button>
                        {canManage && manual.length > 0 && <button type="button" onClick={() => openSheet({ kind: "label", ids: picked })} className={`${smallBtn} bg-white`}>+ תווית</button>}
                        <button type="button" onClick={() => { setPicked([]); setSheet(null); }} className="min-h-[34px] px-2 text-[14px] font-extrabold underline">ניקוי</button>
                    </div>
                )}
            </div>

            {result && (
                <p role="status" className={`m-0 rounded-[14px] border-2 px-4 py-2 font-extrabold ${result.error ? "border-[#C4223B] bg-[#FFE9E6] text-[#B0182F]" : "border-[var(--mh-ink)] bg-[#D7F5E8]"}`}>{result.error ?? result.ok}</p>
            )}
            <div ref={sheetRef} className="scroll-mt-4">
                {sheet && (
                    <BulkSheet
                        key={`${sheet.kind}-${sheet.ids.join(",")}`}
                        sheet={sheet}
                        names={sheet.ids.map((id) => rows.find((r) => r.linkId === id)?.name ?? "").filter(Boolean)}
                        labels={manual}
                        busy={busy}
                        onClose={() => setSheet(null)}
                        onSend={(value) => run(() => (sheet.kind === "message" ? sendMessage(orgId, sheet.ids, value) : addLabelMany(orgId, value, sheet.ids)), () => setSheet(null))}
                    />
                )}
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-[14px] min-[1280px]:grid-cols-[minmax(0,1fr)_340px] min-[1800px]:grid-cols-[minmax(0,1fr)_420px]">
                <section className={`${frame} overflow-visible`} aria-label="רשימת החברים">
                    <div role="table" aria-label="חברים" aria-rowcount={shown.length + 1} className="flex flex-col">
                        <div role="row" className={`hidden min-h-9 rounded-t-[17px] bg-[var(--mh-ink)] px-3 text-[12px] font-extrabold text-white ${COLS}`}>
                            <span role="columnheader" className="flex items-center">
                                <input type="checkbox" aria-label="בחירת כל המוצגים" checked={allPicked} disabled={!pickable.length} onChange={() => setPicked(allPicked ? picked.filter((id) => !pickable.includes(id)) : [...new Set([...picked, ...pickable])])} className="h-[18px] w-[18px] accent-[var(--mh-sun)]" />
                            </span>
                            <span role="columnheader">שם ומשק בית</span>
                            <span role="columnheader">סטטוס</span>
                            <span role="columnheader">יתרה</span>
                            <span role="columnheader">חבר מאז</span>
                            <span role="columnheader">תוויות</span>
                            <span role="columnheader"><span className="sr-only">פעולות</span></span>
                        </div>
                        {!shown.length && <p className="m-0 p-5 font-bold text-[var(--mh-ink-soft)]">{rows.length ? "אין חברים שמתאימים לסינון הזה." : "עוד אין חברים. מוסיפים מ״+ הוספת חברים״."}</p>}
                        {shown.map((r, i) => (
                            <Row key={r.key} r={r} i={i} orgId={orgId} picked={!!r.linkId && picked.includes(r.linkId)} focused={focus === r.key} canManage={canManage && manual.length > 0}
                                onToggle={() => r.linkId && toggle(r.linkId, r.key)}
                                onFocus={() => setFocus(r.key)}
                                onRemind={() => r.linkId && run(() => sendReminders(orgId, [r.linkId!]))}
                                onMessage={() => r.linkId && openSheet({ kind: "message", ids: [r.linkId] })}
                                onLabel={() => r.linkId && openSheet({ kind: "label", ids: [r.linkId] })} />
                        ))}
                    </div>
                </section>
                <aside className="hidden min-[1280px]:sticky min-[1280px]:top-4 min-[1280px]:block" aria-label="פרטי החבר">
                    {focused ? (
                        <MemberPanel r={focused} orgId={orgId} color={color} busy={busy}
                            onRemind={() => focused.linkId && run(() => sendReminders(orgId, [focused.linkId!]))}
                            onMessage={() => focused.linkId && openSheet({ kind: "message", ids: [focused.linkId] })} />
                    ) : (
                        <div className={panel}>
                            <h2 className="m-0 font-display text-[19px]">פרטי חבר</h2>
                            <p className="m-0 text-[14px] font-semibold text-[var(--mh-ink-soft)]">בוחרים חבר ברשימה כדי לראות כאן את הפרטים, היתרה והפעולות.</p>
                        </div>
                    )}
                </aside>
            </div>
        </>
    );
}

function StatusChip({ r }: { r: MemberRow }) {
    const c = STATUS_CHIP[r.status];
    return <span className="inline-flex min-h-6 items-center whitespace-nowrap rounded-[12px] border-2 border-[var(--mh-ink)] px-2 text-[12.5px] font-extrabold" style={{ background: c.bg }}>{c.label}</span>;
}

function LabelPills({ labels }: { labels: MemberRow["labels"] }) {
    if (!labels.length) return <span className="text-[13px] font-semibold text-[var(--mh-ink-soft)] md:sr-only">בלי תוויות</span>;
    const show = labels.slice(0, 2);
    return (
        <span className="flex flex-wrap items-center gap-1" role="img" aria-label={`תוויות: ${labels.map((l) => l.name).join(", ")}`}>
            {show.map((l) => (
                <span key={l.id} className="inline-flex h-[22px] max-w-full items-center gap-1 rounded-[7px] border-2 border-[var(--mh-ink)] px-[6px] text-[12px] font-extrabold" style={{ background: l.color }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={TAG_ICON} /></svg>
                    <bdi className="truncate">{l.name}</bdi>
                </span>
            ))}
            {labels.length > 2 && <span className="text-[12px] font-extrabold">+{labels.length - 2}</span>}
        </span>
    );
}

function Row({ r, i, orgId, picked, focused, canManage, onToggle, onFocus, onRemind, onMessage, onLabel }: {
    r: MemberRow; i: number; orgId: string; picked: boolean; focused: boolean; canManage: boolean;
    onToggle: () => void; onFocus: () => void; onRemind: () => void; onMessage: () => void; onLabel: () => void;
}) {
    const bal = balanceCell(r.facts.kind, r.balanceMinor);
    const href = r.linkId ? `/orgs/${orgId}/members/${r.linkId}` : `/orgs/${orgId}/requests`;
    const closeMenu = (e: MouseEvent) => e.currentTarget.closest("details")?.removeAttribute("open");
    return (
        <div role="row" onClick={(e) => { if (!(e.target as HTMLElement).closest("a,button,input,summary,details")) onFocus(); }}
            className={`grid grid-cols-[28px_minmax(0,1fr)_auto_44px] items-center gap-x-3 gap-y-2 border-b-[1.5px] border-[var(--mh-line-soft)] px-3 py-3 last:border-0 md:min-h-[46px] md:py-1 ${COLS} ${picked ? "bg-[#FFF6D1]" : focused ? "bg-[var(--mh-ticket)]" : "hover:bg-[var(--mh-ticket)]"}`}>
            <span role="cell" className="flex items-center">
                {r.linkId ? <input type="checkbox" checked={picked} onChange={onToggle} aria-label={`בחירת ${r.name}`} className="h-[18px] w-[18px] rounded-[5px] accent-[var(--mh-ink)]" /> : <span aria-hidden="true" />}
            </span>
            <span role="cell" className="flex min-w-0 items-center gap-[10px]">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-[var(--mh-ink)] text-[13px] font-extrabold" style={{ background: avatarPastel(i) }} aria-hidden="true">{initial(r.name)}</span>
                <span className="flex min-w-0 flex-col">
                    <Link href={href} className="truncate font-extrabold hover:underline">{r.name}</Link>
                    <span className="truncate text-[12px] font-semibold text-[var(--mh-ink-soft)]">{r.home}</span>
                </span>
            </span>
            <span role="cell" className="col-start-3 row-start-1 md:col-auto md:row-auto"><StatusChip r={r} /></span>
            <span role="cell" className="col-span-3 col-start-2 row-start-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] md:contents">
                <span className="md:block"><span className="text-[var(--mh-ink-soft)] md:hidden">יתרה </span><bdi className={`font-extrabold ${bal.owes ? "text-[#C4223B]" : ""}`}>{bal.text}</bdi></span>
                <span className="font-semibold md:block"><span className="text-[var(--mh-ink-soft)] md:hidden">{r.facts.kind === "pending" ? "ביקש " : "חבר מאז "}</span>{r.sinceText}</span>
                <span className="min-w-0 md:block"><LabelPills labels={r.labels} /></span>
            </span>
            <span role="cell" className="col-start-4 row-start-1 flex justify-end md:col-auto md:row-auto">
                <details className="relative">
                    <summary aria-label={`פעולות עבור ${r.name}`} className="grid h-9 w-11 cursor-pointer list-none place-items-center rounded-full border-2 border-transparent text-[20px] font-extrabold leading-none hover:border-[var(--mh-ink)] hover:bg-white [&::-webkit-details-marker]:hidden">···</summary>
                    <div className="absolute end-0 top-10 z-20 flex w-[200px] flex-col rounded-[14px] border-2 border-[var(--mh-ink)] bg-white p-1 shadow-[0_3px_0_var(--mh-ink)]">
                        <Link href={href} className="min-h-10 content-center rounded-[10px] px-3 font-bold hover:bg-[var(--mh-ticket)]">{r.linkId ? "לתיק החבר" : "לבקשת ההצטרפות"}</Link>
                        {r.linkId && r.owedMinor > 0 && <button type="button" onClick={(e) => { closeMenu(e); onRemind(); }} className="min-h-10 rounded-[10px] px-3 text-start font-bold hover:bg-[var(--mh-ticket)]">שליחת תזכורת חוב</button>}
                        {r.linkId && <button type="button" onClick={(e) => { closeMenu(e); onMessage(); }} className="min-h-10 rounded-[10px] px-3 text-start font-bold hover:bg-[var(--mh-ticket)]">הודעה</button>}
                        {r.linkId && canManage && r.facts.linkStatus === "active" && <button type="button" onClick={(e) => { closeMenu(e); onLabel(); }} className="min-h-10 rounded-[10px] px-3 text-start font-bold hover:bg-[var(--mh-ticket)]">הוספת תווית</button>}
                    </div>
                </details>
            </span>
        </div>
    );
}

function BulkSheet({ sheet, names, labels, busy, onClose, onSend }: {
    sheet: NonNullable<Sheet>; names: string[]; labels: Label[]; busy: boolean; onClose: () => void; onSend: (value: string) => void;
}) {
    const [text, setText] = useState("");
    const [label, setLabel] = useState(labels[0]?.id ?? "");
    const to = names.length === 1 ? names[0] : `${names.length} חברים`;
    const isMsg = sheet.kind === "message";
    return (
        <section className={`${panel} bg-[var(--mh-ticket)]`} aria-label={isMsg ? "הודעה לחברים" : "הוספת תווית"}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="m-0 font-display text-[19px]">{isMsg ? `הודעה ל${to}` : `הוספת תווית ל${to}`}</h2>
                <button type="button" onClick={onClose} className="min-h-10 px-2 font-extrabold underline">סגירה</button>
            </div>
            {isMsg ? (
                <label className="flex flex-col gap-1">
                    <span className="text-[15px] font-extrabold">ההודעה</span>
                    <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={MESSAGE_MAX} rows={3} className="min-h-[84px] rounded-[12px] border-2 border-[var(--mh-ink)] bg-white p-3 font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)]" />
                    <span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">נשלחת באפליקציה ובמייל למי שיש לו. <bdi>{text.length}/{MESSAGE_MAX}</bdi></span>
                </label>
            ) : (
                <div role="radiogroup" aria-label="תווית" className="flex flex-wrap gap-2">
                    {labels.map((l) => (
                        <button key={l.id} type="button" role="radio" aria-checked={label === l.id} onClick={() => setLabel(l.id)}
                            className={`inline-flex min-h-11 items-center gap-2 rounded-[12px] border-2 px-3 font-extrabold ${label === l.id ? "border-[var(--mh-ink)] shadow-[0_3px_0_var(--mh-ink)]" : "border-transparent opacity-80"}`} style={{ background: l.color }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={TAG_ICON} /></svg>
                            <bdi>{l.name}</bdi>
                        </button>
                    ))}
                </div>
            )}
            <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy || (isMsg ? !text.trim() : !label)} onClick={() => onSend(isMsg ? text : label)} className={`${btn} bg-[var(--mh-sun)]`}>{busy ? "שולחים…" : isMsg ? "שליחה" : "הוספה"}</button>
                <button type="button" onClick={onClose} className={`${btn} bg-white`}>ביטול</button>
            </div>
        </section>
    );
}

function MemberPanel({ r, orgId, color, busy, onRemind, onMessage }: { r: MemberRow; orgId: string; color: string; busy: boolean; onRemind: () => void; onMessage: () => void }) {
    const on = onColor(color);
    const file = r.linkId ? `/orgs/${orgId}/members/${r.linkId}` : `/orgs/${orgId}/requests`;
    const fmt = (m: number) => `₪${new Intl.NumberFormat("he-IL", { maximumFractionDigits: 2 }).format(m / 100)}`;
    const details: [string, string | null][] = [
        ["טלפון", r.phone],
        ["מייל", r.email],
        ["כתובת", r.address],
        ["בני משפחה", r.family],
        ...r.extra.map((x) => [x.label, x.value] as [string, string]),
    ];
    return (
        <div className={`${frame} overflow-hidden`}>
            <div className="flex items-center gap-3 border-b-[2.5px] border-[var(--mh-ink)] p-4" style={{ background: color, color: on }}>
                <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full border-2 border-[var(--mh-ink)] bg-white font-display text-[24px] text-[var(--mh-ink)]" aria-hidden="true">{initial(r.name)}</span>
                <span className="flex min-w-0 flex-col">
                    <b className="truncate text-[20px]">{r.name}</b>
                    <span className="truncate text-[13px] font-bold">{r.home}</span>
                </span>
            </div>
            <div className="flex flex-col gap-3 p-4">
                <div className="flex flex-wrap gap-2">
                    {r.owedMinor > 0 && <span className="inline-flex min-h-6 items-center rounded-[12px] border-2 border-[var(--mh-ink)] bg-[var(--mh-sun)] px-2 text-[12.5px] font-extrabold">חוב פתוח</span>}
                    {r.disputes > 0 && <span className="inline-flex min-h-6 items-center rounded-[12px] border-2 border-[var(--mh-ink)] bg-[#CFF0FC] px-2 text-[12.5px] font-extrabold">מחלוקת על חיוב</span>}
                    {r.status === "left_debt" && <span className="inline-flex min-h-6 items-center rounded-[12px] border-2 border-[var(--mh-ink)] bg-[#FFDCD3] px-2 text-[12.5px] font-extrabold">עזב עם חוב</span>}
                    {r.status === "pending" && <span className="inline-flex min-h-6 items-center rounded-[12px] border-2 border-[var(--mh-ink)] bg-[#E3DDFF] px-2 text-[12.5px] font-extrabold">ממתין לאישור</span>}
                </div>
                {r.facts.kind === "member" && (
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col rounded-[14px] border-2 border-[var(--mh-ink)] bg-[#FFF9EC] p-2">
                            <span className="text-[12px] font-extrabold text-[var(--mh-ink-soft)]">יתרה</span>
                            <bdi className={`font-display text-[20px] ${r.balanceMinor > 0 ? "text-[#C4223B]" : ""}`}>{r.balanceMinor > 0 ? `-${fmt(r.balanceMinor)}` : "₪0"}</bdi>
                        </div>
                        <div className="flex flex-col rounded-[14px] border-2 border-[var(--mh-ink)] bg-[#FFF9EC] p-2">
                            <span className="text-[12px] font-extrabold text-[var(--mh-ink-soft)]">שולם השנה</span>
                            <bdi className="font-display text-[20px]">{fmt(r.paidYearMinor)}</bdi>
                        </div>
                    </div>
                )}
                {r.facts.kind === "member" ? (
                    <div className="flex flex-col gap-1">
                        <b className="text-[14px]">פרטים <span className="font-semibold text-[var(--mh-ink-soft)]">(לפי מה שהחבר אישר לארגון)</span></b>
                        <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-[14px]">
                            {details.map(([k, v]) => (
                                <div key={k} className="contents">
                                    <dt className="font-semibold text-[var(--mh-ink-soft)]">{k}</dt>
                                    <dd className="m-0 truncate font-bold">{v ? (k === "טלפון" || k === "מייל" ? <bdi dir="ltr">{v}</bdi> : v) : <span className="font-semibold text-[var(--mh-ink-soft)]">לא שותף</span>}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                ) : (
                    <p className="m-0 text-[14px] font-semibold text-[var(--mh-ink-soft)]">ביקש להצטרף ב-<bdi>{ilDay(r.since)}</bdi>. הפרטים נפתחים לארגון אחרי האישור.</p>
                )}
                {r.facts.kind === "member" ? (
                    <div className="flex flex-col gap-2">
                        <b className="text-[14px]">פעולות</b>
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" disabled={busy || r.owedMinor <= 0 || !!r.remindAfter} onClick={onRemind} className={`${smallBtn} bg-[var(--mh-sun)]`}>{r.remindAfter && r.owedMinor > 0 ? `תזכורת שוב ב-${ilDay(r.remindAfter)}` : "שליחת תזכורת"}</button>
                            <Link href={`${file}#charges`} className={`${smallBtn} bg-white`}>רישום תשלום</Link>
                            <Link href={`${file}?dispute=1#charges`} className={`${smallBtn} bg-white`}>מחלוקת על חיוב</Link>
                            <button type="button" onClick={onMessage} className={`${smallBtn} bg-white`}>הודעה</button>
                        </div>
                        <Link href={file} className="min-h-10 content-center text-center font-extrabold underline">לתיק החבר המלא</Link>
                    </div>
                ) : (
                    <Link href={file} className={`${smallBtn} bg-[var(--mh-sun)]`}>לבקשת ההצטרפות</Link>
                )}
            </div>
        </div>
    );
}
