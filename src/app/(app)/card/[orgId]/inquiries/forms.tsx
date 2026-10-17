"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { bigBtn, bigBtnPlain } from "@/components/card/member-header";
import { BODY_MAX } from "@/lib/inquiries";
import { replyInquiry, sendInquiry, type SendResult } from "./actions";

const field = "w-full rounded-[14px] border-2 border-[var(--mh-ink)] bg-white px-[14px] font-semibold outline-none placeholder:text-[var(--mh-ink-soft)] focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)]";
const panel = "flex flex-col gap-4 rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-white p-5 shadow-[0_4px_0_var(--mh-ink)]";
const warn = "m-0 rounded-[14px] bg-[#FFF1D6] p-3 text-[14px] font-bold";

type Kind = { kind: string; label: string; fields: { key: string; label: string; type: string; required?: boolean }[] };

// "פנייה חדשה" (board D-InquiryNew), and in its place, once sent, "הפנייה נשלחה" (board D-InquirySent).
export function NewInquiryForm({ orgId, kinds, earlier, follows: follows0, post }: {
    orgId: string; kinds: Kind[]; earlier: { id: string; label: string }[]; follows: string | null; post: { id: string; title: string } | null;
}) {
    const [kind, setKind] = useState(post ? "general" : "");
    const [body, setBody] = useState("");
    const [fields, setFields] = useState<Record<string, string>>({});
    const [follows, setFollows] = useState(follows0 ?? "");
    const [res, setRes] = useState<SendResult | null>(null);
    const [busy, start] = useTransition();
    const def = kinds.find((k) => k.kind === kind);
    if (res?.id)
        return (
            <section className={`${panel} scan-pop items-center text-center`} aria-labelledby="sent-h">
                <span aria-hidden="true" className="grid h-16 w-16 place-items-center rounded-full border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-ok)] text-white">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
                </span>
                <h2 id="sent-h" className="m-0 font-display text-[26px] font-normal">הפנייה נשלחה</h2>
                <p className="m-0 font-semibold text-[var(--mh-ink-soft)]">ההנהלה תקבל אותה ותענה כאן{res.number ? <>, בפנייה <bdi>#{res.number}</bdi></> : null}. נעדכן אתכם כשיש תשובה.</p>
                <div className="flex flex-wrap justify-center gap-3">
                    <Link href={`/card/${orgId}/inquiries/${res.id}`} className={bigBtn}>לפנייה</Link>
                    <Link href={`/card/${orgId}/inquiries`} className={bigBtnPlain}>הפניות שלי</Link>
                </div>
            </section>
        );
    return (
        <form className={panel} onSubmit={(e) => { e.preventDefault(); start(async () => setRes(await sendInquiry(orgId, { kind, body, fields, followsId: follows || null, postId: post?.id ?? null }))); }}>
            {post && <p className="m-0 rounded-[14px] bg-[var(--mh-ticket)] p-3 font-bold">בהמשך להודעה: {post.title}</p>}
            <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
                <legend className="mb-2 text-[16px] font-extrabold">על מה הפנייה?</legend>
                <div role="radiogroup" aria-label="על מה הפנייה" className="flex flex-wrap gap-2">
                    {kinds.map((k) => (
                        <button key={k.kind} type="button" role="radio" aria-checked={kind === k.kind} onClick={() => { setKind(k.kind); setRes(null); }}
                            className={`min-h-11 rounded-full border-2 border-[var(--mh-ink)] px-4 font-extrabold transition-[transform,background-color] duration-150 hover:-translate-y-px ${kind === k.kind ? "bg-[var(--mh-ink)] text-white" : "bg-white hover:bg-[var(--mh-ticket)]"}`}>
                            {k.label}
                        </button>
                    ))}
                </div>
            </fieldset>
            {def?.fields.map((f) => (
                <label key={f.key} className="flex flex-col gap-2">
                    <span className="text-[14px] font-extrabold">{f.label}{!f.required && <span className="font-semibold text-[var(--mh-ink-soft)]"> (לא חובה)</span>}</span>
                    <input value={fields[f.key] ?? ""} onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })} required={f.required} inputMode={f.type === "number" ? "decimal" : undefined} maxLength={200} className={`${field} min-h-11`} />
                </label>
            ))}
            {earlier.length > 0 && !post && (
                <label className="flex flex-col gap-2">
                    <span className="text-[14px] font-extrabold">בהמשך לפנייה קודמת <span className="font-semibold text-[var(--mh-ink-soft)]">(לא חובה)</span></span>
                    <select value={follows} onChange={(e) => setFollows(e.target.value)} className={`${field} min-h-11`}>
                        <option value="">לא, פנייה חדשה</option>
                        {earlier.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
                    </select>
                </label>
            )}
            <label className="flex flex-col gap-2">
                <span className="flex items-baseline justify-between gap-2">
                    <span className="text-[14px] font-extrabold">כמה מילים</span>
                    <span className="text-[13px] font-bold text-[var(--mh-ink-soft)]"><bdi>{[...body].length}</bdi> מתוך {BODY_MAX}</span>
                </span>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} maxLength={BODY_MAX} placeholder={kind === "other" ? "כתבו על מה הפנייה" : "אפשר לפרט, או להשאיר ריק"} className={`${field} py-3`} />
            </label>
            <p className={warn}>אל תכתבו כאן מידע רפואי או מזהה רגיש.</p>
            <p className="m-0 text-[14px] font-semibold text-[var(--mh-ink-soft)]">הפנייה מגיעה להנהלה בשמכם. חברים אחרים לא רואים אותה.</p>
            {res?.error && <p role="alert" className="m-0 font-extrabold text-[#B0182F]">{res.error}</p>}
            <button type="submit" disabled={busy || !kind} className={bigBtn}>{busy ? "שולחים…" : "שליחה להנהלה"}</button>
        </form>
    );
}

// "התגובה שלכם" and "סגירת הפנייה" (board D-InquiryView).
export function MemberReply({ orgId, id }: { orgId: string; id: string }) {
    const [body, setBody] = useState("");
    const [error, setError] = useState("");
    const [busy, start] = useTransition();
    const go = (close: boolean) => start(async () => {
        const r = await replyInquiry(orgId, id, { body, close });
        setError(r.error ?? "");
        if (!r.error) setBody("");
    });
    return (
        <form className={panel} onSubmit={(e) => { e.preventDefault(); go(false); }}>
            <label className="flex flex-col gap-2">
                <span className="text-[16px] font-extrabold">התגובה שלכם</span>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={BODY_MAX} placeholder="אפשר להגיב עד שהפנייה נסגרת" className={`${field} py-3`} />
            </label>
            <p className={warn}>אל תכתבו כאן מידע רפואי או מזהה רגיש.</p>
            {error && <p role="alert" className="m-0 font-extrabold text-[#B0182F]">{error}</p>}
            <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={busy || !body.trim()} className={bigBtn}>{busy ? "שולחים…" : "שליחת תגובה"}</button>
                <button type="button" disabled={busy} onClick={() => go(true)} className={bigBtnPlain}>סגירת הפנייה</button>
            </div>
        </form>
    );
}
