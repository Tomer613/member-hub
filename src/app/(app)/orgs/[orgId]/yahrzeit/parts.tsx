"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { HEBREW_DAYS, HEBREW_MONTHS, YAHRZEIT_RELATIONS } from "@/packs/synagogue/yahrzeit";
import { NAME_MAX, NOTES_MAX, REMIND_DAYS, type YahrzeitInput } from "@/lib/yahrzeit";
import { deleteYahrzeit, saveRemindDays, saveYahrzeit, type YahrzeitResult } from "./actions";

const panel = "flex flex-col gap-4 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_3px_0_var(--mh-ink)] md:p-5";
const field = "min-h-11 w-full rounded-[14px] border-2 border-[var(--mh-ink)] bg-white px-[14px] font-semibold outline-none placeholder:text-[var(--mh-ink-soft)] focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)]";
const label = "text-[14px] font-extrabold";
const hint = "text-[14px] font-semibold text-[var(--mh-ink-soft)]";
const btn = "inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] px-[18px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none";

function Toggle({ on, onChange, title, line }: { on: boolean; onChange: (v: boolean) => void; title: string; line: string }) {
    return (
        <label className={`flex cursor-pointer items-center justify-between gap-3 rounded-[18px] border-[2.5px] border-[var(--mh-ink)] p-[14px] transition-colors duration-200 ${on ? "bg-[var(--mh-tint-sun)]" : "bg-white"}`}>
            <span className="flex min-w-0 flex-col gap-1">
                <b className="text-[16px] leading-tight">{title}</b>
                <span className={hint}>{line}</span>
            </span>
            <input type="checkbox" role="switch" checked={on} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
            <span aria-hidden="true" className={`relative inline-flex h-8 w-14 shrink-0 rounded-full border-[2.5px] border-[var(--mh-ink)] transition-colors duration-200 peer-focus-visible:ring-[3px] peer-focus-visible:ring-[var(--mh-ink)] peer-focus-visible:ring-offset-2 ${on ? "bg-[var(--mh-ok)]" : "bg-white"}`}>
                <span className={`absolute top-[2px] h-[22px] w-[22px] rounded-full border-2 border-[var(--mh-ink)] bg-white transition-[inset-inline-start] duration-200 ${on ? "start-[26px]" : "start-[2px]"}`} />
            </span>
        </label>
    );
}

