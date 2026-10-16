"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { TAG_ICON } from "@/components/labels/stamp";
import { onColor } from "@/lib/color";
import { autoMapping, buildRows, DEFAULT_INVITE_TEXT, IMPORT_FIELDS, IMPORT_MAX_ROWS, INVITE_TEXT_MAX, inviteText, isImportField, markRows, parseCsv, readPerson, type ImportField, type ImportRow } from "@/lib/import";
import { localPhone } from "@/lib/members-admin";
import { readXlsx } from "@/lib/xlsx-read";
import { runImport, sendSample } from "../add/actions";

type Contacts = { phones: string[]; emails: string[] };
type Step = 1 | 2 | 3 | 4;
type Filter = "all" | "fix" | "known";

const STEPS = ["קובץ", "התאמת עמודות", "מי יוזמן", "שליחה"];
const panel = "flex flex-col gap-3 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_3px_0_var(--mh-ink)]";
const btn = "inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] px-[18px] text-[15px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:hover:translate-y-0";
const field = "min-h-[42px] rounded-[12px] border-2 border-[var(--mh-ink)] bg-white px-3 text-[16px] font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)]";
const chip = (on: boolean) => `inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] px-4 text-[15px] font-extrabold transition-colors ${on ? "bg-[var(--mh-ink)] text-white" : "bg-white hover:bg-[var(--mh-ticket)]"}`;
const SHOWN = 10;

function decodeText(buf: ArrayBuffer): string {
    const utf = new TextDecoder("utf-8").decode(buf);
    // Excel in Hebrew often saves CSV in the old Windows encoding; then UTF-8 gives replacement marks.
    return utf.includes("�") ? new TextDecoder("windows-1255").decode(buf) : utf;
}

