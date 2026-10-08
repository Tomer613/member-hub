import type { ReactNode } from "react";

export type ToastTone = "ok" | "info" | "error";
const tones: Record<ToastTone, string> = { ok: "bg-[#D7F5E8]", info: "bg-[#CFF0FC]", error: "bg-[#FFDCD3]" };

// Presentational. role=status announces politely; errors use role=alert.
export function Toast({ tone = "info", children }: { tone?: ToastTone; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-2xl border-2 border-[var(--mh-ink)] px-[14px] py-[10px] font-extrabold shadow-[var(--mh-shadow)] ${tones[tone]}`}
    >
      {children}
    </div>
  );
}
