import type { CSSProperties } from "react";
import { labelTilt } from "@/lib/labels";

export const TAG_ICON = "M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01";

// A label as a rubber stamp (boards D-Labels, D-AdmLabels): the label's color, an ink frame and hard
// shadow, and its own small tilt. The page is RTL, so the tilt is mirrored (rtl-ltr 2).
export function LabelStamp({ id, name, color, size = "md", style }: { id: string; name: string; color: string; size?: "sm" | "md"; style?: CSSProperties }) {
    const sm = size === "sm";
    return (
        <span
            className={`inline-flex shrink-0 items-center gap-[6px] rounded-[10px] border-[2.5px] border-[var(--mh-ink)] font-extrabold text-[var(--mh-ink)] shadow-[0_3px_0_var(--mh-ink)] ${sm ? "min-h-9 px-[12px] text-[15px]" : "min-h-10 px-[14px] text-[16px]"}`}
            style={{ background: color, transform: `rotate(${-labelTilt(id)}deg)`, ...style }}
        >
            <svg width={sm ? 16 : 20} height={sm ? 16 : 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={TAG_ICON} /></svg>
            <bdi>{name}</bdi>
        </span>
    );
}
