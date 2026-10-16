"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type PointerEvent as ReactPointerEvent } from "react";
import { hideCard, saveArrangement, setSortMode } from "../arrange-actions";
import { moveTo, SORT_MODES, type SortMode } from "@/lib/wallet";

type Row = { id: string; name: string; role: string; letter: string; logo: string | null; color: string; fg: string; pinned: boolean; locked: boolean };

// Pinned cards first, each group in its own order.
const settle = (rows: Row[]) => [...rows.filter((r) => r.pinned), ...rows.filter((r) => !r.pinned)];

export function Arrange({ rows: initial, mode: initialMode, archived }: { rows: Row[]; mode: SortMode; archived: number }) {
    const router = useRouter();
    const [rows, setRows] = useState(initial);
    const [mode, setMode] = useState(initialMode);
    const [moving, setMoving] = useState<string | null>(null);
    const [drag, setDrag] = useState<string | null>(null);
    const [, start] = useTransition();
    const list = useRef<HTMLDivElement>(null);
    const [said, setSaid] = useState("");

    // A new order from the server (another display order was chosen) replaces the local one.
    const [seen, setSeen] = useState(initial);
    if (seen !== initial) {
        setSeen(initial);
        setRows(initial);
    }

    const save = (next: Row[], note?: string) => {
        const s = settle(next);
        setRows(s);
        setMode("manual");
        if (note) setSaid(note);
        start(async () => {
            await saveArrangement(s.map((r) => ({ id: r.id, pinned: r.pinned })));
        });
    };
    // A card moved into the pinned places becomes pinned, and out of them, not pinned.
    const landed = (ids: string[], id: string) => {
        const r = rows.find((x) => x.id === id)!;
        const pinned = ids.indexOf(id) < rows.filter((x) => x.pinned).length;
        save(ids.map((x) => (x === id ? { ...r, pinned } : rows.find((y) => y.id === x)!)), `${r.name} עבר למקום ${ids.indexOf(id) + 1}`);
    };
    const place = (id: string, n: number) => landed(moveTo(rows.map((x) => x.id), id, n), id);
    const togglePin = (id: string) => {
        const r = rows.find((x) => x.id === id)!;
        save(rows.map((x) => (x.id === id ? { ...x, pinned: !x.pinned } : x)), r.pinned ? `${r.name} כבר לא נעוץ` : `${r.name} נעוץ בראש הארנק`);
    };

    // Dragging by the handle: the row follows the finger and the list reorders under it.
    const onHandleDown = (e: ReactPointerEvent, id: string) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setDrag(id);
    };
    const onHandleMove = (e: ReactPointerEvent) => {
        if (!drag || !list.current) return;
        const items = [...list.current.querySelectorAll<HTMLElement>("[data-row]")];
        const over = items.findIndex((el) => {
            const b = el.getBoundingClientRect();
            return e.clientY < b.top + b.height / 2;
        });
        const target = over === -1 ? items.length : over;
        const ids = rows.map((r) => r.id);
        const from = ids.indexOf(drag);
        const to = target > from ? target - 1 : target;
        if (to !== from) setRows((cur) => moveTo(cur.map((r) => r.id), drag, to + 1).map((x) => cur.find((r) => r.id === x)!));
    };
    const onHandleUp = () => {
        if (!drag) return;
        landed(rows.map((x) => x.id), drag);
        setDrag(null);
    };

    const pinned = rows.filter((r) => r.pinned);
    const others = rows.filter((r) => !r.pinned);
    const current = moving ? rows.find((r) => r.id === moving) ?? null : null;
    return (
        <main className="min-h-dvh bg-[var(--mh-sun)] pb-10">
            <div className="mx-auto flex w-full max-w-[640px] flex-col gap-3 px-4 pt-5 lg:[zoom:1.2] min-[1800px]:[zoom:1.5]">
                <header className="flex items-center justify-between gap-3">
                    <h1 className="m-0 font-display text-[28px] font-normal">סידור הארנק</h1>
                    <Link href="/wallet" className="inline-flex min-h-11 items-center rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-ink)] px-5 font-extrabold text-white transition-transform hover:-translate-y-px">סיום</Link>
                </header>
                <p className="m-0 text-[15px] font-bold"><bdi>{rows.length}</bdi> חברויות. גררו בידית, או לחצו על המספר כדי להעביר למקום מסוים.</p>
                <section className="flex flex-col gap-2 rounded-[20px] border-2 border-[var(--mh-ink)] bg-white p-3 shadow-[0_3px_0_var(--mh-ink)]">
                    <b id="sortby" className="text-[15px]">סדר הצגה</b>
                    <div role="radiogroup" aria-labelledby="sortby" className="flex flex-wrap gap-2">
                        {SORT_MODES.map((m) => (
                            <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} onClick={() => { setMode(m.id); start(async () => { await setSortMode(m.id); router.refresh(); }); }} className={`inline-flex min-h-11 items-center rounded-full border-2 border-[var(--mh-ink)] px-4 text-[15px] font-extrabold transition-colors ${mode === m.id ? "bg-[var(--mh-ink)] text-white" : "bg-white hover:bg-[var(--mh-ticket)]"}`}>{m.label}</button>
                        ))}
                    </div>
                </section>
                <div ref={list} className="flex flex-col gap-2" onPointerMove={onHandleMove} onPointerUp={onHandleUp} onPointerCancel={onHandleUp}>
                    {pinned.length > 0 && <h2 className="m-0 mt-1 text-[15px] font-extrabold">נעוצות</h2>}
                    {pinned.map((r, i) => <RowView key={r.id} r={r} n={i + 1} dragging={drag === r.id} onHandle={onHandleDown} onPin={togglePin} onPlace={setMoving} />)}
                    {pinned.length > 0 && others.length > 0 && <h2 className="m-0 mt-2 text-[15px] font-extrabold">שאר החברויות</h2>}
                    {others.map((r, i) => <RowView key={r.id} r={r} n={pinned.length + i + 1} dragging={drag === r.id} onHandle={onHandleDown} onPin={togglePin} onPlace={setMoving} />)}
                </div>
                <p role="status" className="sr-only">{said}</p>
                {archived > 0 && (
                    <Link href="/wallet/archive?from=arrange" className="group mt-1 flex min-h-[60px] items-center gap-3 rounded-[18px] border-2 border-dashed border-[var(--mh-ink)] bg-[var(--mh-ticket)] px-4">
                        <span className="flex flex-1 flex-col">
                            <b>ארכיון (<bdi>{archived}</bdi>)</b>
                            <span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">חברויות שפג תוקפן או שהוסתרו</span>
                        </span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform group-hover:-translate-x-[3px]"><path d="M15 6l-6 6 6 6" /></svg>
                    </Link>
                )}
            </div>
            {current && (
                <MoveSheet
                    r={current}
                    at={rows.findIndex((x) => x.id === current.id) + 1}
                    total={rows.length}
                    onClose={() => setMoving(null)}
                    onPlace={(n) => { place(current.id, n); setMoving(null); }}
                    onPin={() => { togglePin(current.id); setMoving(null); }}
                    onArchive={() => {
                        setRows((cur) => cur.filter((x) => x.id !== current.id));
                        setMoving(null);
                        setSaid(`${current.name} עבר לארכיון`);
                        start(async () => { await hideCard(current.id); router.refresh(); });
                    }}
                />
            )}
        </main>
    );
}

