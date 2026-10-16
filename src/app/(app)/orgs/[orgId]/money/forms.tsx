"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { createCharges, recordPayment, reviewReport, voidCharge, type ChargeFormState, type RecordState } from "./actions";
import { NOTE_MAX, RECORD_METHODS, TITLE_MAX } from "@/lib/billing/account";
import { formatShekels, shekelsToMinor } from "@/lib/money";
import { OrgDot, type OrgLook } from "@/components/pay/parts";

const label = "text-[15px] font-extrabold";
const field = "min-h-12 rounded-[14px] border-2 border-[var(--mh-ink)] bg-white px-3 text-[16px] font-bold";
const small = "inline-flex min-h-11 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] px-4 text-[15px] font-extrabold transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px]";
const chip = (on: boolean) => `inline-flex min-h-10 items-center rounded-full border-2 border-[var(--mh-ink)] px-4 text-[15px] font-extrabold transition-colors ${on ? "bg-[var(--mh-ink)] text-white" : "bg-white hover:bg-[var(--mh-ticket)]"}`;

function Submit({ children, busy }: { children: string; busy: string }) {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="inline-flex min-h-12 items-center justify-center rounded-full border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-sun)] px-6 text-[17px] font-extrabold shadow-[0_3px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none disabled:opacity-60">
            {pending ? busy : children}
        </button>
    );
}

