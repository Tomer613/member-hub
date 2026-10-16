"use client";

import { useRef, useState } from "react";
import { LOGO_MIN_PX } from "@/lib/org-setup";

// The org's color names and logo picker, shared by the setup wizard and "מראה וצבע" in the org settings.
export const COLOR_NAMES: Record<string, string> = {
    "#5B3DF5": "סגול", "#FF5A36": "כתום", "#00B67A": "ירוק", "#FF5C9E": "ורוד", "#18B8F0": "תכלת", "#1E1633": "כהה",
};

const pill = "inline-flex min-h-[var(--mh-hit)] items-center justify-center gap-2 rounded-full border-[2.5px] border-[var(--mh-ink)] px-[22px] font-extrabold shadow-[var(--mh-shadow)] transition-[transform,box-shadow,background-color] duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:translate-y-0 disabled:border-[#B8AFC7] disabled:bg-[#EDE6D6] disabled:text-[var(--mh-ink-soft)] disabled:shadow-none";
const secondary = `${pill} bg-white text-[var(--mh-ink)] hover:bg-[var(--mh-ticket)]`;
const label = "text-[14px] font-extrabold";

// The logo is cropped to a square in the browser and saved at 256x256, so any photo works as long as
// it is big enough. Smaller than 256 pixels would look blurry on the card.
export function LogoPicker({ logo, onChange }: { logo: string | null; onChange: (v: string | null) => void }) {
    const input = useRef<HTMLInputElement>(null);
    const [error, setError] = useState("");
    const pick = (file: File | undefined) => {
        setError("");
        if (!file) return;
        if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return setError("אפשר להעלות תמונה מסוג PNG, JPG או WEBP");
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            const side = Math.min(img.naturalWidth, img.naturalHeight);
            if (side < LOGO_MIN_PX) return setError("התמונה קטנה מדי. צריך לפחות 256 פיקסלים בכל צד");
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = LOGO_MIN_PX;
            const ctx = canvas.getContext("2d");
            if (!ctx) return setError("הלוגו לא נקלט. נסו קובץ אחר");
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, LOGO_MIN_PX, LOGO_MIN_PX);
            ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, LOGO_MIN_PX, LOGO_MIN_PX);
            onChange(canvas.toDataURL("image/webp", 0.9));
        };
        img.onerror = () => { URL.revokeObjectURL(url); setError("הלוגו לא נקלט. נסו קובץ אחר"); };
        img.src = url;
    };
    return (
        <div className="flex flex-col gap-2">
            <span className={label}>לוגו <span className="font-semibold text-[var(--mh-ink-soft)]">(לא חובה)</span></span>
            <div className="flex flex-wrap items-center gap-3">
                {logo && (
                    // eslint-disable-next-line @next/next/no-img-element -- inline data URL
                    <img src={logo} alt="הלוגו שנבחר" className="h-14 w-14 rounded-full border-[2.5px] border-[var(--mh-ink)] object-cover" />
                )}
                <button type="button" onClick={() => input.current?.click()} className={secondary}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                    {logo ? "להחליף לוגו" : "להוסיף לוגו"}
                </button>
                {logo && <button type="button" onClick={() => onChange(null)} className="min-h-10 font-extrabold underline">להסיר</button>}
                <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
            </div>
            <span className={`text-[14px] font-semibold ${error ? "font-extrabold text-[var(--mh-danger)]" : "text-[var(--mh-ink-soft)]"}`} role={error ? "alert" : undefined}>
                {error || "בלי לוגו, הכרטיס מציג את האות הראשונה של השם. מרובע, לפחות 256 פיקסלים."}
            </span>
        </div>
    );
}
