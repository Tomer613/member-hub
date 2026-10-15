"use client";

import { useState, useSyncExternalStore } from "react";

// A join link with a copy button. The path is completed with the address the site is opened from.
const noSubscribe = () => () => undefined;

export function CopyLink({ path, label = "קישור ההצטרפות" }: { path: string; label?: string }) {
    const origin = useSyncExternalStore(noSubscribe, () => window.location.origin, () => "");
    const url = `${origin}${path}`;
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* the field stays selectable */ }
    };
    return (
        <div className="flex items-center gap-2 rounded-[18px] border-[2.5px] border-[var(--mh-ink)] bg-white p-2 ps-4">
            <input readOnly value={url} dir="ltr" onFocus={(e) => e.target.select()} aria-label={label} className="min-w-0 flex-1 bg-transparent text-end font-extrabold outline-none" />
            <button type="button" onClick={copy} className={`inline-flex min-h-10 shrink-0 items-center rounded-full border-[2.5px] border-[var(--mh-ink)] bg-white px-4 font-extrabold shadow-[var(--mh-shadow)] hover:bg-[var(--mh-ticket)] active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)]`} aria-live="polite">{copied ? "הועתק" : "העתקה"}</button>
        </div>
    );
}

// Opens WhatsApp with a ready message and the full link, so the organizer only picks the group.
export function WhatsAppShare({ path, text }: { path: string; text: string }) {
    const origin = useSyncExternalStore(noSubscribe, () => window.location.origin, () => "");
    const href = `https://wa.me/?text=${encodeURIComponent(`${text}\n${origin}${path}`)}`;
    return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[var(--mh-hit)] items-center justify-center gap-2 rounded-full border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-ok)] px-[22px] font-extrabold shadow-[var(--mh-shadow)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)] focus-visible:ring-offset-2">
            לשלוח בווטסאפ
        </a>
    );
}
