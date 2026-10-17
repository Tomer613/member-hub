"use client";

import { useState, useTransition, type ReactNode } from "react";
import { OrgCard } from "@/components/org-card";
import { COLOR_NAMES, LogoPicker } from "@/components/org-look";
import { onColor } from "@/lib/color";
import { IL_CITIES } from "@/lib/il-cities";
import { CITY_MAX, NAME_MAX, PALETTE } from "@/lib/org-setup";
import { ABOUT_MAX, TAGLINE_MAX, shortLine } from "@/lib/org-settings";
import { getPack } from "@/packs";
import { saveOrgDetails, saveOrgLook, saveOrgPublic, type SaveResult } from "./actions";

const panel = "flex flex-col gap-4 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_3px_0_var(--mh-ink)] md:p-5";
const field = "min-h-11 w-full rounded-[14px] border-2 border-[var(--mh-ink)] bg-white px-[14px] font-semibold outline-none placeholder:text-[var(--mh-ink-soft)] focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)]";
const label = "text-[14px] font-extrabold";
const hint = "text-[14px] font-semibold text-[var(--mh-ink-soft)]";
const btn = "inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] px-[22px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none disabled:translate-y-0 disabled:opacity-50 disabled:shadow-none";
const count = (s: string) => [...s].length;

// One group of settings: the fields, "ביטול" and "שמירה", and beside them (on a wide screen) what it looks like.
function Frame({ title, line, dirty, onReset, onSave, preview, children }: {
    title: string; line: string; dirty: boolean; onReset: () => void; onSave: () => Promise<SaveResult>; preview: ReactNode; children: ReactNode;
}) {
    const [res, setRes] = useState<SaveResult | null>(null);
    const [busy, start] = useTransition();
    return (
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-[14px] xl:grid-cols-[minmax(0,1fr)_360px] min-[1800px]:grid-cols-[minmax(0,1fr)_440px]">
            <form className={panel} onSubmit={(e) => { e.preventDefault(); start(async () => setRes(await onSave())); }} onChange={() => setRes(null)}>
                <span className="flex flex-col gap-1">
                    <h2 className="m-0 font-display text-[22px] leading-tight">{title}</h2>
                    <span className={hint}>{line}</span>
                </span>
                {children}
                <div className="flex flex-wrap items-center gap-3 border-t-2 border-[#EDE6D6] pt-4">
                    <button type="submit" disabled={busy || !dirty} className={`${btn} bg-[var(--mh-sun)]`}>{busy ? "שומרים…" : "שמירה"}</button>
                    <button type="button" disabled={busy || !dirty} onClick={() => { onReset(); setRes(null); }} className={`${btn} bg-white`}>ביטול</button>
                    {res?.saved && <span role="status" className="font-bold text-[#00573A]">{res.saved}</span>}
                    {res?.error && <span role="alert" className="font-extrabold text-[#B0182F]">{res.error}</span>}
                </div>
            </form>
            <aside className={`${panel} bg-[var(--mh-ticket)]`} aria-label="תצוגה מקדימה">{preview}</aside>
        </div>
    );
}

export function DetailsForm({ orgId, name: name0, city: city0, packId, color, logo }: { orgId: string; name: string; city: string; packId: string; color: string; logo: string | null }) {
    const [name, setName] = useState(name0);
    const [city, setCity] = useState(city0);
    return (
        <Frame title="פרטי הארגון" line="השם והעיר מופיעים בכרטיס החבר, בחיפוש ובקישור ההצטרפות."
            dirty={name !== name0 || city !== city0} onReset={() => { setName(name0); setCity(city0); }}
            onSave={() => saveOrgDetails(orgId, { name, city })}
            preview={<><b className="font-display text-[18px]">כך זה נראה בכרטיס</b><OrgCard name={name.trim()} city={city.trim()} color={color} logo={logo} /></>}>
            <label className="flex flex-col gap-2">
                <span className="flex items-baseline justify-between gap-2"><span className={label}>שם הארגון</span><span className={hint}><bdi>{count(name)}</bdi> מתוך {NAME_MAX}</span></span>
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={NAME_MAX} required className={field} autoComplete="organization" />
            </label>
            <label className="flex flex-col gap-2">
                <span className={label}>עיר</span>
                <input value={city} onChange={(e) => setCity(e.target.value)} list="il-cities" maxLength={CITY_MAX} placeholder="מתחילים להקליד" className={`${field} max-w-[420px]`} autoComplete="address-level2" />
                <span className={hint}>עוזרת לחברים למצוא אתכם בחיפוש.</span>
                <datalist id="il-cities">{IL_CITIES.map((c) => <option key={c} value={c} />)}</datalist>
            </label>
            <div className="flex flex-col gap-1 rounded-[14px] bg-[var(--mh-ticket)] p-3">
                <span className={label}>סוג הארגון</span>
                <b>{getPack(packId).name}</b>
                <span className={hint}>החלפת סוג הארגון תיפתח כאן בהמשך.</span>
            </div>
        </Frame>
    );
}

