"use client";

import { useActionState, useState } from "react";
import { MAX_PEOPLE, type RsvpStatus } from "@/lib/celebration";
import { answer } from "./actions";

// The reply: a name, coming / maybe / not, and how many. "מתוכם ילדים?" stays folded until opened
// (decided with Tommy 14.10.2026), because most replies are adults only.

const STATUSES: { id: RsvpStatus; label: string; on: string }[] = [
    { id: "yes", label: "מגיע/ה", on: "bg-[var(--mh-ok)]" },
    { id: "maybe", label: "אולי", on: "bg-[var(--mh-sun)]" },
    { id: "no", label: "לא אגיע", on: "bg-[var(--mh-tint-pink)]" },
];

const field = "min-h-[var(--mh-hit)] w-full rounded-[14px] border-2 border-[var(--mh-ink)] bg-white px-[14px] font-semibold outline-none placeholder:text-[var(--mh-ink-soft)] focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)]";

export function ReplyForm({ token, kids: kidsInvited, initial }: { token: string; kids: boolean; initial: { name: string; status: RsvpStatus | null; people: number; kids: number } }) {
    const [state, action, pending] = useActionState(answer.bind(null, token), undefined);
    const [status, setStatus] = useState<RsvpStatus | null>(initial.status);
    const [people, setPeople] = useState(initial.people);
    const [kids, setKids] = useState(initial.kids);
    const [kidsOpen, setKidsOpen] = useState(initial.kids > 0);
    const counting = status === "yes" || status === "maybe";

    return (
        <form action={action} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2">
                <span className="text-[14px] font-extrabold">השם שלכם</span>
                <input name="name" defaultValue={initial.name} required minLength={2} maxLength={40} autoComplete="name" placeholder="שם פרטי ומשפחה" className={field} />
            </label>
            <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
                <legend className="mb-2 text-[14px] font-extrabold">מגיעים?</legend>
                <div role="radiogroup" aria-label="מגיעים?" className="grid grid-cols-3 gap-2">
                    {STATUSES.map((s) => (
                        <label key={s.id} className={`flex min-h-[52px] cursor-pointer items-center justify-center rounded-full border-[2.5px] border-[var(--mh-ink)] px-2 text-center font-extrabold transition-[transform,box-shadow,background-color] duration-150 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-[var(--mh-ink)] has-[:focus-visible]:ring-offset-2 ${status === s.id ? `${s.on} shadow-[0_3px_0_var(--mh-ink)]` : "bg-white hover:-translate-y-px hover:bg-[var(--mh-ticket)]"}`}>
                            <input type="radio" name="status" value={s.id} checked={status === s.id} onChange={() => setStatus(s.id)} className="sr-only" required />
                            {s.label}
                        </label>
                    ))}
                </div>
            </fieldset>
            {counting && (
                <div className="flex flex-col gap-3 rounded-[18px] border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-ticket)] p-[14px]">
                    <Counter label="כמה תהיו?" hint="כולל אתכם" name="people" value={people} min={1} max={MAX_PEOPLE} onChange={(v) => { setPeople(v); setKids((k) => Math.min(k, v)); }} />
                    {!kidsInvited ? null : kidsOpen ? (
                        <Counter label="מתוכם ילדים?" name="kids" value={kids} min={0} max={people} onChange={setKids} />
                    ) : (
                        <button type="button" onClick={() => setKidsOpen(true)} className="min-h-10 self-start font-extrabold underline">+ מתוכם ילדים?</button>
                    )}
                </div>
            )}
            {state?.error && <p role="alert" className="m-0 font-extrabold text-[var(--mh-danger)]">{state.error}</p>}
            <button disabled={pending || !status} className="min-h-[52px] w-full rounded-full border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-org-violet)] text-[18px] font-extrabold text-white shadow-[var(--mh-shadow)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:border-[#B8AFC7] disabled:bg-[#EDE6D6] disabled:text-[var(--mh-ink-soft)] disabled:shadow-none">
                {pending ? "שולחים…" : initial.status ? "לעדכן את התשובה" : "לשלוח תשובה"}
            </button>
        </form>
    );
}

function Counter({ label, hint, name, value, min, max, onChange }: { label: string; hint?: string; name: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
    const btn = "inline-flex h-11 w-11 items-center justify-center rounded-full border-[2.5px] border-[var(--mh-ink)] bg-white text-[22px] font-extrabold transition-transform duration-150 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)] focus-visible:ring-offset-2 disabled:opacity-40 disabled:hover:scale-100";
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="flex flex-col">
                <b className="text-[17px]">{label}</b>
                {hint && <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">{hint}</span>}
            </span>
            <span className="flex items-center gap-3">
                <button type="button" aria-label={`${label} פחות`} disabled={value <= min} onClick={() => onChange(value - 1)} className={btn}>−</button>
                <output aria-live="polite" className="min-w-[2ch] text-center font-display text-[24px]"><bdi>{value}</bdi></output>
                <button type="button" aria-label={`${label} יותר`} disabled={value >= max} onClick={() => onChange(value + 1)} className={btn}>+</button>
                <input type="hidden" name={name} value={value} />
            </span>
        </div>
    );
}