function Dot({ r, size }: { r: Row; size: number }) {
    return (
        <span aria-hidden="true" className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--mh-ink)] font-display" style={{ width: size, height: size, background: r.color, color: r.fg, fontSize: size * 0.45 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- the logo is an inline data URL */}
            {r.logo ? <img src={r.logo} alt="" className="h-full w-full object-cover" /> : r.letter}
        </span>
    );
}

function RowView({ r, n, dragging, onHandle, onPin, onPlace }: { r: Row; n: number; dragging: boolean; onHandle: (e: ReactPointerEvent, id: string) => void; onPin: (id: string) => void; onPlace: (id: string) => void }) {
    return (
        <div data-row className={`flex min-h-16 items-center gap-3 rounded-[18px] border-2 border-[var(--mh-ink)] bg-white px-2 transition-[transform,box-shadow] duration-150 ${dragging ? "z-10 scale-[1.02] -rotate-1 shadow-[0_6px_0_var(--mh-ink)]" : "shadow-[0_3px_0_var(--mh-ink)]"}`}>
            <span role="img" aria-label="גרירה להזזה" onPointerDown={(e) => onHandle(e, r.id)} className="inline-flex h-11 w-8 shrink-0 cursor-grab touch-none items-center justify-center text-[var(--mh-ink-soft)] active:cursor-grabbing">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.8" /><circle cx="15" cy="6" r="1.8" /><circle cx="9" cy="12" r="1.8" /><circle cx="15" cy="12" r="1.8" /><circle cx="9" cy="18" r="1.8" /><circle cx="15" cy="18" r="1.8" /></svg>
            </span>
            <Dot r={r} size={40} />
            <span className="flex min-w-0 flex-1 flex-col">
                <b className="truncate text-[16px]">{r.name}</b>
                <span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">{r.role}</span>
            </span>
            <button type="button" aria-pressed={r.pinned} aria-label={r.pinned ? "ביטול נעיצה" : "נעיצה"} onClick={() => onPin(r.id)} className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] transition-transform hover:-rotate-12 ${r.pinned ? "bg-[var(--mh-ink)] text-white" : "bg-white"}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 17v5M9 3h6l-1 6 3 3v2H7v-2l3-3z" /></svg>
            </button>
            <button type="button" aria-label={`מקום ${n}, לשינוי מקום`} onClick={() => onPlace(r.id)} className="inline-flex h-11 w-12 shrink-0 items-center justify-center rounded-[14px] border-2 border-[var(--mh-ink)] bg-[var(--mh-ticket)] font-display text-[20px] transition-transform hover:-translate-y-px">
                <bdi>{n}</bdi>
            </button>
        </div>
    );
}