export function PublicForm({ orgId, name, city, color, logo, listed: listed0, tagline: tagline0, about: about0, approval: approval0, isOwner }: {
    orgId: string; name: string; city: string; color: string; logo: string | null; listed: boolean; tagline: string; about: string; approval: boolean; isOwner: boolean;
}) {
    const [listed, setListed] = useState(listed0);
    const [approval, setApproval] = useState(approval0);
    const [tagline, setTagline] = useState(tagline0);
    const [about, setAbout] = useState(about0);
    const preview = (
        <>
            <b className="font-display text-[18px]">כך זה נראה בחיפוש</b>
            <div className={`flex items-center gap-3 rounded-[16px] border-2 border-[var(--mh-ink)] bg-white p-3 ${listed ? "" : "opacity-60"}`}>
                <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-[var(--mh-ink)] font-display text-[20px]" style={{ background: color, color: onColor(color) }} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element -- the logo is an inline data URL */}
                    {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : [...name][0]}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                    <b className="truncate">{name}</b>
                    <span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">{tagline.trim() ? shortLine(tagline.trim()) : city || "בלי משפט הזמנה"}</span>
                </span>
                <span className={`shrink-0 rounded-full border-2 border-[var(--mh-ink)] px-2 text-[12px] font-extrabold ${listed ? "bg-[var(--mh-tint-ok)]" : "bg-white"}`}>{listed ? (approval ? "בבקשה לאישור" : "הצטרפות מיידית") : "לא בחיפוש"}</span>
            </div>
            <p className="m-0 text-[14px] font-bold">{listed ? "כשהארגון ציבורי, השם, העיר ומשפט ההזמנה נראים לכל מי שמחפש. פרטי חברים לעולם לא." : "הארגון לא מופיע בחיפוש. מצטרפים רק בקישור ההצטרפות או בהזמנה."}</p>
        </>
    );
    return (
        <Frame title="נראות והזמנה" line="האם אנשים שלא הוזמנו יכולים למצוא את הארגון, ומה הם קוראים עליו."
            dirty={listed !== listed0 || approval !== approval0 || tagline !== tagline0 || about !== about0} onReset={() => { setListed(listed0); setApproval(approval0); setTagline(tagline0); setAbout(about0); }}
            onSave={() => saveOrgPublic(orgId, { listed, approval, tagline, about })} preview={preview}>
            <Toggle on={listed} onChange={setListed} title="ארגון ציבורי" line="מופיע בחיפוש ארגונים. כבוי: אפשר להצטרף רק בקישור או בהזמנה." />
            <Toggle on={approval} onChange={setApproval} locked={!isOwner} title="הצטרפות באישור מנהל"
                line={`${approval ? "מי שמבקש להצטרף נכנס לבקשות ההצטרפות, ומצטרף רק אחרי שאישרתם." : "כבוי: הצטרפות מיידית. מי שמצטרף מהחיפוש או מקישור ההצטרפות הופך לחבר מיד, ואתם מקבלים הודעה."}${isOwner ? "" : " רק המנהל הראשי יכול לשנות את זה."}`} />
            {!approval && approval0 && <p className="m-0 rounded-[14px] bg-[#FFF1D6] p-3 text-[14px] font-bold">שימו לב: כל מי שיש לו את הקישור, או שמוצא את הארגון בחיפוש, ייכנס מיד ויראה את ההודעות והפעילויות של הארגון. בקשות שכבר מחכות נשארות לאישור שלכם. הזמנות אישיות לא משתנות.</p>}
            <label className="flex flex-col gap-2">
                <span className="flex items-baseline justify-between gap-2"><span className={label}>משפט ההזמנה</span><span className={hint}><bdi>{count(tagline)}</bdi> מתוך {TAGLINE_MAX}</span></span>
                <input value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={TAGLINE_MAX} placeholder="למשל: בית כנסת קהילתי בלב השכונה. מזמינים אתכם להצטרף." className={field} />
                <span className={hint}>מופיע בחיפוש ובעמוד קישור ההצטרפות.</span>
            </label>
            <label className="flex flex-col gap-2">
                <span className="flex items-baseline justify-between gap-2"><span className={label}>פירוט <span className="font-semibold text-[var(--mh-ink-soft)]">(לא חובה)</span></span><span className={hint}><bdi>{count(about)}</bdi> מתוך {ABOUT_MAX}</span></span>
                <textarea value={about} onChange={(e) => setAbout(e.target.value)} maxLength={ABOUT_MAX} rows={4} placeholder="מה קורה אצלכם, למי זה מתאים" className={`${field} py-3`} />
                <span className={hint}>מופיע בעמוד קישור ההצטרפות, מתחת למשפט ההזמנה.</span>
            </label>
        </Frame>
    );
}

