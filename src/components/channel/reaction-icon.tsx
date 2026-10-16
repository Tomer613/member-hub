import type { ReactionKind } from "@/lib/reactions";

// The six reaction icons, drawn as in board D-ChannelReact.
const THUMB = "M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3zM7 11l4-8c1.6 0 2.5 1 2.5 2.5V9h5a2 2 0 0 1 2 2.3l-1.2 7a2 2 0 0 1-2 1.7H7";

export function ReactionIcon({ kind, size = 28 }: { kind: ReactionKind; size?: number }) {
    return (
        <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="var(--mh-ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {kind === "heart" && <path d="M12 20.5C5 15.5 3 12 3 8.8 3 6 5 4 7.5 4c1.9 0 3.5 1 4.5 2.7C13 5 14.6 4 16.5 4 19 4 21 6 21 8.8c0 3.2-2 6.7-9 11.7z" fill="#FF5C9E" />}
            {kind === "bravo" && <><path d="M8 4h8v5a4 4 0 0 1-8 0z" fill="#FFC53D" /><path d="M8 6H5.5a2 2 0 0 0 0 4A3 3 0 0 0 8 11M16 6h2.5a2 2 0 0 1 0 4A3 3 0 0 1 16 11M12 13v4M8.5 20h7M9.5 17h5" /></>}
            {kind === "like" && <path d={THUMB} fill="#18B8F0" />}
            {kind === "dislike" && <g transform="rotate(180 12 12)"><path d={THUMB} fill="#FF5A36" /></g>}
            {kind === "funny" && <><circle cx="12" cy="12" r="9" fill="#FFD84A" /><path d="M8 10q1-1.5 2 0M14 10q1-1.5 2 0" /><path d="M7.5 13.5h9a4.5 4.5 0 0 1-9 0z" fill="#fff" /></>}
            {kind === "got" && <><circle cx="12" cy="12" r="9" fill="#00B67A" /><path d="M8 12.5l2.8 2.8L16.5 9.5" strokeWidth="2.5" /></>}
        </svg>
    );
}
