"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LoginFlow } from "@/app/(auth)/login/login-flow";

// The "מתחילים כאן" panel. Choosing join / open / sign in swaps the panel for the sign-in flow in place
// (Tommy, 14.10.2026: no jump to another page). Any link on the page marked data-start="join|open|login"
// opens the same panel, so the sticky bar and the lower sections lead here too. Without JavaScript the
// links still go to /login.

type Mode = "join" | "open" | "login";
const isMode = (v: string | undefined): v is Mode => v === "join" || v === "open" || v === "login";

export default function EntryPanel() {
    const [mode, setMode] = useState<Mode | null>(null);
    const box = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            const a = (e.target as Element | null)?.closest<HTMLElement>("[data-start]");
            const next = a?.dataset.start;
            if (!a || !isMode(next)) return;
            e.preventDefault();
            setMode(next);
            // From further down the page, bring the panel into view.
            if (!box.current?.contains(a)) box.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        };
        // Capture phase, so this runs before next/link navigates (it skips clicks that are already handled).
        document.addEventListener("click", onClick, true);
        return () => document.removeEventListener("click", onClick, true);
    }, []);

    // Move focus to the new content so keyboard and screen reader users follow the swap (not on first load).
    const shown = useRef<Mode | null>(null);
    useEffect(() => {
        if (shown.current === mode) return;
        shown.current = mode;
        box.current?.querySelector<HTMLElement>(mode ? "input" : "[data-start]")?.focus({ preventScroll: true });
    }, [mode]);

    return (
        <div ref={box} className="entry-box">
            {mode ? (
                <div className="entry-flow" key={mode}>
                    <button type="button" className="entry-back" onClick={() => setMode(null)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
                        חזרה
                    </button>
                    <LoginFlow flow={{ intent: mode === "login" ? null : mode }} inviteOrg={null} embedded />
                </div>
            ) : (
                <div className="panel">
                    <h3>מתחילים כאן</h3>
                    <p>בלי סיסמה. נשלח קוד לטלפון או למייל.</p>
                    <Link href="/login?intent=join" data-start="join" className="btn pri">להצטרף לארגון<small>לארגון שלכם, או לגלות קהילות ומועדונים חדשים</small></Link>
                    <Link href="/login?intent=open" data-start="open" className="btn sec">לפתוח ארגון<small>הקמה וניהול, בכמה דקות</small></Link>
                    <div className="sep"></div>
                    <div className="login">כבר רשומים? <Link href="/login" data-start="login">כניסה</Link></div>
                    <div className="legal"><Link href="/terms">תנאי שימוש</Link><Link href="/privacy">מדיניות פרטיות</Link></div>
                </div>
            )}
        </div>
    );
}
