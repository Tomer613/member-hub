"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { deleteLabel, grantLabel, revokeLabel, saveLabel, type LabelFormState } from "./actions";
import { LABEL_COLORS, LABEL_NAME_MAX } from "@/lib/labels";
import { LabelStamp } from "@/components/labels/stamp";

type LabelRow = { id: string; name: string; color: string; visibility: string; assignment: string; planId: string | null; plan: string | null; count: number; holders: { memberId: string; name: string }[] };
type Plan = { id: string; name: string };
type Person = { linkId: string; memberId: string | null; name: string };

const box = "flex flex-col gap-3 rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-white p-[clamp(16px,2vw,24px)] shadow-[0_4px_0_var(--mh-ink)]";
const lbl = "text-[15px] font-extrabold";
const chip = (on: boolean) => `inline-flex min-h-11 items-center rounded-full border-2 border-[var(--mh-ink)] px-4 text-[15px] font-extrabold transition-colors ${on ? "bg-[var(--mh-ink)] text-white" : "bg-white hover:bg-[var(--mh-ticket)]"}`;
const small = "inline-flex min-h-11 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-white px-4 text-[15px] font-extrabold transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px]";

const giveText = (l: LabelRow) => (l.assignment === "auto_plan" ? `אוטומטית · ${l.plan ?? "מסלול שנמחק"}` : "ידנית");

