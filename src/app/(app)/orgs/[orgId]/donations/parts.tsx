"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { RECORD_METHODS } from "@/lib/billing/account";
import { MAX_INSTALLMENTS, NOTE_MAX, PLEDGE_KINDS, PURPOSE_MAX, QUICK_AMOUNTS, splitAmount, type PledgeInput } from "@/lib/donations";
import { formatShekels, shekelsToMinor } from "@/lib/money";
import { cancelPledgeForm, savePledge, type PledgeResult } from "./actions";

const panel = "flex flex-col gap-4 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_3px_0_var(--mh-ink)] md:p-5";
const field = "min-h-11 w-full rounded-[14px] border-2 border-[var(--mh-ink)] bg-white px-[14px] font-semibold outline-none placeholder:text-[var(--mh-ink-soft)] focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)]";
const label = "text-[14px] font-extrabold";
const hint = "text-[14px] font-semibold text-[var(--mh-ink-soft)]";
const btn = "inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] px-[18px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none";
const chip = (on: boolean) => `inline-flex min-h-11 flex-1 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] px-4 font-extrabold transition-colors duration-150 ${on ? "bg-[var(--mh-ink)] text-white" : "bg-white hover:bg-[var(--mh-ticket)]"}`;

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

// "נדר חדש" (board D-ModSynDonations), as the gabbai's fast entry (synagogue-tools 3): type a name and pick it,
// an amount or a quick amount, Enter, and the form is ready for the next one.
export function PledgeForm({ orgId, members, today, first, color, ink }: { orgId: string; members: { id: string; label: string }[]; today: string; first: string; color: string; ink: string }) {
    const router = useRouter();
    const blank: PledgeInput = { memberId: "", kind: "pledge", purpose: "", amount: "", installments: "1", first, note: "", paidNow: false, method: "cash", notify: true, anonymous: false };
    const [v, setV] = useState<PledgeInput>(blank);
    const [who, setWho] = useState("");
    const [res, setRes] = useState<PledgeResult | null>(null);
    const [busy, run] = useTransition();
    const whoRef = useRef<HTMLInputElement>(null);
    // Two members with the same name get a number, so the typed name always picks one person.
    const names = useMemo(() => {
        const seen = new Map<string, number>();
        return members.map((m) => {
            const k = (seen.get(m.label) ?? 0) + 1;
            seen.set(m.label, k);
            return { id: m.id, label: k > 1 ? `${m.label} (${k})` : m.label };
        });
    }, [members]);
    const set = <K extends keyof PledgeInput>(k: K, x: PledgeInput[K]) => { setV((o) => ({ ...o, [k]: x })); setRes(null); };
    const kind = PLEDGE_KINDS.find((k) => k.value === v.kind) ?? PLEDGE_KINDS[1];
    const n = Number(v.installments);
    const minor = shekelsToMinor(v.amount);
    const each = minor && n > 1 ? splitAmount(minor, n) : null;
    const save = () => run(async () => {
        const r = await savePledge(orgId, v);
        setRes(r);
        if (r.id) {
            // Ready for the next one: the same kind and purpose stay (a Shabbat's aliyot are typed in a row).
            setV({ ...blank, kind: v.kind, purpose: v.purpose });
            setWho("");
            router.refresh();
            whoRef.current?.focus();
        }
    });
    return (
        <form className={panel} aria-labelledby="pl-h" onSubmit={(e) => { e.preventDefault(); save(); }}>
            <h2 id="pl-h" className="m-0 font-display text-[22px] leading-tight">נדר חדש</h2>
            {res?.ok && (
                <p role="status" className="m-0 rounded-[14px] bg-[#D7F5E8] p-3 font-bold text-[#00573A]">
                    {res.ok} {res.id && <Link href={`/orgs/${orgId}/donations?e=${res.id}`} className="font-extrabold underline">לפרטים</Link>}
                </p>
            )}
            <fieldset disabled={busy} className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
                <label className="flex flex-col gap-2">
                    <span className={label}>מי</span>
                    <input ref={whoRef} value={who} list="pl-members" autoComplete="off" placeholder="מקלידים שם ובוחרים" className={field} required
                        onChange={(e) => { const t = e.target.value; setWho(t); set("memberId", names.find((m) => m.label === t)?.id ?? ""); }} />
                    <datalist id="pl-members">{names.map((m) => <option key={m.id} value={m.label} />)}</datalist>
                    {who && !v.memberId && <span className={hint}>בחרו שם מהרשימה.</span>}
                </label>
                <div className="flex flex-col gap-2">
                    <span className={label} id="pk-l">סוג</span>
                    <div role="radiogroup" aria-labelledby="pk-l" className="flex gap-2">
                        {PLEDGE_KINDS.map((k) => <button key={k.value} type="button" role="radio" aria-checked={v.kind === k.value} onClick={() => set("kind", k.value)} className={chip(v.kind === k.value)}>{k.label}</button>)}
                    </div>
                </div>
                <label className="flex flex-col gap-2">
                    <span className={label}>על מה</span>
                    <input value={v.purpose} onChange={(e) => set("purpose", e.target.value)} maxLength={PURPOSE_MAX} placeholder={kind.hint} className={field} required />
                </label>
                <div className="flex flex-col gap-2">
                    <label className="flex flex-col gap-2">
                        <span className={label}>סכום (₪)</span>
                        <input value={v.amount} onChange={(e) => set("amount", e.target.value)} inputMode="decimal" dir="ltr" placeholder="0" className={`${field} text-start`} required />
                    </label>
                    <div className="flex flex-wrap gap-2" aria-label="סכומים מהירים">
                        {QUICK_AMOUNTS.map((q) => (
                            <button key={q} type="button" onClick={() => set("amount", String(q / 100))} aria-pressed={minor === q}
                                className={`inline-flex min-h-10 items-center rounded-full border-2 border-[var(--mh-ink)] px-3 text-[14px] font-extrabold transition-[background-color,transform] duration-150 hover:-translate-y-px ${minor === q ? "bg-[var(--mh-ink)] text-white" : "bg-white hover:bg-[var(--mh-ticket)]"}`}>
                                <bdi>{formatShekels(q)}</bdi>
                            </button>
                        ))}
                    </div>
                </div>
                <Toggle on={v.anonymous} onChange={(x) => set("anonymous", x)} title="בעילום שם" line="בכל רשימה ודוח יופיע &quot;בעילום שם&quot;. את השם רואים רק הגזבר, או המנהל הראשי כשאין גזבר" />
                <Toggle on={v.paidNow} onChange={(x) => setV((o) => ({ ...o, paidNow: x, installments: x ? "1" : o.installments }))} title="הכסף כבר התקבל" line="במזומן, בהעברה או בצ׳ק. נרשם כשולם, עם קבלה" />
                {v.paidNow ? (
                    <div className="flex flex-col gap-2">
                        <span className={label} id="pm-l">איך שולם</span>
                        <div role="radiogroup" aria-labelledby="pm-l" className="flex gap-2">
                            {RECORD_METHODS.map((m) => <button key={m.id} type="button" role="radio" aria-checked={v.method === m.id} onClick={() => set("method", m.id)} className={chip(v.method === m.id)}>{m.label}</button>)}
                        </div>
                    </div>
                ) : (
                    <>
                        <Toggle on={n > 1} onChange={(x) => set("installments", x ? "3" : "1")} title="פריסה לתשלומים" line={n > 1 ? `${n} חיובים חודשיים${each ? `, ${each[0] === each[n - 1] ? `${formatShekels(each[0])} כל אחד` : `הראשון ${formatShekels(each[0])} והשאר ${formatShekels(each[n - 1])}`}` : ""}` : "חיוב אחד בכרטיס החבר"} />
                        <div className={`grid gap-3 ${n > 1 ? "grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : "grid-cols-[minmax(0,1fr)]"}`}>
                            {n > 1 && (
                                <label className="flex flex-col gap-2">
                                    <span className={label}>כמה תשלומים</span>
                                    <select value={v.installments} onChange={(e) => set("installments", e.target.value)} className={field}>
                                        {Array.from({ length: MAX_INSTALLMENTS - 1 }, (_, i) => i + 2).map((x) => <option key={x} value={x}>{x}</option>)}
                                    </select>
                                </label>
                            )}
                            <label className="flex flex-col gap-2">
                                <span className={label}>{n > 1 ? "תשלום ראשון עד" : "לתשלום עד"}</span>
                                <input type="date" dir="ltr" value={v.first} min={today} onChange={(e) => set("first", e.target.value)} className={`${field} text-start`} required />
                            </label>
                        </div>
                        <Toggle on={v.notify} onChange={(x) => set("notify", x)} title="הודעה לחבר" line="הודעת תודה באפליקציה ובמייל, עם קישור לתשלום" />
                    </>
                )}
                <label className="flex flex-col gap-2">
                    <span className={label}>הערה <span className="font-bold text-[var(--mh-ink-soft)]">(לא חובה, רק מנהלים רואים)</span></span>
                    <textarea value={v.note} onChange={(e) => set("note", e.target.value)} rows={2} maxLength={NOTE_MAX} placeholder="למשל: לרפואת רבקה בת שרה" className={`${field} py-3`} />
                </label>
            </fieldset>
            <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={busy} className={btn} style={{ background: color, color: ink }}>{busy ? "יוצרים…" : v.paidNow ? "רישום כשולם" : "יצירת חיוב"}</button>
                {res?.error && <span role="alert" className="font-extrabold text-[#B0182F]">{res.error}</span>}
            </div>
        </form>
    );
}

