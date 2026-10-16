"use client";

import { useState, useTransition } from "react";
import { sendReminders, type BulkResult } from "./members/actions";

// "שליחת תזכורת" in "דורש טיפול" (board D-AdmOverview): a reminder to every member in debt, under the same
// rules as the members table (one a week per member, never about a disputed charge).
export function RemindAll({ orgId, linkIds }: { orgId: string; linkIds: string[] }) {
    const [res, setRes] = useState<BulkResult | null>(null);
    const [busy, start] = useTransition();
    return (
        <span className="flex flex-col items-end gap-1">
            <button type="button" disabled={busy || !!res?.ok} onClick={() => start(async () => setRes(await sendReminders(orgId, linkIds)))}
                className="inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-sun)] px-[18px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none disabled:opacity-60">
                {busy ? "שולחים…" : "שליחת תזכורת"}
            </button>
            {res?.ok && <span role="status" className="text-end text-[13px] font-bold">{res.ok}</span>}
            {res?.error && <span role="alert" className="text-end text-[13px] font-bold text-[#B0182F]">{res.error}</span>}
        </span>
    );
}
