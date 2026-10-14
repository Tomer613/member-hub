"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { revokeOtherSessions, revokeSession } from "../../actions";

export type DeviceRow = { id: string; label: string; deviceKind: string; city: string | null; lastSeen: string; current: boolean };

// Connected devices (decided 13.10.2026): approximate city with "(בערך)" and a "?" that explains it and
// leads straight to disconnecting. We never ask the device for its location.
export function DeviceList({ rows }: { rows: DeviceRow[] }) {
    const [about, setAbout] = useState<DeviceRow | null>(null);
    const [pending, start] = useTransition();
    const cut = (id: string) => start(async () => { setAbout(null); await revokeSession(id); });

    return (
        <>
            <section className="flex flex-col rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-white px-4 shadow-[0_4px_0_var(--mh-ink)]">
                {rows.map((d) => (
                    <div key={d.id} className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 border-b-2 border-[var(--mh-line-soft)] py-[14px] last:border-b-0">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[var(--mh-ink)] bg-[var(--mh-ticket)]" aria-hidden="true">
                            {d.deviceKind === "computer" ? (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="4" y="5" width="16" height="11" rx="2" /><path d="M2 19h20" /></svg>
                            ) : (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="6" y="3" width="12" height="18" rx="2" /><path d="M10 17h4" /></svg>
                            )}
                        </span>
                        <div className="min-w-0">
                            <b className="block">{d.label}</b>
                            <span className="flex items-center gap-1 text-sm font-semibold text-[var(--mh-ink-soft)]">
                                {d.city ? `${d.city} (בערך)` : "מיקום לא ידוע"}
                                <button type="button" onClick={() => setAbout(d)} aria-label="מה זה המיקום?" className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-white text-xs font-black text-[var(--mh-ink)]">?</button>
                            </span>
                            <span className="block text-sm font-semibold text-[var(--mh-ink-soft)]">{d.current ? "פעיל עכשיו" : d.lastSeen}</span>
                            {d.current && <span className="mt-1 inline-block rounded-[10px] border-2 border-[var(--mh-ink)] bg-[var(--mh-sun)] px-2 text-xs font-extrabold">המכשיר הזה</span>}
                        </div>
                        {!d.current && (
                            <button type="button" disabled={pending} onClick={() => cut(d.id)} className="min-h-10 rounded-full border-2 border-[var(--mh-ink)] bg-white px-[14px] text-sm font-extrabold">לנתק</button>
                        )}
                    </div>
                ))}
            </section>
            {rows.length > 1 && (
                <Button variant="secondary" disabled={pending} onClick={() => start(() => revokeOtherSessions())}>לנתק את כל השאר</Button>
            )}
            <Modal open={!!about} onClose={() => setAbout(null)} title={about?.city ? `${about.city} (בערך)` : "מיקום לא ידוע"}>
                <p className="mt-0 font-semibold">המיקום משוער לפי הרשת ולכן לא תמיד מדויק. לא מזהים את המכשיר? נתקו אותו, ונשלח לכם קוד חדש בכניסה הבאה.</p>
                <div className="flex flex-col gap-2">
                    {about && !about.current && <Button variant="highlight" onClick={() => cut(about.id)}>לנתק את המכשיר</Button>}
                    <Button variant="secondary" onClick={() => setAbout(null)}>{about?.current ? "הבנתי" : "זה המכשיר שלי"}</Button>
                </div>
            </Modal>
        </>
    );
}
