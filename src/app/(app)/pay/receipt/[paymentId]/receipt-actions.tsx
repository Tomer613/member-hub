"use client";

import { useState, useTransition } from "react";
import { emailReceipt } from "../../actions";
import { primaryBtn, smallBtn } from "@/components/pay/parts";

// "הורדה כ-PDF" opens the print dialog, where every browser offers "save as PDF"; the page prints as the
// receipt alone. Sharing uses the phone's share sheet, or copies the link where there is none.
export function ReceiptActions({ paymentId, title }: { paymentId: string; title: string }) {
    const [note, setNote] = useState<string | null>(null);
    const [busy, start] = useTransition();
    const share = async () => {
        const url = window.location.href.split("?")[0];
        try {
            if (navigator.share) await navigator.share({ title, url });
            else {
                await navigator.clipboard.writeText(url);
                setNote("הקישור הועתק. רק מי שמחובר לחשבון שלך יוכל לפתוח אותו.");
            }
        } catch {
            /* closed the share sheet */
        }
    };
    return (
        <div className="flex flex-col gap-3 print:hidden">
            <button type="button" onClick={() => window.print()} className={primaryBtn}>הורדה כ-PDF</button>
            <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy} onClick={() => start(async () => setNote((await emailReceipt(paymentId)).message))} className={smallBtn}>שליחה למייל</button>
                <button type="button" onClick={share} className={smallBtn}>שיתוף</button>
            </div>
            {note && <p role="status" className="m-0 text-[14px] font-extrabold">{note}</p>}
        </div>
    );
}
