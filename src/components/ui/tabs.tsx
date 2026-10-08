"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";

export function Tabs({ tabs }: { tabs: ReadonlyArray<{ key: string; label: string; content: ReactNode }> }) {
  const base = useId();
  const [active, setActive] = useState(tabs[0]?.key);

  // Arrow keys move between tabs. In RTL the visual left/right are swapped, so use the element's direction.
  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const i = tabs.findIndex((t) => t.key === active);
    const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
    const next = e.key === "ArrowRight" ? (rtl ? -1 : 1) : e.key === "ArrowLeft" ? (rtl ? 1 : -1) : 0;
    if (!next) return;
    e.preventDefault();
    const n = tabs[(i + next + tabs.length) % tabs.length];
    setActive(n.key);
    document.getElementById(`${base}-tab-${n.key}`)?.focus();
  }

  return (
    <div>
      <div role="tablist" onKeyDown={onKeyDown} className="mb-3 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            id={`${base}-tab-${t.key}`}
            role="tab"
            type="button"
            aria-selected={t.key === active}
            aria-controls={`${base}-panel-${t.key}`}
            tabIndex={t.key === active ? 0 : -1}
            onClick={() => setActive(t.key)}
            className={`min-h-9 rounded-full border-2 border-[var(--mh-ink)] px-4 font-extrabold ${
              t.key === active ? "bg-[var(--mh-ink)] text-white" : "bg-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.key} id={`${base}-panel-${t.key}`} role="tabpanel" aria-labelledby={`${base}-tab-${t.key}`} hidden={t.key !== active}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
