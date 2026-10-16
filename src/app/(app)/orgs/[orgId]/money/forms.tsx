"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { deleteChargeDraft, recordPayment, reviewReport, voidCharge, type RecordState } from "./actions";
import { NOTE_MAX, RECORD_METHODS } from "@/lib/billing/account";
import { inMovementFilter, signedAmount, type Movement, type MovementFilter } from "@/lib/billing/charge-plan";

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

export function DraftDelete({ orgId, draftId }: { orgId: string; draftId: string }) {
    const [ask, setAsk] = useState(false);
    const [busy, start] = useTransition();
    if (!ask) return <button type="button" onClick={() => setAsk(true)} className={`${small} bg-white`}>מחיקה</button>;
    return (
        <span className="flex flex-wrap items-center gap-2">
            <span className="font-bold">למחוק את הטיוטה?</span>
            <button type="button" disabled={busy} onClick={() => start(() => deleteChargeDraft(orgId, draftId))} className={`${small} border-[#C4223B] bg-[#C4223B] text-white`}>כן, למחוק</button>
            <button type="button" onClick={() => setAsk(false)} className={`${small} bg-white`}>לא</button>
        </span>
    );
}

type MovementRow = Omit<Movement, "at"> & { at: string; amount: string };
const STATUS_BG: Record<Movement["status"], string> = { "נקלט": "bg-[#D7F5E8]", "הועבר": "bg-[#D7F5E8]", "בדרך": "bg-[#FFF6D1]" };

// "תנועות בקופה" (board D-AdmKupa): filter chips, "ייצוא", and the table.
export function Movements({ orgId, rows }: { orgId: string; rows: MovementRow[] }) {
    const [f, setF] = useState<MovementFilter>("all");
    const [all, setAll] = useState(false);
    const list = rows.filter((m) => inMovementFilter(m, f));
    const shown = all ? list : list.slice(0, 20);
    const cols = "md:grid md:grid-cols-[64px_minmax(0,1.6fr)_minmax(0,1fr)_110px_80px] md:items-center md:gap-3";
    return (
        <section className="flex flex-col gap-3 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_3px_0_var(--mh-ink)] md:p-5" aria-labelledby="mv-title">
            <div className="flex flex-wrap items-center gap-2">
                <h2 id="mv-title" className="m-0 me-2 font-display text-[20px]">תנועות בקופה</h2>
                <div role="radiogroup" aria-label="סינון תנועות" className="flex flex-wrap gap-2">
                    {([["all", "הכל"], ["in", "הכנסות"], ["out", "הוצאות"]] as const).map(([k, t]) => <button key={k} type="button" role="radio" aria-checked={f === k} onClick={() => setF(k)} className={chip(f === k)}>{t}</button>)}
                </div>
                <a href={`/orgs/${orgId}/money/export`} download className={`${small} ms-auto bg-white`}>ייצוא</a>
            </div>
            <div role="table" aria-label="תנועות בקופה" className="flex flex-col">
                <div role="row" className={`hidden min-h-9 border-b-2 border-[var(--mh-ink)] text-[13px] font-extrabold text-[var(--mh-ink-soft)] ${cols}`}>
                    <span role="columnheader">תאריך</span><span role="columnheader">תיאור</span><span role="columnheader">מי</span><span role="columnheader" className="text-end">סכום</span><span role="columnheader">סטטוס</span>
                </div>
                {!list.length && <p className="m-0 p-4 font-semibold text-[var(--mh-ink-soft)]">{f === "out" ? "עוד אין הוצאות. משיכות, החזרים ותשלומים לספקים יופיעו כאן כשנחבר את ספק התשלומים." : "עוד לא התקבלו תשלומים."}</p>}
                {shown.map((m) => (
                    <div key={m.id} role="row" className={`grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 border-b-[1.5px] border-[var(--mh-line-soft)] py-2 last:border-0 ${cols}`}>
                        <span role="cell" className="order-3 text-[13px] font-semibold text-[var(--mh-ink-soft)] md:order-none md:text-[14px]"><bdi>{m.at}</bdi><span className="md:hidden"> · {m.who}</span></span>
                        <span role="cell" className="order-1 truncate font-bold md:order-none">{m.what}</span>
                        <span role="cell" className="hidden truncate font-semibold md:block">{m.who}</span>
                        <span role="cell" className={`order-2 text-end font-extrabold md:order-none ${m.dir === "in" ? "text-[#007A52]" : ""}`}><bdi>{signedAmount(m, m.amount)}</bdi></span>
                        <span role="cell" className="order-4 justify-self-end md:order-none md:justify-self-start"><span className={`inline-flex min-h-6 items-center rounded-[12px] border-2 border-[var(--mh-ink)] px-2 text-[12.5px] font-extrabold ${STATUS_BG[m.status]}`}>{m.status}</span></span>
                    </div>
                ))}
            </div>
            {list.length > 20 && <button type="button" onClick={() => setAll((x) => !x)} className="min-h-10 self-start font-extrabold underline">{all ? "הצגת פחות" : `הצגת כל ${list.length} התנועות`}</button>}
        </section>
    );
}