// "ביטול", with a question first: what was not paid yet is cancelled.
export function CancelPledge({ orgId, id, what }: { orgId: string; id: string; what: string }) {
    const router = useRouter();
    const [asking, setAsking] = useState(false);
    const [res, setRes] = useState<PledgeResult | null>(null);
    const [busy, run] = useTransition();
    const go = () => run(async () => {
        const r = await cancelPledgeForm(orgId, id);
        setRes(r);
        setAsking(false);
        if (r.ok) router.refresh();
    });
    return (
        <div className="flex flex-col gap-2">
            {asking ? (
                <div role="alertdialog" aria-labelledby="cp-h" className="flex flex-wrap items-center gap-2 rounded-[16px] border-2 border-[var(--mh-ink)] bg-[#FFF0F2] p-3">
                    <span className="me-auto flex min-w-0 flex-col">
                        <b id="cp-h">לבטל את {what}?</b>
                        <span className={hint}>החיובים שעוד לא שולמו יבוטלו. מה ששולם נשאר רשום.</span>
                    </span>
                    <button type="button" disabled={busy} onClick={go} className={`${btn} bg-[#C4223B] text-white`}>כן, לבטל</button>
                    <button type="button" disabled={busy} onClick={() => setAsking(false)} className={`${btn} bg-white`}>לא</button>
                </div>
            ) : !res?.ok && <button type="button" onClick={() => setAsking(true)} className="self-start font-extrabold text-[#B0182F] underline underline-offset-4">ביטול</button>}
            {res?.ok && <span role="status" className="font-bold text-[#00573A]">{res.ok}</span>}
            {res?.error && <span role="alert" className="font-extrabold text-[#B0182F]">{res.error}</span>}
        </div>
    );
}
