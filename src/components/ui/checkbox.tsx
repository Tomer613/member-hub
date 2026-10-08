import { useId, type InputHTMLAttributes } from "react";

export function Checkbox({ label, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string }) {
  const id = useId();
  return (
    <label htmlFor={id} className="inline-flex min-h-[var(--mh-hit)] cursor-pointer items-center gap-2 font-bold">
      <input
        id={id}
        type="checkbox"
        {...props}
        className="h-[22px] w-[22px] cursor-pointer appearance-none rounded-md border-2 border-[var(--mh-ink)] bg-white checked:bg-[var(--org)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)]"
      />
      {label}
    </label>
  );
}
