"use client";

import { useState } from "react";

// Language switch. Only Hebrew exists for now; a tap says so instead of doing nothing.
export default function LangButton() {
    const [open, setOpen] = useState(false);
    return (
        <button type="button" className={`lang${open ? " open" : ""}`} aria-expanded={open} onClick={() => setOpen((o) => !o)} onBlur={() => setOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>
            עברית
            <span className="more" aria-live="polite">{open ? "אנגלית, ערבית ועוד: בקרוב" : "English · العربية · ועוד"}</span>
        </button>
    );
}
