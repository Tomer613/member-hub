"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { LabelStamp } from "@/components/labels/stamp";
import { grantedText } from "@/lib/labels";
import { DISPUTE_REASON_MAX, MESSAGE_MAX } from "@/lib/members-admin";
import type { FileCharge, MemberRow } from "@/lib/members-server";
import { RecordForm } from "../../money/forms";
import { addLabelMany, changePlan, closeDispute, openDispute, removeLabel, removeMember, sendMessage, sendReminders, setFreeze, type BulkResult } from "../actions";

type Held = { id: string; name: string; color: string; how: "manual" | "auto_plan"; plan: string | null; since: string };
type Sheet = "message" | "dispute" | "plan" | "freeze" | "remove" | null;

const panel = "flex flex-col gap-3 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_3px_0_var(--mh-ink)]";
const btn = "inline-flex min-h-[38px] items-center justify-center gap-2 rounded-full border-2 border-[var(--mh-ink)] px-[18px] text-[15px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none disabled:opacity-60";
const field = "min-h-[42px] rounded-[12px] border-2 border-[var(--mh-ink)] bg-white px-3 text-[16px] font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)]";
const fmt = (m: number) => `₪${new Intl.NumberFormat("he-IL", { maximumFractionDigits: 2 }).format(m / 100)}`;
const day = (iso: string) => new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", day: "2-digit", month: "2-digit", year: "2-digit" }).format(new Date(iso));

const CHARGE_CHIP = {
    open: { label: "פתוח", bg: "#FFE9E6" },
    pending: { label: "ממתין לאישור", bg: "#FFF6D1" },
    paid: { label: "שולם", bg: "#D7F5E8" },
    dispute: { label: "במחלוקת", bg: "#CFF0FC" },
};

