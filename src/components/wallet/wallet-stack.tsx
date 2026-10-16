"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { GROUP_LABEL, TILTS, type WalletGroup } from "@/lib/wallet";
import { TAG_ICON } from "@/components/labels/stamp";

// One card in the wallet (approved board D-Wallet): a header in the org color with the letter or logo, the
// name, the role and a status chip, and a cream body with two short lines. The whole card is one link.
export type CardView = {
    id: string;
    href: string | null;
    name: string;
    color: string;
    fg: string;
    logo: string | null;
    letter: string;
    role: string;
    status: string | null;
    money: boolean; // a status about money gets the yellow chip
    left?: boolean; // left with a debt: the "עזב עם חוב" chip (board D-Components)
    label?: { name: string; more: number; all: string } | null;
    bell?: { count: number; href: string }; // shown only when something waits (board D-Wallet) // the newest label the member sees (ux-spec 14.25)
    start: string;
    end: string;
    group: WalletGroup;
};

// Phones get the stacked cards of the board; from a tablet up the cards sit side by side, whole.
export function WalletStack({ cards, chips }: { cards: CardView[]; chips: WalletGroup[] }) {
    const [group, setGroup] = useState<WalletGroup | null>(null);
    const shown = group ? cards.filter((c) => c.group === group) : cards;
    return (
        <>
            {chips.length > 0 && (
                <div role="group" aria-label="סינון לפי קבוצה" className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
                    <Chip on={group === null} onClick={() => setGroup(null)}>הכול</Chip>
                    {chips.map((g) => (
                        <Chip key={g} on={group === g} onClick={() => setGroup(g)}>{GROUP_LABEL[g]}</Chip>
                    ))}
                </div>
            )}
            <ul key={group ?? "all"} className="m-0 flex list-none flex-col p-0 pt-[2px] md:grid md:grid-cols-2 md:gap-4 xl:grid-cols-3 min-[1800px]:grid-cols-4">
                {shown.map((c, i) => <Card key={c.id} card={c} i={i} />)}
            </ul>
        </>
    );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: string }) {
    return (
        <button type="button" aria-pressed={on} onClick={onClick} className={`h-11 shrink-0 rounded-full border-2 border-[var(--mh-ink)] px-[18px] font-extrabold transition-[transform,background-color] duration-150 hover:-translate-y-px active:translate-y-[1px] ${on ? "bg-[var(--mh-ink)] text-white" : "bg-white hover:bg-[var(--mh-ticket)]"}`}>
            {children}
        </button>
    );
}

export function Card({ card: c, i, stacked = true }: { card: CardView; i: number; stacked?: boolean }) {
    const tilt = TILTS[i % TILTS.length];
    const body = (
        <>
            <span className={`flex h-[84px] items-center gap-[10px] border-b-2 border-[var(--mh-ink)] px-[14px] ${c.bell ? "pe-[66px]" : ""}`} style={{ background: c.color, color: c.fg }}>
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--mh-ink)] bg-white font-display text-[22px] text-[var(--mh-ink)]">
                    {/* eslint-disable-next-line @next/next/no-img-element -- the logo is an inline data URL */}
                    {c.logo ? <img src={c.logo} alt="" className="h-full w-full object-cover" /> : c.letter}
                </span>
                <span className={`flex min-w-0 flex-1 flex-col ${c.label ? "gap-[3px]" : "gap-1"}`}>
                    <b className="truncate font-display text-[18px] font-normal leading-[1.1]">{c.name}</b>
                    <span className="flex min-w-0 items-center gap-2">
                        <span className="shrink-0 whitespace-nowrap text-[13px] font-bold">{c.role}</span>
                        {c.status && (
                            <span className="truncate rounded-full border-2 border-[var(--mh-ink)] px-[10px] text-[12px] font-extrabold text-[var(--mh-ink)]" style={{ background: c.left ? "#FFDCD3" : c.money ? "var(--mh-sun)" : `color-mix(in srgb, ${c.color} 22%, white)` }}>
                                <bdi>{c.status}</bdi>
                            </span>
                        )}
                    </span>
                    {c.label && (
                        <span role="img" aria-label={c.label.all} className="flex min-w-0 items-center gap-1">
                            <span className="inline-flex min-w-0 items-center gap-1 rounded-full border-2 border-[var(--mh-ink)] bg-white px-2 text-[12px] font-extrabold leading-[18px] text-[var(--mh-ink)]">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0"><path d={TAG_ICON} /></svg>
                                <bdi className="truncate">{c.label.name}</bdi>
                            </span>
                            {c.label.more > 0 && <span className="shrink-0 rounded-full border-2 border-[var(--mh-ink)] bg-white px-[6px] text-[12px] font-extrabold leading-[18px] text-[var(--mh-ink)]"><bdi>{`+${c.label.more}`}</bdi></span>}
                        </span>
                    )}
                </span>
            </span>
            <span className="flex h-14 items-center justify-between gap-3 px-4 text-[13px] font-bold text-[var(--mh-ink-soft)]">
                <span className="truncate">{c.start}</span>
                <span className="shrink-0">{c.end}</span>
            </span>
        </>
    );
    const shell = "wl-stackcard block h-[144px] overflow-hidden rounded-[22px] border-2 border-[var(--mh-ink)] bg-[var(--mh-ticket)] shadow-[0_3px_0_var(--mh-ink)]";
    return (
        <li className={`relative ${stacked && i > 0 ? "-mt-12 md:mt-0" : ""}`} style={{ "--tilt": `${tilt}deg`, "--i": i } as CSSProperties}>
            {c.href ? (
                <Link href={c.href} className={`${shell} focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)] focus-visible:ring-offset-2`}>{body}</Link>
            ) : (
                <div className={shell}>{body}</div>
            )}
            {c.bell && (
                <Link href={c.bell.href} aria-label={`הודעות מ${c.name}: ${c.bell.count === 1 ? "אחת שמחכה" : `${c.bell.count} שמחכות`}`} className="wl-bell absolute end-[14px] top-[20px] z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-white text-[var(--mh-ink)] shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px hover:rotate-[8deg]" style={{ rotate: `${tilt}deg` }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></svg>
                    <span aria-hidden="true" className="absolute -end-[6px] -top-[6px] inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-org-orange)] px-1 text-[12px] font-extrabold leading-none"><bdi>{c.bell.count > 99 ? "99+" : c.bell.count}</bdi></span>
                </Link>
            )}
        </li>
    );
}
