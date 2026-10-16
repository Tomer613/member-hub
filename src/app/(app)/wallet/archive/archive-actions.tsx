"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { deleteCard, unhideCard } from "../arrange-actions";

const small = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 px-4 text-[15px] font-extrabold transition-transform hover:-translate-y-px";

// "החזרה לארנק" for a hidden card, and "מחיקה" with its confirmation (board D-WalletDelete).
export function ArchiveActions({ linkId, orgName, canRestore }: { linkId: string; orgName: string; canRestore: boolean }) {
    const [asking, setAsking] = useState(false);
    const [busy, start] = useTransition();
    return (
        <span className="flex flex-wrap gap-2">
            {canRestore && <button type="button" disabled={busy} onClick={() => start(() => unhideCard(linkId))} className={`${small} border-[var(--mh-ink)] bg-white`}>החזרה לארנק</button>}
            <button type="button" onClick={() => setAsking(true)} className={`${small} border-[#C4223B] bg-white text-[#C4223B]`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
                מחיקה
            </button>
            {asking && <DeleteDialog linkId={linkId} orgName={orgName} onClose={() => setAsking(false)} />}
        </span>
    );
}

function DeleteDialog({ linkId, orgName, onClose }: { linkId: string; orgName: string; onClose: () => void }) {
    const [wipe, setWipe] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [busy, start] = useTransition();
    const box = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const prev = document.activeElement as HTMLElement | null;
        box.current?.querySelector<HTMLElement>("[aria-checked=true]")?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key !== "Tab" || !box.current) return;
            const f = [...box.current.querySelectorAll<HTMLElement>("button")];
            if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
            else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
        };
        document.addEventListener("keydown", onKey);
        return () => { document.removeEventListener("keydown", onKey); prev?.focus(); };
    }, [onClose]);
    const options = [
        { on: false, title: "מחיקת הכרטיס בלבד", sub: "הכרטיס יוסר מהארנק שלכם. הארגון ממשיך להחזיק את הפרטים שלכם, ואפשר להצטרף שוב." },
        { on: true, title: "מחיקת הכרטיס והסרת המידע שלי", sub: "הארגון יסיר את הפרטים האישיים שלכם. נתונים שהחוק מחייב לשמור, כמו קבלות ותשלומים, יישמרו לתקופה הנדרשת וימחקו בסופה." },
    ];
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(30,22,51,0.6)] px-4" onClick={onClose}>
            <div ref={box} role="alertdialog" aria-modal="true" aria-labelledby={`del-${linkId}`} onClick={(e) => e.stopPropagation()} className="pay-sheet flex w-full max-w-[460px] flex-col gap-3 rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-white p-5 shadow-[0_5px_0_var(--mh-ink)]">
                <h2 id={`del-${linkId}`} className="m-0 font-display text-[22px] font-normal">למחוק את {orgName}?</h2>
                <div role="radiogroup" aria-label="מה למחוק" className="flex flex-col gap-2">
                    {options.map((o) => (
                        <button key={o.title} type="button" role="radio" aria-checked={wipe === o.on} onClick={() => setWipe(o.on)} className={`flex items-start gap-3 rounded-[16px] border-2 border-[var(--mh-ink)] p-3 text-start ${wipe === o.on ? "bg-[var(--mh-sun)] shadow-[0_3px_0_var(--mh-ink)]" : "bg-white hover:bg-[var(--mh-ticket)]"}`}>
                            <span className="mt-[2px] inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-white">{wipe === o.on && <span className="h-3 w-3 rounded-full bg-[var(--mh-ink)]" />}</span>
                            <span className="flex flex-col"><b>{o.title}</b><span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">{o.sub}</span></span>
                        </button>
                    ))}
                </div>
                {error && <p role="alert" className="m-0 font-extrabold text-[#B0182F]">{error}</p>}
                <div className="grid grid-cols-2 gap-2">
                    <button type="button" disabled={busy} onClick={() => start(async () => { const r = await deleteCard(linkId, wipe); if (r.error) setError(r.error); else onClose(); })} className="min-h-12 rounded-full border-2 border-[var(--mh-ink)] bg-[#C4223B] font-extrabold text-white transition-transform hover:-translate-y-px disabled:opacity-60">{busy ? "מוחקים…" : "מחיקה"}</button>
                    <button type="button" onClick={onClose} className="min-h-12 rounded-full border-2 border-[var(--mh-ink)] bg-white font-extrabold transition-transform hover:-translate-y-px">ביטול</button>
                </div>
            </div>
        </div>
    );
}