export function LookForm({ orgId, name, city, color: color0, logo: logo0 }: { orgId: string; name: string; city: string; color: string; logo: string | null }) {
    const [color, setColor] = useState(color0);
    const [logo, setLogo] = useState(logo0);
    return (
        <Frame title="מראה וצבע" line="מה שמזהה את הארגון: צבע אחד, והמערכת דואגת שהטקסט עליו יישאר קריא."
            dirty={color !== color0 || logo !== logo0} onReset={() => { setColor(color0); setLogo(logo0); }}
            onSave={() => saveOrgLook(orgId, { color, logo: logo === logo0 ? undefined : logo })}
            preview={<><b className="font-display text-[18px]">כך זה נראה בכרטיס החבר</b><OrgCard name={name} city={city} color={color} logo={logo} size="lg" /></>}>
            <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
                <legend className={`${label} mb-2`}>צבע הארגון</legend>
                <div role="radiogroup" aria-label="צבע הארגון" className="flex flex-wrap gap-3">
                    {PALETTE.map((c) => (
                        <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={COLOR_NAMES[c]} onClick={() => setColor(c)}
                            className={`h-11 w-11 rounded-full border-[2.5px] border-[var(--mh-ink)] transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)] focus-visible:ring-offset-2 ${color === c ? "scale-110 shadow-[0_0_0_3px_#fff,0_0_0_5.5px_var(--mh-ink)]" : ""}`}
                            style={{ background: c }} />
                    ))}
                </div>
                <span className={hint}>הצבע מופיע בתפריט הניהול, בכרטיס החברות ובכפתורים הראשיים. הרקע נשאר צהוב לכולם.</span>
            </fieldset>
            <LogoPicker logo={logo} onChange={setLogo} />
        </Frame>
    );
}

function Toggle({ on, onChange, locked = false, title, line }: { on: boolean; onChange?: (v: boolean) => void; locked?: boolean; title: string; line: string }) {
    return (
        <label className={`flex items-center justify-between gap-3 rounded-[18px] border-[2.5px] border-[var(--mh-ink)] p-[14px] transition-colors duration-200 ${locked ? "cursor-not-allowed border-dashed bg-white" : "cursor-pointer"} ${on && !locked ? "bg-[var(--mh-tint-sun)]" : "bg-white"}`}>
            <span className="flex min-w-0 flex-col gap-1">
                <b className="text-[17px] leading-tight">{title}</b>
                <span className={hint}>{line}</span>
            </span>
            <input type="checkbox" role="switch" checked={on} disabled={locked} onChange={(e) => onChange?.(e.target.checked)} className="peer sr-only" />
            <span aria-hidden="true" className={`relative inline-flex h-8 w-14 shrink-0 rounded-full border-[2.5px] border-[var(--mh-ink)] transition-colors duration-200 peer-focus-visible:ring-[3px] peer-focus-visible:ring-[var(--mh-ink)] peer-focus-visible:ring-offset-2 ${on ? "bg-[var(--mh-ok)]" : "bg-white"} ${locked ? "opacity-60" : ""}`}>
                <span className={`absolute top-[2px] h-[22px] w-[22px] rounded-full border-2 border-[var(--mh-ink)] bg-white transition-[inset-inline-start] duration-200 ${on ? "start-[26px]" : "start-[2px]"}`} />
            </span>
        </label>
    );
}
