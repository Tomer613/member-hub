"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ContactKind } from "@/lib/auth/contact";
import { completeSignup, requestCode, requestPhoneChange, verifyCode, type Flow } from "./actions";
import { CodeBoxes } from "./code-boxes";

// The whole sign-in / sign-up path on one page (decided 13.10.2026, screens 1, 2, 3 and 5):
// contact -> code -> (new people only) name. Lockout and "no access to my phone" branch off the code step.

// "Remember this computer" is offered on computers only; phones always stay signed in.
const COMPUTER_QUERY = "(pointer: fine) and (min-width: 861px)";
const subscribeComputer = (cb: () => void) => {
    const m = window.matchMedia(COMPUTER_QUERY);
    m.addEventListener("change", cb);
    return () => m.removeEventListener("change", cb);
};
const isComputerNow = () => window.matchMedia(COMPUTER_QUERY).matches;

type Step = "contact" | "code" | "name" | "locked" | "help" | "helpSent";

const card = "flex flex-col gap-[14px] rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-surface)] p-4 shadow-[0_4px_0_var(--mh-ink)]";
const title = "m-0 font-display text-[30px] leading-[1.1] [text-wrap:balance]";
const sub = "m-0 font-semibold text-[var(--mh-ink-soft)]";
const link = "min-h-10 self-center font-extrabold underline";

