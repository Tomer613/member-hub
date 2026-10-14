"use client";

import { useState, useTransition } from "react";
import { approveAll, approveRequest, declineRequest } from "./actions";

export type RequestRow = { id: string; name: string; phone: string | null; note: string | null; when: string; adminNote: string | null };

const pill = "inline-flex min-h-11 items-center justify-center rounded-full border-[2.5px] border-[var(--mh-ink)] px-5 font-extrabold shadow-[var(--mh-shadow)] transition-[transform,box-shadow,background-color] duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)] focus-visible:ring-offset-2 disabled:opacity-60";

export function RequestList({ orgId, tab, rows }: { orgId: string; tab: string; rows: RequestRow[] }) {
    const [pending, start] = useTransition();
    if (!rows.length)
        return (
            <section className="rounded-[24px] border-[2.5px] border-dashed border-[var(--mh-ink)] bg-white p-6 text-center">
                <b className="text-[18px]">{tab === "pending" ? "אין בקשות שמחכות" : tab === "approved" ? "עוד לא אושרו בקשות" : "לא נדחו בקשות"}</b>
                {tab === "pending" && <p className="m-0 mt-1 font-semibold text-[var(--mh-ink-soft)]">כשמישהו יבקש להצטרף דרך הקישור, הבקשה תופיע כאן.</p>}
            </section>
        );
    return (
        <section className="flex flex-col gap-3">
            {tab === "pending" && rows.length > 1 && (
                <div className="flex justify-end">
                    <button type="button" disabled={pending} onClick={() => start(() => approveAll(orgId))} className={`${pill} bg-white hover:bg-[var(--mh-ticket)]`}>
                        לאשר את כולן (<bdi>{rows.length}</bdi>)
                    </button>
                </div>
            )}
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {rows.map((r) => <Row key={r.id} orgId={orgId} row={r} tab={tab} />)}
            </ul>
        </section>
    );
}

function Row({ orgId, row, tab }: { orgId: string; row: RequestRow; tab: string }) {
    const [declining, setDeclining] = useState(false);
    const [reason, setReason] = useState("");
    const [pending, start] = useTransition();
    return (
        <li className={`wz-in flex flex-col gap-3 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white p-[14px] shadow-[var(--mh-shadow)] transition-opacity md:flex-row md:items-center ${pending ? "opacity-60" : ""}`}>
            <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-tint-violet)] font-display text-[20px]" aria-hidden="true">{Array.from(row.name)[0]}</span>
                <div className="flex min-w-0 flex-col">
                    <b className="truncate text-[18px]">{row.name}</b>
                    <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">
                        {row.phone && <><bdi dir="ltr">{row.phone}</bdi> · </>}{row.when}
                    </span>
                </div>
            </div>
            <p className="m-0 min-w-0 flex-1 text-[15px] font-semibold md:max-w-[38%]">
                {row.note ? row.note : <span className="text-[var(--mh-ink-soft)]">בלי הערה</span>}
                {tab === "rejected" && row.adminNote && <span className="mt-1 block text-[13px] text-[var(--mh-ink-soft)]">הערה פנימית: {row.adminNote}</span>}
            </p>
            {tab === "pending" && !declining && (
                <div className="flex shrink-0 gap-2 max-md:w-full">
                    <button type="button" disabled={pending} onClick={() => start(() => approveRequest(orgId, row.id))} className={`${pill} bg-[var(--mh-sun)] max-md:flex-1`}>לאשר</button>
                    <button type="button" disabled={pending} onClick={() => setDeclining(true)} className={`${pill} border-[var(--mh-danger)] bg-white text-[var(--mh-danger)] shadow-none max-md:flex-1`}>לדחות</button>
                </div>
            )}
            {tab === "pending" && declining && (
                <div className="flex w-full flex-col gap-2 md:max-w-[340px]">
                    <label className="flex flex-col gap-1">
                        <span className="text-[13px] font-extrabold">למה? (לא חובה, נשאר אצל המנהלים)</span>
                        <input autoFocus value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} className="min-h-11 rounded-[14px] border-2 border-[var(--mh-ink)] px-3 font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)]" />
                    </label>
                    <div className="flex gap-2">
                        <button type="button" disabled={pending} onClick={() => start(() => declineRequest(orgId, row.id, reason))} className={`${pill} flex-1 border-[var(--mh-danger)] bg-[var(--mh-danger)] text-white`}>לדחות את הבקשה</button>
                        <button type="button" disabled={pending} onClick={() => setDeclining(false)} className="min-h-11 px-3 font-extrabold underline">ביטול</button>
                    </div>
                </div>
            )}
        </li>
    );
}
