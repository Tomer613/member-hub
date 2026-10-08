"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Uses the native <dialog>: focus trap, Escape to close and the backdrop come from the browser.
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={title}
      className="m-auto w-[min(92vw,460px)] rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-ticket)] p-5 shadow-[var(--mh-shadow)] backdrop:bg-[rgba(30,22,51,0.45)]"
    >
      <h2 className="mb-3 text-[22px]">{title}</h2>
      {children}
    </dialog>
  );
}
