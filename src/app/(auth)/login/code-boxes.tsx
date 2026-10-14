"use client";

import { useEffect, useRef, useState } from "react";

// Six boxes for the one-time code. Typing, pasting and the phone's SMS autofill (which drops the whole
// code into the first box) all work; the sixth digit submits by itself, so there is no confirm button.
// errorTick: bump it after a wrong code; the boxes shake, clear and take focus again.
export function CodeBoxes({ onComplete, disabled, errorTick }: { onComplete: (code: string) => void; disabled: boolean; errorTick: number }) {
    const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
    const [shaking, setShaking] = useState(false);
    const refs = useRef<Array<HTMLInputElement | null>>([]);

    useEffect(() => {
        refs.current[0]?.focus();
    }, []);
    useEffect(() => {
        if (!errorTick) return;
        const start = setTimeout(() => setShaking(true), 0);
        const t = setTimeout(() => {
            setShaking(false);
            setDigits(Array(6).fill(""));
            refs.current[0]?.focus();
        }, 450);
        return () => {
            clearTimeout(start);
            clearTimeout(t);
        };
    }, [errorTick]);

    function fill(from: number, text: string) {
        const incoming = text.replace(/\D/g, "").slice(0, 6 - from).split("");
        const next = [...digits];
        incoming.forEach((d, k) => { next[from + k] = d; });
        if (incoming.length === 0) next[from] = "";
        setDigits(next);
        if (incoming.length) refs.current[Math.min(5, from + incoming.length)]?.focus();
        const code = next.join("");
        if (code.length === 6 && !next.includes("")) onComplete(code);
    }

    return (
        <div dir="ltr" className={`flex justify-center gap-2 ${shaking ? "mh-shake" : ""}`}>
            {digits.map((d, i) => (
                <input
                    key={i}
                    ref={(el) => { refs.current[i] = el; }}
                    value={d}
                    disabled={disabled}
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    aria-label={`ספרה ${i + 1} מתוך 6`}
                    onChange={(e) => fill(i, e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Backspace" && !digits[i] && i > 0) {
                            e.preventDefault();
                            const next = [...digits];
                            next[i - 1] = "";
                            setDigits(next);
                            refs.current[i - 1]?.focus();
                        }
                    }}
                    onPaste={(e) => {
                        e.preventDefault();
                        fill(i, e.clipboardData.getData("text"));
                    }}
                    className={`h-[58px] w-0 min-w-0 max-w-[52px] flex-1 rounded-[14px] border-[2.5px] bg-white text-center font-display text-[26px] outline-none focus:bg-[var(--mh-ticket)] focus:shadow-[var(--mh-shadow)] ${
                        shaking ? "border-[var(--mh-danger)]" : "border-[var(--mh-ink)]"
                    }`}
                />
            ))}
        </div>
    );
}
