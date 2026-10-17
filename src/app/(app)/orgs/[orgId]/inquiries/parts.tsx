"use client";

import { useState, useTransition } from "react";
import { BODY_MAX } from "@/lib/inquiries";
import { answerInquiry } from "./actions";

const btn = "inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] px-[18px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none";

// The answer box under an inquiry (board D-AdmInquiry): an answer the member sees, or an internal note.
export function Composer({ orgId, id, signer }: { orgId: string; id: string; signer: string }) {
    const [body, setBody] = useState("");
    const [internal, setInternal] = useState(false);
    const [res, setRes] = useState<{ error?: string; ok?: string } | null>(null);
    const [busy, start] = useTransition();
    const go = (close: boolean) => start(async () => {
        const r = await answerInquiry(orgId, id, { body, internal, close });
        setRes(r);
        if (r.ok) setBody("");
    });
    return (
        <form className={`flex flex-col gap-3 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] p-4 shadow-[0_3px_0_var(--mh-ink)] md:p-5 ${internal ? "border-dashed bg-[#FFF6D1]" : "bg-white"}`} onSubmit={(e) => { e.preventDefault(); go(false); }}>
            <label className="flex flex-col gap-2">
                <span className="flex items-baseline justify-between gap-2">
                    <span className="text-[16px] font-extrabold">{internal ? "הערה פנימית" : "תשובה"}</span>
                    <span className="text-[13px] font-bold text-[var(--mh-ink-soft)]"><bdi>{[...body].length}</bdi> מתוך {BODY_MAX}</span>
                </span>
                <textarea value={body} onChange={(e) => { setBody(e.target.value); setRes(null); }} rows={4} maxLength={BODY_MAX} placeholder={internal ? "רק מנהלים יראו את ההערה" : "כתבו כאן את התשובה…"}
                    className="w-full rounded-[14px] border-2 border-[var(--mh-ink)] bg-white px-[14px] py-3 font-semibold outline-none placeholder:text-[var(--mh-ink-soft)] focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)]" />
            </label>
            <p className="m-0 rounded-[14px] bg-[#FFF1D6] p-3 text-[14px] font-bold">{internal ? "החבר לא רואה הערות פנימיות. הן נשמרות עם השם שלכם." : "אל תכתבו כאן מידע רפואי או מזהה רגיש. החבר יראה את התשובה בפניות שלו, עם השם הפרטי והתפקיד שלכם."}</p>
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-[14px] font-bold text-[var(--mh-ink-soft)]">{internal ? "כותבים בשם:" : "משיבים בשם:"} <b className="text-[var(--mh-ink)]">{signer}</b></span>
                <label className="ms-auto flex min-h-11 cursor-pointer items-center gap-2 font-extrabold">
                    <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} className="h-5 w-5 accent-[var(--mh-ink)]" />
                    הערה פנימית
                </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={busy || !body.trim()} className={`${btn} bg-[var(--mh-sun)]`}>{busy ? "שולחים…" : internal ? "שמירת ההערה" : "שליחת תשובה"}</button>
                <button type="button" disabled={busy} onClick={() => go(true)} className={`${btn} bg-white`}>{body.trim() && !internal ? "שליחה וסגירה" : "סגירת הפנייה"}</button>
                {res?.ok && <span role="status" className="font-bold text-[#00573A]">{res.ok}</span>}
                {res?.error && <span role="alert" className="font-extrabold text-[#B0182F]">{res.error}</span>}
            </div>
        </form>
    );
}
