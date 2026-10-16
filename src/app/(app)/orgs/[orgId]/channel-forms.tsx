"use client";

import { useActionState, useState } from "react";
import { POST_BODY_MAX, POST_TITLE_MAX } from "@/lib/reactions";
import { MAX_OPTIONS, QUESTION_MAX, type Question } from "@/lib/celebration";
import { publishPost, saveLinks, saveQuestion } from "./actions";

const field = "min-h-[var(--mh-hit)] w-full rounded-[14px] border-2 border-[var(--mh-ink)] bg-white px-[14px] font-semibold outline-none placeholder:text-[var(--mh-ink-soft)] focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)]";
const btn = "inline-flex min-h-11 items-center justify-center self-start rounded-full border-[2.5px] border-[var(--mh-ink)] px-5 font-extrabold shadow-[var(--mh-shadow)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none disabled:opacity-60";

// A new update (board D-AdmCompose, trimmed for a celebration: everyone who replied gets it).
export function Compose({ orgId }: { orgId: string }) {
    const [state, action, pending] = useActionState(publishPost.bind(null, orgId), undefined);
    // The form clears itself after a publish (React form actions); the fields' own checks catch most mistakes first.
    return (
        <form action={action} className="flex flex-col gap-3">
            <label className="flex flex-col gap-2">
                <span className="text-[14px] font-extrabold">כותרת</span>
                <input name="title" required minLength={2} maxLength={POST_TITLE_MAX} placeholder="למשל: שינוי בשעה" className={field} />
            </label>
            <label className="flex flex-col gap-2">
                <span className="text-[14px] font-extrabold">העדכון</span>
                <textarea name="body" required rows={4} maxLength={POST_BODY_MAX} placeholder="מה האורחים צריכים לדעת?" className={`${field} py-3`} />
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 font-extrabold">
                <input type="checkbox" name="pinned" className="h-5 w-5 accent-[var(--mh-org-violet)]" />
                להציג גם בראש ההזמנה <span className="font-semibold text-[var(--mh-ink-soft)]">(לשינוי חשוב, כמו שעה או מקום)</span>
            </label>
            <details className="group">
                <summary className="min-h-10 cursor-pointer content-center font-extrabold underline marker:content-none">אפשרויות תגובה</summary>
                <div className="flex flex-col gap-1 pt-1">
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 font-semibold">
                        <input type="checkbox" name="reactable" defaultChecked className="h-5 w-5 accent-[var(--mh-org-violet)]" />
                        לאפשר תגובות באייקון
                    </label>
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 font-semibold">
                        <input type="checkbox" name="dislike" defaultChecked className="h-5 w-5 accent-[var(--mh-org-violet)]" />
                        לאפשר ״לא אהבתי״
                    </label>
                </div>
            </details>
            {state?.error && <p role="alert" className="m-0 font-extrabold text-[var(--mh-danger)]">{state.error}</p>}
            {state?.ok && <p role="status" className="m-0 font-extrabold">העדכון פורסם.</p>}
            <button disabled={pending} className={`${btn} bg-[var(--mh-org-violet)] text-white`}>{pending ? "מפרסמים…" : "לפרסם"}</button>
        </form>
    );
}

export function Links({ orgId, whatsapp, album }: { orgId: string; whatsapp: string | null; album: string | null }) {
    const [state, action, pending] = useActionState(saveLinks.bind(null, orgId), undefined);
    return (
        <form action={action} className="flex flex-col gap-3">
            <label className="flex flex-col gap-2">
                <span className="text-[14px] font-extrabold">קישור לקבוצת הווטסאפ <span className="font-semibold text-[var(--mh-ink-soft)]">(לא חובה)</span></span>
                <input name="whatsapp" defaultValue={whatsapp ?? ""} dir="ltr" inputMode="url" placeholder="https://chat.whatsapp.com/..." className={`${field} text-end`} />
            </label>
            <label className="flex flex-col gap-2">
                <span className="text-[14px] font-extrabold">קישור לאלבום תמונות משותף <span className="font-semibold text-[var(--mh-ink-soft)]">(לא חובה)</span></span>
                <input name="album" defaultValue={album ?? ""} dir="ltr" inputMode="url" placeholder="https://" className={`${field} text-end`} />
                <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">אלבום בגוגל, באייפון או בכל שירות. התמונות נשארות שם.</span>
            </label>
            {state?.error && <p role="alert" className="m-0 font-extrabold text-[var(--mh-danger)]">{state.error}</p>}
            {state?.ok && <p role="status" className="m-0 font-extrabold">נשמר. האורחים שענו יראו את הכפתורים.</p>}
            <button disabled={pending} className={`${btn} bg-white`}>{pending ? "שומרים…" : "לשמור"}</button>
        </form>
    );
}

// "שאלה משלכם": the question and whether guests answer freely or pick one of a few options.
export function QuestionForm({ orgId, question }: { orgId: string; question: Question | null }) {
    const [state, action, pending] = useActionState(saveQuestion.bind(null, orgId), undefined);
    const [kind, setKind] = useState<"free" | "options">(question?.options.length ? "options" : "free");
    const choice = (id: "free" | "options", label: string) => (
        <label className={`flex min-h-11 cursor-pointer items-center justify-center rounded-full border-2 border-[var(--mh-ink)] px-3 text-center font-extrabold has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-[var(--mh-ink)] has-[:focus-visible]:ring-offset-2 ${kind === id ? "bg-[var(--mh-sun)] shadow-[0_2px_0_var(--mh-ink)]" : "bg-white hover:bg-[var(--mh-ticket)]"}`}>
            <input type="radio" checked={kind === id} onChange={() => setKind(id)} className="sr-only" />
            {label}
        </label>
    );
    return (
        <form action={action} className="flex flex-col gap-3">
            <label className="flex flex-col gap-2">
                <span className="text-[14px] font-extrabold">השאלה</span>
                <input name="text" required minLength={3} maxLength={QUESTION_MAX} defaultValue={state?.text ?? question?.text ?? ""} placeholder="למשל: מה תרצו לאכול?" className={field} />
            </label>
            <div role="radiogroup" aria-label="איך עונים" className="grid grid-cols-2 gap-2">
                {choice("free", "תשובה חופשית")}
                {choice("options", "בחירה מאפשרויות")}
            </div>
            {kind === "options" && (
                <label className="flex flex-col gap-2">
                    <span className="text-[14px] font-extrabold">האפשרויות <span className="font-semibold text-[var(--mh-ink-soft)]">(כל אחת בשורה, עד {MAX_OPTIONS})</span></span>
                    <textarea name="options" rows={4} defaultValue={state?.options ?? question?.options.join("\n") ?? ""} placeholder={"בשרי\nצמחוני\nטבעוני"} className={`${field} py-3`} />
                </label>
            )}
            <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">רק מי שעונה ״מגיע״ או ״אולי״ רואה את השאלה, ולא חייבים לענות.</span>
            {state?.error && <p role="alert" className="m-0 font-extrabold text-[var(--mh-danger)]">{state.error}</p>}
            <button disabled={pending} className={`${btn} bg-white`}>{pending ? "שומרים…" : "לשמור את השאלה"}</button>
        </form>
    );
}
