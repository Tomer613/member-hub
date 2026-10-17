"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CANDLE_MINUTES, DAYS, NAME_MAX, PLACE_MAX, PRAYER_NAMES, shortDate, UPDATE_MAX } from "@/lib/prayers";
import { changeThisWeek, deletePrayer, saveCandleMinutes, saveOneTime, savePrayer, sendPrayerUpdate, undoChange, type PrayersResult } from "./actions";

const panel = "flex flex-col gap-4 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_3px_0_var(--mh-ink)] md:p-5";
const field = "min-h-11 w-full rounded-[14px] border-2 border-[var(--mh-ink)] bg-white px-[14px] font-semibold outline-none placeholder:text-[var(--mh-ink-soft)] focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)]";
const label = "text-[14px] font-extrabold";
const hint = "text-[14px] font-semibold text-[var(--mh-ink-soft)]";
const btn = "inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] px-[18px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none";

function Result({ res }: { res: PrayersResult | null }) {
    if (res?.ok) return <span role="status" className="font-bold text-[#00573A]">{res.ok}</span>;
    if (res?.error) return <span role="alert" className="font-extrabold text-[#B0182F]">{res.error}</span>;
    return null;
}

// The prayer's name: the usual ones to pick, or any other typed.
function NameField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <label className="flex flex-col gap-2">
            <span className={label}>תפילה</span>
            <input value={value} onChange={(e) => onChange(e.target.value)} list="pr-names" maxLength={NAME_MAX} placeholder="למשל: מנחה" className={field} required />
            <datalist id="pr-names">{PRAYER_NAMES.map((n) => <option key={n} value={n} />)}</datalist>
        </label>
    );
}
function TimePlace({ time, place, onTime, onPlace }: { time: string; place: string; onTime: (v: string) => void; onPlace: (v: string) => void }) {
    return (
        <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3">
            <label className="flex flex-col gap-2">
                <span className={label}>שעה</span>
                <input type="time" value={time} onChange={(e) => onTime(e.target.value)} className={`${field} text-start`} required dir="ltr" />
            </label>
            <label className="flex flex-col gap-2">
                <span className={label}>מקום <span className="font-bold text-[var(--mh-ink-soft)]">(לא חובה)</span></span>
                <input value={place} onChange={(e) => onPlace(e.target.value)} maxLength={PLACE_MAX} placeholder="היכל, בית המדרש" className={field} />
            </label>
        </div>
    );
}

type Start = { day: string; name: string; time: string; place: string };

