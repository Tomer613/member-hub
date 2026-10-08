import { useId, type SelectHTMLAttributes } from "react";

export function Select({
  label,
  options,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: ReadonlyArray<{ value: string; label: string }> }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[13px] font-extrabold">
        {label}
      </label>
      <select
        id={id}
        {...props}
        className={`min-h-[var(--mh-hit)] rounded-[14px] border-2 border-[var(--mh-ink)] bg-white px-[14px] font-semibold focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)] ${className}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