export function LabelsAdmin({ orgId, orgName, labels, plans, members }: { orgId: string; orgName: string; labels: LabelRow[]; plans: Plan[]; members: Person[] }) {
    const [open, setOpen] = useState<string | "new" | null>(null);
    const [fresh, setFresh] = useState(0); // a new "+ תווית חדשה" always opens an empty editor
    const editor = useRef<HTMLDivElement>(null);
    const current = open && open !== "new" ? labels.find((l) => l.id === open) ?? null : null;
    const pick = (id: string | "new") => {
        setOpen(id);
        if (id === "new") setFresh((n) => n + 1);
        // On a phone the editor sits under the list: bring it into view.
        requestAnimationFrame(() => {
            if (editor.current && window.innerWidth < 1024) editor.current.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    };
    return (
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1fr)_420px] min-[1800px]:grid-cols-[minmax(0,1fr)_520px]">
            <section className={box} aria-labelledby="labels-title">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 id="labels-title" className="m-0 font-display text-[22px]">תוויות הארגון</h2>
                    <button type="button" onClick={() => pick("new")} className="inline-flex min-h-12 items-center rounded-full border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-sun)] px-5 text-[16px] font-extrabold shadow-[0_3px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none">+ תווית חדשה</button>
                </div>
                <p className="m-0 max-w-[640px] text-[15px] font-semibold text-[var(--mh-ink-soft)]">תווית מסמנת תרומה או תפקיד של חבר, כמו תומך, מתנדב או מייסד. אין ביניהן דירוג, ולחבר יכולות להיות כמה. חבר בלי תוויות לא רואה שום סימון.</p>
                {!labels.length ? (
                    <p className="m-0 rounded-[16px] border-2 border-dashed border-[var(--mh-ink)] bg-[var(--mh-ticket)] p-4 font-bold">עוד אין תוויות. אפשר להתחיל ב״+ תווית חדשה״.</p>
                ) : (
                    <div role="table" aria-label="תוויות הארגון" className="flex flex-col">
                        <div role="row" className="hidden min-h-9 items-center gap-3 rounded-[12px] bg-[var(--mh-ink)] px-3 text-[12px] font-extrabold text-white md:grid md:grid-cols-[minmax(0,1.4fr)_90px_110px_minmax(0,1fr)]">
                            <span role="columnheader">תווית</span>
                            <span role="columnheader">חברים</span>
                            <span role="columnheader">מי רואה</span>
                            <span role="columnheader">הענקה</span>
                        </div>
                        {labels.map((l) => (
                            <button
                                key={l.id}
                                type="button"
                                role="row"
                                aria-current={open === l.id ? "true" : undefined}
                                onClick={() => pick(l.id)}
                                className={`flex flex-wrap items-center gap-x-4 gap-y-2 border-b-2 border-[var(--mh-line-soft)] px-3 py-3 text-start transition-colors last:border-0 hover:bg-[var(--mh-ticket)] md:grid md:grid-cols-[minmax(0,1.4fr)_90px_110px_minmax(0,1fr)] md:gap-3 ${open === l.id ? "bg-[#FFF6D1]" : ""}`}
                            >
                                <span role="cell" className="w-full py-1 md:w-auto"><LabelStamp id={l.id} name={l.name} color={l.color} size="sm" /></span>
                                <span role="cell" className="text-[15px] font-bold">{l.count === 1 ? <><span className="md:hidden">חבר </span>אחד</> : <><bdi>{l.count}</bdi><span className="md:hidden"> חברים</span></>}</span>
                                <span role="cell" className="text-[15px] font-bold">{l.visibility === "admins" ? "מנהלים" : "הכל"}<span className="md:hidden"> רואים</span></span>
                                <span role="cell" className="text-[15px] font-bold text-[var(--mh-ink-soft)]">{giveText(l)}</span>
                            </button>
                        ))}
                    </div>
                )}
            </section>
            <div ref={editor} className="scroll-mt-4 lg:sticky lg:top-4">
                {open ? (
                    <Editor key={open === "new" ? `new-${fresh}` : open} orgId={orgId} orgName={orgName} label={current} plans={plans} members={members} onClose={() => setOpen(null)} />
                ) : (
                    <div className={`${box} hidden lg:flex`}>
                        <h2 className="m-0 font-display text-[22px]">עריכת תווית</h2>
                        <p className="m-0 font-semibold text-[var(--mh-ink-soft)]">בחרו תווית מהרשימה כדי לערוך אותה ולקבוע למי היא שייכת, או צרו תווית חדשה.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function Save() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="inline-flex min-h-12 items-center justify-center rounded-full border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-sun)] px-6 text-[17px] font-extrabold shadow-[0_3px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none disabled:opacity-60">
            {pending ? "שומר…" : "שמירה"}
        </button>
    );
}

function Editor({ orgId, orgName, label, plans, members, onClose }: { orgId: string; orgName: string; label: LabelRow | null; plans: Plan[]; members: Person[]; onClose: () => void }) {
    const [state, act] = useActionState<LabelFormState, FormData>(saveLabel, {});
    const [name, setName] = useState(label?.name ?? "");
    const [color, setColor] = useState(label?.color ?? LABEL_COLORS[0]);
    const [visibility, setVisibility] = useState(label?.visibility ?? "all");
    const [assignment, setAssignment] = useState(label?.assignment ?? "manual");
    const [planId, setPlanId] = useState(label?.planId ?? plans[0]?.id ?? "");
    const [shown, setShown] = useState(state);
    const [asking, setAsking] = useState(false);
    const [said, setSaid] = useState("");
    const [, start] = useTransition();
    if (state !== shown) {
        setShown(state);
        if (state.error) {
            setName(state.name ?? ""); setColor(state.color ?? LABEL_COLORS[0]); setVisibility(state.visibility ?? "all"); setAssignment(state.assignment ?? "manual"); setPlanId(state.planId ?? "");
        } else if (state.saved) {
            setSaid(`התווית ״${state.saved}״ נשמרה.`);
            if (!label) {
                setName(""); setColor(LABEL_COLORS[0]); setVisibility("all"); setAssignment("manual"); setPlanId(plans[0]?.id ?? "");
            }
        }
    }
    const remove = () => {
        setAsking(false);
        start(async () => {
            if (label) await deleteLabel(orgId, label.id);
            onClose();
        });
    };
    const head = label ? `עריכת תווית · ${label.name}` : "תווית חדשה";
    return (
        <div className={box}>
            <div className="flex items-center justify-between gap-2">
                <h2 className="m-0 truncate font-display text-[22px]"><bdi>{head}</bdi></h2>
                <button type="button" aria-label="סגירת העורך" onClick={onClose} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-white">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
            </div>
            <form action={act} className="flex flex-col gap-4">
                <input type="hidden" name="orgId" value={orgId} />
                <input type="hidden" name="id" value={label?.id ?? ""} />
                <input type="hidden" name="color" value={color} />
                <input type="hidden" name="visibility" value={visibility} />
                <input type="hidden" name="assignment" value={assignment} />
                <label className="flex flex-col gap-1">
                    <span className="flex items-baseline justify-between"><span className={lbl}>שם</span><span className="text-[13px] font-bold text-[var(--mh-ink-soft)]">עד 14 תווים · <bdi>{`${name.length}/${LABEL_NAME_MAX}`}</bdi></span></span>
                    <input name="name" required maxLength={LABEL_NAME_MAX} value={name} onChange={(e) => setName(e.target.value)} placeholder="למשל: מתנדב" className="min-h-12 rounded-[14px] border-2 border-[var(--mh-ink)] bg-white px-3 text-[16px] font-bold" />
                </label>
                <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
                    <legend className={`${lbl} mb-1`}>צבע</legend>
                    <div role="radiogroup" aria-label="צבע" className="flex flex-wrap gap-2">
                        {LABEL_COLORS.map((c, i) => (
                            <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={["טורקיז", "ורוד", "כתום", "תכלת", "סגול", "צהוב"][i]} onClick={() => setColor(c)}
                                className={`h-11 w-11 rounded-full border-[3px] transition-transform duration-150 hover:-translate-y-px ${color === c ? "border-[var(--mh-ink)]" : "border-transparent"}`}>
                                <span className="block h-full w-full rounded-full border-2 border-white" style={{ background: c, boxShadow: "0 0 0 1px rgba(30,22,51,0.25)" }} />
                            </button>
                        ))}
                    </div>
                </fieldset>
                <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
                    <legend className={`${lbl} mb-1`}>מי רואה</legend>
                    <div role="radiogroup" aria-label="מי רואה" className="flex flex-wrap gap-2">
                        <button type="button" role="radio" aria-checked={visibility === "all"} onClick={() => setVisibility("all")} className={chip(visibility === "all")}>כל החברים</button>
                        <button type="button" role="radio" aria-checked={visibility === "admins"} onClick={() => setVisibility("admins")} className={chip(visibility === "admins")}>מנהלים בלבד</button>
                    </div>
                    {visibility === "admins" && <span className="text-[13px] font-bold text-[var(--mh-ink-soft)]">החבר לא רואה את התווית הזו, לא בכרטיס ולא בארנק.</span>}
                </fieldset>
                <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
                    <legend className={`${lbl} mb-1`}>הענקה</legend>
                    <div role="radiogroup" aria-label="הענקה" className="flex flex-wrap gap-2">
                        <button type="button" role="radio" aria-checked={assignment === "manual"} onClick={() => setAssignment("manual")} className={chip(assignment === "manual")}>ידנית</button>
                        <button type="button" role="radio" aria-checked={assignment === "auto_plan"} aria-disabled={!plans.length} onClick={() => plans.length && setAssignment("auto_plan")} className={`${chip(assignment === "auto_plan")} aria-disabled:opacity-50`}>אוטומטית לפי מסלול</button>
                    </div>
                    {!plans.length ? (
                        <span className="text-[13px] font-bold text-[var(--mh-ink-soft)]">הענקה אוטומטית תהיה אפשרית אחרי שיוגדרו מסלולי חברות בארגון.</span>
                    ) : assignment === "auto_plan" ? (
                        <label className="flex flex-col gap-1">
                            <span className="text-[14px] font-bold">כל מי שיש לו מנוי פעיל במסלול:</span>
                            <select name="planId" value={planId} onChange={(e) => setPlanId(e.target.value)} className="min-h-12 rounded-[14px] border-2 border-[var(--mh-ink)] bg-white px-3 text-[16px] font-bold">
                                {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </label>
                    ) : null}
                </fieldset>
                <div className="flex flex-col gap-2">
                    <span className={lbl}>דוגמה בכרטיס</span>
                    <div className="flex min-h-[84px] flex-col items-start justify-center gap-2 rounded-[18px] border-2 border-[var(--mh-ink)] bg-[var(--mh-ticket)] p-4">
                        <span className="text-[13px] font-bold text-[var(--mh-ink-soft)]">התוויות שלי ב<bdi>{orgName}</bdi></span>
                        <LabelStamp id={label?.id ?? "new"} name={name.trim() || "שם התווית"} color={color} />
                    </div>
                </div>
                {state.error && <p role="alert" className="m-0 rounded-[14px] border-2 border-[#C4223B] bg-white p-3 font-bold text-[#B0182F]">{state.error}</p>}
                <p aria-live="polite" className="m-0 font-bold empty:hidden">{said}</p>
                <div className="flex flex-wrap items-center gap-2">
                    {label && <button type="button" onClick={() => (label.count > 0 ? setAsking(true) : remove())} className={`${small} me-auto text-[#B0182F]`}>מחיקה</button>}
                    <button type="button" onClick={onClose} className={`${small} ${label ? "" : "ms-auto"}`}>ביטול</button>
                    <Save />
                </div>
            </form>
            {label && label.assignment === "manual" && <Holders orgId={orgId} label={label} members={members} />}
            {label && label.assignment === "auto_plan" && <p className="m-0 border-t-2 border-[var(--mh-line-soft)] pt-3 font-semibold text-[var(--mh-ink-soft)]">התווית ניתנת ונלקחת לבד, לפי מנוי פעיל במסלול ״{label.plan}״. כרגע: {label.count === 1 ? "חבר אחד" : <><bdi>{label.count}</bdi> חברים</>}.</p>}
            {asking && label && <ConfirmDelete count={label.count} name={label.name} onCancel={() => setAsking(false)} onConfirm={remove} />}
        </div>
    );
}

// Who holds a hand-given label, and adding or removing a member.
function Holders({ orgId, label, members }: { orgId: string; label: LabelRow; members: Person[] }) {
    const [, start] = useTransition();
    const held = new Set(label.holders.map((h) => h.memberId));
    const free = members.filter((m) => !m.memberId || !held.has(m.memberId));
    const [wanted, setPick] = useState(free[0]?.linkId ?? "");
    // After someone is added they leave the list: fall back to the first one still free.
    const pick = free.some((m) => m.linkId === wanted) ? wanted : (free[0]?.linkId ?? "");
    const [said, setSaid] = useState("");
    return (
        <section aria-labelledby="holders" className="flex flex-col gap-2 border-t-2 border-[var(--mh-line-soft)] pt-3">
            <h3 id="holders" className="m-0 text-[17px] font-extrabold">למי יש את התווית (<bdi>{label.holders.length}</bdi>)</h3>
            {!label.holders.length && <p className="m-0 font-semibold text-[var(--mh-ink-soft)]">לאף אחד עדיין.</p>}
            <ul className="m-0 flex list-none flex-col p-0">
                {label.holders.map((h) => (
                    <li key={h.memberId} className="flex min-h-12 items-center justify-between gap-2 border-b border-[var(--mh-line-soft)] last:border-0">
                        <b>{h.name}</b>
                        <button type="button" aria-label={`הסרת התווית מ${h.name}`} onClick={() => { setSaid(`התווית הוסרה מ${h.name}.`); start(() => revokeLabel(orgId, label.id, h.memberId)); }} className={small}>הסרה</button>
                    </li>
                ))}
            </ul>
            {free.length > 0 && (
                <div className="flex flex-wrap items-end gap-2">
                    <label className="flex min-w-[180px] flex-1 flex-col gap-1">
                        <span className="text-[14px] font-bold">הוספת חבר</span>
                        <select value={pick} onChange={(e) => setPick(e.target.value)} className="min-h-12 rounded-[14px] border-2 border-[var(--mh-ink)] bg-white px-3 text-[16px] font-bold">
                            {free.map((m) => <option key={m.linkId} value={m.linkId}>{m.name}</option>)}
                        </select>
                    </label>
                    <button type="button" disabled={!pick} onClick={() => { const who = free.find((m) => m.linkId === pick)?.name ?? ""; setSaid(`התווית ניתנה ל${who}.`); start(() => grantLabel(orgId, label.id, pick)); }} className={`${small} bg-[var(--mh-sun)]`}>הוספה</button>
                </div>
            )}
            <p aria-live="polite" className="m-0 text-[14px] font-bold empty:hidden">{said}</p>
        </section>
    );
}

function ConfirmDelete({ count, name, onCancel, onConfirm }: { count: number; name: string; onCancel: () => void; onConfirm: () => void }) {
    const first = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        first.current?.focus();
        const esc = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
        window.addEventListener("keydown", esc);
        return () => window.removeEventListener("keydown", esc);
    }, [onCancel]);
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(30,22,51,0.6)] p-0 sm:items-center sm:p-4" onClick={onCancel}>
            <div role="alertdialog" aria-modal="true" aria-labelledby="del-t" aria-describedby="del-d" onClick={(e) => e.stopPropagation()} className="pay-sheet flex w-full max-w-[460px] flex-col gap-3 rounded-t-[24px] border-t-[2.5px] border-[var(--mh-ink)] bg-white p-5 sm:rounded-[24px] sm:border-[2.5px]">
                <h2 id="del-t" className="m-0 font-display text-[22px]">למחוק את התווית ״<bdi>{name}</bdi>״?</h2>
                <p id="del-d" className="m-0 font-bold">{count === 1 ? "לחבר אחד יש את התווית הזו." : <>ל-<bdi>{count}</bdi> חברים יש את התווית הזו.</>} היא תוסר מכולם, ואי אפשר לבטל.</p>
                <div className="flex flex-wrap justify-end gap-2">
                    <button ref={first} type="button" onClick={onCancel} className={small}>ביטול</button>
                    <button type="button" onClick={onConfirm} className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-[#C4223B] bg-[#C4223B] px-4 text-[15px] font-extrabold text-white">מחיקת התווית</button>
                </div>
            </div>
        </div>
    );
}
