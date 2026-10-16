"use client";

import { useState, useTransition } from "react";
import { TAG_ICON } from "@/components/labels/stamp";
import { onColor } from "@/lib/color";
import { DEFAULT_INVITE_TEXT, INVITE_DAYS, inviteText } from "@/lib/import";
import { sendInvite, type InviteResult } from "../add/actions";

const panel = "flex flex-col gap-4 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_3px_0_var(--mh-ink)] md:p-5";
const field = "min-h-[52px] rounded-[14px] border-2 border-[var(--mh-ink)] bg-white px-3 text-[17px] font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)]";
const lbl = "text-[15px] font-extrabold";
const chip = (on: boolean) => `inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-[var(--mh-ink)] px-4 text-[15px] font-extrabold transition-colors ${on ? "bg-[var(--mh-ink)] text-white" : "bg-white hover:bg-[var(--mh-ticket)]"}`;
const btn = "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border-[2.5px] border-[var(--mh-ink)] px-6 text-[17px] font-extrabold shadow-[0_3px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none disabled:opacity-60";

export function InviteForm({ orgId, orgName, sender, color, plans, labels }: {
    orgId: string; orgName: string; sender: string; color: string;
    plans: { id: string; name: string }[]; labels: { id: string; name: string; color: string }[];
}) {
    const [name, setName] = useState("");
    const [contact, setContact] = useState("");
    const [planId, setPlanId] = useState(plans.length === 1 ? plans[0].id : "");
    const [picked, setPicked] = useState<string[]>([]);
    const isEmail = contact.includes("@");
    const [channel, setChannel] = useState("whatsapp");
    const [result, setResult] = useState<InviteResult | null>(null);
    const [copied, setCopied] = useState(false);
    const [busy, start] = useTransition();
    const ways = isEmail ? [{ id: "email", label: "מייל" }, { id: "link", label: "קישור" }] : [{ id: "whatsapp", label: "WhatsApp" }, { id: "sms", label: "SMS" }, { id: "link", label: "קישור" }];
    const way = ways.some((w) => w.id === channel) ? channel : ways[0].id;
    const plan = plans.find((p) => p.id === planId);
    const preview = inviteText(DEFAULT_INVITE_TEXT, { name, sender, org: orgName, link: "" });

    const submit = () => {
        setResult(null);
        start(async () => setResult(await sendInvite(orgId, { name, contact, planId, labelIds: picked, channel: way })));
    };
    const copy = async (text: string) => {
        try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* the field stays selectable */ }
    };
    const reset = () => { setName(""); setContact(""); setPicked([]); setResult(null); };

    if (result?.ok) {
        return (
            <section className={`${panel} max-w-[640px]`} aria-live="polite">
                <h2 className="m-0 font-display text-[22px]">{result.ok}</h2>
                <p className="m-0 font-semibold text-[var(--mh-ink-soft)]">ההזמנה מיועדת {isEmail ? "לכתובת" : "למספר"} הזה בלבד ותקפה {INVITE_DAYS} ימים. אחרי שהאדם מאשר, הוא נכנס מיד.</p>
                {way === "whatsapp" && result.waHref && <a href={result.waHref} target="_blank" rel="noreferrer" className={`${btn} bg-[#D7F5E8]`}>פתיחה בוואטסאפ עם ההודעה</a>}
                {way === "sms" && result.smsHref && <a href={result.smsHref} className={`${btn} bg-[#D7F5E8]`}>פתיחה בהודעות עם ההודעה</a>}
                <div className="flex items-center gap-2 rounded-[18px] border-[2.5px] border-[var(--mh-ink)] bg-white p-2 ps-4">
                    <input readOnly value={result.link} dir="ltr" aria-label="קישור ההזמנה" onFocus={(e) => e.target.select()} className="min-w-0 flex-1 bg-transparent text-end font-extrabold outline-none" />
                    <button type="button" onClick={() => copy(result.text ?? result.link ?? "")} className="inline-flex min-h-10 shrink-0 items-center rounded-full border-[2.5px] border-[var(--mh-ink)] bg-white px-4 font-extrabold shadow-[var(--mh-shadow)]" aria-live="polite">{copied ? "הועתק" : "העתקת ההודעה"}</button>
                </div>
                <button type="button" onClick={reset} className={`${btn} bg-white`}>הזמנה נוספת</button>
            </section>
        );
    }

    return (
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-[14px] lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)]">
            <form className={panel} onSubmit={(e) => { e.preventDefault(); submit(); }}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="flex flex-col gap-1">
                        <span className={lbl}>שם <span className="font-semibold text-[var(--mh-ink-soft)]">(לא חובה)</span></span>
                        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="off" className={field} />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className={lbl}>טלפון או מייל</span>
                        <input value={contact} onChange={(e) => setContact(e.target.value)} required dir="ltr" inputMode={isEmail ? "email" : "tel"} placeholder="050-0000000" className={`${field} text-end`} />
                    </label>
                </div>
                {plans.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <span className={lbl} id="plan-l">מסלול</span>
                        <div role="radiogroup" aria-labelledby="plan-l" className="flex flex-wrap gap-2">
                            <button type="button" role="radio" aria-checked={!planId} onClick={() => setPlanId("")} className={chip(!planId)}>בלי מסלול</button>
                            {plans.map((p) => <button key={p.id} type="button" role="radio" aria-checked={planId === p.id} onClick={() => setPlanId(p.id)} className={chip(planId === p.id)}>{p.name}</button>)}
                        </div>
                    </div>
                )}
                {labels.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <span className={lbl} id="labels-l">תוויות <span className="font-semibold text-[var(--mh-ink-soft)]">(לא חובה, אפשר כמה)</span></span>
                        <div role="group" aria-labelledby="labels-l" className="flex flex-wrap gap-2">
                            {labels.map((l) => {
                                const on = picked.includes(l.id);
                                return (
                                    <button key={l.id} type="button" aria-pressed={on} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== l.id) : [...p, l.id]))}
                                        className={`inline-flex min-h-11 items-center gap-2 rounded-[12px] border-2 px-3 font-extrabold transition-shadow ${on ? "border-[var(--mh-ink)] shadow-[0_3px_0_var(--mh-ink)]" : "border-[var(--mh-ink)]/30 opacity-75"}`} style={{ background: l.color }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={TAG_ICON} /></svg>
                                        <bdi>{l.name}</bdi>{on && <span aria-hidden="true">✓</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
                <div className="flex flex-col gap-2">
                    <span className={lbl} id="way-l">איך לשלוח</span>
                    <div role="radiogroup" aria-labelledby="way-l" className="flex flex-wrap gap-2">
                        {ways.map((w) => <button key={w.id} type="button" role="radio" aria-checked={way === w.id} onClick={() => setChannel(w.id)} className={chip(way === w.id)}><bdi>{w.label}</bdi></button>)}
                    </div>
                    <span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">{way === "email" ? "אנחנו שולחים את המייל." : way === "link" ? "מקבלים קישור ומשתפים אותו איך שנוח." : "ההודעה נפתחת אצלכם בטלפון, מוכנה לשליחה."}</span>
                </div>
                {result?.error && <p role="alert" className="m-0 rounded-[14px] border-2 border-[#C4223B] bg-[#FFE9E6] px-4 py-2 font-extrabold text-[#B0182F]">{result.error}</p>}
                <button type="submit" disabled={busy || !contact.trim()} className={btn} style={{ background: color, color: onColor(color) }}>{busy ? "מכינים…" : "שליחת הזמנה"}</button>
                <p className="m-0 text-[13px] font-semibold text-[var(--mh-ink-soft)]">ההזמנה מיועדת {isEmail ? "לכתובת" : "למספר"} הזה בלבד ותקפה {INVITE_DAYS} ימים. אחרי שהאדם מאשר, הוא נכנס מיד.</p>
            </form>
            <aside className={`${panel} lg:sticky lg:top-4`} aria-label="תצוגת ההודעה">
                <h2 className="m-0 font-display text-[19px]">כך תיראה ההודעה</h2>
                <div className="flex flex-col gap-2 rounded-[16px] border-2 border-dashed border-[var(--mh-ink)] bg-[var(--mh-ticket)] p-4">
                    <b className="text-[14px] text-[var(--mh-ink-soft)]">{sender} · {orgName}</b>
                    <p className="m-0 font-semibold">{preview}</p>
                    <bdi dir="ltr" className="block text-end font-extrabold text-[#3B2BB5] underline">…/invite/••••••</bdi>
                    {(plan || picked.length > 0) && (
                        <p className="m-0 text-[14px] font-semibold text-[var(--mh-ink-soft)]">
                            {plan ? `מסלול: ${plan.name}` : ""}{plan && picked.length ? " · " : ""}{picked.length ? `תוויות: ${labels.filter((l) => picked.includes(l.id)).map((l) => l.name).join(", ")}` : ""}
                        </p>
                    )}
                </div>
            </aside>
        </div>
    );
}
