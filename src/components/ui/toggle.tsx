"use client";

// Accessible switch. Locked = mandatory field the org requires (cannot be turned off).
export function Toggle({
  checked,
  onChange,
  label,
  locked = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  locked?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={locked}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-[50px] rounded-full border-2 border-[var(--mh-ink)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)] ${
        checked ? "bg-[var(--mh-ok)]" : "bg-[#B8AFC7]"
      } ${locked ? "opacity-70" : ""}`}
    >
      <span
        className={`absolute top-[2px] h-5 w-5 rounded-full border-2 border-[var(--mh-ink)] bg-white ${
          checked ? "end-[2px]" : "start-[2px]"
        }`}
      />
    </button>
  );
}
