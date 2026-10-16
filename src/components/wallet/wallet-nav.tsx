"use client";

import Link from "next/link";
import { useState } from "react";
import { JoinSheet } from "@/app/(app)/wallet/join-sheet";

// The main navigation (board D-Wallet): a bar fixed at the bottom on phones, a pill group in the header row
// on wide screens. The bell on "הודעות" counts what needs doing, like "דורש טיפול" on that screen.
export function WalletNav({ notes = 0 }: { notes?: number }) {
    const [open, setOpen] = useState(false);
    const tab = "flex min-h-12 items-center justify-center gap-[6px] rounded-full border-2 px-4 font-extrabold transition-[transform,background-color] duration-150 hover:-translate-y-px";
    return (
        <>
            <nav aria-label="ניווט ראשי" className="fixed inset-x-0 bottom-0 z-20 grid h-16 grid-cols-3 gap-2 border-t-2 border-[var(--mh-ink)] bg-white px-[14px] py-[7px] lg:static lg:order-last lg:flex lg:h-auto lg:self-center lg:gap-2 lg:rounded-full lg:border-2 lg:p-1 lg:shadow-[var(--mh-shadow)]">
                <span aria-current="page" className={`${tab} border-[var(--mh-ink)] bg-[var(--mh-sun)]`}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7h18v12H3zM3 7l2-3h14l2 3M16 13h2" /></svg>
                    ארנק
                </span>
                <button type="button" onClick={() => setOpen(true)} className={`${tab} border-transparent hover:bg-[var(--mh-ticket)]`}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3" /></svg>
                    חיפוש
                </button>
                <Link href="/notifications" aria-label={notes ? `הודעות, ${notes === 1 ? "אחת דורשת טיפול" : `${notes} דורשות טיפול`}` : undefined} className={`${tab} border-transparent hover:bg-[var(--mh-ticket)]`}>
                    <span className="relative inline-flex">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></svg>
                        {notes > 0 && <span aria-hidden="true" className="absolute -end-[9px] -top-[7px] inline-flex h-[20px] min-w-[20px] items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-org-orange)] px-1 text-[11px] leading-none"><bdi>{notes > 99 ? "99+" : notes}</bdi></span>}
                    </span>
                    הודעות
                </Link>
            </nav>
            <JoinSheet open={open} onClose={() => setOpen(false)} />
        </>
    );
}