export function LoginFlow({ flow, inviteOrg }: { flow: Flow; inviteOrg: string | null }) {
    const router = useRouter();
    const [step, setStep] = useState<Step>("contact");
    const [kind, setKind] = useState<ContactKind>("phone");
    const [raw, setRaw] = useState("");
    const [value, setValue] = useState("");
    const [masked, setMasked] = useState("");
    const [error, setError] = useState("");
    const [codeError, setCodeError] = useState(0);
    const [resendIn, setResendIn] = useState(0);
    const [lockLeft, setLockLeft] = useState(0);
    const [remember, setRemember] = useState(true);
    const [first, setFirst] = useState("");
    const [last, setLast] = useState("");
    const [pending, start] = useTransition();

    const isComputer = useSyncExternalStore(subscribeComputer, isComputerNow, () => false);
    useEffect(() => {
        if (resendIn <= 0) return;
        const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [resendIn]);
    useEffect(() => {
        if (lockLeft <= 0) return;
        const t = setTimeout(() => setLockLeft((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [lockLeft]);

    function lock(seconds: number) {
        setLockLeft(seconds);
        setStep("locked");
    }

    function send(again = false) {
        setError("");
        start(async () => {
            const r = await requestCode(kind, raw);
            if (!r.ok) {
                if ("locked" in r) return lock(r.locked);
                setError(r.error === "invalid" ? (kind === "phone" ? "המספר לא נראה תקין" : "כתובת המייל לא נראית תקינה") : "לא הצלחנו לשלוח קוד. נסו שוב בעוד רגע");
                return;
            }
            setValue(r.value);
            setMasked(r.masked);
            setResendIn(r.resendIn);
            if (!again) setStep("code");
        });
    }

    function verify(code: string) {
        start(async () => {
            const r = await verifyCode(kind, value, code, isComputer ? remember : true, flow);
            if (!r.ok) {
                if ("locked" in r) return lock(r.locked);
                setError(r.error === "expired" ? "הקוד פג תוקף. שלחו קוד חדש" : "הקוד לא נכון, נסו שוב");
                setCodeError((n) => n + 1);
                return;
            }
            if ("needsName" in r) {
                setFirst(r.first);
                setLast(r.last);
                setStep("name");
                return;
            }
            router.replace(r.goTo);
        });
    }

    function finish() {
        start(async () => {
            const r = await completeSignup(first, last, flow);
            if (!r.ok) {
                if (r.error === "expired") {
                    setError("עבר יותר מדי זמן. נשלח קוד חדש כדי להמשיך");
                    setStep("contact");
                }
                return;
            }
            router.replace(r.goTo);
        });
    }

    if (step === "contact")
        return (
            <div className="flex flex-col gap-[14px]">
                {inviteOrg && (
                    <div className="flex items-center gap-[10px] rounded-2xl border-2 border-[var(--mh-ink)] bg-[var(--mh-pastel-teal)] px-3 py-[10px] font-extrabold">
                        <span>
                            הוזמנתם ל{inviteOrg}
                            <small className="block text-[13px] font-semibold">אחרי הכניסה ההזמנה תחכה לכם</small>
                        </span>
                    </div>
                )}
                <h1 className={title}>נכנסים או מצטרפים</h1>
                <form
                    className={card}
                    onSubmit={(e) => {
                        e.preventDefault();
                        send();
                    }}
                >
                    {kind === "phone" ? (
                        <Input key="phone" label="מספר טלפון" type="tel" inputMode="tel" autoComplete="tel" ltr placeholder="050-123-4567" value={raw} onChange={(e) => setRaw(e.target.value)} error={error || undefined} hint="בלי סיסמה. נשלח לכם קוד ב־SMS, ובעזרתו תיכנסו." required autoFocus />
                    ) : (
                        <Input key="email" label="כתובת מייל" type="email" autoComplete="email" ltr placeholder="name@example.com" value={raw} onChange={(e) => setRaw(e.target.value)} error={error || undefined} hint="בלי סיסמה. נשלח לכם קוד למייל, ובעזרתו תיכנסו." required autoFocus />
                    )}
                    <Button variant="highlight" type="submit" disabled={pending} className="min-h-[54px] text-[18px]">
                        שלחו לי קוד
                    </Button>
                    <button
                        type="button"
                        className={link}
                        onClick={() => {
                            setKind(kind === "phone" ? "email" : "phone");
                            setRaw("");
                            setError("");
                        }}
                    >
                        {kind === "phone" ? "להשתמש במייל במקום" : "להשתמש בטלפון במקום"}
                    </button>
                </form>
                <p className="m-0 text-center text-[13px] font-semibold text-[var(--mh-ink-soft)]">
                    בהמשך אתם מסכימים ל<Link href="/terms" className="font-extrabold text-[var(--mh-ink)] underline">תנאי השימוש</Link> ול<Link href="/privacy" className="font-extrabold text-[var(--mh-ink)] underline">מדיניות הפרטיות</Link>
                </p>
            </div>
        );

    if (step === "code")
        return (
            <div className="flex flex-col gap-[14px]">
                <h1 className={title}>הקלידו את הקוד</h1>
                <p className={sub}>
                    שלחנו קוד ל־<b dir="ltr" className="text-[var(--mh-ink)] [unicode-bidi:isolate]">{masked}</b>
                </p>
                <button type="button" className="min-h-8 self-start font-extrabold underline" onClick={() => { setError(""); setStep("contact"); }}>
                    {kind === "phone" ? "לא המספר שלי" : "לא המייל שלי"}
                </button>
                <div className={card}>
                    <CodeBoxes onComplete={verify} disabled={pending} errorTick={codeError} />
                    <p role="alert" className="m-0 min-h-[22px] text-center font-extrabold text-[var(--mh-danger)]">{error}</p>
                    {isComputer && (
                        <label className="flex cursor-pointer items-center gap-[10px] font-bold">
                            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-[22px] w-[22px] accent-[var(--mh-ink)]" />
                            <span>
                                לזכור את המחשב הזה
                                <small className="block text-[13px] font-semibold text-[var(--mh-ink-soft)]">לא תצטרכו קוד כאן במשך 30 יום</small>
                            </span>
                        </label>
                    )}
                    <div className="text-center font-bold text-[var(--mh-ink-soft)]">
                        {resendIn > 0 ? (
                            `אפשר לשלוח שוב בעוד 0:${String(resendIn).padStart(2, "0")}`
                        ) : (
                            <button type="button" className={link} onClick={() => send(true)} disabled={pending}>לשלוח שוב</button>
                        )}
                    </div>
                </div>
            </div>
        );

    if (step === "name")
        return (
            <form
                className="flex flex-col gap-[14px]"
                onSubmit={(e) => {
                    e.preventDefault();
                    finish();
                }}
            >
                <h1 className={title}>נעים להכיר!</h1>
                <p className={sub}>{inviteOrg && first ? `כך רשמו אתכם ב${inviteOrg}. אפשר לתקן.` : "איך קוראים לכם?"}</p>
                <div className={card}>
                    <Input label="שם פרטי" autoComplete="given-name" value={first} onChange={(e) => setFirst(e.target.value)} required autoFocus={!first} />
                    <Input label="שם משפחה" autoComplete="family-name" value={last} onChange={(e) => setLast(e.target.value)} required />
                    <Button variant="highlight" type="submit" disabled={pending || !first.trim() || !last.trim()} className="min-h-[54px] text-[18px]">
                        סיום
                    </Button>
                </div>
            </form>
        );

    if (step === "locked")
        return (
            <div className="flex flex-col items-stretch gap-[14px] text-center">
                <h1 className={title}>רגע, יותר מדי ניסיונות</h1>
                <p className={sub}>כדי לשמור על החשבון, אפשר לנסות שוב בעוד:</p>
                <div dir="ltr" className="font-display text-[56px] leading-none" aria-live="polite">
                    {Math.floor(lockLeft / 60)}:{String(lockLeft % 60).padStart(2, "0")}
                </div>
                <Button variant="secondary" disabled={lockLeft > 0} onClick={() => { setError(""); setCodeError(0); setStep(value ? "code" : "contact"); }} className="min-h-[54px]">
                    לנסות שוב
                </Button>
                <button type="button" className={link} onClick={() => { setError(""); setStep("help"); }}>צריכים עזרה?</button>
            </div>
        );

    if (step === "help") return <NoPhoneAccess oldPhone={kind === "phone" ? raw : ""} onBack={() => setStep("locked")} onSent={() => setStep("helpSent")} />;

    return (
        <div className="flex flex-col gap-[14px] text-center">
            <h1 className={title}>הבקשה נשלחה</h1>
            <p className={sub}>אם הפרטים נכונים, מנהלי הארגון יקבלו בקשה לאשר שזה אתם. אחרי האישור המספר החדש ייכנס לתוקף בעוד 3 ימים, ונודיע על כך גם במספר הישן.</p>
            <Button variant="secondary" onClick={() => setStep("contact")} className="min-h-[54px]">חזרה לכניסה</Button>
        </div>
    );
}

// "No access to my phone": new number (proved with a code) + an org the person belongs to.
function NoPhoneAccess({ oldPhone, onBack, onSent }: { oldPhone: string; onBack: () => void; onSent: () => void }) {
    const [old, setOld] = useState(oldPhone);
    const [fresh, setFresh] = useState("");
    const [org, setOrg] = useState("");
    const [codeSent, setCodeSent] = useState(false);
    const [error, setError] = useState("");
    const [pending, start] = useTransition();
    const [lockLeft, setLockLeft] = useState(0);
    const [tick, setTick] = useState(0);

    return (
        <form
            className="flex flex-col gap-[14px]"
            onSubmit={(e) => {
                e.preventDefault();
                setError("");
                start(async () => {
                    const r = await requestCode("phone", fresh);
                    if (!r.ok) {
                        if ("locked" in r) setLockLeft(r.locked);
                        setError("locked" in r ? `אפשר לנסות שוב בעוד ${Math.ceil(r.locked / 60)} דקות` : "המספר החדש לא נראה תקין");
                        return;
                    }
                    setCodeSent(true);
                });
            }}
        >
            <button type="button" onClick={onBack} className="min-h-11 self-start rounded-full border-2 border-[var(--mh-ink)] bg-white px-[14px] text-sm font-extrabold">חזרה</button>
            <h1 className={title}>אין גישה לטלפון?</h1>
            <p className={sub}>מנהל של ארגון שאתם חברים בו יאשר שזה אתם. אחרי האישור המספר יוחלף בעוד 3 ימים, ונודיע על כך גם במספר הישן.</p>
            <div className={card}>
                <Input label="המספר הקודם" type="tel" ltr value={old} onChange={(e) => setOld(e.target.value)} required />
                <Input label="המספר החדש" type="tel" ltr value={fresh} onChange={(e) => setFresh(e.target.value)} disabled={codeSent} required />
                <Input label="באיזה ארגון אתם חברים?" hint="השם כמו שהוא מופיע אצלכם, למשל ועד הבית הרצל 12" value={org} onChange={(e) => setOrg(e.target.value)} required />
                {!codeSent ? (
                    <Button variant="highlight" type="submit" disabled={pending || lockLeft > 0} className="min-h-[54px]">שלחו קוד למספר החדש</Button>
                ) : (
                    <>
                        <p className="m-0 font-bold">הקלידו את הקוד שנשלח למספר החדש</p>
                        <CodeBoxes
                            onComplete={(code) =>
                                start(async () => {
                                    const r = await requestPhoneChange(old, fresh, code, org);
                                    if (r.ok) return onSent();
                                    setError("locked" in r ? `אפשר לנסות שוב בעוד ${Math.ceil(r.locked / 60)} דקות` : "הקוד לא נכון, נסו שוב");
                                    setTick((n) => n + 1);
                                })
                            }
                            disabled={pending}
                            errorTick={tick}
                        />
                    </>
                )}
                <p role="alert" className="m-0 text-center font-extrabold text-[var(--mh-danger)]">{error}</p>
            </div>
        </form>
    );
}
