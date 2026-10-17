"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { formatShekels } from "@/lib/money";
import { dedicate } from "./actions";

// The gabbai's dedications as cards to choose from, and one button.
export function DedicateForm({ orgId, yid, items, color, ink }: { orgId: string; yid: string; items: { label: string; priceMinor: number }[]; color: string; ink: string }) {
    const router = useRouter();
    const [pick, setPick] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [busy, run] = useTransition();
    const go = () => run(async () => {
        const r = await dedicate(orgId, yid, pick);
        if (r.error) setError(r.error);
        else router.push(`/pay/${orgId}`);
    });
    return (
        <form className="flex flex-col gap-3 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_3px_0_var(--mh-ink)] md:p-5" onSubmit={(e) => { e.preventDefault(); go(); }}>
            <fieldset disabled={busy} className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
                <legend className="mb-2 p-0 font-display text-[20px]">מה להקדיש</legend>
                <div className="grid grid-cols-[minmax(0,1fr)] gap-2 md:grid-cols-2">
                    {items.map((x, i) => (
                        <label key={i} className={`flex cursor-pointer items-center gap-3 rounded-[16px] border-2 border-[var(--mh-ink)] p-3 transition-[background-color,transform] duration-150 hover:-translate-y-px ${pick === i ? "bg-[var(--mh-tint-sun)]" : "bg-white hover:bg-[var(--mh-ticket)]"}`}>
                            <input type="radio" name="d" checked={pick === i} onChange={() => { setPick(i); setError(null); }} className="size-[18px] shrink-0 accent-[var(--mh-ink)]" />
                            <b className="min-w-0 flex-1 leading-tight">{x.label}</b>
                            <bdi className="font-extrabold">{formatShekels(x.priceMinor)}</bdi>
                        </label>
                    ))}
                </div>
            </fieldset>
            <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={busy} className="inline-flex min-h-12 items-center justify-center rounded-full border-[2.5px] border-[var(--mh-ink)] px-6 text-[17px] font-extrabold shadow-[0_3px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none disabled:opacity-60" style={{ background: color, color: ink }}>
                    {busy ? "רושמים…" : <>להקדשה · <bdi>{formatShekels(items[pick]?.priceMinor ?? 0)}</bdi></>}
                </button>
                <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">החיוב יופיע בכרטיס, ומשם משלמים.</span>
            </div>
            {error && <p role="alert" className="m-0 font-extrabold text-[#B0182F]">{error}</p>}
        </form>
    );
}
