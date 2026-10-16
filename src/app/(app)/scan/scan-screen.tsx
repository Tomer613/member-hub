"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { lookupCode, renewProfileCode } from "./actions";
import { parseScan } from "@/lib/scan";
import { readImageFile, useCamera } from "@/components/scan/use-camera";
import { Viewfinder } from "@/components/scan/viewfinder";

type Profile = { name: string; letter: string; link: string; svg: string };
type Tab = "scan" | "code";

const pill = "inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 px-2 text-[13px] font-extrabold min-[400px]:text-[14px] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px]";

// The scanner and the person's own profile code (boards D-QrScan, D-QrMyCode).
export function ScanScreen({ hosts, start, profile: initial }: { hosts: string[]; start: Tab; profile: Profile }) {
    const router = useRouter();
    const [tab, setTab] = useState<Tab>(start);
    const [note, setNote] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [sheet, setSheet] = useState<"paste" | "type" | null>(null);
    const [profile, setProfile] = useState(initial);
    const file = useRef<HTMLInputElement>(null);

    const handle = useCallback(
        async (text: string | null) => {
            if (!text) {
                setNote("לא נמצא קוד בתמונה. נסו תמונה חדה יותר, שהקוד ממלא את רובה.");
                return;
            }
            const r = parseScan(text, hosts.concat(typeof window === "undefined" ? [] : [window.location.host]));
            if (r.kind === "go") {
                setBusy(true);
                setNote("פותחים…");
                router.push(r.to);
            } else if (r.kind === "code") {
                setBusy(true);
                const found = await lookupCode(r.code);
                if (found.to) router.push(found.to);
                else {
                    setBusy(false);
                    setNote(found.error ?? "הקוד לא נמצא.");
                }
            } else if (r.kind === "entry") {
                setNote("זה קוד הכניסה של כרטיס חבר. סורקים אותו בכניסה לארגון, במסך ״סריקה בכניסה״ של הארגון.");
            } else if (r.kind === "foreign") {
                setNote("הקוד הזה לא שייך לארנק, ולכן לא פותחים אותו מכאן.");
            }
        },
        [hosts, router],
    );
    const onCode = useCallback((t: string) => void handle(t), [handle]);
    const cam = useCamera(tab === "scan" && !busy && !sheet && !note, onCode);

    const fromGallery = async (f: File | undefined) => {
        if (!f) return;
        setNote("קוראים את התמונה…");
        await handle(await readImageFile(f));
    };
    const paste = async () => {
        try {
            const t = await navigator.clipboard.readText();
            if (t.trim()) return void handle(t);
        } catch {
            // No permission to read the clipboard: the person pastes into the field instead.
        }
        setSheet("paste");
    };

    const dark = tab === "scan";
    return (
        <main className={`min-h-dvh overflow-x-clip transition-colors duration-300 ${dark ? "bg-[var(--mh-ink)] text-white" : "bg-white text-[var(--mh-ink)]"}`}>
            <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col gap-4 px-4 py-[18px] lg:justify-center lg:[zoom:1.15] min-[1800px]:[zoom:1.5]">
                <header className="flex items-center gap-3">
                    <Link href="/wallet" aria-label="חזרה לארנק" className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-white text-[var(--mh-ink)] shadow-[0_3px_0_rgba(0,0,0,0.35)] transition-transform hover:-translate-y-px">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
                    </Link>
                    <h1 className="m-0 font-display text-[28px] font-normal">{dark ? "סריקה" : "קוד פרופיל"}</h1>
                </header>

                {dark ? (
                    <section id="tab-scan" role="tabpanel" aria-labelledby="t-scan" className="flex flex-col gap-4">
                        <Viewfinder video={cam.video} state={cam.state} label="המצלמה, מחפשת קוד" />
                        <div className="text-center">
                            <h2 className="m-0 font-display text-[22px] font-normal">מכוונים אל הקוד</h2>
                            <p className="m-0 mt-1 text-[15px] font-semibold text-white/80">קוד פרופיל ארגון, מכרזה, מעמוד הארגון או מחבר שהמליץ. הצטרפות תמיד מסתיימת באישור שלכם.</p>
                        </div>
                        {note && (
                            <div role="status" className="scan-pop flex flex-col gap-3 rounded-[18px] border-2 border-white bg-white p-4 text-[var(--mh-ink)]">
                                <p className="m-0 font-bold">{note}</p>
                                {!busy && <button type="button" onClick={() => setNote(null)} className={`${pill} flex-none self-start border-[var(--mh-ink)] bg-[var(--mh-sun)] px-5`}>סריקה נוספת</button>}
                            </div>
                        )}
                    </section>
                ) : (
                    <MyCode profile={profile} onRenew={setProfile} />
                )}

                <div className="flex items-center gap-3">
                    {dark ? (
                        <button type="button" aria-label="פנס" aria-pressed={cam.torch} aria-disabled={!cam.torchable} onClick={() => cam.torchable && cam.setTorch(!cam.torch)} title={cam.torchable ? undefined : ""}
                            className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white transition-colors aria-disabled:opacity-40 ${cam.torch ? "bg-[var(--mh-sun)] text-[var(--mh-ink)]" : "bg-transparent text-white"}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 2h10l-2 6H9zM9 8h6v13H9zM12 12v3" /></svg>
                        </button>
                    ) : (
                        <span className="w-14 shrink-0" aria-hidden="true" />
                    )}
                    <div role="tablist" aria-label="סריקה או קוד פרופיל" className={`flex flex-1 gap-1 rounded-full border-2 p-1 ${dark ? "border-white/40" : "border-[var(--mh-ink)]"}`}>
                        {(["scan", "code"] as const).map((t) => (
                            <button key={t} id={`t-${t}`} type="button" role="tab" aria-selected={tab === t} aria-controls={`tab-${t}`} onClick={() => { setTab(t); setNote(null); setBusy(false); }}
                                className={`min-h-12 flex-1 rounded-full text-[16px] font-extrabold transition-colors ${tab === t ? "border-2 border-[var(--mh-ink)] bg-[var(--mh-sun)] text-[var(--mh-ink)] shadow-[0_3px_0_var(--mh-ink)]" : dark ? "text-white" : ""}`}>
                                {t === "scan" ? "סריקה" : "קוד פרופיל"}
                            </button>
                        ))}
                    </div>
                </div>

                {dark && (
                    <div className="flex gap-2">
                        <button type="button" onClick={() => file.current?.click()} className={`${pill} border-white/70 text-white hover:bg-white/10`}>בחירה מהגלריה</button>
                        <button type="button" onClick={paste} className={`${pill} border-white/70 text-white hover:bg-white/10`}>הדבקת קישור</button>
                        <button type="button" onClick={() => setSheet("type")} className={`${pill} border-white/70 text-white hover:bg-white/10`}>הקלדת קוד</button>
                        <input ref={file} type="file" accept="image/*" className="hidden" aria-hidden="true" tabIndex={-1} onChange={(e) => { void fromGallery(e.target.files?.[0]); e.target.value = ""; }} />
                    </div>
                )}
            </div>
            {sheet && <EnterSheet kind={sheet} onClose={() => setSheet(null)} onSubmit={(t) => { setSheet(null); void handle(t); }} />}
        </main>
    );
}

