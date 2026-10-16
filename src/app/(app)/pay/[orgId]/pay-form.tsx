"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { payNow, type PayState } from "../actions";
import { Hint, LOCK, primaryBtn } from "@/components/pay/parts";
import type { SavedMethod } from "@/lib/payments/provider";

const CARD = "M2 6h20v12H2zM2 10h20M6 15h4";

// The payment method row, its bottom sheet (board D-PayOrgSheet), and the pay button (board D-PayCharge).
export function PayForm({ orgId, charges, total, methods, mode, openSheet }: { orgId: string; charges: string; total: string; methods: SavedMethod[]; mode: "test" | "off"; openSheet: boolean }) {
    const [state, act] = useActionState<PayState, FormData>(payNow, {});
    const [method, setMethod] = useState(methods[0]?.id ?? "");
    const [sheet, setSheet] = useState(openSheet && methods.length > 1);
    const chosen = methods.find((m) => m.id === method);
    return (
        <form action={act} className="flex flex-1 flex-col gap-3">
            <input type="hidden" name="orgId" value={orgId} />
            <input type="hidden" name="charges" value={charges} />
            <input type="hidden" name="method" value={method} />
            <h2 className="m-0 text-[17px] font-extrabold">אמצעי תשלום</h2>
            {chosen ? (
                <button type="button" onClick={() => setSheet(true)} aria-haspopup="dialog" className="group flex min-h-[60px] items-center gap-3 rounded-[16px] border-2 border-[var(--mh-ink)] bg-white px-[14px] text-start transition-transform duration-150 hover:-translate-y-px">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-ticket)]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={CARD} /></svg>
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                        <bdi className="text-[16px] font-extrabold">{chosen.label}</bdi>
                        <span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">{chosen.id === methods[0].id ? `ברירת מחדל · ${chosen.sub}` : chosen.sub}</span>
                    </span>
                    <span className="text-[15px] font-extrabold">שינוי</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform duration-200 group-hover:-translate-x-[3px]"><path d="M15 6l-6 6 6 6" /></svg>
                </button>
            ) : (
                <p className="m-0 rounded-[16px] border-2 border-[var(--mh-ink)] bg-white p-[14px] text-[15px] font-bold">תשלום בכרטיס ייפתח כשנחבר את ספק התשלומים. בינתיים אפשר לשלם לארגון ישירות ולדווח כאן.</p>
            )}
            {mode === "test" && chosen && <p className="m-0 text-[13px] font-bold text-[var(--mh-ink-soft)]">מצב בדיקה: לא עובר כסף אמיתי.</p>}
            {state.error && <p role="alert" className="m-0 text-[14px] font-extrabold text-[#B0182F]">{state.error}</p>}
            <span className="flex-1" />
            <PayButton total={total} disabled={!chosen} />
            <Hint icon={LOCK}>התשלום מאובטח ועובר לקופת הארגון</Hint>
            <Link href={`/pay/${orgId}/report?c=${charges}`} className="mx-auto inline-flex min-h-11 items-center text-[15px] font-extrabold underline underline-offset-4">שילמתי מחוץ לאפליקציה</Link>
            {sheet && <MethodSheet methods={methods} value={method} onClose={() => setSheet(false)} onSave={(id) => { setMethod(id); setSheet(false); }} />}
        </form>
    );
}

function PayButton({ total, disabled }: { total: string; disabled: boolean }) {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={disabled || pending} aria-disabled={disabled || pending} className={primaryBtn}>
            {pending ? "מעבירים את התשלום…" : <>לתשלום{" "}<bdi>{total}</bdi></>}
        </button>
    );
}

function MethodSheet({ methods, value, onClose, onSave }: { methods: SavedMethod[]; value: string; onClose: () => void; onSave: (id: string) => void }) {
    const [pick, setPick] = useState(value);
    const box = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const prev = document.activeElement as HTMLElement | null;
        box.current?.querySelector<HTMLElement>("[aria-checked=true]")?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key !== "Tab" || !box.current) return;
            // Keep the focus inside the sheet while it is open.
            const f = [...box.current.querySelectorAll<HTMLElement>("button")];
            if (!f.length) return;
            if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
            else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
        };
        document.addEventListener("keydown", onKey);
        return () => { document.removeEventListener("keydown", onKey); prev?.focus(); };
    }, [onClose]);
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(30,22,51,.55)] lg:items-center" onClick={onClose}>
            <div ref={box} role="dialog" aria-modal="true" aria-label="אמצעי תשלום" onClick={(e) => e.stopPropagation()} className="pay-sheet flex w-full max-w-[480px] flex-col gap-3 rounded-t-[24px] border-t-[2.5px] border-[var(--mh-ink)] bg-white px-4 pb-6 pt-3 lg:rounded-[24px] lg:border-[2.5px]">
                <span className="mx-auto h-[5px] w-11 rounded-full bg-[var(--mh-ink)] opacity-35 lg:hidden" aria-hidden="true" />
                <h2 className="m-0 font-display text-[20px] font-normal">אמצעי תשלום</h2>
                <div role="radiogroup" aria-label="אמצעי תשלום" className="flex flex-col gap-2">
                    {methods.map((m, i) => {
                        const on = m.id === pick;
                        return (
                            <button key={m.id} type="button" role="radio" aria-checked={on} onClick={() => setPick(m.id)} className={`flex min-h-[60px] items-center gap-3 rounded-[16px] border-2 border-[var(--mh-ink)] px-[14px] text-start transition-colors ${on ? "bg-[var(--mh-sun)] shadow-[0_3px_0_var(--mh-ink)]" : "bg-white hover:bg-[var(--mh-ticket)]"}`}>
                                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-white">{on && <span className="h-3 w-3 rounded-full bg-[var(--mh-ink)]" />}</span>
                                <span className="flex flex-col">
                                    <bdi className="text-[16px] font-extrabold">{m.label}</bdi>
                                    <span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">{i === 0 ? `ברירת מחדל · ${m.sub}` : m.sub}</span>
                                </span>
                            </button>
                        );
                    })}
                </div>
                <button type="button" onClick={() => onSave(pick)} className={primaryBtn}>שמירה</button>
            </div>
        </div>
    );
}
