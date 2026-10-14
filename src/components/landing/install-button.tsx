"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

// "הוספה למסך הבית": uses the browser's own install prompt when it offers one, otherwise explains
// the two taps it takes on iPhone and Android.

type InstallPrompt = Event & { prompt: () => Promise<void> };

export default function InstallButton() {
    const deferred = useRef<InstallPrompt | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const keep = (e: Event) => {
            e.preventDefault();
            deferred.current = e as InstallPrompt;
        };
        window.addEventListener("beforeinstallprompt", keep);
        return () => window.removeEventListener("beforeinstallprompt", keep);
    }, []);

    function add() {
        if (deferred.current) {
            void deferred.current.prompt();
            deferred.current = null;
            return;
        }
        setOpen(true);
    }

    return (
        <>
            <button type="button" className="btn pri inline" onClick={add}>הוספה למסך הבית</button>
            <Modal open={open} onClose={() => setOpen(false)} title="הוספה למסך הבית">
                <div className="flex flex-col gap-3 text-[16px] font-semibold">
                    <p className="m-0"><b>באייפון:</b> פותחים את האתר בספארי, לוחצים על כפתור השיתוף (ריבוע עם חץ למעלה), ובוחרים &quot;הוספה למסך הבית&quot;.</p>
                    <p className="m-0"><b>באנדרואיד:</b> פותחים את האתר בכרום, לוחצים על שלוש הנקודות למעלה, ובוחרים &quot;הוספה למסך הבית&quot; או &quot;התקנת האפליקציה&quot;.</p>
                    <p className="m-0 text-[var(--mh-ink-soft)]">במחשב אפשר פשוט לשמור את האתר במועדפים.</p>
                    <Button variant="highlight" onClick={() => setOpen(false)}>הבנתי</Button>
                </div>
            </Modal>
        </>
    );
}