function EnterSheet({ kind, onClose, onSubmit }: { kind: "paste" | "type"; onClose: () => void; onSubmit: (text: string) => void }) {
    const [v, setV] = useState("");
    const input = useRef<HTMLInputElement>(null);
    useEffect(() => {
        input.current?.focus();
        const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", esc);
        return () => window.removeEventListener("keydown", esc);
    }, [onClose]);
    const title = kind === "paste" ? "הדבקת קישור" : "הקלדת קוד";
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(30,22,51,0.6)] sm:items-center sm:p-4" onClick={onClose}>
            <form role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); if (v.trim()) onSubmit(v); }}
                className="flex w-full max-w-[460px] flex-col gap-3 rounded-t-[24px] border-t-[2.5px] border-[var(--mh-ink)] bg-white p-5 text-[var(--mh-ink)] sm:rounded-[24px] sm:border-[2.5px]">
                <h2 className="m-0 font-display text-[22px] font-normal">{title}</h2>
                <label className="flex flex-col gap-1">
                    <span className="text-[15px] font-extrabold">{kind === "paste" ? "הקישור" : "הקוד"}</span>
                    <input ref={input} dir="ltr" value={v} onChange={(e) => setV(e.target.value)} autoCapitalize="none" autoCorrect="off" spellCheck={false} inputMode={kind === "paste" ? "url" : "text"}
                        placeholder={kind === "paste" ? "https://…" : "abcd2345"} className="min-h-12 rounded-[14px] border-2 border-[var(--mh-ink)] px-3 text-start text-[16px] font-bold" />
                    <span className="text-[13px] font-bold text-[var(--mh-ink-soft)]">{kind === "paste" ? "קישור להצטרפות, להזמנה או לחגיגה." : "קוד מהזמנה, מעמוד ארגון או מקוד פרופיל."}</span>
                </label>
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="inline-flex min-h-11 items-center rounded-full border-2 border-[var(--mh-ink)] bg-white px-4 font-extrabold">ביטול</button>
                    <button type="submit" className="inline-flex min-h-11 items-center rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-sun)] px-5 font-extrabold shadow-[0_2px_0_var(--mh-ink)]">המשך</button>
                </div>
            </form>
        </div>
    );
}

