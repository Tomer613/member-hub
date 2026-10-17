"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { bigBtn, bigBtnPlain } from "@/components/card/member-header";
import { signOff, signUp, type SignupResult } from "./actions";

// "להירשם" and "ביטול ההרשמה" on one activity. Cancelling asks once, in place.
export function SignupButton({ orgId, eventId, mine, full, paid }: { orgId: string; eventId: string; mine: boolean; full: boolean; paid: boolean }) {
    const [res, setRes] = useState<SignupResult | null>(null);
    const [asking, setAsking] = useState(false);
    const [busy, run] = useTransition();
    const go = (fn: typeof signUp) => run(async () => { setRes(await fn(orgId, eventId)); setAsking(false); });
    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
                {mine ? (
                    asking ? (
                        <>
                            <span className="font-extrabold">לבטל את ההרשמה?</span>
                            <button type="button" disabled={busy} onClick={() => go(signOff)} className={bigBtnPlain}>{busy ? "מבטלים…" : "כן, לבטל"}</button>
                            <button type="button" disabled={busy} onClick={() => setAsking(false)} className="min-h-11 px-2 font-extrabold underline underline-offset-4">לא</button>
                        </>
                    ) : (
                        <>
                            <span className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-[var(--mh-ink)] bg-[#D7F5E8] px-4 font-extrabold">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
                                אתם רשומים
                            </span>
                            <button type="button" onClick={() => { setAsking(true); setRes(null); }} className="min-h-11 px-2 font-extrabold underline underline-offset-4">ביטול ההרשמה</button>
                        </>
                    )
                ) : full ? (
                    <span className="inline-flex min-h-11 items-center rounded-full border-2 border-dashed border-[var(--mh-ink)] px-4 font-extrabold">כל המקומות נתפסו</span>
                ) : (
                    <button type="button" disabled={busy} onClick={() => go(signUp)} className={bigBtn}>{busy ? "נרשמים…" : paid ? "להירשם ולשלם" : "להירשם"}</button>
                )}
            </div>
            {res?.ok && <p role="status" className="m-0 font-bold text-[#00573A]">{res.ok}{res.pay && <> <Link href={`/pay/${orgId}`} className="underline">לתשלום</Link></>}</p>}
            {res?.error && <p role="alert" className="m-0 font-extrabold text-[#B0182F]">{res.error}</p>}
        </div>
    );
}
