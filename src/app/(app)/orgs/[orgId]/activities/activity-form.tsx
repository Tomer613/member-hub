"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ABOUT_MAX, PLACE_MAX, TITLE_MAX, minyanText, type ActivityInput } from "@/lib/activities";
import { cancelActivityForm, saveActivityForm, type ActivityResult } from "./actions";

export type FormStart = {
    id: string | null;
    status: "draft" | "published" | "cancelled";
    past: boolean;
    input: ActivityInput;
    people: { id: string; name: string; ago: string; paid: boolean }[];
    saved: string | null; // the message of the save that opened this activity, after a new one got its address
};

const panel = "flex flex-col gap-4 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_3px_0_var(--mh-ink)] md:p-5";
const field = "min-h-11 w-full rounded-[14px] border-2 border-[var(--mh-ink)] bg-white px-[14px] font-semibold outline-none placeholder:text-[var(--mh-ink-soft)] focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)] disabled:border-dashed disabled:opacity-70";
const label = "text-[14px] font-extrabold";
const hint = "text-[14px] font-semibold text-[var(--mh-ink-soft)]";
const btn = "inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] px-[18px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none";
const count = (s: string) => [...s].length;

function Toggle({ on, onChange, locked = false, title, line }: { on: boolean; onChange: (v: boolean) => void; locked?: boolean; title: string; line: string }) {
    return (
        <label className={`flex items-center justify-between gap-3 rounded-[18px] border-[2.5px] border-[var(--mh-ink)] p-[14px] transition-colors duration-200 ${locked ? "cursor-not-allowed border-dashed" : "cursor-pointer"} ${on && !locked ? "bg-[var(--mh-tint-sun)]" : "bg-white"}`}>
            <span className="flex min-w-0 flex-col gap-1">
                <b className="text-[16px] leading-tight">{title}</b>
                <span className={hint}>{line}</span>
            </span>
            <input type="checkbox" role="switch" checked={on} disabled={locked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
            <span aria-hidden="true" className={`relative inline-flex h-8 w-14 shrink-0 rounded-full border-[2.5px] border-[var(--mh-ink)] transition-colors duration-200 peer-focus-visible:ring-[3px] peer-focus-visible:ring-[var(--mh-ink)] peer-focus-visible:ring-offset-2 ${on ? "bg-[var(--mh-ok)]" : "bg-white"} ${locked ? "opacity-60" : ""}`}>
                <span className={`absolute top-[2px] h-[22px] w-[22px] rounded-full border-2 border-[var(--mh-ink)] bg-white transition-[inset-inline-start] duration-200 ${on ? "start-[26px]" : "start-[2px]"}`} />
            </span>
        </label>
    );
}

// The side form of board D-AdmActivities: "פעילות חדשה", or the chosen activity with who signed up.
export function ActivityForm({ orgId, types, packFields, packName, start }: {
    orgId: string; types: { value: string; label: string }[]; packFields: readonly { key: string; label: string; line: string }[]; packName: string; start: FormStart;
}) {
    const router = useRouter();
    const [v, setV] = useState<ActivityInput>(start.input);
    const [notify, setNotify] = useState(true);
    const [res, setRes] = useState<ActivityResult | null>(start.saved ? { ok: start.saved } : null);
    const [asking, setAsking] = useState(false);
    const [busy, run] = useTransition();
    const set = <K extends keyof ActivityInput>(k: K, value: ActivityInput[K]) => { setV((o) => ({ ...o, [k]: value })); setRes(null); };
    const going = start.people.length;
    const locked = start.status === "cancelled" || start.past;
    // Once someone signed up, the price stays and the sign-up stays open: their charges were made by it.
    const moneyLocked = locked || going > 0;
    const published = start.status === "published";

    const save = (publish: boolean) => run(async () => {
        const r = await saveActivityForm(orgId, start.id, v, { publish, notify: publish && !published && notify });
        setRes(r);
        if (r.id && !start.id) router.replace(`/orgs/${orgId}/activities?e=${r.id}&saved=${publish ? "p" : "d"}`);
        else if (r.ok) router.refresh();
    });
    const cancel = () => run(async () => {
        const r = await cancelActivityForm(orgId, start.id!);
        setRes(r);
        setAsking(false);
        router.refresh();
    });

    return (
        <form className={panel} onSubmit={(e) => { e.preventDefault(); save(true); }} aria-labelledby="act-h">
            <span className="flex flex-wrap items-center gap-2">
                <h2 id="act-h" className="m-0 font-display text-[22px] leading-tight">{start.id ? v.title || "פעילות" : "פעילות חדשה"}</h2>
                {start.status === "draft" && start.id && <span className="rounded-full border-2 border-[var(--mh-ink)] bg-[#FFF1D6] px-2 text-[12px] font-extrabold">טיוטה</span>}
                {start.status === "cancelled" && <span className="rounded-full border-2 border-[var(--mh-ink)] bg-[#FFD9DE] px-2 text-[12px] font-extrabold">בוטל</span>}
            </span>
            {locked && <p className="m-0 rounded-[14px] bg-[var(--mh-ticket)] p-3 font-bold">{start.status === "cancelled" ? "הפעילות בוטלה. אפשר לראות אותה, אבל לא לערוך." : "הפעילות כבר התקיימה. אפשר לראות מי נרשם, אבל לא לערוך."}</p>}

            <fieldset disabled={locked || busy} className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
                <label className="flex flex-col gap-2">
                    <span className="flex items-baseline justify-between gap-2"><span className={label}>שם</span><span className="text-[13px] font-bold text-[var(--mh-ink-soft)]"><bdi>{count(v.title)}</bdi> מתוך {TITLE_MAX}</span></span>
                    <input value={v.title} onChange={(e) => set("title", e.target.value)} maxLength={TITLE_MAX} placeholder="למשל: ארוחת שבת קהילתית" className={field} required />
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-2"><span className={label}>תאריך</span><input type="date" value={v.date} onChange={(e) => set("date", e.target.value)} className={field} required /></label>
                    <label className="flex flex-col gap-2"><span className={label}>שעה</span><input type="time" value={v.time} onChange={(e) => set("time", e.target.value)} className={field} required /></label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-2">
                        <span className={label}>סוג</span>
                        <select value={v.type} onChange={(e) => set("type", e.target.value)} className={field}>
                            {types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </label>
                    <label className="flex flex-col gap-2">
                        <span className={label}>מקומות</span>
                        <input inputMode="numeric" value={v.seats} onChange={(e) => set("seats", e.target.value.replace(/[^\d]/g, ""))} placeholder="בלי הגבלה" className={field} />
                    </label>
                </div>
                <label className="flex flex-col gap-2">
                    <span className={label}>מקום <span className="font-bold text-[var(--mh-ink-soft)]">(לא חובה)</span></span>
                    <input value={v.location} onChange={(e) => set("location", e.target.value)} maxLength={PLACE_MAX} placeholder="למשל: אולם בית הכנסת" className={field} />
                </label>
                <label className="flex flex-col gap-2">
                    <span className="flex items-baseline justify-between gap-2"><span className={label}>כמה מילים לחברים <span className="font-bold text-[var(--mh-ink-soft)]">(לא חובה)</span></span><span className="text-[13px] font-bold text-[var(--mh-ink-soft)]"><bdi>{count(v.about)}</bdi> מתוך {ABOUT_MAX}</span></span>
                    <textarea value={v.about} onChange={(e) => set("about", e.target.value)} rows={3} maxLength={ABOUT_MAX} className={`${field} py-3`} />
                </label>

                <Toggle on={v.signup} onChange={(x) => { set("signup", x); if (!x) set("paid", false); }} locked={moneyLocked && v.signup} title="הרשמה מראש" line={moneyLocked && v.signup ? "כבר יש נרשמים, לכן ההרשמה נשארת פתוחה" : "החברים נרשמים מהאפליקציה"} />
                <Toggle on={v.paid} onChange={(x) => { set("paid", x); if (x) set("signup", true); }} locked={moneyLocked} title="בתשלום" line={moneyLocked && going ? "כבר יש נרשמים שחויבו, לכן המחיר נשאר" : "חיוב אוטומטי בהרשמה, לתשלום עד יום הפעילות"} />
                {v.paid && (
                    <label className="flex flex-col gap-2">
                        <span className={label}>מחיר לנרשם, בשקלים</span>
                        <input inputMode="decimal" value={v.price} onChange={(e) => set("price", e.target.value)} disabled={moneyLocked} placeholder="למשל: 60" className={field} />
                        <span className={hint}>מי שמבטל לפני ששילם, החיוב שלו מתבטל.</span>
                    </label>
                )}

                {packFields.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <span className={label}>שדות ייעודיים · {packName}</span>
                        {packFields.map((f) => <Toggle key={f.key} on={!!v.fields[f.key]} onChange={(x) => set("fields", { ...v.fields, [f.key]: x })} title={f.label} line={f.line} />)}
                    </div>
                )}

                {!published && (
                    <label className="flex min-h-11 cursor-pointer items-center gap-2 font-extrabold">
                        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="h-5 w-5 accent-[var(--mh-ink)]" />
                        להודיע לכל החברים כשמפרסמים
                    </label>
                )}
            </fieldset>

            {!locked && (
                <div className="flex flex-wrap items-center gap-3">
                    <button type="submit" disabled={busy} className={`${btn} bg-[var(--mh-sun)]`}>{busy ? "שומרים…" : published ? "שמירת השינויים" : "פרסום"}</button>
                    {!published && <button type="button" disabled={busy} onClick={() => save(false)} className={`${btn} bg-white hover:bg-[var(--mh-ticket)]`}>שמירה כטיוטה</button>}
                </div>
            )}
            {res?.ok && <p role="status" className="m-0 font-bold text-[#00573A]">{res.ok}</p>}
            {res?.error && <p role="alert" className="m-0 font-extrabold text-[#B0182F]">{res.error}</p>}

            {start.id && (start.input.signup || going > 0) && (
                <section aria-labelledby="ppl-h" className="flex flex-col gap-2 border-t-2 border-dashed border-[var(--mh-ink)] pt-4">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                        <h3 id="ppl-h" className="m-0 text-[17px] font-extrabold">נרשמו <bdi>{going}</bdi>{start.input.seats ? <> מתוך <bdi>{start.input.seats}</bdi></> : null}</h3>
                        {start.input.fields.minyan && <span className="text-[14px] font-extrabold text-[#8A5A00]">{minyanText(going)}</span>}
                    </span>
                    {going ? (
                        <ul className="m-0 flex max-h-[320px] list-none flex-col overflow-y-auto p-0">
                            {start.people.map((p) => (
                                <li key={p.id} className="flex min-h-11 items-center gap-2 border-b border-[#E6E0D4] last:border-0">
                                    <b className="min-w-0 flex-1 truncate">{p.name}</b>
                                    {p.paid && <span className="rounded-full border-2 border-[var(--mh-ink)] bg-[#FFF1D6] px-2 text-[12px] font-extrabold">חויב</span>}
                                    <span className="shrink-0 text-[13px] font-bold text-[var(--mh-ink-soft)]">{p.ago}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className={`m-0 ${hint}`}>{published ? "עוד אף אחד לא נרשם." : "החברים יוכלו להירשם אחרי הפרסום."}</p>}
                </section>
            )}

            {start.id && start.status !== "cancelled" && !start.past && (
                asking ? (
                    <div role="alertdialog" aria-labelledby="cx-h" className="flex flex-col gap-3 rounded-[16px] border-2 border-[var(--mh-ink)] bg-[#FFF0F2] p-3">
                        <b id="cx-h">{going ? `לבטל את הפעילות? ${going === 1 ? "הנרשם יקבל" : `${going} הנרשמים יקבלו`} הודעה, וחיובים שעוד לא שולמו יבוטלו.` : "לבטל את הפעילות?"}</b>
                        <span className="flex flex-wrap gap-2">
                            <button type="button" disabled={busy} onClick={cancel} className={`${btn} bg-[#C4223B] text-white`}>כן, לבטל</button>
                            <button type="button" disabled={busy} onClick={() => setAsking(false)} className={`${btn} bg-white`}>לא</button>
                        </span>
                    </div>
                ) : (
                    <button type="button" onClick={() => setAsking(true)} className="self-start font-extrabold text-[#B0182F] underline underline-offset-4">ביטול הפעילות</button>
                )
            )}
        </form>
    );
}