// "+ תפילה" and editing a prayer of the regular week ("קבוע"). From "שבוע זה" a new prayer can also be for
// this week only (סליחות, a minyan for an event).
export function PrayerForm({ orgId, id, oneTimeId, start, week, today, back, saved }: {
    orgId: string; id: string | null; oneTimeId: string | null; start: Start & { date?: string }; week: string[] | null; today: string; back: string; saved: string | null;
}) {
    const router = useRouter();
    const [v, setV] = useState(start);
    const [once, setOnce] = useState(!!oneTimeId);
    const [date, setDate] = useState(start.date ?? (week?.find((d) => d >= today) ?? today));
    const [res, setRes] = useState<PrayersResult | null>(saved ? { ok: saved } : null);
    const [asking, setAsking] = useState(false);
    const [busy, run] = useTransition();
    const set = <K extends keyof Start>(k: K, x: string) => { setV((o) => ({ ...o, [k]: x })); setRes(null); };
    const fresh = !id && !oneTimeId;
    const save = () => run(async () => {
        const r = once ? await saveOneTime(orgId, oneTimeId, { ...v, date }) : await savePrayer(orgId, id, v);
        setRes(r);
        if (r.id && fresh) router.replace(`/orgs/${orgId}/prayers?${once ? `e=c-${r.id}` : `v=fixed&e=${r.id}`}&saved=1`);
        else if (r.ok) router.refresh();
    });
    const remove = () => run(async () => {
        const r = oneTimeId ? await undoChange(orgId, oneTimeId) : await deletePrayer(orgId, id!);
        if (r.ok) router.replace(back);
        else setRes(r);
    });
    const left = (week ?? []).filter((d) => d >= today);
    return (
        <form className={panel} aria-labelledby="pr-h" onSubmit={(e) => { e.preventDefault(); save(); }}>
            <h2 id="pr-h" className="m-0 font-display text-[22px] leading-tight">{fresh ? "תפילה חדשה" : oneTimeId ? "תפילה לשבוע הזה" : "עריכת תפילה בלוח הקבוע"}</h2>
            <fieldset disabled={busy} className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
                {fresh && week && left.length > 0 && (
                    <div role="radiogroup" aria-label="לאיזה שבוע" className="grid grid-cols-2 gap-2">
                        {[{ o: false, t: "כל שבוע", l: "נכנס ללוח הקבוע" }, { o: true, t: "רק השבוע", l: "למשל סליחות או מניין לאירוע" }].map((x) => (
                            <label key={x.t} className={`flex cursor-pointer flex-col gap-[2px] rounded-[14px] border-2 border-[var(--mh-ink)] p-3 transition-colors duration-150 ${once === x.o ? "bg-[var(--mh-tint-sun)]" : "bg-white hover:bg-[var(--mh-ticket)]"}`}>
                                <span className="flex items-center gap-2"><input type="radio" name="pr-once" checked={once === x.o} onChange={() => { setOnce(x.o); setRes(null); }} className="size-[18px] accent-[var(--mh-ink)]" /><b>{x.t}</b></span>
                                <span className={hint}>{x.l}</span>
                            </label>
                        ))}
                    </div>
                )}
                {once ? (
                    <label className="flex flex-col gap-2">
                        <span className={label}>יום</span>
                        <select value={date} onChange={(e) => { setDate(e.target.value); setRes(null); }} className={field}>
                            {(left.includes(date) ? left : [date, ...left]).map((d) => <option key={d} value={d}>{`${DAYS[new Date(`${d}T12:00:00Z`).getUTCDay()]}, ${shortDate(d)}`}</option>)}
                        </select>
                    </label>
                ) : (
                    <label className="flex flex-col gap-2">
                        <span className={label}>יום</span>
                        <select value={v.day} onChange={(e) => set("day", e.target.value)} className={field}>
                            {DAYS.map((d, i) => <option key={d} value={String(i)}>{d}</option>)}
                        </select>
                    </label>
                )}
                <NameField value={v.name} onChange={(x) => set("name", x)} />
                <TimePlace time={v.time} place={v.place} onTime={(x) => set("time", x)} onPlace={(x) => set("place", x)} />
                {!once && <span className={hint}>{id ? "השינוי חל מעכשיו על כל השבועות. לשינוי של השבוע הזה בלבד, עברו ל\"שבוע זה\"." : "חוזר כל שבוע באותו יום ובאותה שעה."}</span>}
            </fieldset>
            <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={busy} className={`${btn} bg-[var(--mh-sun)]`}>{busy ? "שומרים…" : "שמירה"}</button>
                <Result res={res} />
            </div>
            {!fresh && (asking ? (
                <div role="alertdialog" aria-labelledby="del-h" className="flex flex-wrap items-center gap-2 rounded-[16px] border-2 border-[var(--mh-ink)] bg-[#FFF0F2] p-3">
                    <b id="del-h" className="me-auto">{oneTimeId ? "להסיר מהשבוע?" : "להסיר מהלוח הקבוע? היא לא תופיע יותר בשום שבוע."}</b>
                    <button type="button" disabled={busy} onClick={remove} className={`${btn} bg-[#C4223B] text-white`}>כן, להסיר</button>
                    <button type="button" disabled={busy} onClick={() => setAsking(false)} className={`${btn} bg-white`}>לא</button>
                </div>
            ) : <button type="button" onClick={() => setAsking(true)} className="self-start font-extrabold text-[#B0182F] underline underline-offset-4">הסרה</button>)}
        </form>
    );
}

