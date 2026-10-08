import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "highlight" | "danger";

const styles: Record<Variant, string> = {
  primary: "bg-[var(--org)] text-[var(--on-org)]",
  secondary: "bg-white text-[var(--mh-ink)]",
  highlight: "bg-[#FFD84A] text-[var(--mh-ink)]",
  danger: "bg-[var(--mh-danger)] text-white",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-[var(--mh-hit)] items-center justify-center gap-2 rounded-full border-[2.5px] border-[var(--mh-ink)] px-[22px] font-extrabold shadow-[var(--mh-shadow)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)] disabled:cursor-not-allowed disabled:border-[#B8AFC7] disabled:bg-[#EDE6D6] disabled:text-[var(--mh-ink-soft)] disabled:shadow-none ${styles[variant]} ${className}`}
    />
  );
}
