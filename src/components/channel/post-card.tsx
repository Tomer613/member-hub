"use client";

import Link from "next/link";
import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { REACTIONS, type ReactionKind } from "@/lib/reactions";
import { ReactionIcon } from "./reaction-icon";

// One update in the channel (board D-Channel) with its reaction row and the picker (board D-ChannelReact).
// Decided for the board's open point: tapping your own reaction removes it, and tapping a chip in the row
// picks that reaction directly.

// personal: a message to this member alone (board D-Channel: cream card with "אישית, רק לכם").
export type PostView = { id: string; title: string; body: string; ago: string; pinned: boolean; reactable: boolean; dislike: boolean; personal?: boolean };
type Counts = Partial<Record<ReactionKind, number>>;

export function PostCard({ post, counts, mine, react, replyHref }: {
    post: PostView;
    // "להשיב בפנייה": answers go to the org privately, as an inquiry (board D-InquiryNew).
    replyHref?: string;
    counts: Counts;
    mine: ReactionKind | null;
    // Null when the viewer cannot react (for example an organizer previewing).
    react: ((postId: string, kind: ReactionKind | null) => Promise<void>) | null;
}) {
    const [state, setOptimistic] = useOptimistic({ counts, mine }, (s, next: ReactionKind | null) => {
        const c = { ...s.counts };
        if (s.mine) c[s.mine] = Math.max(0, (c[s.mine] ?? 1) - 1);
        if (next) c[next] = (c[next] ?? 0) + 1;
        return { counts: c, mine: next };
    });
    const [, start] = useTransition();
    const [open, setOpen] = useState(false);
    const plus = useRef<HTMLButtonElement>(null);
    const choices = REACTIONS.filter((r) => post.dislike || r.kind !== "dislike");

    const pick = (kind: ReactionKind) => {
        if (!react) return;
        const next = state.mine === kind ? null : kind;
        setOpen(false);
        start(async () => { setOptimistic(next); await react(post.id, next); });
    };

    useEffect(() => {
        if (!open) return;
        const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); plus.current?.focus(); } };
        window.addEventListener("keydown", esc);
        return () => window.removeEventListener("keydown", esc);
    }, [open]);

    const shown = REACTIONS.filter((r) => (state.counts[r.kind] ?? 0) > 0);
    return (
        <article className={`relative flex flex-col gap-2 rounded-[22px] border-[2.5px] border-[var(--mh-ink)] p-[clamp(14px,1.8vw,18px)] shadow-[0_4px_0_var(--mh-ink)] ${post.pinned ? "bg-[var(--mh-tint-pink)]" : post.personal ? "bg-[#FFF9EC]" : "bg-white"} ${open ? "z-40" : ""}`}>
            <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h3 className="m-0 font-display text-[18px] leading-tight">{post.title}</h3>
                <span className="flex items-center gap-2 text-[13px] font-extrabold text-[var(--mh-ink-soft)]">
                    {post.pinned && <span className="rounded-full border-2 border-[var(--mh-ink)] bg-white px-2 text-[12px] text-[var(--mh-ink)]">חשוב</span>}
                    {post.personal && <span className="rounded-full border-2 border-[var(--mh-ink)] bg-white px-2 text-[12px] text-[var(--mh-ink)]">אישית, רק לכם</span>}
                    {post.ago}
                </span>
            </header>
            <p className="m-0 whitespace-pre-line text-[15px] font-semibold leading-relaxed">{post.body}</p>
            {post.reactable && (shown.length > 0 || react) && (
                <div className="flex flex-wrap items-center gap-1">
                    {shown.map((r) => (
                        <button key={r.kind} type="button" disabled={!react} onClick={() => pick(r.kind)} aria-pressed={state.mine === r.kind} aria-label={`${r.label}, ${state.counts[r.kind]}`}
                            className={`inline-flex min-h-11 items-center gap-1 rounded-[14px] px-2 font-extrabold transition-transform duration-150 enabled:hover:scale-105 enabled:active:scale-95 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)] ${state.mine === r.kind ? "bg-[#FFEFA8]" : ""}`}>
                            <ReactionIcon kind={r.kind} />
                            <bdi>{state.counts[r.kind]}</bdi>
                        </button>
                    ))}
                    {react && (
                        <button ref={plus} type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="להוסיף תגובה"
                            className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] transition-transform duration-150 hover:scale-110 hover:bg-[var(--mh-ticket)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)]">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                        </button>
                    )}
                </div>
            )}
            {replyHref && (
                <Link href={replyHref} className="inline-flex min-h-11 items-center gap-2 self-start rounded-full px-1 font-extrabold underline decoration-2 underline-offset-4 hover:no-underline">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-2" /></svg>
                    <span>להשיב בפנייה</span>
                </Link>
            )}
            {open && (
                <>
                    {createPortal(<div className="fixed inset-0 z-30 bg-[rgba(30,22,51,.35)]" onClick={() => setOpen(false)} aria-hidden="true" />, document.body)}
                    <div role="dialog" aria-label="בחירת תגובה" className="ch-pop absolute inset-x-0 bottom-[calc(100%-8px)] z-10 flex justify-around rounded-[22px] border-[2.5px] border-[var(--mh-ink)] bg-white p-3 shadow-[0_4px_0_var(--mh-ink)]">
                        {choices.map((r) => (
                            <button key={r.kind} type="button" autoFocus={r.kind === (state.mine ?? "heart")} onClick={() => pick(r.kind)} aria-label={r.label} aria-pressed={state.mine === r.kind}
                                className={`inline-flex h-[52px] w-[52px] items-center justify-center rounded-[16px] transition-transform duration-150 hover:-translate-y-1 hover:scale-110 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)] ${state.mine === r.kind ? "bg-[#FFEFA8]" : ""}`}>
                                <ReactionIcon kind={r.kind} size={38} />
                            </button>
                        ))}
                    </div>
                </>
            )}
        </article>
    );
}