export function MemberFile({ orgId, linkId, r, charges, held, manual, plans, plan, canFreeze, canManage, removable, today, startDispute }: {
    orgId: string;
    linkId: string;
    r: MemberRow;
    charges: FileCharge[];
    held: Held[];
    manual: { id: string; name: string; color: string }[];
    plans: { id: string; name: string }[];
    plan: { name: string; planId: string; frozen: boolean; until: string | null } | null;
    canFreeze: boolean;
    canManage: boolean;
    removable: boolean;
    today: string;
    startDispute: boolean;
}) {
    const router = useRouter();
    const disputable = charges.filter((c) => c.state === "open" && !c.disputeId);
    const [sheet, setSheet] = useState<Sheet>(startDispute && disputable.length ? "dispute" : null);
    const [result, setResult] = useState<BulkResult | null>(null);
    const [recording, setRecording] = useState(false);
    const [busy, start] = useTransition();
    const sheetRef = useRef<HTMLDivElement>(null);
    const active = r.status !== "left_debt";
    const owes = r.owedMinor > 0;

    const run = (fn: () => Promise<BulkResult>, after?: () => void) => {
        setResult(null);
        start(async () => {
            const res = await fn();
            setResult(res);
            if (res.ok) {
                setSheet(null);
                after?.();
                router.refresh();
            }
        });
    };
    const open = (s: Sheet) => {
        setSheet(s);
        setResult(null);
        requestAnimationFrame(() => sheetRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    };
    const remindLabel = r.remindAfter && owes ? `תזכורת שוב ב-${day(r.remindAfter).slice(0, 5)}` : "שליחת תזכורת";
    const details: [string, string | null][] = [
        ["טלפון", r.phone],
        ["מייל", r.email],
        ["כתובת", r.address],
        ["בני משפחה", r.family],
        ...r.extra.map((x) => [x.label, x.value] as [string, string]),
    ];
    const addable = manual.filter((m) => !held.some((h) => h.id === m.id));

    return (
        <>
            {result && <p role="status" className={`m-0 rounded-[14px] border-2 px-4 py-2 font-extrabold ${result.error ? "border-[#C4223B] bg-[#FFE9E6] text-[#B0182F]" : "border-[var(--mh-ink)] bg-[#D7F5E8]"}`}>{result.error ?? result.ok}</p>}
            <div ref={sheetRef} className="scroll-mt-4">
                {sheet && (
                    <ActionSheet key={sheet} sheet={sheet} r={r} disputable={disputable} plans={plans} plan={plan} today={today} busy={busy} onClose={() => setSheet(null)}
                        onMessage={(t) => run(() => sendMessage(orgId, [linkId], t))}
                        onDispute={(c, why) => run(() => openDispute(orgId, c, why))}
                        onPlan={(p) => run(() => changePlan(orgId, linkId, p))}
                        onFreeze={(until) => run(() => setFreeze(orgId, linkId, until))}
                        onRemove={() => run(() => removeMember(orgId, linkId), () => router.push(`/orgs/${orgId}/members`))} />
                )}
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-[14px] [grid-template-areas:'d'_'a'_'c'] lg:grid-cols-[minmax(0,1fr)_230px] lg:[grid-template-areas:'d_a'_'c_a'] xl:grid-cols-[320px_minmax(0,1fr)_230px] xl:[grid-template-areas:'d_c_a']">
                <section className={`${panel} [grid-area:d]`} aria-labelledby="details-title">
                    <div>
                        <h2 id="details-title" className="m-0 font-display text-[19px]">פרטים</h2>
                        <p className="m-0 text-[13px] font-semibold text-[var(--mh-ink-soft)]">לפי מה שהחבר אישר לארגון</p>
                    </div>
                    <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-[15px]">
                        {details.map(([k, v]) => (
                            <div key={k} className="contents">
                                <dt className="font-semibold text-[var(--mh-ink-soft)]">{k}</dt>
                                <dd className="m-0 break-words font-bold">{v ? (k === "טלפון" || k === "מייל" ? <bdi dir="ltr">{v}</bdi> : v) : <span className="font-semibold text-[var(--mh-ink-soft)]">לא שותף</span>}</dd>
                            </div>
                        ))}
                        <dt className="font-semibold text-[var(--mh-ink-soft)]">מסלול</dt>
                        <dd className="m-0 font-bold">{plan ? `${plan.name}${plan.frozen && plan.until ? ` · מוקפא עד ${plan.until.split("-").reverse().join(".")}` : ""}` : <span className="font-semibold text-[var(--mh-ink-soft)]">בלי מסלול</span>}</dd>
                    </dl>
                    <div className="flex flex-col gap-2 border-t-[1.5px] border-[var(--mh-line-soft)] pt-3">
                        <b className="text-[15px]">תוויות</b>
                        {held.length ? (
                            <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-4 p-0 pt-1">
                                {held.map((l, i) => (
                                    <li key={l.id} className="flex items-center gap-1" title={undefined}>
                                        <LabelStamp id={l.id} name={l.name} color={l.color} size="sm" style={{ transform: `rotate(${i % 2 ? 3 : -3}deg)` }} />
                                        <span className="sr-only">{grantedText({ since: new Date(l.since), how: l.how, plan: l.plan })}</span>
                                        {canManage && l.how === "manual" && (
                                            <button type="button" disabled={busy} onClick={() => start(async () => { await removeLabel(orgId, l.id, r.memberId!); router.refresh(); })} aria-label={`הסרת התווית ${l.name}`} className="grid h-8 w-8 place-items-center rounded-full border-2 border-transparent text-[18px] font-extrabold hover:border-[var(--mh-ink)]">×</button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="m-0 text-[14px] font-semibold text-[var(--mh-ink-soft)]">אין תוויות.</p>}
                        {canManage && active && addable.length > 0 && <AddLabel labels={addable} busy={busy} onAdd={(id) => run(() => addLabelMany(orgId, id, [linkId]))} />}
                    </div>
                </section>

                <section id="charges" className={`${panel} scroll-mt-4 [grid-area:c]`} aria-labelledby="charges-title">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 id="charges-title" className="m-0 font-display text-[19px]">חיובים ותשלומים</h2>
                        <div className="flex flex-wrap gap-2">
                            {charges.some((c) => c.state === "open") && <button type="button" aria-expanded={recording} onClick={() => setRecording((v) => !v)} className={`${btn} bg-white`}>רישום תשלום ידני</button>}
                            {active && <Link href={`/orgs/${orgId}/money/new?for=${linkId}`} className={`${btn} bg-[var(--mh-sun)]`}>חיוב חדש</Link>}
                        </div>
                    </div>
                    {!charges.length ? (
                        <p className="m-0 font-semibold text-[var(--mh-ink-soft)]">עוד אין חיובים לחבר הזה.</p>
                    ) : (
                        <div role="table" aria-label="חיובים" className="flex flex-col">
                            <div role="row" className="hidden min-h-9 grid-cols-[84px_minmax(0,1fr)_100px_118px] items-center gap-3 border-b-2 border-[var(--mh-ink)] text-[13px] font-extrabold text-[var(--mh-ink-soft)] sm:grid">
                                <span role="columnheader">תאריך</span>
                                <span role="columnheader">חיוב</span>
                                <span role="columnheader" className="text-end">סכום</span>
                                <span role="columnheader">סטטוס</span>
                            </div>
                            {charges.map((c) => {
                                const chip = c.disputeId && c.state !== "paid" ? CHARGE_CHIP.dispute : CHARGE_CHIP[c.state];
                                return (
                                    <div key={c.id} role="row" className="flex flex-col gap-2 border-b-[1.5px] border-[var(--mh-line-soft)] py-2 last:border-0">
                                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 sm:grid-cols-[84px_minmax(0,1fr)_100px_118px] sm:gap-3">
                                            <span role="cell" className="col-start-1 row-start-2 text-[13px] font-semibold text-[var(--mh-ink-soft)] sm:col-auto sm:row-auto sm:text-[14px] sm:text-[var(--mh-ink)]"><bdi>{day(c.createdAt)}</bdi></span>
                                            <span role="cell" className="col-start-1 row-start-1 font-bold sm:col-auto sm:row-auto">{c.description}</span>
                                            <span role="cell" className="col-start-2 row-start-1 text-end font-extrabold sm:col-auto sm:row-auto"><bdi>{fmt(c.state === "paid" ? c.amountMinor : c.leftMinor)}</bdi></span>
                                            <span role="cell" className="col-start-2 row-start-2 justify-self-end sm:col-auto sm:row-auto sm:justify-self-auto">
                                                <span className="inline-flex min-h-6 items-center whitespace-nowrap rounded-[12px] border-2 border-[var(--mh-ink)] px-2 text-[12.5px] font-extrabold" style={{ background: chip.bg }}>{chip.label}</span>
                                            </span>
                                        </div>
                                        {c.disputeId && (
                                            <div className="flex flex-wrap items-center gap-2 rounded-[12px] bg-[#EEF9FE] p-2 text-[14px]">
                                                <span className="flex-1 font-semibold">{c.disputeSide === "org" ? "הארגון סימן" : "החבר סימן"}: ״{c.disputeReason}״. תזכורות על החיוב הזה עצורות.</span>
                                                <button type="button" disabled={busy} onClick={() => start(async () => { await closeDispute(orgId, c.disputeId!); router.refresh(); })} className={`${btn} min-h-[34px] bg-white px-3 text-[14px]`}>סגירת המחלוקת</button>
                                            </div>
                                        )}
                                        {recording && c.state === "open" && <RecordForm chargeId={c.id} who={r.name} left={fmt(c.leftMinor)} leftValue={(c.leftMinor / 100).toString()} today={today} />}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                <section className={`${panel} [grid-area:a]`} aria-labelledby="actions-title">
                    <h2 id="actions-title" className="m-0 font-display text-[19px]">פעולות</h2>
                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                        <button type="button" disabled={busy || !owes || !!r.remindAfter} onClick={() => run(() => sendReminders(orgId, [linkId]))} className={`${btn} bg-[var(--mh-sun)] px-3`}>{remindLabel}</button>
                        <button type="button" onClick={() => open("message")} className={`${btn} bg-white px-3`}>הודעה אישית</button>
                        <button type="button" disabled={!disputable.length} onClick={() => open("dispute")} className={`${btn} bg-white px-3`}>מחלוקת על חיוב</button>
                        {active && plans.length > 0 && <button type="button" onClick={() => open("plan")} className={`${btn} bg-white px-3`}>שינוי מסלול</button>}
                        {active && canFreeze && plan && <button type="button" onClick={() => open("freeze")} className={`${btn} bg-white px-3`}>{plan.frozen ? "ביטול ההקפאה" : "הקפאת מנוי"}</button>}
                        {removable && <button type="button" onClick={() => open("remove")} className={`${btn} border-[#C4223B] bg-white px-3 text-[#C4223B] shadow-[0_2px_0_#C4223B]`}>הסרת חבר</button>}
                    </div>
                    {!owes && !r.disputes && <p className="m-0 text-[13px] font-semibold text-[var(--mh-ink-soft)]">אין חוב פתוח, אז אין צורך בתזכורת.</p>}
                    <p className="m-0 flex gap-2 rounded-[14px] border-2 border-[var(--mh-ink)] bg-[#FFF6D1] p-3 text-[13.5px] font-semibold">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0"><path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>
                        <span>הסרת חבר עם חוב פתוח שומרת את החוב, והכרטיס נשאר אצלו בארנק עד שהחוב ייסגר.</span>
                    </p>
                </section>
            </div>
        </>
    );
}

function AddLabel({ labels, busy, onAdd }: { labels: { id: string; name: string }[]; busy: boolean; onAdd: (id: string) => void }) {
    const [pick, setPick] = useState(labels[0].id);
    return (
        <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="add-label">תווית להוספה</label>
            <select id="add-label" value={pick} onChange={(e) => setPick(e.target.value)} className={`${field} min-w-0 flex-1`}>
                {labels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <button type="button" disabled={busy} onClick={() => onAdd(pick)} className={`${btn} bg-white`}>+ הוספה</button>
        </div>
    );
}

function ActionSheet({ sheet, r, disputable, plans, plan, today, busy, onClose, onMessage, onDispute, onPlan, onFreeze, onRemove }: {
    sheet: NonNullable<Sheet>;
    r: MemberRow;
    disputable: FileCharge[];
    plans: { id: string; name: string }[];
    plan: { name: string; planId: string; frozen: boolean; until: string | null } | null;
    today: string;
    busy: boolean;
    onClose: () => void;
    onMessage: (t: string) => void;
    onDispute: (chargeId: string, why: string) => void;
    onPlan: (id: string) => void;
    onFreeze: (until: string) => void;
    onRemove: () => void;
}) {
    const [text, setText] = useState("");
    const [charge, setCharge] = useState(disputable[0]?.id ?? "");
    const [planId, setPlanId] = useState(plans.find((p) => p.id !== plan?.planId)?.id ?? "");
    const [until, setUntil] = useState("");
    const owes = r.balanceMinor > 0;
    const title = {
        message: `הודעה אישית ל${r.name}`,
        dispute: "סימון חיוב במחלוקת",
        plan: "שינוי מסלול",
        freeze: plan?.frozen ? "ביטול ההקפאה" : "הקפאת מנוי",
        remove: `להסיר את ${r.name}?`,
    }[sheet];
    const danger = sheet === "remove";
    return (
        <section role={danger ? "alertdialog" : undefined} aria-label={title} className={`${panel} ${danger ? "border-[#C4223B] bg-[#FFE9E6]" : "bg-[var(--mh-ticket)]"}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="m-0 font-display text-[19px]">{title}</h2>
                <button type="button" onClick={onClose} className="min-h-10 px-2 font-extrabold underline">סגירה</button>
            </div>
            {sheet === "message" && (
                <label className="flex flex-col gap-1">
                    <span className="text-[15px] font-extrabold">ההודעה</span>
                    <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={MESSAGE_MAX} rows={3} className={`${field} min-h-[84px] p-3 font-semibold`} />
                    <span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">נשלחת באפליקציה ובמייל אם יש. <bdi>{text.length}/{MESSAGE_MAX}</bdi></span>
                </label>
            )}
            {sheet === "dispute" && (
                <>
                    <p className="m-0 text-[14px] font-semibold">כל צד יכול לסמן חיוב במחלוקת. כל עוד היא פתוחה לא נשלחות על החיוב תזכורות. המערכת רק מתעדת ולא מכריעה.</p>
                    <label className="flex flex-col gap-1">
                        <span className="text-[15px] font-extrabold">איזה חיוב</span>
                        <select value={charge} onChange={(e) => setCharge(e.target.value)} className={field}>
                            {disputable.map((c) => <option key={c.id} value={c.id}>{c.description} · {fmt(c.leftMinor)}</option>)}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="text-[15px] font-extrabold">על מה המחלוקת</span>
                        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={DISPUTE_REASON_MAX} className={field} />
                        <span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">החבר יראה את הנוסח. בלי מידע רפואי או רגיש.</span>
                    </label>
                </>
            )}
            {sheet === "plan" && (
                <>
                    <p className="m-0 text-[14px] font-semibold">{plan ? `המסלול הנוכחי: ${plan.name}. ` : ""}המסלול החדש מתחיל היום. חיובים שכבר נוצרו נשארים כמו שהם.</p>
                    <div role="radiogroup" aria-label="מסלול חדש" className="flex flex-col gap-2">
                        {plans.map((p) => (
                            <button key={p.id} type="button" role="radio" aria-checked={planId === p.id} disabled={p.id === plan?.planId} onClick={() => setPlanId(p.id)}
                                className={`flex min-h-12 items-center gap-3 rounded-[16px] border-2 border-[var(--mh-ink)] px-3 text-start font-extrabold disabled:opacity-50 ${planId === p.id ? "bg-[#FFF6D1] shadow-[0_3px_0_var(--mh-ink)]" : "bg-white"}`}>
                                <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border-2 border-[var(--mh-ink)] bg-white" aria-hidden="true">{planId === p.id && <span className="h-[10px] w-[10px] rounded-full bg-[var(--mh-ink)]" />}</span>
                                <span>{p.name}{p.id === plan?.planId ? " (נוכחי)" : ""}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
            {sheet === "freeze" && !plan?.frozen && (
                <label className="flex flex-col gap-1">
                    <span className="text-[15px] font-extrabold">מוקפא עד</span>
                    <input type="date" dir="ltr" min={today} value={until} onChange={(e) => setUntil(e.target.value)} className={`${field} text-start`} />
                    <span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">ההקפאה מתחילה היום, והחבר מקבל על כך הודעה.</span>
                </label>
            )}
            {sheet === "freeze" && plan?.frozen && <p className="m-0 text-[14px] font-semibold">המנוי יחזור לפעול מהיום.</p>}
            {sheet === "remove" && (
                <p className="m-0 font-semibold">
                    {owes
                        ? "יש לחבר יתרה פתוחה. החוב נשמר, החבר יופיע תחת ״עזבו עם חוב״, והכרטיס יישאר אצלו בארנק עד שהחוב ייסגר."
                        : "החברות תסתיים והכרטיס יעבור אצלו לארכיון. החבר יקבל הודעה על כך."}
                </p>
            )}
            <div className="flex flex-wrap gap-2">
                {sheet === "message" && <button type="button" disabled={busy || !text.trim()} onClick={() => onMessage(text)} className={`${btn} bg-[var(--mh-sun)]`}>{busy ? "שולחים…" : "שליחה"}</button>}
                {sheet === "dispute" && <button type="button" disabled={busy || !text.trim() || !charge} onClick={() => onDispute(charge, text)} className={`${btn} bg-[var(--mh-sun)]`}>סימון במחלוקת</button>}
                {sheet === "plan" && <button type="button" disabled={busy || !planId} onClick={() => onPlan(planId)} className={`${btn} bg-[var(--mh-sun)]`}>עדכון המסלול</button>}
                {sheet === "freeze" && <button type="button" disabled={busy || (!plan?.frozen && !until)} onClick={() => onFreeze(plan?.frozen ? "" : until)} className={`${btn} bg-[var(--mh-sun)]`}>{plan?.frozen ? "החזרה לפעילות" : "הקפאה"}</button>}
                {sheet === "remove" && <button type="button" disabled={busy} onClick={onRemove} className={`${btn} border-[#C4223B] bg-white text-[#C4223B] shadow-[0_2px_0_#C4223B]`}>{busy ? "מסירים…" : "הסרת החבר"}</button>}
                <button type="button" onClick={onClose} className={`${btn} bg-white`}>ביטול</button>
            </div>
        </section>
    );
}