// A new charge (board D-AdmCharge): the fields, who gets it, a live preview of what the member will see,
// and the totals.
export function ChargeForm({ orgId, org, today, members, forLink }: { orgId: string; org: OrgLook; today: string; members: { id: string; name: string }[]; forLink?: string }) {
    const [state, act] = useActionState<ChargeFormState, FormData>(createCharges, {});
    const [title, setTitle] = useState(state.title ?? "");
    const [amount, setAmount] = useState(state.amount ?? "");
    const [due, setDue] = useState(state.due ?? "");
    const [note, setNote] = useState(state.note ?? "");
    // Opened from a member file ("חיוב חדש"), the charge starts addressed to that member alone.
    const [to, setTo] = useState(state.to ?? (forLink ? "picked" : "all"));
    const [picked, setPicked] = useState<string[]>(state.picked ?? (forLink ? [forLink] : []));
    const [shown, setShown] = useState(state);
    // After a send the form clears; after an error it keeps what was typed.
    if (state !== shown) {
        setShown(state);
        if (state.done) {
            setTitle(""); setAmount(""); setDue(""); setNote(""); setTo("all"); setPicked([]);
        }
    }
    const minor = shekelsToMinor(amount) ?? 0;
    const count = to === "all" ? members.length : picked.length;
    const dueText = due ? due.split("-").reverse().join(".") : "DD.MM.YYYY";
    return (
        <form action={act} className="flex flex-col gap-3 rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-white p-[clamp(16px,2vw,24px)] shadow-[0_4px_0_var(--mh-ink)] lg:sticky lg:top-4">
            <input type="hidden" name="orgId" value={orgId} />
            <input type="hidden" name="to" value={to} />
            <h2 className="m-0 font-display text-[22px]">חיוב חדש</h2>
            <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2">
                <label className="flex flex-col gap-1 min-[520px]:col-span-2">
                    <span className={label}>כותרת החיוב</span>
                    <input name="title" required maxLength={TITLE_MAX} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="למשל: דמי ועד נובמבר" className={field} />
                </label>
                <label className="flex flex-col gap-1">
                    <span className={label}>סכום (₪)</span>
                    <input name="amount" required inputMode="decimal" dir="ltr" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className={`${field} text-start`} />
                </label>
                <label className="flex flex-col gap-1">
                    <span className={label}>תאריך לתשלום</span>
                    <input name="due" type="date" required dir="ltr" min={today} value={due} onChange={(e) => setDue(e.target.value)} className={`${field} text-start`} />
                </label>
            </div>
            <span id="to" className={label}>למי</span>
            <div role="radiogroup" aria-labelledby="to" className="flex flex-col gap-2">
                {[
                    { id: "all", title: "כל החברים הפעילים", sub: `${members.length} חברים` },
                    { id: "picked", title: "חברים נבחרים", sub: picked.length ? `${picked.length} נבחרו` : "בחירה מהרשימה" },
                ].map((o) => (
                    <button key={o.id} type="button" role="radio" aria-checked={to === o.id} onClick={() => setTo(o.id)} className={`flex min-h-[60px] items-center gap-3 rounded-[16px] border-2 border-[var(--mh-ink)] px-[14px] text-start ${to === o.id ? "bg-[var(--mh-sun)] shadow-[0_3px_0_var(--mh-ink)]" : "bg-white hover:bg-[var(--mh-ticket)]"}`}>
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-white">{to === o.id && <span className="h-3 w-3 rounded-full bg-[var(--mh-ink)]" />}</span>
                        <span className="flex flex-col"><b>{o.title}</b><span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">{o.sub}</span></span>
                    </button>
                ))}
            </div>
            {to === "picked" && (
                <fieldset className="m-0 flex max-h-[220px] flex-col gap-1 overflow-y-auto rounded-[16px] border-2 border-[var(--mh-ink)] p-2">
                    <legend className="sr-only">בחירת חברים</legend>
                    {members.map((m) => (
                        <label key={m.id} className="flex min-h-11 items-center gap-3 rounded-[10px] px-2 hover:bg-[var(--mh-ticket)]">
                            <input type="checkbox" name="members" value={m.id} checked={picked.includes(m.id)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, m.id] : p.filter((x) => x !== m.id)))} className="h-5 w-5 accent-[var(--mh-ink)]" />
                            <span className="font-bold">{m.name}</span>
                        </label>
                    ))}
                </fieldset>
            )}
            <label className="flex flex-col gap-1">
                <span className={label}>הסבר לחברים (לא חובה)</span>
                <span className="text-[13px] font-bold text-[var(--mh-ink-soft)]">יוצג בכרטיס החיוב ובהודעה. אל תכתבו כאן מידע רפואי או מזהה רגיש.</span>
                <textarea name="note" rows={2} maxLength={NOTE_MAX} value={note} onChange={(e) => setNote(e.target.value)} className={`${field} py-2`} />
            </label>
            <label className="flex min-h-11 items-center gap-3">
                <input type="checkbox" name="notify" defaultChecked className="h-5 w-5 accent-[var(--mh-ink)]" />
                <span className="font-bold">לשלוח הודעה לחברים</span>
            </label>

            <span className={label}>כך החבר יראה</span>
            <div className="overflow-hidden rounded-[18px] border-2 border-[var(--mh-ink)]" aria-hidden="true">
                <div className="flex items-center gap-3 border-b-2 border-[var(--mh-ink)] bg-[#FFF1B8] px-3 py-2">
                    <OrgDot org={org} size={34} />
                    <b className="flex-1">חיוב חדש</b>
                    <bdi className="font-display text-[22px]">{formatShekels(minor)}</bdi>
                </div>
                <div className="flex flex-col gap-1 bg-[var(--mh-ticket)] p-3">
                    <b>{title || "כותרת החיוב"}</b>
                    <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">עד <bdi>{dueText}</bdi> · {org.name}</span>
                    {note && <span className="text-[14px] font-semibold">{note}</span>}
                    <span className="mt-1 inline-flex min-h-11 items-center self-start rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-sun)] px-4 font-extrabold">לתשלום</span>
                </div>
            </div>
            <dl className="m-0 grid grid-cols-2 gap-x-3 gap-y-1">
                <dt className="font-bold text-[var(--mh-ink-soft)]">מקבלים</dt><dd className="m-0 text-end font-extrabold"><bdi>{count}</bdi></dd>
                <dt className="font-bold text-[var(--mh-ink-soft)]">סכום כולל</dt><dd className="m-0 text-end font-extrabold"><bdi>{formatShekels(minor * count)}</bdi></dd>
            </dl>
            <p className="m-0 rounded-[14px] bg-[var(--mh-ticket)] p-3 text-[14px] font-bold">חיוב שנשלח לא נמחק. אפשר לבטל אותו כל עוד לא שולם עליו כלום.</p>
            {state.error && <p role="alert" className="m-0 font-extrabold text-[#B0182F]">{state.error}</p>}
            {state.done && <p role="status" className="m-0 font-extrabold">{state.done}</p>}
            <Submit busy="שולחים…">שליחה לחברים</Submit>
        </form>
    );
}