function MoveSheet({ r, at, total, onClose, onPlace, onPin, onArchive }: { r: Row; at: number; total: number; onClose: () => void; onPlace: (n: number) => void; onPin: () => void; onArchive: () => void }) {
    const [n, setN] = useState(String(at));
    const box = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const prev = document.activeElement as HTMLElement | null;
        box.current?.querySelector<HTMLElement>("button")?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key !== "Tab" || !box.current) return;
            const f = [...box.current.querySelectorAll<HTMLElement>("button, input")];
            if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
            else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
        };
        document.addEventListener("keydown", onKey);
        return () => { document.removeEventListener("keydown", onKey); prev?.focus(); };
    }, [onClose]);
    const act = "flex min-h-[52px] w-full items-center gap-3 border-b border-[#EDE6D6] px-1 text-start text-[16px] font-extrabold last:border-0 hover:bg-[var(--mh-ticket)] disabled:opacity-40";
    const icon = (d: string) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(30,22,51,0.6)] lg:items-center" onClick={onClose}>
            <div ref={box} role="dialog" aria-modal="true" aria-label={`העברת ${r.name}`} onClick={(e) => e.stopPropagation()} className="pay-sheet flex w-full max-w-[480px] flex-col gap-2 rounded-t-[24px] border-t-[2.5px] border-[var(--mh-ink)] bg-white px-4 pb-6 pt-4 lg:rounded-[24px] lg:border-[2.5px]">
                <div className="flex items-center gap-3">
                    <Dot r={r} size={40} />
                    <span className="flex flex-1 flex-col">
                        <b className="text-[17px]">{r.name}</b>
                        <span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">מקום <bdi>{at}</bdi> מתוך <bdi>{total}</bdi></span>
                    </span>
                    <button type="button" aria-label="סגירה" onClick={onClose} className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-white">{icon("M6 6l12 12M18 6L6 18")}</button>
                </div>
                <div className="flex flex-col">
                    <button type="button" className={act} disabled={at === 1} onClick={() => onPlace(at - 1)}>{icon("M12 19V5M5 12l7-7 7 7")}הזזה למעלה</button>
                    <button type="button" className={act} disabled={at === total} onClick={() => onPlace(at + 1)}>{icon("M12 5v14M19 12l-7 7-7-7")}הזזה למטה</button>
                    <button type="button" className={act} disabled={at === 1} onClick={() => onPlace(1)}>{icon("M5 4h14M12 20V9M6 14l6-6 6 6")}לראש הרשימה</button>
                    <button type="button" className={act} disabled={at === total} onClick={() => onPlace(total)}>{icon("M5 20h14M12 4v11M6 10l6 6 6-6")}לסוף הרשימה</button>
                    <form className="flex min-h-[60px] items-center gap-3 border-b border-[#EDE6D6] px-1" onSubmit={(e) => { e.preventDefault(); onPlace(Number(n)); }}>
                        <label htmlFor="place" className="flex-1 text-[16px] font-extrabold">העברה למקום מספר</label>
                        <input id="place" inputMode="numeric" dir="ltr" value={n} onChange={(e) => setN(e.target.value.replace(/\D/g, "").slice(0, 3))} className="h-12 w-16 rounded-[14px] border-2 border-[var(--mh-ink)] text-center font-display text-[20px]" />
                        <button type="submit" className="inline-flex h-12 items-center rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-sun)] px-4 font-extrabold shadow-[0_2px_0_var(--mh-ink)]">העברה</button>
                    </form>
                    <button type="button" className={act} onClick={onPin}>{icon("M12 17v5M9 3h6l-1 6 3 3v2H7v-2l3-3z")}{r.pinned ? "ביטול נעיצה" : "נעיצה בראש הארנק"}</button>
                    {r.locked ? (
                        <p className="m-0 flex min-h-[60px] items-center gap-3 px-1 text-[15px] font-bold text-[var(--mh-ink-soft)]">{icon("M3 4h18v4H3zM5 8v12h14V8M10 12h4")}אפשר להעביר לארכיון אחרי סילוק החוב.</p>
                    ) : (
                        <button type="button" className={act} onClick={onArchive}>{icon("M3 4h18v4H3zM5 8v12h14V8M10 12h4")}העברה לארכיון</button>
                    )}
                </div>
            </div>
        </div>
    );
}
