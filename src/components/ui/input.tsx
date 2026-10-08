import { useId, type InputHTMLAttributes } from "react";

export function Input({
  label,
  error,
  hint,
  ltr = false,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string; ltr?: boolean }) {
  const id = useId();
  const msgId = `${id}-msg`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[13px] font-extrabold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? msgId : undefined}
        dir={ltr ? "ltr" : undefined}
        {...props}
        className={`${ltr ? "text-end" : ""} min-h-[var(--mh-hit)] rounded-[14px] border-2 bg-white px-[14px] font-semibold outline-none placeholder:text-[var(--mh-ink-soft)] focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)] ${
          error ? "border-[var(--mh-danger)]" : "border-[var(--mh-ink)]"
        } ${className}`}
      />
      {(error || hint) && (
        <span id={msgId} className={`text-xs font-extrabold ${error ? "text-[var(--mh-danger)]" : "text-[var(--mh-ink-soft)]"}`}>
          {error ?? hint}
        </span>
      )}
    </div>
  );
}
