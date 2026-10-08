import type { ReactNode } from "react";

// Status is always text, never color alone (accessibility).
export type ChipTone = "ok" | "debt" | "dispute" | "pending" | "left" | "org" | "plain";

const tones: Record<ChipTone, string> = {
  ok: "bg-[#D7F5E8]",
  debt: "bg-[#FFD84A]",
  dispute: "bg-[#CFF0FC]",
  pending: "bg-[#E3DDFF]",
  left: "bg-[#FFDCD3]",
  org: "bg-[var(--org)] text-[var(--on-org)]",
  plain: "bg-white",
};

export function Chip({ tone = "plain", children }: { tone?: ChipTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full border-2 border-[var(--mh-ink)] px-3 py-[3px] text-sm font-extrabold ${tones[tone]}`}>
      {children}
    </span>
  );
}
