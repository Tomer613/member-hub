"use client";

import { useState, useTransition } from "react";
import { deleteMessageDraft, remindUnread, type MessageResult } from "./actions";

const btn = "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] px-[18px] text-[15px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none disabled:opacity-60";

// "שליחת תזכורת ל-N שלא קראו" (board D-AdmMessages). Once per message.
export function RemindButton({ orgId, id, label, done }: { orgId: string; id: string; label: string; done: string | null }) {
    const [res, setRes] = useState<MessageResult | null>(null);
    const [busy, start] = useTransition();
    if (done) return <p role="status" className="m-0 text-[14px] font-bold text-[var(--mh-ink-soft)]">נשלחה תזכורת {done}. אפשר לשלוח תזכורת אחת לכל הודעה.</p>;
    return (
        <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={busy} onClick={() => start(async () => setRes(await remindUnread(orgId, id)))} className={`${btn} self-start bg-[var(--mh-sun)]`}>{busy ? "שולחים…" : label}</button>
            {res?.error && <span role="alert" className="font-extrabold text-[#B0182F]">{res.error}</span>}
            {res?.ok && <span role="status" className="font-extrabold">{res.ok}</span>}
        </div>
    );
}

export function DraftRemove({ orgId, id }: { orgId: string; id: string }) {
    const [sure, setSure] = useState(false);
    const [busy, start] = useTransition();
    if (!sure) return <button type="button" onClick={() => setSure(true)} className="min-h-11 rounded-full px-3 text-[14px] font-extrabold text-[#B0182F] underline">מחיקה</button>;
    return (
        <span className="flex items-center gap-1">
            <button type="button" disabled={busy} onClick={() => start(() => deleteMessageDraft(orgId, id))} className="min-h-11 rounded-full border-2 border-[#C4223B] bg-[#FFE9E6] px-3 text-[14px] font-extrabold text-[#B0182F]">למחוק?</button>
            <button type="button" onClick={() => setSure(false)} className="min-h-11 rounded-full px-2 text-[14px] font-bold underline">לא</button>
        </span>
    );
}
