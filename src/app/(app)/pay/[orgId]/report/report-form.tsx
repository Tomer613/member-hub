"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { reportPayment, type ReportState } from "../../actions";
import { NOTE_MAX, REPORT_METHODS } from "@/lib/billing/account";
import { primaryBtn } from "@/components/pay/parts";

// Shrinks a photo in the browser to at most 1200px and JPEG, so a confirmation fits without a file store.
async function shrink(file: File): Promise<string> {
    const img = await createImageBitmap(file);
    const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const q of [0.8, 0.6, 0.45]) {
        const url = canvas.toDataURL("image/jpeg", q);
        if (url.length < 400_000) return url;
    }
    throw new Error("too big");
}

export function ReportForm({ orgId, charges, today }: { orgId: string; charges: string; today: string }) {
    const [state, act] = useActionState<ReportState, FormData>(reportPayment, {});
    // The typed values come back on an error, since the form resets after every submit.
    const [method, setMethod] = useState(state.method ?? "bank");
    const [proof, setProof] = useState("");
    const [proofNote, setProofNote] = useState<string | null>(null);
    const file = useRef<HTMLInputElement>(null);
    const label = "text-[15px] font-extrabold";
    const field = "min-h-[52px] rounded-[14px] border-2 border-[var(--mh-ink)] bg-white px-3 text-[16px] font-bold";
    return (
        <form action={act} className="flex flex-1 flex-col gap-3">
            <input type="hidden" name="orgId" value={orgId} />
            <input type="hidden" name="charges" value={charges} />
            <input type="hidden" name="method" value={method} />
            <input type="hidden" name="proof" value={proof} />
            <span id="how" className={label}>איך שילמתם</span>
            <div role="radiogroup" aria-labelledby="how" className="flex flex-wrap gap-2">
                {REPORT_METHODS.map((m) => (
                    <button key={m.id} type="button" role="radio" aria-checked={method === m.id} onClick={() => setMethod(m.id)} className={`inline-flex min-h-10 items-center rounded-full border-2 border-[var(--mh-ink)] px-4 text-[15px] font-extrabold transition-colors ${method === m.id ? "bg-[var(--mh-ink)] text-white" : "bg-white hover:bg-[var(--mh-ticket)]"}`}>{m.label}</button>
                ))}
            </div>
            <label className="flex flex-col gap-1">
                <span className={label}>תאריך התשלום</span>
                <input type="date" name="date" dir="ltr" required max={today} defaultValue={state.date ?? today} className={`${field} text-start`} />
            </label>
            <label className="flex flex-col gap-1">
                <span className={label}>הערה (לא חובה)</span>
                <span className="text-[13px] font-bold text-[var(--mh-ink-soft)]">אל תכתבו כאן מידע רפואי או מזהה רגיש.</span>
                <textarea name="note" maxLength={NOTE_MAX} rows={3} defaultValue={state.note} placeholder="מספר אסמכתא או כל פרט שיעזור לארגון" className={`${field} py-2`} />
            </label>
            <input ref={file} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                    setProof(await shrink(f));
                    setProofNote(`צורף: ${f.name}`);
                } catch {
                    setProof("");
                    setProofNote("את התמונה לא הצלחנו לצרף. נסו תמונה אחרת.");
                }
            }} />
            <button type="button" onClick={() => file.current?.click()} className="flex min-h-[52px] items-center justify-center gap-2 rounded-[16px] border-2 border-dashed border-[var(--mh-ink)] bg-[var(--mh-ticket)] text-[15px] font-extrabold transition-transform hover:-translate-y-px">
                <span aria-hidden="true" className="text-[20px] leading-none">+</span>
                {proof ? "החלפת האישור" : "צירוף אישור (תמונה)"}
            </button>
            {proofNote && <p role="status" className="m-0 text-[14px] font-bold">{proofNote}</p>}
            {state.error && <p role="alert" className="m-0 text-[14px] font-extrabold text-[#B0182F]">{state.error}</p>}
            <span className="flex-1" />
            <Submit />
        </form>
    );
}

function Submit() {
    const { pending } = useFormStatus();
    return <button type="submit" disabled={pending} className={primaryBtn}>{pending ? "שולחים…" : "שליחת דיווח"}</button>;
}
