"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { checkEntry, type EntryCheck } from "./actions";
import { useCamera } from "@/components/scan/use-camera";
import { Viewfinder } from "@/components/scan/viewfinder";

// The door: point at the code on the back of a member card. A clear green or red answer, then the next one.
export function DoorScanner({ orgId, orgName }: { orgId: string; orgName: string }) {
    const [result, setResult] = useState<EntryCheck | null>(null);
    const [checking, setChecking] = useState(false);
    const [count, setCount] = useState(0);
    const onCode = useCallback(
        async (code: string) => {
            setChecking(true);
            const r = await checkEntry(orgId, code);
            setChecking(false);
            setResult(r);
            if (r.ok) setCount((n) => n + 1);
        },
        [orgId],
    );
    const cam = useCamera(!result && !checking, (c) => void onCode(c));
    // The answer stays a few seconds, then the camera looks for the next card.
    useEffect(() => {
        if (!result) return;
        const t = window.setTimeout(() => setResult(null), result.ok ? 3000 : 5000);
        return () => window.clearTimeout(t);
    }, [result]);
    return (
        <main className="min-h-dvh overflow-x-clip bg-[var(--mh-ink)] text-white">
            <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col gap-4 px-4 py-[18px] lg:justify-center lg:[zoom:1.15] min-[1800px]:[zoom:1.5]">
                <header className="flex items-center gap-3">
                    <Link href={`/orgs/${orgId}`} aria-label="חזרה לסקירה" className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-white text-[var(--mh-ink)] transition-transform hover:-translate-y-px">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
                    </Link>
                    <span className="flex min-w-0 flex-col">
                        <h1 className="m-0 font-display text-[26px] font-normal leading-tight">סריקה בכניסה</h1>
                        <span className="truncate text-[14px] font-bold text-white/75">{orgName}</span>
                    </span>
                </header>
                {result ? (
                    <section role="alert" className={`scan-pop flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-[24px] border-[3px] p-6 text-center text-[var(--mh-ink)] ${result.ok ? "border-[#00573A] bg-[#D7F5E8]" : "border-[#9B1028] bg-[#FFDCD3]"}`}>
                        <span aria-hidden="true" className={`inline-flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-[var(--mh-ink)] ${result.ok ? "bg-[#00B67A]" : "bg-[#FF5A36]"} text-white`}>
                            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d={result.ok ? "M5 12l5 5L20 7" : "M6 6l12 12M18 6L6 18"} /></svg>
                        </span>
                        <b className="font-display text-[30px] font-normal leading-tight">{result.ok ? "בתוקף" : "לא בתוקף"}</b>
                        {result.ok ? (
                            <p className="m-0 text-[20px] font-extrabold"><bdi>{result.name}</bdi> · {result.role}</p>
                        ) : (
                            <p className="m-0 text-[17px] font-bold">{result.reason}</p>
                        )}
                        <button type="button" onClick={() => setResult(null)} className="mt-2 inline-flex min-h-12 items-center rounded-full border-[2.5px] border-[var(--mh-ink)] bg-white px-6 text-[16px] font-extrabold shadow-[0_3px_0_var(--mh-ink)]">לסריקה הבאה</button>
                    </section>
                ) : (
                    <>
                        <Viewfinder video={cam.video} state={cam.state} label="המצלמה, מחפשת קוד כניסה" />
                        <p role="status" className="m-0 text-center text-[15px] font-semibold text-white/85">{checking ? "בודקים…" : "מכוונים אל קוד הכניסה בגב כרטיס החבר. הקוד מתחלף כל דקה, ולכן צילום מסך לא יעבור."}</p>
                    </>
                )}
                <div className="flex items-center justify-between gap-3">
                    <button type="button" aria-label="פנס" aria-pressed={cam.torch} aria-disabled={!cam.torchable} onClick={() => cam.torchable && cam.setTorch(!cam.torch)}
                        className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white aria-disabled:opacity-40 ${cam.torch ? "bg-[var(--mh-sun)] text-[var(--mh-ink)]" : "text-white"}`}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 2h10l-2 6H9zM9 8h6v13H9zM12 12v3" /></svg>
                    </button>
                    <span className="text-[15px] font-bold">נכנסו בסריקה הזו: <bdi>{count}</bdi></span>
                </div>
            </div>
        </main>
    );
}