// "הוספת יארצייט" and editing one (board D-ModSynYahrzeit).
export function YahrzeitForm({ orgId, id, start, families, saved }: { orgId: string; id: string | null; start: YahrzeitInput; families: { id: string; label: string }[]; saved: string | null }) {
    const router = useRouter();
    const [v, setV] = useState(start);
    const [res, setRes] = useState<YahrzeitResult | null>(saved ? { ok: saved } : null);
    const [asking, setAsking] = useState(false);
    const [busy, run] = useTransition();
    const set = <K extends keyof YahrzeitInput>(k: K, x: YahrzeitInput[K]) => { setV((o) => ({ ...o, [k]: x })); setRes(null); };
    const save = () => run(async () => {
        const r = await saveYahrzeit(orgId, id, v);
        setRes(r);
        if (r.id && !id) router.replace(`/orgs/${orgId}/yahrzeit?e=${r.id}&saved=1`);
        else if (r.ok) router.refresh();
    });
    const remove = () => run(async () => {
        const r = await deleteYahrzeit(orgId, id!);
        if (r.ok) router.replace(`/orgs/${orgId}/yahrzeit`);
        else setRes(r);
    });
    return (
        <form className={panel} aria-labelledby="yz-h" onSubmit={(e) => { e.preventDefault(); save(); }}>
            <h2 id="yz-h" className="m-0 font-display text-[22px] leading-tight">{id ? "עריכת יארצייט" : "הוספת יארצייט"}</h2>
            <fieldset disabled={busy} className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
                <label className="flex flex-col gap-2">
                    <span className={label}>לזכר</span>
                    <input value={v.name} onChange={(e) => set("name", e.target.value)} maxLength={NAME_MAX} placeholder="למשל: אבי הזקן ז״ל" className={field} required />
                </label>
                <label className="flex flex-col gap-2">
                    <span className={label}>קרבה</span>
                    <select value={v.relation} onChange={(e) => set("relation", e.target.value)} className={field}>
                        {YAHRZEIT_RELATIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                </label>
                <div className="flex flex-col gap-2">
                    <span className={label} id="hd-l">תאריך עברי של הפטירה</span>
                    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3">
                        <select aria-labelledby="hd-l" aria-label="יום" value={v.day} onChange={(e) => set("day", e.target.value)} className={field}>
                            {HEBREW_DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                        <select aria-label="חודש" value={v.month} onChange={(e) => set("month", e.target.value)} className={field}>
                            {HEBREW_MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <span className={hint}>מחושב מחדש כל שנה. באדר בשנה מעוברת: אדר ב׳, אלא אם בוחרים אדר א׳.</span>
                </div>
                <label className="flex flex-col gap-2">
                    <span className={label}>משפחה</span>
                    <select value={v.memberId} onChange={(e) => set("memberId", e.target.value)} className={field} required>
                        <option value="">בחרו חבר</option>
                        {families.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                    <span className={hint}>מי שמקבל את התזכורת.</span>
                </label>
                <label className="flex flex-col gap-2">
                    <span className={label}>הערה <span className="font-bold text-[var(--mh-ink-soft)]">(לא חובה, רק מנהלים רואים)</span></span>
                    <textarea value={v.notes} onChange={(e) => set("notes", e.target.value)} rows={2} maxLength={NOTES_MAX} placeholder="למשל: עלייה לתורה בשבת שלפני" className={`${field} py-3`} />
                </label>
                <Toggle on={v.remind} onChange={(x) => set("remind", x)} title="תזכורת למשפחה" line="הודעה באפליקציה ובמייל, לפני התאריך" />
                <Toggle on={v.announce} onChange={(x) => set("announce", x)} title="הודעה לקהל" line="כל החברים מקבלים הודעה באותו יום שבו נשלחת התזכורת" />
            </fieldset>
            <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={busy} className={`${btn} bg-[var(--mh-sun)]`}>{busy ? "שומרים…" : "שמירה"}</button>
                {res?.ok && <span role="status" className="font-bold text-[#00573A]">{res.ok}</span>}
                {res?.error && <span role="alert" className="font-extrabold text-[#B0182F]">{res.error}</span>}
            </div>
            {id && (asking ? (
                <div role="alertdialog" aria-labelledby="del-h" className="flex flex-wrap items-center gap-2 rounded-[16px] border-2 border-[var(--mh-ink)] bg-[#FFF0F2] p-3">
                    <b id="del-h" className="me-auto">למחוק את היארצייט?</b>
                    <button type="button" disabled={busy} onClick={remove} className={`${btn} bg-[#C4223B] text-white`}>כן, למחוק</button>
                    <button type="button" disabled={busy} onClick={() => setAsking(false)} className={`${btn} bg-white`}>לא</button>
                </div>
            ) : <button type="button" onClick={() => setAsking(true)} className="self-start font-extrabold text-[#B0182F] underline underline-offset-4">מחיקה</button>)}
        </form>
    );
}

// "הגדרות תזכורת": when to send. The channel is the app and email until SMS and push are connected.
export function RemindSettings({ orgId, days }: { orgId: string; days: number }) {
    const router = useRouter();
    const [d, setD] = useState(days);
    const [res, setRes] = useState<YahrzeitResult | null>(null);
    const [busy, run] = useTransition();
    return (
        <section className={panel} aria-labelledby="rs-h">
            <h2 id="rs-h" className="m-0 font-display text-[20px]">הגדרות תזכורת</h2>
            <label className="flex flex-col gap-2">
                <span className={label}>מתי לשלוח</span>
                <select value={d} disabled={busy} onChange={(e) => { const n = Number(e.target.value); setD(n); run(async () => { setRes(await saveRemindDays(orgId, n)); router.refresh(); }); }} className={field}>
                    {REMIND_DAYS.map((n) => <option key={n} value={n}>{n === 1 ? "יום לפני" : `${n} ימים לפני`}</option>)}
                </select>
            </label>
            <div className="flex flex-col gap-1">
                <span className={label}>ערוץ</span>
                <span className="font-bold">התראה באפליקציה ומייל</span>
                <span className={hint}>הודעות SMS והתראות לטלפון יתווספו כשנחבר את שירות ההודעות.</span>
            </div>
            {res?.ok && <span role="status" className="font-bold text-[#00573A]">{res.ok}</span>}
            {res?.error && <span role="alert" className="font-extrabold text-[#B0182F]">{res.error}</span>}
        </section>
    );
}