export function ImportWizard({ orgId, orgName, sender, color, homeWord, members, pending, plans, labels }: {
    orgId: string; orgName: string; sender: string; color: string; homeWord: string;
    members: Contacts; pending: Contacts;
    plans: { id: string; name: string }[]; labels: { id: string; name: string; color: string }[];
}) {
    const known = useMemo(() => ({ phones: new Set([...members.phones, ...pending.phones]), emails: new Set([...members.emails, ...pending.emails]) }), [members, pending]);
    const [step, setStep] = useState<Step>(1);
    const [fileName, setFileName] = useState("");
    const [table, setTable] = useState<string[][]>([]);
    const [mapping, setMapping] = useState<(ImportField | null)[]>([]);
    const [auto, setAuto] = useState<(ImportField | null)[]>([]);
    const [people, setPeople] = useState<ImportRow[]>([]);
    const [out, setOut] = useState<number[]>([]); // lines the admin moved to "לא יוזמנו"
    const [filter, setFilter] = useState<Filter>("all");
    const [q, setQ] = useState("");
    const [sort, setSort] = useState<"file" | "name" | "home">("file");
    const [all, setAll] = useState(false);
    const [fixing, setFixing] = useState<number | null>(null);
    const [mode, setMode] = useState<"invite" | "list">("invite");
    const [channel, setChannel] = useState("whatsapp");
    const [remind, setRemind] = useState(true);
    const [template, setTemplate] = useState(DEFAULT_INVITE_TEXT);
    const [planId, setPlanId] = useState("");
    const [labelIds, setLabelIds] = useState<string[]>([]);
    const [consent, setConsent] = useState(false);
    const [confirm, setConfirm] = useState(false);
    const [note, setNote] = useState<{ ok?: string; error?: string } | null>(null);
    const [done, setDone] = useState<string | null>(null);
    const [busy, start] = useTransition();
    const top = useRef<HTMLDivElement>(null);

    const go = (s: Step) => {
        setStep(s);
        setNote(null);
        requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    };

    // ---- step 1: the file ----
    const readFile = async (f: File) => {
        setNote(null);
        try {
            const buf = await f.arrayBuffer();
            const rows = /\.xlsx$/i.test(f.name) ? await readXlsx(buf) : parseCsv(decodeText(buf));
            if (rows.length < 2) return setNote({ error: "לא מצאנו בקובץ שורות של אנשים. בשורה הראשונה צריכות להיות כותרות העמודות, ומתחתיה שורה לכל אדם." });
            if (rows.length - 1 > IMPORT_MAX_ROWS) return setNote({ error: `אפשר לייבא עד ${IMPORT_MAX_ROWS} שורות בפעם אחת. חלקו את הקובץ לכמה קבצים.` });
            const width = Math.max(...rows.map((r) => r.length));
            const t = rows.map((r) => [...r, ...Array(width - r.length).fill("")]);
            const m = autoMapping(t[0]);
            setFileName(f.name);
            setTable(t);
            setMapping(m);
            setAuto(m);
            go(2);
        } catch {
            setNote({ error: "לא הצלחנו לקרוא את הקובץ. שמרו אותו כ־CSV או כאקסל (xlsx) ונסו שוב." });
        }
    };

    // ---- step 2: columns ----
    const hasContact = mapping.includes("phone") || mapping.includes("email");
    const setCol = (i: number, f: ImportField | null) => setMapping((m) => m.map((x, j) => (j === i ? f : f && f !== "skip" && x === f ? null : x)));
    const toStep3 = () => {
        setPeople(buildRows(table, mapping, known));
        setOut([]);
        setFilter("all");
        go(3);
    };

    // ---- step 3: who ----
    const fixCount = people.filter((p) => p.problem).length;
    const knownCount = people.filter((p) => !p.problem && p.already).length;
    const invited = people.filter((p) => !p.problem && !p.already && !out.includes(p.line));
    const notInvited = people.filter((p) => !p.problem && (p.already || out.includes(p.line)));
    const isPendingInvite = (p: ImportRow) => (!!p.phone && pending.phones.includes(p.phone)) || (!!p.email && pending.emails.includes(p.email));
    const match = (p: ImportRow) => {
        const s = q.trim().toLowerCase();
        if (!s) return true;
        return p.name.toLowerCase().includes(s) || p.home.toLowerCase().includes(s) || (p.phone ?? "").includes(s.replace(/\D/g, "") || "§") || p.phoneRaw.includes(s) || (p.email ?? "").includes(s);
    };
    const sorted = (list: ImportRow[]) => (sort === "file" ? list : [...list].sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name, "he") : a.home.localeCompare(b.home, "he", { numeric: true }))));
    const mainList = sorted(filter === "fix" ? people.filter((p) => p.problem) : filter === "known" ? notInvited.filter((p) => p.already) : [...people.filter((p) => p.problem), ...invited]).filter(match);
    const visible = all ? mainList : mainList.slice(0, SHOWN);
    const saveFix = (line: number, cells: { name: string; phone: string; email: string }) => {
        setPeople((list) => markRows(list.map((p) => (p.line === line ? readPerson(line, { ...cells, home: p.home, note: p.note }) : p)), known));
        setFixing(null);
    };

    // ---- step 4: sending ----
    const missing = mode === "invite" ? invited.filter((p) => (channel === "email" ? !p.email : !p.phone)) : [];
    const sample = inviteText(template || DEFAULT_INVITE_TEXT, { name: invited[0]?.name ?? "דנה כהן", sender, org: orgName, link: "" });
    const send = () => {
        setConfirm(false);
        setNote(null);
        start(async () => {
            const r = await runImport(orgId, {
                fileName, rowsInFile: table.length - 1, mode, channel, remind, template, planId, labelIds,
                people: invited.map((p) => ({ line: p.line, name: p.name, phone: p.phone ?? "", email: p.email ?? "", home: p.home, note: p.note })),
            });
            if (r.ok) setDone(r.ok);
            else setNote(r);
        });
    };

    if (done) {
        return (
            <section className={`${panel} max-w-[680px]`} aria-live="polite">
                <h1 className="m-0 font-display text-[26px]">הייבוא הסתיים</h1>
                <p className="m-0 text-[17px] font-bold">{done}</p>
                <p className="m-0 font-semibold text-[var(--mh-ink-soft)]">הייבוא מופיע ב״ייבואים אחרונים״, ושם רואים כמה כבר אישרו.</p>
                <div className="flex flex-wrap gap-2">
                    <Link href={`/orgs/${orgId}/members/add`} className={`${btn} bg-[var(--mh-sun)]`}>לייבואים האחרונים</Link>
                    <Link href={`/orgs/${orgId}/members`} className={`${btn} bg-white`}>לרשימת החברים</Link>
                </div>
            </section>
        );
    }

    return (
        <div ref={top} className="flex scroll-mt-4 flex-col gap-[14px]">
            <header className="flex flex-wrap items-center gap-3">
                <span className="flex flex-col">
                    <h1 className="m-0 font-display text-[28px] leading-tight">ייבוא חברים מקובץ</h1>
                    <span className="font-bold text-[var(--mh-ink-soft)]">שלב {step} מתוך 4{step === 3 ? ": מי יוזמן" : ""}</span>
                </span>
                <div className="ms-auto flex gap-2">
                    {step > 1 && <button type="button" onClick={() => go((step - 1) as Step)} className={`${btn} bg-white`}>חזרה</button>}
                    {step === 2 && <button type="button" disabled={!hasContact} onClick={toStep3} className={`${btn} max-lg:hidden`} style={{ background: color, color: onColor(color) }}>להמשך</button>}
                </div>
            </header>
            <ol className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="שלבי הייבוא">
                {STEPS.map((s, i) => {
                    const n = i + 1;
                    const state = n < step ? "done" : n === step ? "now" : "next";
                    return (
                        <li key={s} aria-current={state === "now" ? "step" : undefined} className={`inline-flex min-h-[34px] items-center gap-2 rounded-[20px] border-2 border-[var(--mh-ink)] pe-3 ps-1 text-[14px] font-extrabold ${state === "done" ? "bg-[#D7F5E8]" : state === "now" ? "bg-[var(--mh-sun)]" : "bg-white"}`}>
                            <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-[var(--mh-ink)] text-[12px] text-white" aria-hidden="true">{state === "done" ? "✓" : n}</span>
                            {s}
                        </li>
                    );
                })}
            </ol>
            {note?.error && <p role="alert" className="m-0 rounded-[14px] border-2 border-[#C4223B] bg-[#FFE9E6] px-4 py-2 font-extrabold text-[#B0182F]">{note.error}</p>}
            {note?.ok && <p role="status" className="m-0 rounded-[14px] border-2 border-[var(--mh-ink)] bg-[#D7F5E8] px-4 py-2 font-extrabold">{note.ok}</p>}

            {step === 1 && (
                <section className={panel} aria-label="בחירת קובץ">
                    <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[18px] border-[2.5px] border-dashed border-[var(--mh-ink)] bg-[var(--mh-ticket)] p-6 text-center"
                        onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) void readFile(f); }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M12 18v-6M9 15l3-3 3 3" /></svg>
                        <b className="text-[19px]">בוחרים קובץ, או גוררים אותו לכאן</b>
                        <span className="font-semibold text-[var(--mh-ink-soft)]">אקסל (xlsx) או CSV. שורה ראשונה עם כותרות, ושורה לכל אדם.</span>
                        <span className={`${btn} bg-white`}>בחירת קובץ</span>
                        <input type="file" accept=".csv,.xlsx,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void readFile(f); e.target.value = ""; }} />
                    </label>
                    <p className="m-0 text-[14px] font-semibold">אין קובץ מוכן? <a href={`/orgs/${orgId}/members/import/template`} download className="font-extrabold underline">הורדת תבנית</a></p>
                </section>
            )}

            {step === 2 && (
                <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-[14px] lg:grid-cols-[minmax(0,1fr)_300px]">
                    <section className={panel} aria-label="התאמת עמודות">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="grid h-12 w-12 place-items-center rounded-[14px] border-2 border-[var(--mh-ink)] bg-[#D7F5E8]" aria-hidden="true">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6" /></svg>
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col">
                                <bdi dir="ltr" className="truncate text-end text-[17px] font-extrabold">{fileName}</bdi>
                                <span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">{table.length - 1} שורות · {table[0]?.length ?? 0} עמודות</span>
                            </span>
                            <button type="button" onClick={() => go(1)} className={`${btn} bg-white`}>החלפת קובץ</button>
                        </div>
                        <div role="table" aria-label="התאמת עמודות" className="flex flex-col">
                            <div role="row" className="hidden min-h-9 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(150px,200px)_110px] items-center gap-3 border-b-2 border-[var(--mh-ink)] text-[13px] font-extrabold text-[var(--mh-ink-soft)] md:grid">
                                <span role="columnheader">עמודה בקובץ</span><span role="columnheader">דוגמה</span><span role="columnheader">שדה במערכת</span><span role="columnheader"><span className="sr-only">מצב</span></span>
                            </div>
                            {table[0]?.map((h, i) => {
                                const f = mapping[i];
                                const isAuto = !!f && f === auto[i];
                                return (
                                    <div key={i} role="row" className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-b-[1.5px] border-[var(--mh-line-soft)] py-2 last:border-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(150px,200px)_110px]">
                                        <b role="cell" className="truncate">{h || `עמודה ${i + 1}`}</b>
                                        <span role="cell" className="col-span-2 row-start-2 truncate text-[14px] font-semibold text-[var(--mh-ink-soft)] md:col-span-1 md:row-start-auto"><bdi>{table[1]?.[i] || "—"}</bdi></span>
                                        <span role="cell" className="col-span-2 row-start-3 md:col-span-1 md:row-start-auto">
                                            <select aria-label={`שדה במערכת עבור ${h || `עמודה ${i + 1}`}`} value={f ?? ""} onChange={(e) => setCol(i, isImportField(e.target.value) ? e.target.value : null)} className={`${field} min-h-[38px] w-full`}>
                                                <option value="">לבחור…</option>
                                                {IMPORT_FIELDS.map((x) => <option key={x.id} value={x.id}>{x.id === "home" ? homeWord : x.label}</option>)}
                                            </select>
                                        </span>
                                        <span role="cell" className="col-start-2 row-start-1 md:col-auto md:row-auto">
                                            <span className={`inline-flex min-h-6 items-center whitespace-nowrap rounded-[12px] border-2 border-[var(--mh-ink)] px-2 text-[12.5px] font-extrabold ${isAuto ? "bg-[#D7F5E8]" : f ? "bg-white" : "bg-[#FFF6D1]"}`}>{isAuto ? "זוהה אוטומטית" : f ? "נבחר" : "לבחור"}</span>
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        {!hasContact && <p role="alert" className="m-0 font-extrabold text-[#B0182F]">צריך לבחור עמודה של טלפון או של מייל.</p>}
                        <button type="button" disabled={!hasContact} onClick={toStep3} className={`${btn} self-start lg:hidden`} style={{ background: color, color: onColor(color) }}>להמשך</button>
                    </section>
                    <aside className={panel} aria-label="מה חובה בקובץ">
                        <h2 className="m-0 font-display text-[19px]">מה חובה בקובץ</h2>
                        <ul className="m-0 flex list-disc flex-col gap-1 ps-5 font-semibold">
                            <li>טלפון או מייל לכל שורה, כדי לשלוח הזמנה.</li>
                            <li>שם. בלי שם נשלח ״שלום״ כללי.</li>
                        </ul>
                        <p className="m-0 rounded-[14px] border-2 border-[var(--mh-ink)] bg-[#FFF6D1] p-3 text-[13.5px] font-semibold">אפשר לייבא בלי מסלול ותוויות. בוחרים אחד לכולם בשלב השליחה.</p>
                    </aside>
                </div>
            )}

            {step === 3 && (
                <>
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="flex min-h-10 w-full items-center gap-2 rounded-full border-2 border-[var(--mh-ink)] bg-white px-3 sm:w-auto sm:min-w-[300px]">
                            <span className="sr-only">חיפוש</span>
                            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`חיפוש לפי שם, טלפון או ${homeWord}`} className="min-w-0 flex-1 bg-transparent py-2 font-semibold outline-none" />
                        </label>
                        <div role="radiogroup" aria-label="סינון" className="flex flex-wrap gap-2">
                            <button type="button" role="radio" aria-checked={filter === "all"} onClick={() => setFilter("all")} className={chip(filter === "all")}>הכול</button>
                            <button type="button" role="radio" aria-checked={filter === "fix"} onClick={() => setFilter("fix")} className={chip(filter === "fix")}>לתיקון{fixCount > 0 && <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-[#FF8A6B] px-1 text-[11px] text-[var(--mh-ink)]">{fixCount}</span>}</button>
                            <button type="button" role="radio" aria-checked={filter === "known"} onClick={() => setFilter("known")} className={chip(filter === "known")}>כבר חברים · {knownCount}</button>
                        </div>
                        <label className="ms-auto flex items-center gap-2 text-[14px] font-extrabold">
                            מיון:
                            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className={`${field} min-h-10`}>
                                <option value="file">סדר הקובץ</option><option value="name">שם</option><option value="home">{homeWord}</option>
                            </select>
                        </label>
                    </div>
                    <section className={panel} aria-labelledby="in-title">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 id="in-title" className="m-0 font-display text-[20px]">{filter === "known" ? "כבר בארגון" : filter === "fix" ? "לתיקון" : "יוזמנו"}</h2>
                            {filter === "all" && <span className="rounded-full border-2 border-[var(--mh-ink)] bg-[#D7F5E8] px-2 text-[13px] font-extrabold">{invited.length}</span>}
                            {filter !== "known" && <span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">הכפתור × מעביר ל״לא יוזמנו״.</span>}
                            <button type="button" disabled={busy} onClick={() => start(async () => setNote(await sendSample(orgId, template)))} className="ms-auto min-h-10 font-extrabold underline">שליחת הזמנה לדוגמה אליי</button>
                        </div>
                        {!mainList.length && <p className="m-0 font-semibold text-[var(--mh-ink-soft)]">{filter === "fix" ? "אין שורות לתיקון." : "אין כאן אף אחד."}</p>}
                        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-[10px] p-0">
                            {visible.map((p) => (
                                <PersonTile key={p.line} p={p} homeWord={homeWord} known={filter === "known"} pendingInvite={isPendingInvite(p)} fixing={fixing === p.line}
                                    onOut={() => setOut((o) => [...o, p.line])} onFix={() => setFixing(p.line)} onCancel={() => setFixing(null)} onSave={(c) => saveFix(p.line, c)} />
                            ))}
                        </ul>
                        {mainList.length > SHOWN && (
                            <p className="m-0 text-[14px] font-semibold">מוצגים {visible.length} מתוך {mainList.length} · <button type="button" onClick={() => setAll((v) => !v)} className="min-h-10 font-extrabold underline">{all ? "הצגת פחות" : "הצגת הכול"}</button></p>
                        )}
                    </section>
                    {filter === "all" && out.length > 0 && (
                        <section className="flex flex-col gap-3 rounded-[18px] border-2 border-dashed border-[var(--mh-ink)] bg-white/60 p-4" aria-labelledby="out-title">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 id="out-title" className="m-0 font-display text-[19px]">לא יוזמנו</h2>
                                <span className="rounded-full bg-[#E9E4F2] px-2 text-[13px] font-extrabold">{out.length}</span>
                                <span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">לא יישלח להם כלום. אפשר להחזיר בכל רגע.</span>
                            </div>
                            <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-[10px] p-0">
                                {people.filter((p) => out.includes(p.line)).map((p) => (
                                    <li key={p.line} className="flex items-center gap-2 rounded-[16px] border-2 border-[var(--mh-ink)] bg-[#F1EDF8] p-2 opacity-75">
                                        <span className="flex min-w-0 flex-1 flex-col"><b className="truncate">{p.name || "בלי שם"}</b><span className="truncate text-[12px] font-semibold">{p.note || p.home || ""}</span></span>
                                        <button type="button" aria-label="החזרה לרשימת המוזמנים" onClick={() => setOut((o) => o.filter((x) => x !== p.line))} className="min-h-[34px] rounded-full border-2 border-[var(--mh-ink)] bg-white px-3 text-[13px] font-extrabold">החזרה</button>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                    <div className="sticky bottom-0 z-10 -mx-[clamp(12px,2vw,24px)] flex flex-wrap items-center gap-3 border-t-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-bg)] px-[clamp(12px,2vw,24px)] py-3">
                        <span className="flex flex-col">
                            <b>{invited.length} יוזמנו · {notInvited.length} לא יוזמנו · {fixCount} לתיקון</b>
                            <span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">מי שבתיקון לא נספר עד שיתוקן.</span>
                        </span>
                        <button type="button" disabled={!invited.length} onClick={() => go(4)} className={`${btn} ms-auto`} style={{ background: color, color: onColor(color) }}>להמשך: הגדרות שליחה</button>
                    </div>
                </>
            )}

            {step === 4 && (
                <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-[14px] xl:grid-cols-[minmax(0,1fr)_420px]">
                    <div className="flex flex-col gap-[14px]">
                        <section className={`${panel} ${mode === "list" ? "opacity-50" : ""}`} aria-labelledby="msg-title">
                            <div><h2 id="msg-title" className="m-0 font-display text-[19px]">הודעה</h2><p className="m-0 text-[13px] font-semibold text-[var(--mh-ink-soft)]">אותה הודעה לכולם. {"{שם}"} מתחלף בשם הפרטי, {"{שולח}"} בשם שלכם.</p></div>
                            <label className="flex flex-col gap-1">
                                <span className="text-[15px] font-extrabold">נוסח</span>
                                <textarea disabled={mode === "list"} value={template} onChange={(e) => setTemplate(e.target.value)} maxLength={INVITE_TEXT_MAX} rows={3} className={`${field} p-3 font-semibold`} />
                            </label>
                            <div className="rounded-[14px] border-2 border-dashed border-[var(--mh-ink)] bg-[var(--mh-ticket)] p-3 text-[14px] font-semibold"><b className="block text-[12px] text-[var(--mh-ink-soft)]">כך זה ייראה</b>{sample} <bdi dir="ltr" className="font-extrabold text-[#3B2BB5] underline">…/invite/••••</bdi></div>
                            <span className="text-[15px] font-extrabold" id="ch-l">ערוץ</span>
                            <div role="radiogroup" aria-labelledby="ch-l" className="flex flex-wrap gap-2">
                                {[["whatsapp", "WhatsApp"], ["sms", "SMS"], ["email", "דוא״ל"]].map(([id, l]) => <button key={id} type="button" role="radio" disabled={mode === "list"} aria-checked={channel === id} onClick={() => setChannel(id)} className={chip(channel === id)}><bdi>{l}</bdi></button>)}
                            </div>
                            <label className="flex min-h-11 items-center gap-3">
                                <input type="checkbox" role="switch" disabled={mode === "list"} checked={remind} onChange={(e) => setRemind(e.target.checked)} className="h-6 w-6 accent-[#00B67A]" />
                                <span className="flex flex-col"><b>תזכורת אחרי 3 ימים למי שלא אישר</b><span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">פעם אחת בלבד.</span></span>
                            </label>
                            {missing.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 rounded-[14px] border-2 border-[#C4223B] bg-[#FFE9E6] p-3 text-[14px] font-bold">
                                    <span className="flex-1">{missing.length === 1 ? "לאדם אחד" : `ל-${missing.length} אנשים`} ברשימה אין {channel === "email" ? "מייל" : "טלפון"}, אז אי אפשר לשלוח להם בערוץ הזה.</span>
                                    <button type="button" onClick={() => setOut((o) => [...o, ...missing.map((p) => p.line)])} className="min-h-10 rounded-full border-2 border-[var(--mh-ink)] bg-white px-3 font-extrabold">להוציא אותם מהרשימה</button>
                                </div>
                            )}
                        </section>
                        {(plans.length > 0 || labels.length > 0) && (
                            <section className={panel} aria-labelledby="all-title">
                                <div><h2 id="all-title" className="m-0 font-display text-[19px]">לכולם ברשימה</h2><p className="m-0 text-[13px] font-semibold text-[var(--mh-ink-soft)]">חל על מי שמאשר. אפשר לשנות לכל אחד אחר כך בתיק החבר.</p></div>
                                {plans.length > 0 && (
                                    <div role="radiogroup" aria-label="מסלול" className="flex flex-wrap gap-2">
                                        <button type="button" role="radio" aria-checked={!planId} onClick={() => setPlanId("")} className={chip(!planId)}>בלי מסלול</button>
                                        {plans.map((p) => <button key={p.id} type="button" role="radio" aria-checked={planId === p.id} onClick={() => setPlanId(p.id)} className={chip(planId === p.id)}>{p.name}</button>)}
                                    </div>
                                )}
                                {labels.length > 0 && (
                                    <div role="group" aria-label="תוויות" className="flex flex-wrap gap-2">
                                        {labels.map((l) => {
                                            const on = labelIds.includes(l.id);
                                            return (
                                                <button key={l.id} type="button" aria-pressed={on} onClick={() => setLabelIds((x) => (on ? x.filter((y) => y !== l.id) : [...x, l.id]))} className={`inline-flex min-h-11 items-center gap-2 rounded-[12px] border-2 border-[var(--mh-ink)] px-3 font-extrabold ${on ? "shadow-[0_3px_0_var(--mh-ink)]" : "opacity-70"}`} style={{ background: l.color }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={TAG_ICON} /></svg><bdi>{l.name}</bdi>{on && <span aria-hidden="true">✓</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>
                        )}
                        <section className={panel} aria-labelledby="go-title">
                            <h2 id="go-title" className="m-0 font-display text-[19px]">לפני שליחה</h2>
                            <div className="flex flex-wrap gap-2 text-[13px] font-extrabold">
                                <span className="rounded-full border-2 border-[var(--mh-ink)] bg-[#D7F5E8] px-3 py-1">{invited.length} {mode === "list" ? "ייובאו" : "יוזמנו"}</span>
                                <span className="rounded-full border-2 border-[var(--mh-ink)] bg-[#E3DDFF] px-3 py-1">{notInvited.length} לא {mode === "list" ? "ייובאו" : "יוזמנו"}</span>
                                <span className="rounded-full border-2 border-[var(--mh-ink)] bg-[#FFF6D1] px-3 py-1">{fixCount} לתיקון</span>
                            </div>
                            <label className="flex min-h-11 items-start gap-3">
                                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--mh-ink)]" />
                                <span className="font-semibold">{mode === "list" ? "מאשרים שהאנשים ברשימה מכירים את הארגון ושמותר לשמור את הפרטים שלהם." : "מאשרים שהאנשים ברשימה מכירים את הארגון ושמותר לפנות אליהם בהודעה."}</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" disabled={!consent || busy || !invited.length || missing.length > 0} onClick={() => setConfirm(true)} className={btn} style={{ background: color, color: onColor(color) }}>
                                    {busy ? "מייבאים…" : mode === "list" ? `ייבוא ${invited.length} חברים` : `שליחת ${invited.length} הזמנות`}
                                </button>
                                {mode === "invite" && <button type="button" disabled={busy} onClick={() => start(async () => setNote(await sendSample(orgId, template)))} className={`${btn} bg-white`}>שליחת הזמנה לדוגמה אליי</button>}
                            </div>
                            {confirm && (
                                <div role="alertdialog" aria-labelledby="sure" className="flex flex-col gap-3 rounded-[16px] border-2 border-[var(--mh-ink)] bg-[#FFF6D1] p-3">
                                    <b id="sure">{mode === "list" ? `לייבא ${invited.length} אנשים כרשימה? לא יישלח להם כלום.` : `לשלוח ${invited.length === 1 ? "הזמנה אחת" : `${invited.length} הזמנות`} עכשיו? אי אפשר לבטל הודעה שכבר נשלחה.`}</b>
                                    <div className="flex flex-wrap gap-2">
                                        <button type="button" onClick={send} className={`${btn} bg-[var(--mh-sun)]`}>{mode === "list" ? "כן, לייבא" : "כן, לשלוח"}</button>
                                        <button type="button" onClick={() => setConfirm(false)} className={`${btn} bg-white`}>ביטול</button>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                    <aside className={`${panel} xl:sticky xl:top-4`} aria-labelledby="mode-title">
                        <div><h2 id="mode-title" className="m-0 font-display text-[19px]">מה לעשות עם {invited.length} המוזמנים</h2><p className="m-0 text-[13px] font-semibold text-[var(--mh-ink-soft)]">בוחרים אחד</p></div>
                        <div role="radiogroup" aria-labelledby="mode-title" className="flex flex-col gap-2">
                            {([["invite", "לשלוח הזמנה לכולם", "כל אחד מאשר בלחיצה ונכנס.", true], ["list", "לייבא כרשימה בלבד", "לא נשלח כלום. כל אחד יתחבר לרשומה שלו כשיצטרף עם אותו טלפון או מייל.", false]] as const).map(([id, title, line, rec]) => (
                                <button key={id} type="button" role="radio" aria-checked={mode === id} onClick={() => setMode(id)} className={`flex items-start gap-3 rounded-[16px] border-2 border-[var(--mh-ink)] p-3 text-start ${mode === id ? "bg-[#FFF6D1] shadow-[0_3px_0_var(--mh-ink)]" : "bg-white"}`}>
                                    <span className="mt-[2px] grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border-2 border-[var(--mh-ink)] bg-white" aria-hidden="true">{mode === id && <span className="h-[10px] w-[10px] rounded-full bg-[var(--mh-ink)]" />}</span>
                                    <span className="flex flex-col gap-1">
                                        <b className="flex flex-wrap items-center gap-2">{title}{rec && <span className="rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-sun)] px-2 text-[12px]">מומלץ</span>}</b>
                                        <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">{line}</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </aside>
                </div>
            )}
        </div>
    );
}

function PersonTile({ p, homeWord, known, pendingInvite, fixing, onOut, onFix, onCancel, onSave }: {
    p: ImportRow; homeWord: string; known: boolean; pendingInvite: boolean; fixing: boolean;
    onOut: () => void; onFix: () => void; onCancel: () => void; onSave: (c: { name: string; phone: string; email: string }) => void;
}) {
    const [name, setName] = useState(p.name);
    const [phone, setPhone] = useState(p.phoneRaw);
    const [email, setEmail] = useState(p.emailRaw);
    const first = [...(p.name || "?")][0];
    const contact = p.phone ? localPhone(p.phone) : p.email ?? (p.phoneRaw || p.emailRaw || "—");
    const sub = [p.home && (homeWord === "דירה" ? `דירה ${p.home}` : p.home), known ? (pendingInvite ? "כבר הוזמן" : "כבר חבר") : null].filter(Boolean).join(" · ");
    if (fixing) {
        return (
            <li className="col-span-full flex flex-col gap-2 rounded-[16px] border-2 border-[var(--mh-ink)] bg-[#FFF6D1] p-3 sm:col-span-2">
                <b>תיקון שורה {p.line}</b>
                <input aria-label="שם" value={name} onChange={(e) => setName(e.target.value)} placeholder="שם" className={field} />
                <input aria-label="טלפון" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" inputMode="tel" placeholder="050-0000000" className={`${field} text-end`} />
                <input aria-label="מייל" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" inputMode="email" placeholder="name@example.com" className={`${field} text-end`} />
                <div className="flex gap-2">
                    <button type="button" onClick={() => onSave({ name, phone, email })} className="min-h-10 rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-sun)] px-4 font-extrabold">שמירה</button>
                    <button type="button" onClick={onCancel} className="min-h-10 rounded-full border-2 border-[var(--mh-ink)] bg-white px-4 font-extrabold">ביטול</button>
                </div>
            </li>
        );
    }
    return (
        <li className={`relative flex flex-col gap-1 rounded-[16px] border-2 border-[var(--mh-ink)] p-3 pe-9 shadow-[0_2px_0_var(--mh-ink)] ${p.problem ? "bg-[#FFF6D1]" : known ? "bg-[#F1EDF8]" : "bg-white"}`}>
            {!p.problem && !known && <button type="button" aria-label={`להסיר מהרשימה: ${p.name || `שורה ${p.line}`}`} onClick={onOut} className="absolute end-1 top-1 grid h-[30px] w-[30px] place-items-center rounded-full border-2 border-[var(--mh-ink)] bg-white text-[15px] font-extrabold">×</button>}
            <span className="flex items-center gap-2">
                <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border-2 border-[var(--mh-ink)] bg-[#E3DDFF] font-extrabold" aria-hidden="true">{first}</span>
                <span className="flex min-w-0 flex-col">
                    <b className="truncate">{p.name || "בלי שם"}</b>
                    <bdi dir="ltr" className="truncate text-end text-[13px] font-semibold">{contact}</bdi>
                </span>
            </span>
            {sub && <span className="truncate text-[12px] font-semibold text-[var(--mh-ink-soft)]">{sub}</span>}
            {p.problem && (
                <span className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border-2 border-[var(--mh-ink)] bg-[#FFE9E6] px-2 text-[12px] font-extrabold">{p.problem}</span>
                    <button type="button" onClick={onFix} className="min-h-9 font-extrabold underline">תיקון</button>
                </span>
            )}
        </li>
    );
}
