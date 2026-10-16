"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { inviteByProfile } from "./actions";

type Org = { id: string; name: string; state: "new" | "member" | "pending" };
const STATE = { new: "עוד לא בארגון", member: "כבר חברים בארגון", pending: "בקשת צירוף כבר מחכה לאישור" };

// After a manager scans a profile code (board D-MAdmScan): who it is (first name only), which org, and
// sending the join invitation.
export function ProfileInvite({ code, name, orgs: initial }: { code: string; name: string; orgs: Org[] }) {
    const [orgs, setOrgs] = useState(initial);
    const [pick, setPick] = useState(initial.find((o) => o.state === "new")?.id ?? initial[0].id);
    const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [busy, start] = useTransition();
    const org = orgs.find((o) => o.id === pick)!;
    const send = () =>
        start(async () => {
            const r = await inviteByProfile(pick, code);
            if (r.sent) {
                setOrgs((all) => all.map((o) => (o.id === pick ? { ...o, state: "pending" } : o)));
                setMsg({ ok: true, text: `נשלחה בקשת צירוף ל${name}. היא תופיע אצלם בהודעות.` });
            } else setMsg({ ok: false, text: r.error ?? "משהו השתבש. נסו שוב." });
        });
    return (
        <section role="dialog" aria-label="חבר חדש שנסרק" className="flex flex-col gap-4 rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-white p-5 shadow-[0_4px_0_var(--mh-ink)]">
            <div className="flex items-center gap-3">
                <span aria-hidden="true" className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-sun)] font-display text-[26px]">{name.slice(0, 1)}</span>
                <span className="flex min-w-0 flex-col">
                    <b className="truncate font-display text-[24px] font-normal leading-tight"><bdi>{name}</bdi></b>
                    <span className="text-[14px] font-bold text-[var(--mh-ink-soft)]">{STATE[org.state]}</span>
                </span>
            </div>
            {orgs.length > 1 && (
                <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
                    <legend className="mb-1 text-[15px] font-extrabold">לאיזה ארגון</legend>
                    <div role="radiogroup" aria-label="לאיזה ארגון" className="flex flex-col gap-2">
                        {orgs.map((o) => (
                            <button key={o.id} type="button" role="radio" aria-checked={pick === o.id} onClick={() => { setPick(o.id); setMsg(null); }}
                                className={`flex min-h-12 items-center justify-between gap-2 rounded-[14px] border-2 border-[var(--mh-ink)] px-3 text-start font-extrabold transition-colors ${pick === o.id ? "bg-[var(--mh-sun)]" : "bg-white hover:bg-[var(--mh-ticket)]"}`}>
                                <span className="truncate">{o.name}</span>
                                {o.state !== "new" && <span className="shrink-0 text-[13px] font-bold text-[var(--mh-ink-soft)]">{o.state === "member" ? "כבר חברים" : "מחכה לאישור"}</span>}
                            </button>
                        ))}
                    </div>
                </fieldset>
            )}
            <p className="m-0 rounded-[16px] border-2 border-dashed border-[var(--mh-ink)] bg-[var(--mh-ticket)] p-3 text-[14px] font-semibold">
                <bdi>{name}</bdi> יקבלו בקשת צירוף ויאשרו אותה בטלפון. עד שיאשרו הם לא יופיעו ברשימת החברים, ואתם רואים רק את השם הפרטי.
            </p>
            {msg && <p role={msg.ok ? "status" : "alert"} className={`m-0 rounded-[14px] border-2 p-3 font-bold ${msg.ok ? "border-[var(--mh-ink)] bg-[var(--mh-tint-ok)]" : "border-[#C4223B] text-[#B0182F]"}`}>{msg.text}</p>}
            <div className="flex flex-col gap-2 min-[420px]:flex-row">
                <button type="button" disabled={busy || org.state !== "new"} onClick={send} className="inline-flex min-h-12 flex-[3] items-center justify-center whitespace-nowrap rounded-full border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-sun)] px-5 text-[16px] font-extrabold shadow-[0_3px_0_var(--mh-ink)] transition-transform hover:-translate-y-px active:translate-y-[2px] active:shadow-none disabled:translate-y-0 disabled:border-[#B8AFC7] disabled:bg-[#DDD6EA] disabled:text-[var(--mh-ink-soft)] disabled:shadow-none">
                    {busy ? "שולחים…" : "שליחת בקשת צירוף"}
                </button>
                <Link href="/scan" className="inline-flex min-h-12 flex-[2] whitespace-nowrap items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-white px-5 text-[16px] font-extrabold">סריקה מחדש</Link>
            </div>
        </section>
    );
}
