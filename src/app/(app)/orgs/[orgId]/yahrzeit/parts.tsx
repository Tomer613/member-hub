"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { HEBREW_DAYS, HEBREW_MONTHS, YAHRZEIT_RELATIONS } from "@/packs/synagogue/yahrzeit";
import { ADAR_RULES, DEDICATION_LABEL_MAX, DEDICATION_MAX, MISSING30_RULES, NAME_MAX, NOTES_MAX, REMIND_DAYS, type Dedication, type YahrzeitInput, type YahrzeitRules } from "@/lib/yahrzeit";
import { deleteYahrzeit, saveDedications, saveYahrzeit, saveYahrzeitSettings, type YahrzeitResult } from "./actions";

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
                    <span className={hint}>מחושב מחדש כל שנה. מי שנפטר באדר בשנה רגילה: בשנה מעוברת לפי מנהג הקהילה שבהגדרות.</span>
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

// A choice between customs: each option with its short line, as radio cards.
function Custom({ name, title, options, value, onChange, disabled }: { name: string; title: string; options: readonly { value: string; label: string; line: string }[]; value: string; onChange: (v: string) => void; disabled: boolean }) {
    return (
        <fieldset disabled={disabled} className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
            <legend className={`${label} mb-2 p-0`}>{title}</legend>
            {options.map((o) => (
                <label key={o.value} className={`flex cursor-pointer items-start gap-3 rounded-[14px] border-2 border-[var(--mh-ink)] p-3 transition-colors duration-150 ${value === o.value ? "bg-[var(--mh-tint-sun)]" : "bg-white hover:bg-[var(--mh-ticket)]"}`}>
                    <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="mt-1 size-[18px] shrink-0 accent-[var(--mh-ink)]" />
                    <span className="flex min-w-0 flex-col gap-[2px]">
                        <b className="leading-tight">{o.label}</b>
                        <span className={hint}>{o.line}</span>
                    </span>
                </label>
            ))}
        </fieldset>
    );
}

// "הגדרות": when to send, and the org's custom for dates a year may not have. The channel is the app and email
// until SMS and push are connected.
export function RemindSettings({ orgId, days, rules }: { orgId: string; days: number; rules: YahrzeitRules }) {
    const router = useRouter();
    const [v, setV] = useState({ days, ...rules });
    const [res, setRes] = useState<YahrzeitResult | null>(null);
    const [busy, run] = useTransition();
    const save = (next: typeof v) => { setV(next); run(async () => { setRes(await saveYahrzeitSettings(orgId, next)); router.refresh(); }); };
    return (
        <section className={panel} aria-labelledby="rs-h">
            <h2 id="rs-h" className="m-0 font-display text-[20px]">הגדרות</h2>
            <label className="flex flex-col gap-2">
                <span className={label}>מתי לשלוח תזכורת</span>
                <select value={v.days} disabled={busy} onChange={(e) => save({ ...v, days: Number(e.target.value) })} className={field}>
                    {REMIND_DAYS.map((n) => <option key={n} value={n}>{n === 1 ? "יום לפני" : `${n} ימים לפני`}</option>)}
                </select>
            </label>
            <div className="flex flex-col gap-1">
                <span className={label}>ערוץ</span>
                <span className="font-bold">התראה באפליקציה ומייל</span>
                <span className={hint}>הודעות SMS והתראות לטלפון יתווספו כשנחבר את שירות ההודעות.</span>
            </div>
            <div className="flex flex-col gap-1 rounded-[14px] bg-[var(--mh-ticket)] p-3">
                <b>מנהג הקהילה</b>
                <span className={hint}>בשני המקרים האלה יש מנהגים שונים. כדאי שהגבאי והרב יחליטו לפי מנהג המקום.</span>
            </div>
            <Custom name="adar" title="מי שנפטר באדר בשנה רגילה, בשנה מעוברת:" options={ADAR_RULES} value={v.adar} onChange={(x) => save({ ...v, adar: x as YahrzeitRules["adar"] })} disabled={busy} />
            <Custom name="m30" title="מי שנפטר ביום ל׳ בחודש, בשנה שבה לחודש יש רק 29 ימים:" options={MISSING30_RULES} value={v.missing30} onChange={(x) => save({ ...v, missing30: x as YahrzeitRules["missing30"] })} disabled={busy} />
            {res?.ok && <span role="status" className="font-bold text-[#00573A]">{res.ok}</span>}
            {res?.error && <span role="alert" className="font-extrabold text-[#B0182F]">{res.error}</span>}
        </section>
    );
}

