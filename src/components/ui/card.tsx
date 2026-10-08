import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`rounded-[18px] border-2 border-[var(--mh-ink)] bg-[var(--mh-surface)] p-4 shadow-[var(--mh-shadow)] ${className}`}
    />
  );
}

// Band in the organization color; text color comes from --on-org (computed from luminance).
export function OrgBand({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-[var(--org)] p-4 text-[var(--on-org)] shadow-[var(--mh-shadow)] ${className}`}
    />
  );
}
