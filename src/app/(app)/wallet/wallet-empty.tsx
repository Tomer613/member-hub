"use client";

import Link from "next/link";
import { useState } from "react";
import { CATEGORIES, JoinSheet } from "./join-sheet";

// Empty wallet (approved board D-WalletEmpty): two ways forward and the kinds of orgs people look for.
export function WalletEmpty({ openJoin }: { openJoin: boolean }) {
    const [open, setOpen] = useState(openJoin);
    const [packId, setPackId] = useState<string | undefined>();
    const art = [
        { c: "var(--mh-pastel-violet)", r: "-3deg", top: 0 },
        { c: "var(--mh-pastel-teal)", r: "2deg", top: 38 },
        { c: "var(--mh-pastel-orange)", r: "-1deg", top: 76 },
    ];
    return (
        <>
            <h2 className="m-0 text-[30px]">החברויות שלי</h2>
            <p className="m-0 font-bold">הכרטיס הראשון שלכם עוד מחכה בחוץ. בואו נמצא אותו.</p>
            <div className="relative h-[160px]" aria-hidden="true">
                {art.map((a, i) => (
                    <div key={i} className="absolute start-1/2 ms-[-130px] h-[76px] w-[260px] overflow-hidden rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-ticket)] shadow-[var(--mh-shadow)]" style={{ top: a.top, transform: `rotate(${a.r})` }}>
                        <div className="flex h-12 items-center gap-[10px] border-b-2 border-[var(--mh-ink)] px-3" style={{ background: a.c }}>
                            <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-white font-display">+</span>
                            <span className="h-[9px] max-w-[110px] flex-1 rounded bg-[var(--mh-ink)] opacity-85" />
                        </div>
                    </div>
                ))}
            </div>
            <button type="button" onClick={() => { setPackId(undefined); setOpen(true); }} className="min-h-[52px] rounded-full border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-sun)] text-[18px] font-extrabold shadow-[var(--mh-shadow)]">
                הצטרפות לארגון קיים
            </button>
            <Link href="/orgs/new" className="flex min-h-[52px] items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-white text-[17px] font-extrabold">
                הקמת ארגון חדש
            </Link>
            <h3 className="m-0 mt-2 text-[20px]">מה מחפשים?</h3>
            <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                    <button key={c.packId} type="button" onClick={() => { setPackId(c.packId); setOpen(true); }} className="min-h-11 rounded-full border-2 border-[var(--mh-ink)] bg-white px-4 font-extrabold">
                        {c.label}
                    </button>
                ))}
            </div>
            <p className="m-0 text-center text-[14px] font-bold">קיבלתם קישור הזמנה? פתחו אותו, והחברות תופיע כאן.</p>
            <JoinSheet open={open} onClose={() => setOpen(false)} packId={packId} />
        </>
    );
}