// "הצעת הקדשה" (synagogue-tools 19): the reminder to the family carries a gentle invitation and one button.
export function DedicationSettings({ orgId, on, items }: { orgId: string; on: boolean; items: Dedication[] }) {
    const [v, setV] = useState({ on, items: items.map((x) => ({ label: x.label, price: String(x.priceMinor / 100) })) });
    const [res, setRes] = useState<YahrzeitResult | null>(null);
    const [busy, run] = useTransition();
    const edit = (i: number, k: "label" | "price", x: string) => { setV((o) => ({ ...o, items: o.items.map((it, j) => (j === i ? { ...it, [k]: x } : it)) })); setRes(null); };
    return (
        <form className={panel} aria-labelledby="dd-h" onSubmit={(e) => { e.preventDefault(); run(async () => setRes(await saveDedications(orgId, v))); }}>
            <h2 id="dd-h" className="m-0 font-display text-[20px]">הצעת הקדשה</h2>
            <fieldset disabled={busy} className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
                <Toggle on={v.on} onChange={(x) => { setV((o) => ({ ...o, on: x })); setRes(null); }} title="להציע הקדשה בתזכורת" line="התזכורת למשפחה כוללת הזמנה עדינה וכפתור אחד: להקדשה. בלי מעקב ובלי תזכורת נוספת." />
                {v.on && (
                    <>
                        <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label="ההקדשות">
                            {v.items.map((it, i) => (
                                <li key={i} className="grid grid-cols-[minmax(0,1fr)_96px_auto] items-center gap-2">
                                    <input aria-label="שם ההקדשה" value={it.label} maxLength={DEDICATION_LABEL_MAX} onChange={(e) => edit(i, "label", e.target.value)} placeholder="למשל: קידוש לעילוי נשמת" className={field} />
                                    <input aria-label="מחיר בשקלים" value={it.price} inputMode="decimal" dir="ltr" onChange={(e) => edit(i, "price", e.target.value)} placeholder="₪" className={`${field} text-start`} />
                                    <button type="button" aria-label={`הסרת ${it.label || "השורה"}`} onClick={() => { setV((o) => ({ ...o, items: o.items.filter((_, j) => j !== i) })); setRes(null); }}
                                        className="grid size-11 place-items-center rounded-full border-2 border-[var(--mh-ink)] bg-white transition-colors hover:bg-[#FFF0F2]">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                        {v.items.length < DEDICATION_MAX && (
                            <button type="button" onClick={() => setV((o) => ({ ...o, items: [...o.items, { label: "", price: "" }] }))} className="self-start font-extrabold underline underline-offset-4">הוספת הקדשה</button>
                        )}
                        <span className={hint}>המחירים בשקלים. מה שהמשפחה בוחרת נרשם בתרומות ונדרים, ומופיע לה כחיוב בכרטיס.</span>
                    </>
                )}
            </fieldset>
            <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={busy} className={`${btn} bg-[var(--mh-sun)]`}>{busy ? "שומרים…" : "שמירה"}</button>
                {res?.ok && <span role="status" className="font-bold text-[#00573A]">{res.ok}</span>}
                {res?.error && <span role="alert" className="font-extrabold text-[#B0182F]">{res.error}</span>}
            </div>
        </form>
    );
}
