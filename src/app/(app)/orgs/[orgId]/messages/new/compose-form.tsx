"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { onColor } from "@/lib/color";
import { peopleCount } from "@/lib/billing/charge-plan";
import { firstLine, pickMsgRecipients, type MessageInput, type MsgAudience, type MsgRecipient } from "@/lib/messages-admin";
import { POST_BODY_MAX, POST_TITLE_MAX } from "@/lib/reactions";
import { OrgDot, type OrgLook } from "@/components/pay/parts";
import { saveMessageDraft, sendOrgMessage, type MessageResult } from "../actions";

const panel = "flex flex-col gap-4 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_3px_0_var(--mh-ink)] md:p-5";
const lbl = "text-[15px] font-extrabold";
const field = "min-h-12 w-full rounded-[14px] border-2 border-[var(--mh-ink)] bg-white px-3 text-[16px] font-bold outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)]";
const btn = "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] px-[18px] text-[15px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none disabled:opacity-60";
const hint = "text-[13px] font-semibold text-[var(--mh-ink-soft)]";

type Who = "all" | "group" | "picked";
type R = Pick<MsgRecipient, "linkId" | "name" | "planIds" | "labelIds" | "owes">;

export function ComposeForm({ orgId, org, start, draftId, recipients, plans, labels }: {
    orgId: string; org: OrgLook; start: MessageInput; draftId: string | null;
    recipients: R[]; plans: { id: string; name: string }[]; labels: { id: string; name: string }[];
}) {
    const [v, setV] = useState<MessageInput>(start);
    const s0 = start.audience;
    const [who, setWho] = useState<Who>(s0.to === "all" ? "all" : s0.to === "picked" ? "picked" : "group");
    const [group, setGroup] = useState(s0.to === "debt" ? "debt" : s0.to === "plan" ? `p:${s0.planId}` : s0.to === "label" ? `l:${s0.labelId}` : "debt");
    const [picked, setPicked] = useState<string[]>(s0.to === "picked" ? s0.linkIds : []);
    const [q, setQ] = useState("");
    const [draft, setDraft] = useState(draftId);
    const [note, setNote] = useState<MessageResult | null>(null);
    const [sent, setSent] = useState<MessageResult | null>(null);
    const [busy, run] = useTransition();
    const set = <K extends keyof MessageInput>(k: K, x: MessageInput[K]) => setV((o) => ({ ...o, [k]: x }));

    const audience: MsgAudience = who === "all" ? { to: "all" } : who === "picked" ? { to: "picked", linkIds: picked }
        : group === "debt" ? { to: "debt" } : group.startsWith("p:") ? { to: "plan", planId: group.slice(2) } : group.startsWith("l:") ? { to: "label", labelId: group.slice(2) } : { to: "debt" };
    const to = pickMsgRecipients(recipients, audience);
    const count = (a: MsgAudience) => pickMsgRecipients(recipients, a).length;
    const groupName = group === "debt" ? "מי שבחוב" : group.startsWith("p:") ? plans.find((p) => p.id === group.slice(2))?.name : labels.find((l) => l.id === group.slice(2))?.name;
    const input = { ...v, audience };
    const shown = recipients.filter((r) => !q.trim() || r.name.includes(q.trim()));
    const personal = who === "picked" && to.length === 1;

    const save = () => {
        setNote(null);
        run(async () => {
            const r = await saveMessageDraft(orgId, input, draft ?? undefined);
            if (r.draftId) setDraft(r.draftId);
            setNote(r);
        });
    };
    const send = () => {
        setNote(null);
        if (v.title.trim().length < 2) return setNote({ error: "כתבו כותרת קצרה." });
        if (!v.body.trim()) return setNote({ error: "כתבו את ההודעה." });
        if (!to.length) return setNote({ error: who === "picked" ? "בחרו לפחות חבר אחד." : "אין חברים שמתאימים לבחירה הזו." });
        run(async () => {
            const r = await sendOrgMessage(orgId, input, draft ?? undefined);
            if (r.ok) setSent(r);
            else setNote(r);
        });
    };

    if (sent) {
        return (
            <section className={`${panel} max-w-[640px]`} aria-live="polite">
                <h1 className="m-0 font-display text-[26px]">ההודעה נשלחה</h1>
                <p className="m-0 text-[17px] font-bold">{sent.ok}</p>
                <p className="m-0 font-semibold text-[var(--mh-ink-soft)]">החברים רואים אותה בהודעות ובכרטיס החבר שבארנק. כאן תראו מי קרא ומי הגיב.</p>
                <div className="flex flex-wrap gap-2">
                    <Link href={`/orgs/${orgId}/messages?m=${sent.sentId}`} className={`${btn} bg-[var(--mh-sun)]`}>למי קרא</Link>
                    <a href={`/orgs/${orgId}/messages/new`} className={`${btn} bg-white`}>הודעה נוספת</a>
                </div>
            </section>
        );
    }

    const radio = (id: Who, title: string, sub: string) => (
        <button type="button" role="radio" aria-checked={who === id} onClick={() => setWho(id)} className={`flex min-h-[64px] items-center gap-3 rounded-[16px] border-2 border-[var(--mh-ink)] px-[14px] text-start ${who === id ? "bg-[#FFF6D1] shadow-[0_3px_0_var(--mh-ink)]" : "bg-white hover:bg-[var(--mh-ticket)]"}`}>
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-[var(--mh-ink)] bg-white" aria-hidden="true">{who === id && <span className="h-3 w-3 rounded-full bg-[var(--mh-ink)]" />}</span>
            <span className="flex min-w-0 flex-col"><b>{title}</b><span className={hint}>{sub}</span></span>
        </button>
    );
    const check = (k: "email" | "reactable" | "dislike", title: string, sub: string, disabled = false) => (
        <label className={`flex min-h-11 items-start gap-3 py-1 ${disabled ? "opacity-60" : ""}`}>
            <input type="checkbox" checked={v[k] && !disabled} disabled={disabled} onChange={(e) => set(k, e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--mh-ink)]" />
            <span className="flex flex-col"><b>{title}</b><span className={hint}>{sub}</span></span>
        </label>
    );

    return (
        <div className="flex flex-col gap-[14px]">
            <header className="flex flex-wrap items-center gap-3">
                <h1 className="m-0 font-display text-[28px] leading-tight">הודעה לחברים</h1>
                <div className="ms-auto flex flex-wrap gap-2">
                    <button type="button" disabled={busy} onClick={save} className={`${btn} bg-white`}>שמירה כטיוטה</button>
                    <button type="button" disabled={busy} onClick={send} className={btn} style={{ background: org.color, color: org.fg }}>{busy ? "שולחים…" : "שליחה"}</button>
                </div>
            </header>
            {note?.ok && <p role="status" className="m-0 rounded-[14px] border-2 border-[var(--mh-ink)] bg-[#D7F5E8] px-4 py-2 font-extrabold">{note.ok}</p>}
            {note?.error && <p role="alert" className="m-0 rounded-[14px] border-2 border-[#C4223B] bg-[#FFE9E6] px-4 py-2 font-extrabold text-[#B0182F]">{note.error}</p>}
            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-[14px] lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)]">
                <section className={panel} aria-label="תוכן ההודעה">
                    <div className="flex flex-col gap-2">
                        <span className={lbl} id="who-l">נמענים</span>
                        <div role="radiogroup" aria-labelledby="who-l" className="grid grid-cols-1 gap-2 xl:grid-cols-3">
                            {radio("all", "כל החברים הפעילים", peopleCount(recipients.length))}
                            {radio("group", "לפי סינון", who === "group" && groupName ? `${groupName} · ${peopleCount(to.length)}` : "בחוב, מסלול או תווית")}
                            {radio("picked", "חברים נבחרים", picked.length === 1 ? "הודעה אישית" : picked.length ? `${picked.length} נבחרו` : "אחד או כמה מהרשימה")}
                        </div>
                        {who === "group" && (
                            <label className="flex flex-col gap-1">
                                <span className="sr-only">סינון</span>
                                <select value={group} onChange={(e) => setGroup(e.target.value)} className={field}>
                                    <option value="debt">מי שבחוב · {peopleCount(count({ to: "debt" }))}</option>
                                    {plans.length > 0 && <optgroup label="מסלולים">{plans.map((p) => <option key={p.id} value={`p:${p.id}`}>{p.name} · {peopleCount(count({ to: "plan", planId: p.id }))}</option>)}</optgroup>}
                                    {labels.length > 0 && <optgroup label="תוויות">{labels.map((l) => <option key={l.id} value={`l:${l.id}`}>{l.name} · {peopleCount(count({ to: "label", labelId: l.id }))}</option>)}</optgroup>}
                                </select>
                                <span className={hint}>״בחוב״ הוא מי שיש לו חיוב שמועד התשלום שלו עבר.</span>
                            </label>
                        )}
                        {who === "picked" && (
                            <div className="flex flex-col gap-2 rounded-[16px] border-2 border-[var(--mh-ink)] p-2">
                                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="חיפוש לפי שם" aria-label="חיפוש חבר" className="min-h-11 rounded-full border-2 border-[var(--mh-ink)] px-4 font-semibold outline-none" />
                                <fieldset className="m-0 grid max-h-[260px] grid-cols-1 gap-1 overflow-y-auto border-0 p-0 sm:grid-cols-2">
                                    <legend className="sr-only">בחירת חברים</legend>
                                    {shown.map((r) => (
                                        <label key={r.linkId} className="flex min-h-11 items-center gap-3 rounded-[10px] px-2 hover:bg-[var(--mh-ticket)]">
                                            <input type="checkbox" checked={picked.includes(r.linkId)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, r.linkId] : p.filter((x) => x !== r.linkId)))} className="h-5 w-5 accent-[var(--mh-ink)]" />
                                            <span className="truncate font-bold">{r.name}</span>
                                        </label>
                                    ))}
                                    {!shown.length && <span className={`${hint} p-2`}>אין חברים בשם הזה.</span>}
                                </fieldset>
                                {personal && <span className={`${hint} px-2`}>הודעה אישית: תופיע אצל החבר עם הסימון ״אישית, רק לכם״.</span>}
                            </div>
                        )}
                    </div>

                    <label className="flex flex-col gap-1">
                        <span className={lbl}>כותרת</span>
                        <input value={v.title} maxLength={POST_TITLE_MAX} onChange={(e) => set("title", e.target.value)} placeholder="למשל: עבודות בלובי ביום שלישי" className={field} />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className={lbl}>תוכן ההודעה</span>
                        <textarea value={v.body} maxLength={POST_BODY_MAX} onChange={(e) => set("body", e.target.value)} rows={5} className={`${field} min-h-[140px] py-2 font-semibold`} />
                        <span className={hint}>אל תכתבו כאן מידע רפואי או מזהה רגיש.</span>
                    </label>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <fieldset className="m-0 flex flex-col gap-1 border-0 p-0">
                        <legend className={`${lbl} mb-1`}>איך לשלוח</legend>
                        <label className="flex min-h-11 items-start gap-3 py-1">
                            <input type="checkbox" checked disabled className="mt-1 h-5 w-5 shrink-0 accent-[var(--mh-ink)]" />
                            <span className="flex flex-col"><b>התראה באפליקציה</b><span className={hint}>תמיד. ההודעה נשמרת גם בכרטיס החבר.</span></span>
                        </label>
                        {check("email", "דוא״ל", "למי שיש לו מייל בחשבון.")}
                        <label className="flex min-h-11 items-start gap-3 py-1 opacity-60">
                            <input type="checkbox" disabled className="mt-1 h-5 w-5 shrink-0" />
                            <span className="flex flex-col"><b>SMS</b><span className={hint}>ייפתח כשנחבר שירות הודעות.</span></span>
                        </label>
                    </fieldset>

                    <fieldset className="m-0 flex flex-col gap-1 border-0 p-0">
                        <legend className={`${lbl} mb-1`}>אפשרויות</legend>
                        {check("reactable", "לאפשר תגובות", "אייקונים בלבד, בלי טקסט.")}
                        {check("dislike", "לאפשר ״לא אהבתי״", "חברים יוכלו להגיב גם באייקון הזה.", !v.reactable)}
                    </fieldset>
                    </div>
                    <p className="m-0 rounded-[14px] bg-[var(--mh-ticket)] p-3 text-[14px] font-bold">חברים שכיבו הודעות כלליות לא יקבלו. הודעות על חובות ותשלומים מגיעות תמיד.</p>
                </section>

                <aside className="flex flex-col gap-[14px] lg:sticky lg:top-4" aria-label="תצוגה וסיכום">
                    <section className={panel} aria-labelledby="pv-title">
                        <h2 id="pv-title" className="m-0 font-display text-[19px]">כך החבר יראה</h2>
                        <div className="flex items-start gap-3 rounded-[18px] border-2 border-[var(--mh-ink)] bg-white p-3">
                            <OrgDot org={org} size={40} />
                            <span className="flex min-w-0 flex-1 flex-col">
                                <span className="flex flex-wrap items-center gap-2 text-[13px] font-extrabold text-[var(--mh-ink-soft)]">{org.name}{personal && <span className="rounded-full border-2 border-[var(--mh-ink)] bg-[#FFF9EC] px-2 text-[12px] text-[var(--mh-ink)]">אישית, רק לכם</span>}</span>
                                <b className="text-[16px]">{v.title || "כותרת ההודעה"}</b>
                                <span className="truncate text-[14px] font-semibold">{firstLine(v.body) || "שורה ראשונה מתוך ההודעה…"}</span>
                            </span>
                        </div>
                        <dl className="m-0 grid grid-cols-[1fr_auto] gap-x-3 gap-y-2">
                            <dt className="font-bold text-[var(--mh-ink-soft)]">נשלח אל</dt><dd className="m-0 text-end font-extrabold">{peopleCount(to.length)}</dd>
                            <dt className="font-bold text-[var(--mh-ink-soft)]">לא יקבלו (כיבו הודעות)</dt><dd className="m-0 text-end font-extrabold"><bdi>0</bdi></dd>
                        </dl>
                        <button type="button" disabled={busy} onClick={send} className={`${btn} w-full`} style={{ background: org.color, color: onColor(org.color) }}>{busy ? "שולחים…" : `שליחה ל${to.length === 1 ? "חבר אחד" : `-${to.length} חברים`}`}</button>
                    </section>
                </aside>
            </div>
        </div>
    );
}
