"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ContactKind } from "@/lib/auth/contact";
import { requestCode } from "../../(auth)/login/actions";
import { CodeBoxes } from "../../(auth)/login/code-boxes";
import { addContact } from "../actions";

// Adds a backup way to sign in (an email, or another phone such as a family member's), verified by code.
export function AddContact({ suggestEmail }: { suggestEmail: boolean }) {
    const [kind, setKind] = useState<ContactKind>(suggestEmail ? "email" : "phone");
    const [raw, setRaw] = useState("");
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");
    const [tick, setTick] = useState(0);
    const [done, setDone] = useState(false);
    const [pending, start] = useTransition();

    if (done) return <p className="m-0 font-extrabold text-[var(--mh-ok-ink)]">נוסף. מעכשיו אפשר להיכנס גם כך.</p>;

    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
                e.preventDefault();
                setError("");
                start(async () => {
                    const r = await requestCode(kind, raw);
                    if (!r.ok) return setError("locked" in r ? `אפשר לנסות שוב בעוד ${Math.ceil(r.locked / 60)} דקות` : kind === "email" ? "כתובת המייל לא נראית תקינה" : "המספר לא נראה תקין");
                    setSent(true);
                });
            }}
        >
            <div className="flex gap-2">
                {(["email", "phone"] as const).map((k) => (
                    <button key={k} type="button" disabled={sent} onClick={() => { setKind(k); setRaw(""); }} className={`min-h-10 flex-1 rounded-full border-2 border-[var(--mh-ink)] font-extrabold ${kind === k ? "bg-[var(--mh-sun)]" : "bg-white"}`}>
                        {k === "email" ? "מייל" : "טלפון נוסף"}
                    </button>
                ))}
            </div>
            <Input label={kind === "email" ? "כתובת מייל" : "מספר טלפון"} type={kind === "email" ? "email" : "tel"} ltr value={raw} onChange={(e) => setRaw(e.target.value)} disabled={sent} required />
            {!sent ? (
                <Button variant="highlight" type="submit" disabled={pending}>שלחו קוד</Button>
            ) : (
                <>
                    <p className="m-0 font-bold">הקלידו את הקוד שנשלח</p>
                    <CodeBoxes
                        disabled={pending}
                        errorTick={tick}
                        onComplete={(code) =>
                            start(async () => {
                                const r = await addContact(kind, raw, code);
                                if (r.ok) return setDone(true);
                                setError(r.error === "taken" ? "הפרט הזה כבר שייך לחשבון אחר" : "הקוד לא נכון, נסו שוב");
                                setTick((n) => n + 1);
                            })
                        }
                    />
                </>
            )}
            {error && <p role="alert" className="m-0 font-extrabold text-[var(--mh-danger)]">{error}</p>}
        </form>
    );
}
