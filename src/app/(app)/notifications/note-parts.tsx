"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { markAllRead, markRead } from "./actions";
import type { NoteFilter } from "@/lib/notifications";

const chip = (on: boolean) => `inline-flex h-11 shrink-0 items-center gap-2 rounded-full border-2 border-[var(--mh-ink)] px-[18px] font-extrabold transition-[transform,background-color] duration-150 hover:-translate-y-px ${on ? "bg-[var(--mh-ink)] text-white" : "bg-white hover:bg-[var(--mh-ticket)]"}`;

// The filter row (board D-Notifications): one choice at a time, "דורש טיפול" with its orange counter.
export function FilterBar({ filters, current, actions, org }: { filters: { id: NoteFilter; label: string }[]; current: NoteFilter; actions: number; org: string | null }) {
    const router = useRouter();
    const go = (f: NoteFilter) => router.replace(`/notifications?${new URLSearchParams({ ...(f === "all" ? {} : { f }), ...(org ? { org } : {}) })}`, { scroll: false });
    return (
        <div role="radiogroup" aria-label="סינון הודעות" className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
            {filters.map((f) => (
                <button key={f.id} type="button" role="radio" aria-checked={current === f.id} onClick={() => go(f.id)} className={chip(current === f.id)}>
                    {f.label}
                    {f.id === "action" && actions > 0 && <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-org-orange)] px-1 text-[12px] text-[var(--mh-ink)]"><bdi>{actions}</bdi></span>}
                </button>
            ))}
        </div>
    );
}

export function MarkAllRead({ org }: { org: string | null }) {
    const [busy, start] = useTransition();
    return (
        <button type="button" disabled={busy} onClick={() => start(() => markAllRead(org))} className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-[var(--mh-ink)] bg-white px-4 text-[15px] font-extrabold shadow-[0_3px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none disabled:opacity-60">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12l5 5L18 6M12 17l1 1 9-11" /></svg>
            סימון הכול כנקרא
        </button>
    );
}

export function MarkRead({ id }: { id: string }) {
    const [busy, start] = useTransition();
    return (
        <button type="button" disabled={busy} onClick={() => start(() => markRead(id))} className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-[var(--mh-ink)] bg-white px-4 text-[14px] font-extrabold transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] disabled:opacity-60">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
            סימון כנקרא
        </button>
    );
}