// A regular prayer changed for this week only: another time or place, or no prayer this week.
export function WeekChange({ orgId, prayerId, changeId, date, title, regular, start, fixedHref }: {
    orgId: string; prayerId: string; changeId: string | null; date: string; title: string; regular: string;
    start: { cancelled: boolean; time: string; place: string }; fixedHref: string;
}) {
    const router = useRouter();
    const [v, setV] = useState(start);
    const [res, setRes] = useState<PrayersResult | null>(null);
    const [busy, run] = useTransition();
    const save = () => run(async () => { const r = await changeThisWeek(orgId, { prayerId, date, ...v }); setRes(r); if (r.ok) router.refresh(); });
    const undo = () => run(async () => { const r = await undoChange(orgId, changeId!); setRes(r); if (r.ok) { setV({ ...start, cancelled: false }); router.refresh(); } });
    return (
        <form className={panel} aria-labelledby="wc-h" onSubmit={(e) => { e.preventDefault(); save(); }}>
            <span className="flex flex-col gap-1">
                <h2 id="wc-h" className="m-0 font-display text-[22px] leading-tight">{title}</h2>
                <span className={hint}>בלוח הקבוע: <bdi>{regular}</bdi>. השינוי כאן חל על השבוע הזה בלבד.</span>
            </span>
            <fieldset disabled={busy} className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
                <label className={`flex cursor-pointer items-center gap-3 rounded-[14px] border-2 border-[var(--mh-ink)] p-3 transition-colors duration-150 ${v.cancelled ? "bg-[#FFE3E7]" : "bg-white hover:bg-[var(--mh-ticket)]"}`}>
                    <input type="checkbox" checked={v.cancelled} onChange={(e) => { setV((o) => ({ ...o, cancelled: e.target.checked })); setRes(null); }} className="size-[18px] accent-[var(--mh-ink)]" />
                    <b>אין תפילה השבוע</b>
                </label>
                {!v.cancelled && <TimePlace time={v.time} place={v.place} onTime={(x) => { setV((o) => ({ ...o, time: x })); setRes(null); }} onPlace={(x) => { setV((o) => ({ ...o, place: x })); setRes(null); }} />}
            </fieldset>
            <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={busy} className={`${btn} bg-[var(--mh-sun)]`}>{busy ? "שומרים…" : "שמירה לשבוע הזה"}</button>
                {changeId && <button type="button" disabled={busy} onClick={undo} className={`${btn} bg-white`}>חזרה ללוח הקבוע</button>}
                <Result res={res} />
            </div>
            <Link href={fixedHref} className="self-start font-bold underline underline-offset-4">לשנות בלוח הקבוע, לכל השבועות</Link>
        </form>
    );
}

// "עדכון ידני" (board D-ModSynSchedule): a free message to the community, in the org's "הודעות".
export function UpdateCard({ orgId, resting }: { orgId: string; resting: string | null }) {
    const [text, setText] = useState("");
    const [res, setRes] = useState<PrayersResult | null>(null);
    const [busy, run] = useTransition();
    const send = () => run(async () => { const r = await sendPrayerUpdate(orgId, text); setRes(r); if (r.ok) setText(""); });
    return (
        <form className={panel} aria-labelledby="up-h" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <span className="flex flex-col gap-1">
                <h2 id="up-h" className="m-0 font-display text-[22px] leading-tight">עדכון ידני</h2>
                <span className={hint}>נשלח לכל החברים, בהודעות של בית הכנסת.</span>
            </span>
            <label className="flex flex-col gap-2">
                <span className={label}>הודעה לקהל</span>
                <textarea value={text} onChange={(e) => { setText(e.target.value); setRes(null); }} rows={3} maxLength={UPDATE_MAX} disabled={busy || !!resting} placeholder="למשל: מנחה של שבת בבית המדרש" className={`${field} min-h-[60px] py-3`} />
            </label>
            {resting && <p className="m-0 rounded-[14px] bg-[var(--mh-ticket)] p-3 font-bold">שבת או חג עכשיו, ולא שולחים הודעות. אפשר לשלוח אחרי <bdi>{resting}</bdi>.</p>}
            <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={busy || !!resting || text.trim().length < 3} className={`${btn} bg-[var(--mh-sun)]`}>{busy ? "שולחים…" : "שליחה כהודעה"}</button>
                <Result res={res} />
            </div>
        </form>
    );
}

// Candle lighting minutes before sunset: the city's custom unless the community keeps its own.
export function CandleMinutes({ orgId, minutes, own, cityMinutes }: { orgId: string; minutes: number; own: boolean; cityMinutes: number }) {
    const router = useRouter();
    const [res, setRes] = useState<PrayersResult | null>(null);
    const [busy, run] = useTransition();
    const pick = (x: string) => run(async () => { const r = await saveCandleMinutes(orgId, x === "city" ? null : Number(x)); setRes(r); if (r.ok) router.refresh(); });
    return (
        <label className="flex flex-col gap-2">
            <span className={label}>הדלקת נרות, לפני השקיעה</span>
            <select value={own ? String(minutes) : "city"} disabled={busy} onChange={(e) => pick(e.target.value)} className={field}>
                <option value="city">{`לפי מנהג העיר (${cityMinutes} דקות)`}</option>
                {CANDLE_MINUTES.filter((m) => m !== cityMinutes).map((m) => <option key={m} value={String(m)}>{`${m} דקות`}</option>)}
            </select>
            <Result res={res} />
        </label>
    );
}