// Recording a payment the org got outside the app (board D-MAdmPayRecord), opened under the charge.
export function RecordForm({ chargeId, who, left, leftValue, today }: { chargeId: string; who: string; left: string; leftValue: string; today: string }) {
    const [open, setOpen] = useState(false);
    const [state, act] = useActionState<RecordState, FormData>(recordPayment, {});
    const [method, setMethod] = useState("cash");
    if (!open || state.done) {
        return <button type="button" onClick={() => setOpen(true)} className={`${small} bg-white`}>רישום תשלום</button>;
    }
    return (
        <form action={act} className="flex w-full flex-col gap-3 rounded-[16px] border-2 border-[var(--mh-ink)] bg-[var(--mh-ticket)] p-3">
            <input type="hidden" name="chargeId" value={chargeId} />
            <input type="hidden" name="method" value={method} />
            <b>רישום תשלום ידני · {who} · חוב <bdi>{left}</bdi></b>
            <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2">
                <label className="flex flex-col gap-1">
                    <span className={label}>סכום (₪)</span>
                    <input name="amount" required inputMode="decimal" dir="ltr" defaultValue={leftValue} className={`${field} text-start`} />
                </label>
                <label className="flex flex-col gap-1">
                    <span className={label}>תאריך קבלת התשלום</span>
                    <input name="date" type="date" dir="ltr" max={today} defaultValue={today} className={`${field} text-start`} />
                </label>
            </div>
            <span className={label} id={`m-${chargeId}`}>איך שולם</span>
            <div role="radiogroup" aria-labelledby={`m-${chargeId}`} className="flex flex-wrap gap-2">
                {RECORD_METHODS.map((m) => <button key={m.id} type="button" role="radio" aria-checked={method === m.id} onClick={() => setMethod(m.id)} className={chip(method === m.id)}>{m.label}</button>)}
            </div>
            <label className="flex flex-col gap-1">
                <span className={label}>הערה (לא חובה)</span>
                <span className="text-[13px] font-bold text-[var(--mh-ink-soft)]">אל תכתבו כאן מידע רפואי או מזהה רגיש.</span>
                <input name="note" maxLength={NOTE_MAX} className={field} />
            </label>
            <label className="flex min-h-11 items-center gap-3">
                <input type="checkbox" name="notify" defaultChecked className="h-5 w-5 accent-[var(--mh-ink)]" />
                <span className="font-bold">שליחת אישור לחבר</span>
            </label>
            <p className="m-0 text-[13px] font-bold text-[var(--mh-ink-soft)]">הרישום מתועד בשם המנהל שביצע אותו.</p>
            {state.error && <p role="alert" className="m-0 font-extrabold text-[#B0182F]">{state.error}</p>}
            <div className="flex flex-wrap gap-2">
                <Submit busy="רושמים…">רישום התשלום</Submit>
                <button type="button" onClick={() => setOpen(false)} className={`${small} bg-white`}>ביטול</button>
            </div>
        </form>
    );
}

export function ReviewButtons({ paymentId }: { paymentId: string }) {
    const [busy, start] = useTransition();
    return (
        <span className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => start(() => reviewReport(paymentId, true))} className={`${small} bg-[var(--mh-tint-ok)]`}>אישור</button>
            <button type="button" disabled={busy} onClick={() => start(() => reviewReport(paymentId, false))} className={`${small} bg-white`}>לא התקבל</button>
        </span>
    );
}

export function VoidButton({ chargeId }: { chargeId: string }) {
    const [ask, setAsk] = useState(false);
    const [busy, start] = useTransition();
    if (!ask) return <button type="button" onClick={() => setAsk(true)} className={`${small} border-[#C4223B] bg-white text-[#C4223B]`}>ביטול חיוב</button>;
    return (
        <span className="flex flex-wrap items-center gap-2">
            <span className="font-bold">לבטל את החיוב?</span>
            <button type="button" disabled={busy} onClick={() => start(() => voidCharge(chargeId))} className={`${small} border-[#C4223B] bg-[#C4223B] text-white`}>כן, לבטל</button>
            <button type="button" onClick={() => setAsk(false)} className={`${small} bg-white`}>לא</button>
        </span>
    );
}
