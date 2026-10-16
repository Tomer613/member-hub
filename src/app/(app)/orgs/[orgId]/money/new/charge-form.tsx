"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { onColor } from "@/lib/color";
import { NOTE_MAX, TITLE_MAX } from "@/lib/billing/account";
import { CHARGE_KINDS, peopleCount, pickRecipients, type Audience, type ChargeInput, type ChargeKind, type Recipient } from "@/lib/billing/charge-plan";
import { formatShekels, shekelsToMinor } from "@/lib/money";
import { OrgDot, type OrgLook } from "@/components/pay/parts";
import { saveChargeDraft, sendCharge, type ChargeResult } from "../actions";

const panel = "flex flex-col gap-4 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_3px_0_var(--mh-ink)] md:p-5";
const lbl = "text-[15px] font-extrabold";
const field = "min-h-12 w-full rounded-[14px] border-2 border-[var(--mh-ink)] bg-white px-3 text-[16px] font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)]";
const btn = "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] px-[18px] text-[15px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none disabled:opacity-60";
const hint = "text-[13px] font-semibold text-[var(--mh-ink-soft)]";

type Who = "all" | "group" | "picked";

export function ChargeForm({ orgId, org, today, start, draftId, recipients, plans, labels }: {
    orgId: string; org: OrgLook; today: string; start: ChargeInput; draftId: string | null;
    recipients: Recipient[]; plans: { id: string; name: string }[]; labels: { id: string; name: string; color: string }[];
}) {
    const [v, setV] = useState<ChargeInput>(start);
    const [who, setWho] = useState<Who>(start.audience.to === "all" ? "all" : start.audience.to === "picked" ? "picked" : "group");
    const [group, setGroup] = useState(start.audience.to === "plan" ? `p:${start.audience.planId}` : start.audience.to === "label" ? `l:${start.audience.labelId}` : "");
    const [picked, setPicked] = useState<string[]>(start.audience.to === "picked" ? start.audience.linkIds : []);
    const [q, setQ] = useState("");
    const [draft, setDraft] = useState(draftId);
    const [note, setNote] = useState<ChargeResult | null>(null);
    const [sent, setSent] = useState<string | null>(null);
    const [confirm, setConfirm] = useState(false);
    const [busy, start2] = useTransition();
    const set = <K extends keyof ChargeInput>(k: K, x: ChargeInput[K]) => setV((o) => ({ ...o, [k]: x }));

    const audience: Audience = who === "all" ? { to: "all" } : who === "picked" ? { to: "picked", linkIds: picked } : group.startsWith("p:") ? { to: "plan", planId: group.slice(2) } : group.startsWith("l:") ? { to: "label", labelId: group.slice(2) } : { to: "picked", linkIds: [] };
    const to = pickRecipients(recipients, audience);
    const count = (a: Audience) => pickRecipients(recipients, a).length;
    const groupName = group.startsWith("p:") ? plans.find((p) => p.id === group.slice(2))?.name : labels.find((l) => l.id === group.slice(2))?.name;
    const minor = shekelsToMinor(v.amount) ?? 0;
    const dueText = v.due ? v.due.split("-").reverse().join(".") : "DD.MM.YYYY";
    const input = { ...v, audience };
    const shown = recipients.filter((r) => !q.trim() || r.name.includes(q.trim()));

    const save = () => {
        setNote(null);
        start2(async () => {
            const r = await saveChargeDraft(orgId, input, draft ?? undefined);
            if (r.draftId) setDraft(r.draftId);
            setNote(r);
        });
    };
    const send = () => {
        setConfirm(false);
        setNote(null);
        start2(async () => {
            const r = await sendCharge(orgId, input, draft ?? undefined);
            if (r.ok) setSent(r.ok);
            else setNote(r);
        });
    };
    const ask = () => {
        setNote(null);
        if (!v.title.trim()) return setNote({ error: "כתבו כותרת קצרה לחיוב." });
        if (!minor) return setNote({ error: "כתבו סכום." });
        if (!v.due) return setNote({ error: "בחרו תאריך לתשלום." });
        if (!to.length) return setNote({ error: who === "picked" ? "בחרו לפחות חבר אחד." : "אין חברים שמתאימים לבחירה הזו." });
        setConfirm(true);
    };

    if (sent) {
        return (
            <section className={`${panel} max-w-[640px]`} aria-live="polite">
                <h1 className="m-0 font-display text-[26px]">החיוב נשלח</h1>
                <p className="m-0 text-[17px] font-bold">{sent}</p>
                <p className="m-0 font-semibold text-[var(--mh-ink-soft)]">כל חבר רואה אותו בכרטיס שבארנק, עם כפתור לתשלום.</p>
                <div className="flex flex-wrap gap-2">
                    <Link href={`/orgs/${orgId}/money`} className={`${btn} bg-[var(--mh-sun)]`}>לקופה</Link>
                    <a href={`/orgs/${orgId}/money/new`} className={`${btn} bg-white`}>חיוב נוסף</a>
                </div>
            </section>
        );
    }

    const radio = (id: Who, title: string, sub: string) => (
        <button type="button" role="radio" aria-checked={who === id} onClick={() => setWho(id)} className={`flex min-h-[64px] items-center gap-3 rounded-[16px] border-2 border-[var(--mh-ink)] px-[14px] text-start ${who === id ? "bg-[#FFF6D1] shadow-[0_3px_0_var(--mh-ink)]" : "bg-white hover:bg-[var(--mh-ticket)]"}`}>
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-[var(--mh-ink)] bg-white" aria-hidden="true">{who === id && <span className="h-3 w-3 rounded-full bg-[var(--mh-ink)]" />}</span>
            <span className="flex min-w-0 flex-col"><b>{title}</b><span className={hint}>{sub}</span></span>
        </button>
    );

    return (
        <div className="flex flex-col gap-[14px]">
            <header className="flex flex-wrap items-center gap-3">
                <h1 className="m-0 font-display text-[28px] leading-tight">חיוב חדש</h1>
                <div className="ms-auto flex flex-wrap gap-2">
                    <button type="button" disabled={busy} onClick={save} className={`${btn} bg-white`}>שמירה כטיוטה</button>
                    <button type="button" disabled={busy} onClick={ask} className={btn} style={{ background: org.color, color: org.fg }}>שליחה לחברים</button>
                </div>
            </header>
            {note?.ok && <p role="status" className="m-0 rounded-[14px] border-2 border-[var(--mh-ink)] bg-[#D7F5E8] px-4 py-2 font-extrabold">{note.ok}</p>}
            {note?.error && <p role="alert" className="m-0 rounded-[14px] border-2 border-[#C4223B] bg-[#FFE9E6] px-4 py-2 font-extrabold text-[#B0182F]">{note.error}</p>}
            {confirm && (
                <div role="alertdialog" aria-labelledby="sure" className="flex flex-col gap-3 rounded-[16px] border-2 border-[var(--mh-ink)] bg-[#FFF6D1] p-4">
                    <b id="sure">לשלוח את ״{v.title.trim()}״ ל{to.length === 1 ? "חבר אחד" : `-${to.length} חברים`}, {formatShekels(minor)} לכל אחד? חיוב שנשלח לא נמחק, רק מבוטל.</b>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" disabled={busy} onClick={send} className={`${btn} bg-[var(--mh-sun)]`}>{busy ? "שולחים…" : "כן, לשלוח"}</button>
                        <button type="button" onClick={() => setConfirm(false)} className={`${btn} bg-white`}>ביטול</button>
                    </div>
                </div>
            )}
            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-[14px] lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)]">
                <section className={panel} aria-label="פרטי החיוב">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <label className="flex flex-col gap-1">
                            <span className={lbl}>כותרת החיוב</span>
                            <input value={v.title} maxLength={TITLE_MAX} onChange={(e) => set("title", e.target.value)} placeholder="למשל: דמי ועד נובמבר" className={field} />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className={lbl}>סכום לכל חבר (₪)</span>
                            <input value={v.amount} inputMode="decimal" dir="ltr" onChange={(e) => set("amount", e.target.value)} placeholder="0" className={`${field} text-end`} />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className={lbl}>תאריך לתשלום</span>
                            <input type="date" value={v.due} min={today} dir="ltr" onChange={(e) => set("due", e.target.value)} className={`${field} text-end`} />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className={lbl}>סוג</span>
                            <select value={v.kind} onChange={(e) => set("kind", e.target.value as ChargeKind)} className={field}>
                                {CHARGE_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
                            </select>
                        </label>
                    </div>

                    <div className="flex flex-col gap-2">
                        <span className={lbl} id="who-l">למי</span>
                        <div role="radiogroup" aria-labelledby="who-l" className="grid grid-cols-1 gap-2 xl:grid-cols-3">
                            {radio("all", "כל החברים הפעילים", peopleCount(recipients.length))}
                            {radio("group", "לפי מסלול או תווית", who === "group" && groupName ? `${groupName} · ${peopleCount(to.length)}` : "בחירת מסלול או תווית")}
                            {radio("picked", "חברים נבחרים", picked.length ? `${picked.length} נבחרו` : "בחירה מרשימה")}
                        </div>
                        {who === "group" && (
                            <label className="flex flex-col gap-1">
                                <span className="sr-only">מסלול או תווית</span>
                                <select value={group} onChange={(e) => setGroup(e.target.value)} className={field}>
                                    <option value="">בחירת מסלול או תווית…</option>
                                    {plans.length > 0 && <optgroup label="מסלולים">{plans.map((p) => <option key={p.id} value={`p:${p.id}`}>{p.name} · {peopleCount(count({ to: "plan", planId: p.id }))}</option>)}</optgroup>}
                                    {labels.length > 0 && <optgroup label="תוויות">{labels.map((l) => <option key={l.id} value={`l:${l.id}`}>{l.name} · {peopleCount(count({ to: "label", labelId: l.id }))}</option>)}</optgroup>}
                                </select>
                                {!plans.length && !labels.length && <span className={hint}>לארגון עוד אין מסלולים או תוויות.</span>}
                            </label>
                        )}
                        {who === "picked" && (
                            <div className="flex flex-col gap-2 rounded-[16px] border-2 border-[var(--mh-ink)] p-2">
                                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש לפי שם" aria-label="חיפוש חבר" className="min-h-11 rounded-full border-2 border-[var(--mh-ink)] px-4 font-semibold outline-none" />
                                <fieldset className="m-0 grid max-h-[260px] grid-cols-1 gap-1 overflow-y-auto border-0 p-0 sm:grid-cols-2">
                                    <legend className="sr-only">בחירת חברים</legend>
                                    {shown.map((r) => (
                                        <label key={r.linkId} className="flex min-h-11 items-center gap-3 rounded-[10px] px-2 hover:bg-[var(--mh-ticket)]">
                                            <input type="checkbox" checked={picked.includes(r.linkId)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, r.linkId] : p.filter((x) => x !== r.linkId)))} className="h-5 w-5 accent-[var(--mh-ink)]" />
                                            <span className="truncate font-bold">{r.name}</span>
                                        </label>
                                    ))}
                                    {!shown.length && <span className={`${hint} p-2`}>אין חברים בשם הזה.</span>}
                                </fieldset>
                            </div>
                        )}
                    </div>

                    <label className="flex flex-col gap-1">
                        <span className={lbl}>הסבר לחברים <span className="font-semibold text-[var(--mh-ink-soft)]">(לא חובה)</span></span>
                        <textarea value={v.note} maxLength={NOTE_MAX} onChange={(e) => set("note", e.target.value)} rows={2} className={`${field} min-h-[64px] py-2`} />
                        <span className={hint}>יוצג בכרטיס החיוב ובהודעה. אל תכתבו כאן מידע רפואי או מזהה רגיש.</span>
                    </label>

                    <div className="flex flex-col gap-1">
                        {([
                            ["notify", "לשלוח הודעה לחברים", "בתוך האפליקציה ובמייל למי שיש לו."],
                            ["remind", "לתזכר אוטומטית 3 ימים לפני ובמועד", "רק למי שעוד לא שילם."],
                            ["partial", "לאפשר תשלום חלקי", "החבר יוכל לשלם חלק מהסכום ואת השאר אחר כך."],
                        ] as const).map(([k, t, s]) => (
                            <label key={k} className="flex min-h-11 items-start gap-3 py-1">
                                <input type="checkbox" checked={v[k]} onChange={(e) => set(k, e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--mh-ink)]" />
                                <span className="flex flex-col"><b>{t}</b><span className={hint}>{s}</span></span>
                            </label>
                        ))}
                    </div>
                </section>

                <aside className="flex flex-col gap-[14px] lg:sticky lg:top-4" aria-label="תצוגה וסיכום">
                    <section className={panel} aria-labelledby="pv-title">
                        <h2 id="pv-title" className="m-0 font-display text-[19px]">כך החבר יראה</h2>
                        <div className="overflow-hidden rounded-[18px] border-2 border-[var(--mh-ink)]">
                            <div className="flex items-center gap-3 border-b-2 border-[var(--mh-ink)] bg-[#FFF1B8] px-3 py-2">
                                <OrgDot org={org} size={34} />
                                <b className="flex-1">חיוב חדש</b>
                                <bdi className="font-display text-[22px]">{formatShekels(minor)}</bdi>
                            </div>
                            <div className="flex flex-col gap-1 bg-[var(--mh-ticket)] p-3">
                                <b>{v.title || "כותרת החיוב"}</b>
                                <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">עד <bdi>{dueText}</bdi> · {org.name}</span>
                                {v.note && <span className="text-[14px] font-semibold">{v.note}</span>}
                                <span className="mt-1 inline-flex min-h-11 items-center self-start rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-sun)] px-4 font-extrabold" aria-hidden="true">לתשלום</span>
                            </div>
                        </div>
                    </section>
                    <section className={panel} aria-labelledby="sum-title">
                        <h2 id="sum-title" className="m-0 font-display text-[19px]">סיכום</h2>
                        <dl className="m-0 grid grid-cols-[1fr_auto] gap-x-3 gap-y-2">
                            <dt className="font-bold text-[var(--mh-ink-soft)]">מקבלים</dt><dd className="m-0 text-end font-extrabold"><bdi>{to.length}</bdi></dd>
                            <dt className="font-bold text-[var(--mh-ink-soft)]">סכום כולל</dt><dd className="m-0 text-end font-extrabold"><bdi>{formatShekels(minor * to.length)}</bdi></dd>
                            <dt className="font-bold text-[var(--mh-ink-soft)]">מהם בחיוב אוטומטי</dt><dd className="m-0 text-end font-extrabold"><bdi>0</bdi></dd>
                        </dl>
                        <p className="m-0 rounded-[14px] bg-[var(--mh-ticket)] p-3 text-[14px] font-bold">חיוב שנשלח לא ניתן למחיקה, רק לביטול, וכל עוד לא שולם עליו כלום.</p>
                        <button type="button" disabled={busy} onClick={ask} className={`${btn} w-full`} style={{ background: org.color, color: onColor(org.color) }}>שליחה ל{to.length === 1 ? "חבר אחד" : `-${to.length} חברים`}</button>
                    </section>
                </aside>
            </div>
        </div>
    );
}
