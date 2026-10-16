"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { freshEntry } from "@/app/(app)/card/[orgId]/actions";
import { LabelStamp } from "@/components/labels/stamp";

type Props = {
    orgId: string;
    orgName: string;
    letter: string;
    logo: string | null;
    color: string;
    fg: string;
    role: string;
    memberName: string;
    joined: string;
    sinceWord: string;
    sinceYear: string;
    crowd: string;
    account: { label: string; value: string }; // "מספר חבר 0418", or "דירה 4" in a house committee
    next: { label: string; value: string };
    canEnter: boolean;
    notice: { text: string; href: string } | null;
    tiles: TileView[];
    pay: { label: string; href: string } | null;
    labels: { id: string; name: string; color: string; granted: string }[];
};
export type TileView = { kind: "money" | "manage"; href: string; label: string; sub: string };

// Each tile keeps one tint and icon (board D-Badge).
const TILE_LOOK: Record<TileView["kind"], { tint: string; icon: string }> = {
    money: { tint: "#FFD84A", icon: "M3 7h18v12H3zM3 7l2-3h14l2 3M16 13h2" },
    manage: { tint: "#E3DDFF", icon: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" },
};

const INK = "#1E1633";
const CROWD = ["#FF5A36", "#00B67A", "#FF5C9E", "#18B8F0"];

// The member card on its lanyard (boards D-Badge, D-BadgeBack, D-BadgeFlip). Turning it over shows the entry
// code. The turn always continues the same way round (0 -> 180 -> 360), and the lanyard sways with it.
export function Badge(p: Props) {
    const [turn, setTurn] = useState(0); // in half turns
    const back = turn % 2 === 1;
    const flip = () => setTurn((t) => t + 1);
    return (
        <main className="relative min-h-dvh overflow-x-clip bg-[var(--mh-sun)] pb-10">
            {/* On wide screens the card and its panel sit side by side and grow with the screen. */}
            <div className="mx-auto flex w-full max-w-[1100px] flex-col items-center px-4 lg:flex-row lg:items-start lg:justify-center lg:gap-[clamp(32px,5vw,80px)] lg:[zoom:1.3] min-[1800px]:[zoom:1.6]">
                <div className="relative w-full max-w-[390px] shrink-0">
                    <Doodles />
                    <Link href="/wallet" aria-label="חזרה לארנק" className="absolute start-[14px] top-[14px] z-30 inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-white shadow-[0_3px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
                    </Link>
                    {/* The lanyard and the card sway together around the top of the screen. The class alternates
                        with each turn, which restarts the sway. */}
                    <div className={turn === 0 ? "" : back ? "bd-sway-a" : "bd-sway-b"} style={{ transformOrigin: "50% 0" }}>
                        <Lanyard color={p.color} />
                        <div className="relative mx-auto mt-[84px] h-[340px] w-[308px] [perspective:1100px]">
                            <div className="bd-turn relative h-full w-full [transform-style:preserve-3d]" style={{ transform: `rotateY(${turn * 180}deg)` }}>
                                <Front {...p} onFlip={flip} hidden={back} />
                                <Back {...p} active={back} hidden={!back} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-3 flex w-full max-w-[358px] flex-col gap-3 lg:mt-[84px] lg:max-w-[440px]">
                    {back ? (
                        <>
                            <p className="m-0 flex items-start gap-3 rounded-[18px] border-2 border-[var(--mh-ink)] bg-[var(--mh-tint-ok)] p-3 text-[15px] font-bold">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-[1px] shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                זה קוד הכניסה שלכם, שמעיד על החברות בארגון. הוא מתחלף כל דקה, ולכן אי אפשר לשתף אותו או לצלם אותו.
                            </p>
                            <button type="button" onClick={flip} className="min-h-14 rounded-full border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-ink)] text-[18px] font-extrabold text-white shadow-[0_3px_0_rgba(30,22,51,0.35)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px]">חזרה לכרטיס</button>
                        </>
                    ) : (
                        <>
                            {p.notice && (
                                <Link href={p.notice.href} className="flex min-h-12 items-center gap-[10px] rounded-[16px] border-2 border-[var(--mh-ink)] bg-white px-3 py-[6px] shadow-[0_3px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-[2px] active:translate-y-[2px] active:shadow-none">
                                    <span className="bd-bell inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-org-orange)]">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></svg>
                                    </span>
                                    <span className="flex-1 text-[15px] font-extrabold leading-[1.2]">{p.notice.text}</span>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
                                </Link>
                            )}
                            <section aria-label="מה יש כאן" className="grid grid-cols-2 gap-2">
                                {p.tiles.map((t) => <Tile key={t.kind} {...t} />)}
                            </section>
                            {p.labels.length > 0 && <MyLabels orgName={p.orgName} labels={p.labels} />}
                            {p.pay ? (
                                <Link href={p.pay.href} className="flex min-h-[52px] items-center justify-center rounded-full border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-ink)] text-[18px] font-extrabold text-white shadow-[0_3px_0_rgba(30,22,51,0.35)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px]"><bdi>{p.pay.label}</bdi></Link>
                            ) : p.canEnter && (
                                <button type="button" onClick={flip} className="min-h-[52px] rounded-full border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-ink)] text-[18px] font-extrabold text-white shadow-[0_3px_0_rgba(30,22,51,0.35)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px]">להציג קוד כניסה</button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}

function Face({ hidden, back, children }: { hidden: boolean; back?: boolean; children: ReactNode }) {
    return (
        <article aria-hidden={hidden} inert={hidden} className="absolute inset-0 overflow-hidden rounded-[28px] border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-ticket)] shadow-[0_4px_0_var(--mh-ink)] [backface-visibility:hidden]" style={back ? { transform: "rotateY(180deg)" } : undefined}>
            {children}
        </article>
    );
}

function Mark({ letter, logo, size, text }: { letter: string; logo: string | null; size: number; text: number }) {
    return (
        <span className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-[2.5px] border-[var(--mh-ink)] bg-white font-display text-[var(--mh-ink)]" style={{ width: size, height: size, fontSize: text }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- the logo is an inline data URL */}
            {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : letter}
        </span>
    );
}

function Front(p: Props & { onFlip: () => void; hidden: boolean }) {
    return (
        <Face hidden={p.hidden}>
            <div className="relative flex h-[150px] flex-col items-center overflow-hidden border-b-[2.5px] border-[var(--mh-ink)] px-5 pt-[22px]" style={{ background: p.color, color: p.fg }}>
                <span className="absolute -right-[50px] -top-[70px] h-[180px] w-[180px] rounded-full bg-white/[0.16]" aria-hidden="true" />
                <span className="absolute -bottom-[60px] -left-[40px] h-[120px] w-[120px] rounded-full bg-white/[0.12]" aria-hidden="true" />
                <span className="relative mt-[2px]"><Mark letter={p.letter} logo={p.logo} size={62} text={32} /></span>
                <h1 className="relative m-0 mt-2 line-clamp-1 max-w-[230px] text-center font-display text-[22px] font-normal leading-[1.1]">{p.orgName}</h1>
                <span className="relative mt-[6px] -rotate-2 rounded-[10px] border-2 border-[var(--mh-ink)] bg-[var(--mh-sun)] px-[14px] py-[1px] text-[14px] font-extrabold text-[var(--mh-ink)]">{p.role}</span>
                {p.canEnter && (
                    <button type="button" onClick={p.onFlip} aria-label="להפוך את הכרטיס לקוד כניסה" className="absolute end-3 top-[10px] inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-white text-[var(--mh-ink)] transition-transform duration-200 hover:rotate-12 hover:scale-105">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14v7h-3" /></svg>
                    </button>
                )}
            </div>
            <div className="absolute end-[14px] top-[120px] z-10 flex h-[66px] w-[66px] rotate-[10deg] flex-col items-center justify-center rounded-full border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-org-orange)] shadow-[0_3px_0_var(--mh-ink)]">
                <span className="text-[11px] font-extrabold">{p.sinceWord}</span>
                <b className="font-display text-[23px] font-normal leading-none"><bdi>{p.sinceYear}</bdi></b>
            </div>
            <div className="px-5 pt-5 text-center">
                <div className="line-clamp-1 font-display text-[clamp(26px,9vw,34px)] leading-[1.05]">{p.memberName}</div>
                <div className="mt-[2px] text-[13px] font-bold text-[var(--mh-ink-soft)]"><bdi>{p.joined}</bdi></div>
            </div>
            <div className="mt-[10px] flex items-center justify-center gap-[10px]">
                <span className="flex ps-[7px]" aria-hidden="true">
                    {CROWD.map((c) => <span key={c} className="-ms-[7px] h-6 w-6 rounded-full border-2 border-[var(--mh-ink)]" style={{ background: c }} />)}
                </span>
                <span className="text-[13px] font-extrabold">{p.crowd}</span>
            </div>
            <div className="absolute inset-x-[22px] bottom-[14px] flex items-end justify-between">
                <span className="flex flex-col">
                    <span className="text-[11px] font-bold text-[var(--mh-ink-soft)]">{p.account.label}</span>
                    <bdi className="font-display text-[26px] leading-none">{p.account.value}</bdi>
                </span>
                <span className="flex flex-col text-end">
                    <span className="text-[11px] font-bold text-[var(--mh-ink-soft)]">{p.next.label}</span>
                    <bdi className="font-display text-[26px] leading-none">{p.next.value}</bdi>
                </span>
            </div>
        </Face>
    );
}

function Back(p: Props & { active: boolean; hidden: boolean }) {
    const [entry, setEntry] = useState<{ svg: string; until: number } | null>(null);
    const [now, setNow] = useState(0);
    const loading = useRef(false);
    const until = useRef(0);

    // While the back is showing, keep a fresh code and count down to the next one.
    useEffect(() => {
        if (!p.active || !p.canEnter) return;
        let alive = true;
        const load = async () => {
            if (loading.current) return;
            loading.current = true;
            const r = await freshEntry(p.orgId);
            loading.current = false;
            if (!alive || !r) return;
            const t = Date.now();
            until.current = t + r.secondsLeft * 1000;
            setNow(t);
            setEntry({ svg: r.svg, until: until.current });
        };
        void load();
        const tick = setInterval(() => {
            const t = Date.now();
            setNow(t);
            if (until.current && t >= until.current) void load();
        }, 1000);
        return () => {
            alive = false;
            clearInterval(tick);
        };
    }, [p.active, p.canEnter, p.orgId]);

    const left = entry ? Math.max(0, Math.ceil((entry.until - now) / 1000)) : 0;
    return (
        <Face hidden={p.hidden} back>
            <div className="flex h-14 items-center gap-[10px] border-b-[2.5px] border-[var(--mh-ink)] px-[14px]" style={{ background: p.color, color: p.fg }}>
                <Mark letter={p.letter} logo={p.logo} size={34} text={18} />
                <b className="min-w-0 flex-1 truncate font-display text-[17px] font-normal">{p.orgName}</b>
                <span className="shrink-0 rounded-[10px] border-2 border-[var(--mh-ink)] bg-[var(--mh-sun)] px-[10px] text-[12px] font-extrabold text-[var(--mh-ink)]">{p.role}</span>
            </div>
            <div className="flex flex-col items-center gap-2 px-4 pt-3">
                <div className="relative rounded-[16px] border-2 border-[var(--mh-ink)] bg-white p-2">
                    <div role="img" aria-label="קוד QR" className="relative h-[164px] w-[164px] [&_svg]:h-full [&_svg]:w-full">
                        {entry ? <span className="block h-full w-full" dangerouslySetInnerHTML={{ __html: entry.svg }} /> : <span className="block h-full w-full animate-pulse rounded-[8px] bg-[var(--mh-line-soft)]" />}
                        <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[8px] bg-white" aria-hidden="true">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--mh-ink)]" style={{ background: p.color, color: p.fg }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
                            </span>
                        </span>
                    </div>
                </div>
                <span className="flex flex-col items-center">
                    <b className="max-w-full truncate font-display text-[22px] font-normal leading-tight">{p.memberName}</b>
                    <span className="text-[13px] font-bold text-[var(--mh-ink-soft)]">{p.account.label} <bdi>{p.account.value}</bdi></span>
                </span>
                <span className="flex items-center gap-[6px] text-[14px] font-bold text-[var(--mh-ink-soft)]" aria-live="off">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" /></svg>
                    {entry ? <>מתחדש בעוד <bdi>{`${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`}</bdi></> : "טוען קוד…"}
                </span>
            </div>
        </Face>
    );
}

// A tile: icon and arrow on top, the name and a live status line below (board D-Badge).
function Tile({ kind, href, label, sub }: TileView) {
    const look = TILE_LOOK[kind];
    return (
        <Link href={href} className="group flex min-h-[76px] flex-col justify-between gap-[6px] rounded-[18px] border-2 border-[var(--mh-ink)] bg-white px-3 py-[9px] shadow-[0_3px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-[2px] active:translate-y-[2px] active:shadow-none">
            <span className="flex items-center justify-between">
                <span className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[11px] border-2 border-[var(--mh-ink)] transition-transform duration-200 group-hover:-rotate-6" style={{ background: look.tint }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={look.icon} /></svg>
                </span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform duration-200 group-hover:-translate-x-[3px]"><path d="M15 6l-6 6 6 6" /></svg>
            </span>
            <span className="flex flex-col">
                <b className="text-[17px] leading-[1.15]">{label}</b>
                <span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">{sub}</span>
            </span>
        </Link>
    );
}

// Two straps in the org color meeting over the card, with a white clip (board D-Badge).
function Lanyard({ color }: { color: string }) {
    return (
        <svg width="390" height="110" viewBox="0 0 390 110" className="absolute left-1/2 top-0 -translate-x-1/2" aria-hidden="true">
            <polygon points="78,-2 122,-2 211,88 181,98" fill={color} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
            <line x1="100" y1="0" x2="196" y2="92" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeDasharray="5 5" />
            <polygon points="268,-2 312,-2 209,98 179,88" fill={color} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
            <line x1="290" y1="0" x2="194" y2="92" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeDasharray="5 5" />
            <rect x="175" y="78" width="40" height="28" rx="9" fill="#FFFFFF" stroke={INK} strokeWidth="2.5" />
        </svg>
    );
}

// Outline doodles in the margins only, never behind the card (board D-Badge).
function Doodles() {
    return (
        <svg viewBox="0 0 390 620" className="pointer-events-none absolute left-1/2 top-0 h-[620px] w-[390px] -translate-x-1/2" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.22" aria-hidden="true">
            <g transform="translate(10 150) rotate(-14) scale(1.7)"><path d="M12 2l3 7 7 .6-5.3 4.7 1.7 7.2L12 17.8 5.6 21.5l1.7-7.2L2 9.6 9 9z" /></g>
            <g transform="translate(336 200) rotate(16) scale(1.9)"><path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z" /><path d="M14 7v10" strokeDasharray="2 2.4" /></g>
            <g transform="translate(6 330) rotate(8) scale(1.6)"><circle cx="12" cy="9" r="6" /><path d="M8.5 14L7 22l5-3 5 3-1.5-8" /></g>
            <g transform="translate(344 372) rotate(-10) scale(1.4)"><path d="M12 2l3 7 7 .6-5.3 4.7 1.7 7.2L12 17.8 5.6 21.5l1.7-7.2L2 9.6 9 9z" /></g>
            <g transform="translate(340 66) rotate(20)"><rect width="14" height="6" rx="2" /></g>
            <g transform="translate(26 84) rotate(-24)"><rect width="14" height="6" rx="2" /></g>
            <g transform="translate(364 130)"><path d="M0 -7v14M-7 0h14" /></g>
            <g transform="translate(30 270)"><path d="M0 -6v12M-6 0h12" /></g>
        </svg>
    );
}

// "התוויות שלי ב<ארגון>" (board D-Labels): every stamp, no order or rank. Tapping one tells when and how it
// was given.
function MyLabels({ orgName, labels }: { orgName: string; labels: Props["labels"] }) {
    const [open, setOpen] = useState<string | null>(null);
    const shown = labels.find((l) => l.id === open);
    return (
        <section aria-labelledby="my-labels" className="flex flex-col gap-3 rounded-[20px] border-2 border-[var(--mh-ink)] bg-[var(--mh-ticket)] p-4 shadow-[0_3px_0_var(--mh-ink)]">
            <h2 id="my-labels" className="m-0 text-[16px] font-extrabold">התוויות שלי ב<bdi>{orgName}</bdi></h2>
            <div className="flex flex-wrap gap-3 py-1">
                {labels.map((l) => (
                    <button key={l.id} type="button" aria-expanded={open === l.id} aria-controls="label-why" onClick={() => setOpen(open === l.id ? null : l.id)} className="rounded-[12px] transition-transform duration-150 hover:-translate-y-[2px] active:translate-y-[1px]">
                        <LabelStamp id={l.id} name={l.name} color={l.color} size="sm" />
                    </button>
                ))}
            </div>
            <p id="label-why" aria-live="polite" className="m-0 text-[14px] font-bold text-[var(--mh-ink-soft)] empty:hidden">{shown ? <><b className="text-[var(--mh-ink)]">{shown.name}</b>: {shown.granted}</> : null}</p>
        </section>
    );
}