// The profile code (board D-QrMyCode): the QR, the short link, sharing it, and replacing it.
function MyCode({ profile, onRenew }: { profile: Profile; onRenew: (p: Profile) => void }) {
    const [said, setSaid] = useState("");
    const [asking, setAsking] = useState(false);
    const short = profile.link.replace(/^https?:\/\//, "");
    const asImage = async () => {
        const img = new Image();
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(profile.svg)}`;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = 720;
        c.height = 860;
        const ctx = c.getContext("2d")!;
        ctx.fillStyle = "#FFD84A";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(100, 150, 520, 520);
        ctx.drawImage(img, 130, 180, 460, 460);
        ctx.fillStyle = "#1E1633";
        ctx.textAlign = "center";
        ctx.direction = "rtl";
        ctx.font = "bold 44px sans-serif";
        ctx.fillText(profile.name, 360, 100);
        ctx.font = "bold 30px sans-serif";
        ctx.direction = "ltr";
        ctx.fillText(short, 360, 740);
        const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
        if (!blob) return;
        const f = new File([blob], "profile-code.png", { type: "image/png" });
        if (navigator.canShare?.({ files: [f] })) {
            await navigator.share({ files: [f], title: "קוד פרופיל" }).catch(() => undefined);
        } else {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "profile-code.png";
            a.click();
            URL.revokeObjectURL(a.href);
            setSaid("התמונה נשמרה בהורדות.");
        }
    };
    const copy = async () => {
        if (navigator.share && matchMedia("(pointer: coarse)").matches) {
            await navigator.share({ url: profile.link, title: "קוד פרופיל" }).catch(() => undefined);
            return;
        }
        try {
            await navigator.clipboard.writeText(profile.link);
            setSaid("הקישור הועתק.");
        } catch {
            setSaid(`הקישור: ${short}`);
        }
    };
    const renew = async () => {
        setAsking(false);
        const r = await renewProfileCode();
        if (r) {
            onRenew({ ...profile, svg: r.svg, link: r.link });
            setSaid("נוצר קוד חדש. הקוד הקודם כבר לא עובד.");
        }
    };
    return (
        <section id="tab-code" role="tabpanel" aria-labelledby="t-code" className="flex flex-col gap-3">
            <div className="flex flex-col items-center gap-3 rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-ticket)] p-4 shadow-[0_4px_0_var(--mh-ink)]">
                <div className="flex items-center gap-3 self-stretch">
                    <span aria-hidden="true" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-sun)] font-display text-[22px]">{profile.letter}</span>
                    <span className="flex min-w-0 flex-col">
                        <b className="truncate text-[17px]">{profile.name}</b>
                        <span className="text-[13px] font-bold text-[var(--mh-ink-soft)]">הקוד הקבוע שלכם, אפשר לשתף</span>
                    </span>
                </div>
                <div role="img" aria-label="קוד QR" className="rounded-[16px] border-2 border-[var(--mh-ink)] bg-white p-3">
                    <span className="block h-[200px] w-[200px] [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: profile.svg }} />
                </div>
                <bdi dir="ltr" className="max-w-full truncate rounded-[10px] bg-white px-3 py-1 text-[14px] font-bold">{short}</bdi>
            </div>
            <div className="flex gap-2">
                <button type="button" onClick={asImage} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-sun)] text-[16px] font-extrabold shadow-[0_3px_0_var(--mh-ink)] transition-transform hover:-translate-y-px active:translate-y-[2px] active:shadow-none">שיתוף כתמונה</button>
                <button type="button" onClick={copy} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border-2 border-[var(--mh-ink)] bg-white text-[16px] font-extrabold transition-transform hover:-translate-y-px active:translate-y-[2px]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
                    קישור
                </button>
            </div>
            <p aria-live="polite" className="m-0 text-center font-bold empty:hidden">{said}</p>
            <div className="rounded-[18px] border-2 border-dashed border-[var(--mh-ink)] p-3 text-[14px] font-semibold">
                <b className="block text-[15px]">איך זה עובד</b>
                מנהל של ארגון סורק את הקוד, ואתם מאשרים בטלפון. עד שתאשרו הוא רואה רק את השם הפרטי שלכם, ואחרי האישור רק את מה שהארגון צריך.
            </div>
            {asking ? (
                <div role="alertdialog" aria-label="יצירת קוד חדש" className="flex flex-col gap-2 rounded-[18px] border-2 border-[#C4223B] p-3">
                    <p className="m-0 font-bold">ליצור קוד חדש? מי שקיבל את הקוד הקודם לא יוכל להשתמש בו.</p>
                    <div className="flex gap-2">
                        <button type="button" onClick={renew} className="inline-flex min-h-11 items-center rounded-full border-2 border-[#C4223B] bg-[#C4223B] px-4 font-extrabold text-white">יצירת קוד חדש</button>
                        <button type="button" onClick={() => setAsking(false)} className="inline-flex min-h-11 items-center rounded-full border-2 border-[var(--mh-ink)] bg-white px-4 font-extrabold">ביטול</button>
                    </div>
                </div>
            ) : (
                <button type="button" onClick={() => setAsking(true)} className="min-h-11 self-center font-bold underline">יצירת קוד חדש (הקוד הקיים יפסיק לעבוד)</button>
            )}
        </section>
    );
}
