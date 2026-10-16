"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type InputHTMLAttributes, type ReactNode, type RefObject } from "react";
import { CopyLink } from "@/components/copy-link";
import { OrgCard } from "@/components/org-card";
import { COLOR_NAMES, LogoPicker } from "@/components/org-look";
import { getPack } from "@/packs";
import { IL_CITIES } from "@/lib/il-cities";
import {
    DEFAULT_COLOR, NAME_MAX, PALETTE, STEP_LABELS, parsePhoneList, wizardSteps,
    type Collection, type PackChoice, type StepKey,
} from "@/lib/org-setup";
import { MAX_INVITED, amountOwed, formatShekels, formatWhen, shekelsToMinor, type Access, type CelebrationSettings, type MoneyMode, type Per } from "@/lib/celebration";
import { finishCelebration, finishSetup, invitePhones, saveAccountStep, saveCollection, saveLook, saveMoney, saveName, saveType, saveWhen } from "./actions";

// The org setup wizard, one decision per screen (decided with Tommy 14.10.2026, docs/open-questions.he.md,
// "אשף פתיחת ארגון: מסך אחר מסך"): name, type, card, collection, account (only when collecting through
// the system), invite. Layout follows boards D-AdmWizard1-5: step bar, a main card and a side card.
// A celebration (decided 14.10.2026) goes from the type straight to: when and where, money, who can come in.

export type Draft = {
    orgId: string | null;
    step: StepKey;
    name: string;
    packId: PackChoice | null;
    color: string | null;
    city: string;
    logo: string | null;
    collection: Collection | null;
    joinToken: string | null;
    celebration: CelebrationSettings;
};

const TYPES: { id: PackChoice; label: string; line: string; tools: string[] }[] = [
    { id: "synagogue", label: "בית כנסת", line: "תפילות, תרומות, יארצייט", tools: ["תפילות ולוח זמנים", "תרומות ונדרים", "יארצייט"] },
    { id: "hoa", label: "ועד בית", line: "דמי ועד, תקלות, אסיפות", tools: ["דמי ועד לפי דירה", "תקלות ותחזוקה", "אסיפות דיירים"] },
    { id: "gym", label: "חדר כושר", line: "מנויים, שיעורים, הקפאות", tools: ["מנויים וכרטיסיות", "שיעורים", "הקפאת מנוי"] },
    { id: "club", label: "מועדון", line: "רמות חברות, אירועים, הטבות", tools: ["רמות חברות", "אירועים", "הטבות לחברים"] },
    { id: "celebration", label: "אירוע או חגיגה", line: "יום הולדת, שבע ברכות, מסיבה", tools: ["אישורי הגעה וכמה מגיעים", "מעקב תשלומים למתנה", "מסיבת הפתעה"] },
    { id: "generic", label: "משהו אחר", line: "רק הבסיס: חברים, כספים, הודעות", tools: [] },
];

const COLLECTIONS: { id: Collection; label: string; line: string; tag?: string }[] = [
    { id: "system", label: "גבייה דרך המערכת", tag: "מומלץ", line: "החברים משלמים בכרטיס או בהוראת קבע, והכסף מועבר אליכם." },
    { id: "manual", label: "דיווח ידני בלבד", line: "החברים משלמים מחוץ למערכת (מזומן, העברה), ואתם מסמנים מה שולם." },
    { id: "none", label: "בלי כסף בכלל", line: "בלי תשלומים. רק רשימת חברים, הודעות ואירועים." },
];

const BANKS = [
    "הפועלים (12)", "לאומי (10)", "דיסקונט (11)", "מזרחי טפחות (20)", "הבינלאומי (31)", "מרכנתיל (17)",
    "ירושלים (54)", "מסד (46)", "יהב (4)", "פאג״י (52)", "וואן זירו (18)", "בנק הדואר (9)",
];


const box = "rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-white shadow-[0_4px_0_var(--mh-ink)]";
const h2 = "m-0 font-display text-[clamp(24px,2.2vw,30px)] leading-[1.15] [text-wrap:balance]";
const sub = "m-0 mt-1 font-semibold text-[var(--mh-ink-soft)]";
const pill = "inline-flex min-h-[var(--mh-hit)] items-center justify-center gap-2 rounded-full border-[2.5px] border-[var(--mh-ink)] px-[22px] font-extrabold shadow-[var(--mh-shadow)] transition-[transform,box-shadow,background-color] duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:translate-y-0 disabled:border-[#B8AFC7] disabled:bg-[#EDE6D6] disabled:text-[var(--mh-ink-soft)] disabled:shadow-none";
const primary = `${pill} bg-[var(--mh-org-violet)] text-white hover:bg-[#4A2EE0]`;
const secondary = `${pill} bg-white text-[var(--mh-ink)] hover:bg-[var(--mh-ticket)]`;
const field = "min-h-[var(--mh-hit)] w-full rounded-[14px] border-2 border-[var(--mh-ink)] bg-white px-[14px] font-semibold outline-none placeholder:text-[var(--mh-ink-soft)] focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)]";
const label = "text-[14px] font-extrabold";

export function Wizard({ draft }: { draft: Draft }) {
    const [orgId, setOrgId] = useState(draft.orgId);
    const [joinToken, setJoinToken] = useState(draft.joinToken);
    const [step, setStep] = useState<StepKey>(draft.step);
    const [name, setName] = useState(draft.name);
    const [packId, setPackId] = useState<PackChoice | null>(draft.packId);
    const [color, setColor] = useState<string | null>(draft.color);
    const [city, setCity] = useState(draft.city);
    const [logo, setLogo] = useState<string | null>(draft.logo);
    const [logoChanged, setLogoChanged] = useState(false);
    const [collection, setCollection] = useState<Collection>(draft.collection ?? "system");
    const [inviteWith, setInviteWith] = useState<"link" | "phone" | "import">("link");
    const c0 = draft.celebration;
    const [date, setDate] = useState(c0.startsAt?.slice(0, 10) ?? "");
    const [time, setTime] = useState(c0.startsAt?.slice(11, 16) ?? "");
    const [place, setPlace] = useState(c0.place ?? "");
    const [moneyMode, setMoneyMode] = useState<MoneyMode>(c0.money.mode);
    const [per, setPer] = useState<Per>(c0.money.per);
    const [amount, setAmount] = useState(c0.money.amountMinor ? String(c0.money.amountMinor / 100) : "");
    const [kidAmount, setKidAmount] = useState(c0.money.kidAmountMinor ? String(c0.money.kidAmountMinor / 100) : "");
    const [kidPriceOpen, setKidPriceOpen] = useState(!!c0.money.kidAmountMinor);
    const [payLink, setPayLink] = useState(c0.money.payLink ?? "");
    const [goal, setGoal] = useState(c0.money.goalMinor ? String(c0.money.goalMinor / 100) : "");
    const [surprise, setSurprise] = useState(c0.surprise.on);
    const [honoree, setHonoree] = useState(c0.surprise.honoree ?? "");
    const [honoreePhone, setHonoreePhone] = useState(c0.surprise.phone ?? "");
    const [kidsInvited, setKidsInvited] = useState(c0.kids);
    const [access, setAccess] = useState<Access>(c0.access);
    const [invitedRaw, setInvitedRaw] = useState(c0.invited.join("\n"));
    const [error, setError] = useState("");
    const [pending, start] = useTransition();

    const steps = wizardSteps(collection, packId);
    const index = Math.max(0, steps.indexOf(step));
    const shownColor = color ?? DEFAULT_COLOR[packId ?? "synagogue"];
    const heading = useRef<HTMLHeadingElement>(null);

    // Each new screen starts at the top with focus on its heading, so screen readers announce it.
    const first = useRef(true);
    useEffect(() => {
        if (first.current) { first.current = false; return; }
        window.scrollTo({ top: 0, behavior: "smooth" });
        heading.current?.focus({ preventScroll: true });
    }, [step]);

    const go = (to: StepKey) => { setError(""); setStep(to); };
    const back = () => index > 0 && go(steps[index - 1]);

    const next = () => {
        setError("");
        start(async () => {
            if (step === "name") {
                const r = await saveName(orgId, name);
                if (r.error || !r.orgId) return setError(r.error ?? "משהו השתבש. נסו שוב");
                setOrgId(r.orgId);
                setJoinToken(r.joinToken ?? null);
                return go("type");
            }
            if (!orgId) return go("name");
            if (step === "type") {
                if (!packId) return setError("בחרו את סוג הארגון");
                const r = await saveType(orgId, packId);
                if (r.error) return setError(r.error);
                return go(packId === "celebration" ? "when" : "look");
            }
            if (step === "look") {
                const r = await saveLook(orgId, { color: shownColor, city, logo: logoChanged ? logo : undefined });
                if (r.error) return setError(r.error);
                setColor(shownColor);
                setLogoChanged(false);
                return go("collection");
            }
            if (step === "collection") {
                const r = await saveCollection(orgId, collection);
                if (r.error) return setError(r.error);
                return go(collection === "system" ? "account" : "invite");
            }
            if (step === "account") {
                await saveAccountStep(orgId);
                return go("invite");
            }
            if (step === "when") {
                const r = await saveWhen(orgId, { date, time, place, city, kids: kidsInvited });
                if (r.error) return setError(r.error);
                return go("money");
            }
            if (step === "money") {
                const r = await saveMoney(orgId, { mode: moneyMode, per, amount, kidAmount: kidsInvited && kidPriceOpen ? kidAmount : "", payLink, goal });
                if (r.error) return setError(r.error);
                return go("access");
            }
            if (step === "access") {
                const r = await finishCelebration(orgId, { surprise, honoree, phone: honoreePhone, access, invited: invitedRaw });
                if (r?.error) return setError(r.error);
            }
        });
    };

    const finish = (how: string) => {
        if (!orgId) return;
        start(async () => { await finishSetup(orgId, how); });
    };

    const pack = getPack(packId ?? "generic");
    const type = TYPES.find((t) => t.id === packId);
    const card = <OrgCard name={name.trim()} city={city.trim()} color={shownColor} logo={logo} note="כך החברים יראו את הארגון בארנק." size={step === "look" ? "lg" : "md"} />;

    let main: ReactNode;
    let side: ReactNode;
    let sideFirstOnPhone = false;

    if (step === "name") {
        main = (
            <>
                <Head refEl={heading} title="איך קוראים לארגון שלכם?" text="זה מה שהחברים יראו בראש הכרטיס שלהם." />
                <label className="mt-2 flex flex-col gap-2">
                    <span className="sr-only">שם הארגון</span>
                    <input
                        autoFocus
                        value={name}
                        maxLength={NAME_MAX}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && name.trim().length >= 2) next(); }}
                        placeholder="למשל: בית הכנסת אור חדש"
                        className={`${field} min-h-[68px] rounded-[18px] border-[2.5px] text-[clamp(20px,2vw,26px)] font-extrabold`}
                        aria-invalid={error ? true : undefined}
                    />
                </label>
                <p className="m-0 text-[14px] font-semibold text-[var(--mh-ink-soft)]">את השם אפשר לשנות בכל רגע בהגדרות.</p>
            </>
        );
        side = <Side title="כך הכרטיס ייראה">{card}</Side>;
    } else if (step === "type") {
        main = (
            <>
                <Head refEl={heading} title="איזה סוג ארגון אתם?" text="ככה נדבר במילים שלכם ונפתח את הכלים שמתאימים לכם." />
                <div role="radiogroup" aria-label="סוג הארגון" className="mt-1 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                    {TYPES.map((t) => (
                        <Choice key={t.id} name="type" checked={packId === t.id} onPick={() => setPackId(t.id)} title={t.label} line={t.line} />
                    ))}
                </div>
            </>
        );
        side = type ? (
            <Side title={`מה מקבלים ב${type.id === "generic" ? "ארגון כללי" : type.label}`}>
                <dl className="m-0 flex flex-col">
                    <Row k="חבר נקרא" v={pack.terms.member} />
                    <Row k="מנהל נקרא" v={pack.terms.admin} />
                </dl>
                <h4 className="m-0 mt-1 text-[16px] font-extrabold">כלים מיוחדים שנפתחים</h4>
                {type.tools.length ? (
                    <ul className="m-0 flex list-none flex-col gap-2 p-0">
                        {type.tools.map((tool) => (
                            <li key={tool} className="rounded-[14px] border-2 border-dashed border-[var(--mh-ink)] bg-[var(--mh-tint-violet)] px-3 py-2 font-extrabold">{tool}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="m-0 font-semibold text-[var(--mh-ink-soft)]">בלי כלים מיוחדים. את הבסיס מקבלים כולם, ואפשר להוסיף כלים אחר כך.</p>
                )}
                <Info>אפשר להחליף סוג או לכבות כלים אחר כך, בלי לאבד נתונים.</Info>
            </Side>
        ) : (
            <Side title="מה מקבלים">
                <p className="m-0 font-semibold text-[var(--mh-ink-soft)]">בחרו סוג, ונראה כאן איך יקראו לחברים ולמנהלים ואילו כלים נפתחים.</p>
            </Side>
        );
    } else if (step === "look") {
        sideFirstOnPhone = true;
        main = (
            <>
                <Head refEl={heading} title="איך הכרטיס שלכם ייראה?" text="כל שינוי מופיע מיד על הכרטיס." />
                <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
                    <legend className={`${label} mb-2`}>צבע הארגון</legend>
                    <div role="radiogroup" aria-label="צבע הארגון" className="flex flex-wrap gap-[clamp(8px,2.4vw,12px)]">
                        {PALETTE.map((c) => (
                            <button
                                key={c}
                                type="button"
                                role="radio"
                                aria-checked={shownColor === c}
                                aria-label={COLOR_NAMES[c]}
                                onClick={() => setColor(c)}
                                className={`h-11 w-11 rounded-full border-[2.5px] border-[var(--mh-ink)] transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)] focus-visible:ring-offset-2 ${shownColor === c ? "scale-110 shadow-[0_0_0_3px_#fff,0_0_0_5.5px_var(--mh-ink)]" : ""}`}
                                style={{ background: c }}
                            />
                        ))}
                    </div>
                    <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">בוחרים אחד, והמערכת דואגת שהכול יישאר קריא.</span>
                </fieldset>
                <LogoPicker logo={logo} onChange={(v) => { setLogo(v); setLogoChanged(true); }} />
                <label className="flex flex-col gap-2">
                    <span className={label}>עיר</span>
                    <input value={city} onChange={(e) => setCity(e.target.value)} list="il-cities" maxLength={40} placeholder="מתחילים להקליד" className={`${field} max-w-[420px]`} autoComplete="address-level2" />
                    <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">עוזרת לחברים למצוא אתכם בחיפוש.</span>
                    <datalist id="il-cities">{IL_CITIES.map((c) => <option key={c} value={c} />)}</datalist>
                </label>
            </>
        );
        side = (
            <Side title="כך הכרטיס ייראה">
                {card}
                <Info>את כל זה אפשר לשנות בכל רגע בהגדרות.</Info>
            </Side>
        );
    } else if (step === "collection") {
        main = (
            <>
                <Head refEl={heading} title="איך תגבו כסף מהחברים?" text="אפשר לשנות בכל שלב, והבחירה לא מפעילה גבייה עדיין." />
                <div role="radiogroup" aria-label="אופן הגבייה" className="flex flex-col gap-3">
                    {COLLECTIONS.map((c) => (
                        <Choice key={c.id} name="collection" checked={collection === c.id} onPick={() => setCollection(c.id)} title={c.label} tag={c.tag} line={c.line} />
                    ))}
                </div>
            </>
        );
        side = (
            <Side title="מה זה אומר">
                {collection === "system" && <p className="m-0 font-semibold">במסך הבא תזינו את פרטי החשבון שאליו יעבור הכסף. אפשר גם להשלים אותם אחר כך.</p>}
                {collection === "manual" && <p className="m-0 font-semibold">נדלג על פרטי החשבון. החיובים יופיעו לחברים, ואתם מסמנים מה שולם.</p>}
                {collection === "none" && <p className="m-0 font-semibold">נדלג על פרטי החשבון. אם תרצו לגבות בעתיד, מפעילים את זה בהגדרות.</p>}
                <Info>הכסף לא עובר דרך חשבון של PIRI. ספק התשלומים מחזיק את הכסף ומבצע את ההעברות, ואנחנו מנהלים את ההוראות.</Info>
            </Side>
        );
    } else if (step === "account") {
        main = (
            <>
                <Head refEl={heading} title="פרטי חשבון לקבלת כסף" text="מה שמוזן כאן מועבר ישירות לספק התשלומים, ולא נשמר אצלנו." />
                <div role="radiogroup" aria-label="חשבון בנק" className="grid gap-3 sm:grid-cols-2">
                    <Choice name="bank" checked onPick={() => undefined} title="יש לנו חשבון בנק על שם הארגון" line="הכסף יעבור אליו ישירות." />
                    <Choice name="bank" checked={false} disabled onPick={() => undefined} title="אין לנו חשבון בנק" tag="בקרוב" line="נפתח לכם יתרה אצל ספק התשלומים." />
                </div>
                <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
                    <Field label="שם בעל החשבון" autoComplete="organization" />
                    <Field label="מספר עמותה / ח.פ." ltr inputMode="numeric" />
                    <label className="flex flex-col gap-2">
                        <span className={label}>בנק</span>
                        <select className={field} defaultValue="">
                            <option value="" disabled>בחירה מהרשימה</option>
                            {BANKS.map((b) => <option key={b}>{b}</option>)}
                        </select>
                    </label>
                    <Field label="סניף" ltr inputMode="numeric" />
                    <Field label="מספר חשבון" ltr inputMode="numeric" />
                    <Field label="שם איש קשר מורשה" autoComplete="name" />
                </div>
                <ProofPicker />
            </>
        );
        side = (
            <Side title="סטטוס אימות">
                <dl className="m-0 flex flex-col">
                    <Row k="פרטי הארגון" v={<Chip tone="need">נדרש</Chip>} />
                    <Row k="חשבון בנק" v={<Chip tone="need">נדרש</Chip>} />
                    <Row k="מורשה חתימה" v={<Chip tone="need">נדרש</Chip>} />
                </dl>
                <Info>בדרך כלל הבדיקה לוקחת עד יומיים עסקים, ובינתיים הארגון כבר פתוח. מי שעוד לא מוכן, ממשיך ומשלים אחר כך מדף הסקירה.</Info>
                <p className="m-0 rounded-[14px] border-2 border-dashed border-[var(--mh-ink)] p-3 text-[14px] font-bold text-[var(--mh-ink-soft)]">
                    החיבור לספק התשלומים עוד בבנייה, ולכן כרגע הפרטים לא נשמרים ולא נשלחים לשום מקום.
                </p>
            </Side>
        );
    } else if (step === "when") {
        main = (
            <>
                <Head refEl={heading} title="מתי ואיפה חוגגים?" text="העיר והתאריך מופיעים לכל מי שמקבל את ההזמנה. הכתובת המדויקת רק למי שאישר הגעה." />
                <div className="grid grid-cols-[minmax(0,1fr)] gap-x-4 gap-y-3 sm:grid-cols-2">
                    <Field label="תאריך" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                    <Field label="שעה (לא חובה)" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
                <label className="flex flex-col gap-2">
                    <span className={label}>עיר</span>
                    <input value={city} onChange={(e) => setCity(e.target.value)} list="il-cities" maxLength={40} placeholder="מתחילים להקליד" className={`${field} max-w-[420px]`} autoComplete="address-level2" />
                    <datalist id="il-cities">{IL_CITIES.map((c) => <option key={c} value={c} />)}</datalist>
                </label>
                <label className="flex flex-col gap-2">
                    <span className={label}>המקום המדויק <span className="font-semibold text-[var(--mh-ink-soft)]">(לא חובה)</span></span>
                    <input value={place} onChange={(e) => setPlace(e.target.value)} maxLength={120} placeholder="למשל: אצל דנה, הרצל 12, קומה 3" className={field} autoComplete="street-address" />
                    <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">עוד לא סגור? אפשר להוסיף אחר כך, וכל מי שאישר יראה את העדכון.</span>
                </label>
                <Switch on={kidsInvited} onChange={setKidsInvited} title="ילדים מוזמנים?" line={kidsInvited ? "האורחים יוכלו לציין כמה מהם ילדים." : "לא נשאל את האורחים על ילדים."} />
            </>
        );
        side = (
            <Side title="כך ההזמנה תיראה">
                <InvitePreview name={name} color={shownColor} when={formatWhen(date ? `${date}${time ? `T${time}` : ""}` : null)} city={city.trim()} />
                <Info>את כל הפרטים אפשר לשנות גם אחרי שההזמנה נשלחה.</Info>
            </Side>
        );
    } else if (step === "money") {
        const sample = amountOwed(
            { mode: moneyMode, per, amountMinor: shekelsToMinor(amount), kidAmountMinor: kidsInvited && kidPriceOpen ? shekelsToMinor(kidAmount) : null, payLink: null, goalMinor: null },
            3, kidsInvited && kidPriceOpen ? 1 : 0,
        );
        main = (
            <>
                <Head refEl={heading} title="יש כסף באמצע?" text="למתנה משותפת, לאוכל או לאולם. אפשר גם בלי." />
                <div role="radiogroup" aria-label="כסף" className="flex flex-col gap-3">
                    <Choice name="money" checked={moneyMode === "none"} onPick={() => setMoneyMode("none")} title="בלי כסף" line="רק אישורי הגעה." />
                    <Choice name="money" checked={moneyMode === "fixed"} onPick={() => setMoneyMode("fixed")} title="סכום קבוע" line="כל אחד יודע בדיוק כמה לשים." />
                    {moneyMode === "fixed" && (
                        <div className="flex flex-col gap-3 rounded-[18px] border-[2.5px] border-[var(--mh-ink)] bg-white p-3">
                            <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
                                <Field label="סכום בשקלים" inputMode="decimal" ltr value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100" />
                                <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
                                    <legend className={`${label} mb-2`}>לכל</legend>
                                    <div role="radiogroup" aria-label="לכל" className="flex gap-2">
                                        {(["person", "family"] as const).map((p) => (
                                            <button key={p} type="button" role="radio" aria-checked={per === p} onClick={() => setPer(p)}
                                                className={`min-h-[var(--mh-hit)] flex-1 rounded-full border-[2.5px] border-[var(--mh-ink)] px-4 font-extrabold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)] focus-visible:ring-offset-2 ${per === p ? "bg-[var(--mh-ink)] text-white" : "bg-white hover:bg-[var(--mh-ticket)]"}`}>
                                                {p === "person" ? "אדם" : "משפחה"}
                                            </button>
                                        ))}
                                    </div>
                                </fieldset>
                            </div>
                            {per === "person" && kidsInvited && (kidPriceOpen ? (
                                <div className="flex flex-wrap items-end gap-3">
                                    <div className="min-w-0 flex-1 sm:max-w-[50%]"><Field label="סכום לילד" inputMode="decimal" ltr value={kidAmount} onChange={(e) => setKidAmount(e.target.value)} placeholder="50" /></div>
                                    <button type="button" onClick={() => { setKidPriceOpen(false); setKidAmount(""); }} className="min-h-[var(--mh-hit)] font-extrabold underline">בלי מחיר לילדים</button>
                                </div>
                            ) : (
                                <button type="button" onClick={() => setKidPriceOpen(true)} className="min-h-10 self-start font-extrabold underline">+ סכום אחר לילד</button>
                            ))}
                        </div>
                    )}
                    <Choice name="money" checked={moneyMode === "free"} onPick={() => setMoneyMode("free")} title="כל אחד כמה שרוצה" line="מתאים למתנה משותפת. האורח כותב כמה שם." />
                    {moneyMode === "free" && (
                        <div className="flex flex-col gap-2 rounded-[18px] border-[2.5px] border-[var(--mh-ink)] bg-white p-3">
                            <div className="sm:max-w-[50%]"><Field label="כמה רוצים לאסוף בסך הכול? (לא חובה)" inputMode="decimal" ltr value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="1200" /></div>
                            <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">למשל מחיר המתנה. האורחים יראו פס שמתמלא לעבר היעד.</span>
                        </div>
                    )}
                </div>
                {moneyMode !== "none" && (
                    <label className="flex flex-col gap-2">
                        <span className={label}>קישור לתשלום בביט או בפייבוקס <span className="font-semibold text-[var(--mh-ink-soft)]">(לא חובה)</span></span>
                        <input value={payLink} onChange={(e) => setPayLink(e.target.value)} dir="ltr" inputMode="url" maxLength={300} placeholder="https://" className={`${field} text-end`} />
                        <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">האורחים ילחצו עליו כדי לשלם לכם ישירות, ואז יסמנו ״שילמתי״.</span>
                    </label>
                )}
            </>
        );
        side = (
            <Side title="מה האורחים יראו">
                {moneyMode === "none" && <p className="m-0 font-semibold">בלי כפתור תשלום. רק ״מגיע/ה״, ״אולי״ או ״לא מגיע/ה״.</p>}
                {moneyMode === "fixed" && (
                    <p className="m-0 font-semibold">
                        {sample
                            ? <>למשל, מי שמגיע עם {kidsInvited && kidPriceOpen ? "שני מבוגרים וילד" : "שלושה אנשים"} יראה: <b className="whitespace-nowrap">להעביר {formatShekels(sample)}</b></>
                            : "כתבו סכום, ונראה כאן מה האורחים יקבלו."}
                    </p>
                )}
                {moneyMode === "free" && <p className="m-0 font-semibold">כל אורח כותב כמה העביר{shekelsToMinor(goal) ? <>, וכולם רואים <b className="whitespace-nowrap">נאסף ₪0 מתוך {formatShekels(shekelsToMinor(goal) ?? 0)}</b></> : ", ואתם רואים את הסך הכול מצטבר"}.</p>}
                <Info>הכסף עובר ישירות אליכם, ואנחנו רק עוקבים מי שילם. אתם מאשרים כל תשלום שהגיע.</Info>
            </Side>
        );
    } else if (step === "access") {
        main = (
            <>
                <Head refEl={heading} title="מי יכול להיכנס להזמנה?" text="בכל מקרה, הכתובת ורשימת המגיעים נפתחות רק למי שאישר הגעה." />
                <div role="radiogroup" aria-label="מי יכול להיכנס" className="flex flex-col gap-3">
                    <Choice name="access" checked={access === "link"} onPick={() => setAccess("link")} title="כל מי שקיבל את הקישור" tag="הכי קל" line="שולחים בווטסאפ, ומי שנכנס עונה עם השם שלו, בלי הרשמה." />
                    <Choice name="access" checked={access === "invited"} onPick={() => setAccess("invited")} title="רק מי שהזמנתי" line="אותו קישור לכולם, אבל נכנסים רק המספרים שברשימה, עם קוד לטלפון." />
                    {access === "invited" && <InvitedList raw={invitedRaw} onChange={setInvitedRaw} />}
                </div>
                <Switch on={surprise} onChange={setSurprise} tone="bg-[var(--mh-tint-pink)]" title="זו מסיבת הפתעה?" line="כל האורחים יראו תזכורת לא לספר.">
                    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
                        <Field label="למי ההפתעה? (לא חובה)" value={honoree} onChange={(e) => setHonoree(e.target.value)} maxLength={40} placeholder="השם הפרטי" />
                        <Field label="הטלפון שלו או שלה (לא חובה)" ltr type="tel" inputMode="tel" value={honoreePhone} onChange={(e) => setHonoreePhone(e.target.value)} placeholder="050-1234567" autoComplete="off" />
                    </div>
                    <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">מי שנכנס עם המספר הזה יראה שהקישור לא פעיל, וההזמנה לא תישמר אצלו.</span>
                </Switch>
            </>
        );
        side = (
            <Side title="כך ההזמנה תיראה">
                <InvitePreview name={name} color={shownColor} when={formatWhen(date ? `${date}${time ? `T${time}` : ""}` : null)} city={city.trim()} surprise={surprise} honoree={honoree.trim()} />
                <Info>{access === "invited" ? "שולחים את אותו קישור לכולם. מי שנכנס מקליד את הטלפון ומקבל קוד, ורק המספרים שברשימה רואים את ההזמנה." : "אחרי הפתיחה תקבלו קישור לשלוח בווטסאפ, ודף שבו רואים מי מגיע ומי שילם."}</Info>
            </Side>
        );
    } else {
        main = (
            <>
                <Head refEl={heading} title="איך החברים הראשונים יגיעו?" text="כל הצטרפות היא דו-צדדית: מזמינים, והאדם מאשר." />
                <div role="radiogroup" aria-label="דרך ההזמנה" className="flex flex-col gap-3">
                    <Choice name="invite" checked={inviteWith === "link"} onPick={() => setInviteWith("link")} title="קישור הצטרפות" tag="הכי קל" line="שולחים בווטסאפ או במייל. מי שנכנס שולח בקשה, ואתם מאשרים." />
                    {inviteWith === "link" && joinToken && <CopyLink path={`/join/${joinToken}`} />}
                    <Choice name="invite" checked={inviteWith === "phone"} onPick={() => setInviteWith("phone")} title="הזמנה לפי טלפון" line="מדביקים רשימת מספרים, וכל אחד מקבל הזמנה אישית." />
                    {inviteWith === "phone" && orgId && <PhoneInvites orgId={orgId} />}
                    <Choice name="invite" checked={inviteWith === "import"} onPick={() => setInviteWith("import")} title="יש לנו רשימה קיימת" line="ייבוא מקובץ אקסל. נתאים עמודות ונראה תצוגה מקדימה לפני שמזמינים." />
                    {inviteWith === "import" && (
                        <p className="m-0 rounded-[14px] border-2 border-dashed border-[var(--mh-ink)] bg-[var(--mh-ticket)] p-3 font-bold">מסך הייבוא מקובץ עוד בבנייה. אחרי הסיום הוא יחכה לכם כמשימה בדף הסקירה.</p>
                    )}
                </div>
            </>
        );
        side = (
            <Side title="מה הוקם עד עכשיו">
                <ul className="m-0 flex list-none flex-col p-0">
                    <Done>שם: {name}</Done>
                    <Done>סוג ארגון: {type?.label ?? "משהו אחר"}</Done>
                    <Done>כרטיס: צבע {COLOR_NAMES[shownColor] ?? ""}{logo ? ", לוגו" : ""}{city.trim() ? `, ${city.trim()}` : ""}</Done>
                    <Done>גבייה: {COLLECTIONS.find((c) => c.id === collection)?.label}</Done>
                    {collection === "system" && <Done later>חשבון לקבלת כסף: יושלם אחר כך</Done>}
                </ul>
                <Info>אפשר לסיים עכשיו ולהזמין אחר כך. הכול ממשיך מדף הסקירה.</Info>
            </Side>
        );
    }

    return (
        <main className="flex min-h-dvh flex-col bg-[var(--mh-sun)]">
            <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-[clamp(12px,1.6vw,18px)] px-[clamp(12px,3vw,32px)] pt-[clamp(14px,2.5vw,28px)]">
                <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <div className="flex items-baseline gap-3">
                        <h1 className="m-0 font-display text-[clamp(26px,2.6vw,34px)]">פתיחת ארגון</h1>
                        <span className="font-extrabold text-[var(--mh-ink-soft)]">שלב <bdi>{index + 1}</bdi> מתוך <bdi>{steps.length}</bdi></span>
                    </div>
                    <Link href="/wallet" className="min-h-10 content-center font-extrabold underline">לארנק</Link>
                </header>
                <Stepper steps={steps} index={index} />
                <div className="grid flex-1 grid-cols-[minmax(0,1fr)] items-start gap-[clamp(12px,1.6vw,18px)] lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,1fr)]">
                    <section key={step} className={`${box} wz-in flex flex-col gap-4 p-[clamp(16px,2vw,26px)]`}>
                        {main}
                        {error && <p role="alert" className="m-0 font-extrabold text-[var(--mh-danger)]">{error}</p>}
                    </section>
                    <aside key={`${step}-side`} className={`wz-in flex flex-col gap-3 lg:sticky lg:top-4 ${sideFirstOnPhone ? "max-lg:order-first" : ""}`}>{side}</aside>
                </div>
            </div>
            <footer className="sticky bottom-0 z-10 mt-4 border-t-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-sun)] lg:static lg:border-0">
                <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center gap-3 px-[clamp(12px,3vw,32px)] py-3 lg:pb-6">
                    {index > 0 && <button type="button" onClick={back} disabled={pending} className={secondary}>חזרה</button>}
                    <span className="flex-1" />
                    {step === "invite" ? (
                        <>
                            <button type="button" onClick={() => finish("later")} disabled={pending} className={`${secondary} max-sm:order-last max-sm:w-full`}>אזמין אחר כך</button>
                            <button type="button" onClick={() => finish(inviteWith)} disabled={pending} className={`${primary} max-sm:flex-1`}>סיום ופתיחת הארגון</button>
                        </>
                    ) : (
                        <>
                            <span className="text-[14px] font-bold text-[var(--mh-ink-soft)] max-sm:hidden" aria-live="polite">{pending ? "שומרים…" : orgId && step !== "account" ? "נשמר אוטומטית" : ""}</span>
                            {step === "account" && <button type="button" onClick={next} disabled={pending} className={secondary}>אשלים אחר כך</button>}
                            <button
                                type="button"
                                onClick={next}
                                disabled={pending || (step === "name" && name.trim().length < 2) || (step === "type" && !packId) || (step === "when" && !date)}
                                className={`${primary} min-w-[140px] whitespace-nowrap max-sm:flex-1`}
                            >
                                {step === "access" ? "לפתוח את החגיגה" : "המשך"}
                            </button>
                        </>
                    )}
                </div>
            </footer>
        </main>
    );
}

// The top of the guest's invitation, as the organizer fills in the details.
function InvitePreview({ name, color, when, city, surprise = false, honoree = "" }: { name: string; color: string; when: string | null; city: string; surprise?: boolean; honoree?: string }) {
    return (
        <div className="overflow-hidden rounded-[22px] border-[2.5px] border-[var(--mh-ink)] bg-white shadow-[0_4px_0_var(--mh-ink)]">
            <div className="flex flex-col gap-1 p-4 text-white" style={{ background: color }}>
                <span className="text-[14px] font-extrabold opacity-90">הוזמנתם ל</span>
                <b className="font-display text-[24px] leading-tight [text-wrap:balance]">{name.trim() || "החגיגה שלכם"}</b>
            </div>
            <div className="flex flex-col gap-2 p-4">
                {surprise && (
                    <p className="m-0 rounded-[14px] border-2 border-[var(--mh-ink)] bg-[var(--mh-tint-pink)] p-2 text-[14px] font-extrabold">
                        <span aria-hidden="true">🤫 </span>מסיבת הפתעה. {honoree ? `לא לספר ל${honoree}!` : "לא לספר!"}
                    </p>
                )}
                <span className="font-extrabold">{when ?? "התאריך יופיע כאן"}</span>
                {city && <span className="font-semibold text-[var(--mh-ink-soft)]">{city}</span>}
                <div className="mt-1 grid grid-cols-3 gap-2" aria-hidden="true">
                    {["מגיע/ה", "אולי", "לא"].map((t, i) => (
                        <span key={t} className={`rounded-full border-2 border-[var(--mh-ink)] py-1 text-center text-[13px] font-extrabold ${i === 0 ? "bg-[var(--mh-ok)]" : "bg-white"}`}>{t}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}

// An on/off row. Extra fields for the "on" state open inside the same box.
function Switch({ on, onChange, title, line, tone = "bg-[var(--mh-tint-sun)]", children }: {
    on: boolean; onChange: (v: boolean) => void; title: string; line: string; tone?: string; children?: ReactNode;
}) {
    return (
        <div className={`flex flex-col gap-3 rounded-[18px] border-[2.5px] border-[var(--mh-ink)] p-[14px] transition-colors duration-200 ${on ? tone : "bg-white"}`}>
            <label className="flex cursor-pointer items-center justify-between gap-3">
                <span className="flex min-w-0 flex-col gap-1">
                    <b className="text-[18px] leading-tight">{title}</b>
                    <span className="font-semibold text-[var(--mh-ink-soft)]">{line}</span>
                </span>
                <input type="checkbox" role="switch" checked={on} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
                <span aria-hidden="true" className={`relative inline-flex h-8 w-14 shrink-0 rounded-full border-[2.5px] border-[var(--mh-ink)] transition-colors duration-200 peer-focus-visible:ring-[3px] peer-focus-visible:ring-[var(--mh-ink)] peer-focus-visible:ring-offset-2 ${on ? "bg-[var(--mh-ok)]" : "bg-white"}`}>
                    <span className={`absolute top-[2px] h-[22px] w-[22px] rounded-full border-2 border-[var(--mh-ink)] bg-white transition-[inset-inline-start] duration-200 ${on ? "start-[26px]" : "start-[2px]"}`} />
                </span>
            </label>
            {on && children}
        </div>
    );
}

// The invited phones, pasted in any form. The count and the unreadable entries update as you type.
function InvitedList({ raw, onChange }: { raw: string; onChange: (v: string) => void }) {
    const { phones, invalid } = parsePhoneList(raw, MAX_INVITED);
    return (
        <div className="flex flex-col gap-2 rounded-[18px] border-[2.5px] border-[var(--mh-ink)] bg-white p-3">
            <label className="flex flex-col gap-2">
                <span className={label}>מספרי הטלפון של המוזמנים</span>
                <textarea value={raw} onChange={(e) => onChange(e.target.value)} rows={5} dir="ltr" placeholder={"050-1234567\n052-7654321"} className={`${field} py-3 text-end`} />
            </label>
            <span className="text-[14px] font-semibold" aria-live="polite">
                {phones.length ? `נקלטו ${phones.length} מספרים.` : "כל מספר בשורה, או מופרדים בפסיק. אפשר להדביק מרשימה."}{" "}
                {invalid.length > 0 && <span className="font-extrabold text-[var(--mh-danger)]">לא הצלחנו לקרוא: <bdi dir="ltr">{invalid.join(", ")}</bdi></span>}
            </span>
            <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">אפשר להוסיף עוד מוזמנים אחר כך מדף המארגנים.</span>
        </div>
    );
}

function Head({ title, text, refEl }: { title: string; text: string; refEl: RefObject<HTMLHeadingElement | null> }) {
    return (
        <div>
            <h2 ref={refEl} tabIndex={-1} className={`${h2} outline-none`}>{title}</h2>
            <p className={sub}>{text}</p>
        </div>
    );
}

function Side({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className={`${box} flex flex-col gap-3 p-[clamp(16px,1.8vw,22px)]`}>
            <h3 className="m-0 font-display text-[20px]">{title}</h3>
            {children}
        </div>
    );
}

function Info({ children }: { children: ReactNode }) {
    return (
        <p className="m-0 flex items-start gap-2 rounded-[14px] border-2 border-[var(--mh-ink)] bg-[var(--mh-tint-sun)] p-3 text-[14px] font-bold">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-px shrink-0"><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v5h1" /></svg>
            <span>{children}</span>
        </p>
    );
}

function Row({ k, v }: { k: string; v: ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-3 border-b-2 border-[var(--mh-line-soft)] py-[10px] last:border-0">
            <dt className="font-semibold text-[var(--mh-ink-soft)]">{k}</dt>
            <dd className="m-0 font-extrabold">{v}</dd>
        </div>
    );
}

function Chip({ tone, children }: { tone: "need" | "wait" | "ok"; children: ReactNode }) {
    const bg = tone === "ok" ? "bg-[var(--mh-tint-ok)]" : tone === "wait" ? "bg-[var(--mh-ticket)]" : "bg-[var(--mh-tint-pink)]";
    return <span className={`inline-flex min-h-7 items-center rounded-full border-2 border-[var(--mh-ink)] px-3 text-[13px] font-extrabold ${bg}`}>{children}</span>;
}

function Done({ children, later = false }: { children: ReactNode; later?: boolean }) {
    return (
        <li className="flex items-center gap-3 border-b-2 border-[var(--mh-line-soft)] py-[10px] font-extrabold last:border-0">
            <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] ${later ? "bg-[var(--mh-ticket)]" : "bg-[var(--mh-ok)]"}`} aria-hidden="true">
                {later ? "…" : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--mh-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>}
            </span>
            <span className="min-w-0 break-words">{children}</span>
        </li>
    );
}

// A radio card: the whole card is the hit area. Arrow keys move between cards like native radios.
function Choice({ name, checked, onPick, title, line, tag, disabled = false }: {
    name: string; checked: boolean; onPick: () => void; title: string; line: string; tag?: string; disabled?: boolean;
}) {
    return (
        <label className={`group flex items-start gap-3 rounded-[18px] border-[2.5px] border-[var(--mh-ink)] p-[14px] transition-[transform,box-shadow,background-color] duration-150 ${disabled ? "cursor-not-allowed border-dashed bg-white opacity-70" : checked ? "cursor-pointer bg-[var(--mh-tint-sun)] shadow-[0_4px_0_var(--mh-ink)]" : "cursor-pointer bg-white hover:-translate-y-px hover:bg-[var(--mh-ticket)] hover:shadow-[var(--mh-shadow)]"}`}>
            <input type="radio" name={name} checked={checked} disabled={disabled} onChange={onPick} className="peer sr-only" />
            <span className="mt-[2px] inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[2.5px] border-[var(--mh-ink)] bg-white peer-focus-visible:ring-[3px] peer-focus-visible:ring-[var(--mh-ink)] peer-focus-visible:ring-offset-2" aria-hidden="true">
                <span className={`h-3 w-3 rounded-full bg-[var(--mh-ink)] transition-transform duration-150 ${checked ? "scale-100" : "scale-0"}`} />
            </span>
            <span className="flex min-w-0 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-2">
                    <b className="text-[18px] leading-tight">{title}</b>
                    {tag && <span className="rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-sun)] px-2 text-[12px] font-extrabold">{tag}</span>}
                </span>
                <span className="font-semibold text-[var(--mh-ink-soft)]">{line}</span>
            </span>
        </label>
    );
}

function Field({ label: text, ltr = false, ...props }: { label: string; ltr?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
    return (
        <label className="flex flex-col gap-2">
            <span className={label}>{text}</span>
            <input {...props} dir={ltr ? "ltr" : undefined} className={`${field} ${ltr ? "text-end" : ""}`} />
        </label>
    );
}

// Proof of account ownership. Kept in the browser only until a payment provider is connected.
function ProofPicker() {
    const input = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState("");
    return (
        <div className="flex flex-col gap-2">
            <span className={label} id="proof-label">אסמכתא לבעלות על החשבון</span>
            <div className="flex min-h-[var(--mh-hit)] flex-wrap items-center gap-3">
                <button type="button" aria-describedby="proof-label" onClick={() => input.current?.click()} className={secondary}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M5 20h14" /></svg>
                    {file ? "להחליף קובץ" : "לבחור קובץ"}
                </button>
                {file && <bdi className="min-w-0 truncate font-extrabold">{file}</bdi>}
                <input ref={input} type="file" accept="image/*,application/pdf" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => setFile(e.target.files?.[0]?.name ?? "")} />
            </div>
            <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">צילום של אישור ניהול חשבון או צ׳ק. הספק מבקש את זה כדי למנוע העברות לחשבון לא נכון.</span>
        </div>
    );
}

function PhoneInvites({ orgId }: { orgId: string }) {
    const [raw, setRaw] = useState("");
    const [result, setResult] = useState<{ added: number; invalid: string[]; error?: string } | null>(null);
    const [pending, start] = useTransition();
    return (
        <div className="flex flex-col gap-2 rounded-[18px] border-[2.5px] border-[var(--mh-ink)] bg-white p-3">
            <label className="flex flex-col gap-2">
                <span className={label}>מספרי טלפון, כל מספר בשורה או מופרדים בפסיק</span>
                <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={4} dir="ltr" placeholder={"050-1234567\n052-7654321"} className={`${field} py-3 text-end`} />
            </label>
            <button type="button" disabled={pending || !raw.trim()} onClick={() => start(async () => { const r = await invitePhones(orgId, raw); setResult(r); if (r.added) setRaw(r.invalid.join("\n")); })} className={`${secondary} self-start`}>
                להוסיף להזמנות
            </button>
            {result && (
                <p role="status" className="m-0 font-bold">
                    {result.error ?? `נרשמו ${result.added} הזמנות. הן יישלחו ברגע שנחבר את שירות ההודעות.`}
                    {result.invalid.length > 0 && <span className="block text-[var(--mh-danger)]">לא הצלחנו לקרוא: <bdi dir="ltr">{result.invalid.join(", ")}</bdi></span>}
                </p>
            )}
        </div>
    );
}

function Stepper({ steps, index }: { steps: StepKey[]; index: number }) {
    return (
        <nav aria-label="שלבי הפתיחה" className={`${box} px-[clamp(12px,2vw,24px)] py-3`}>
            {/* Phones: the current step's name and a segmented bar. */}
            <div className="flex flex-col gap-2 md:hidden">
                <b className="text-[16px]">{STEP_LABELS[steps[index]]}</b>
                <div className="flex gap-1" aria-hidden="true">
                    {steps.map((s, i) => (
                        <span key={s} className={`h-2 flex-1 rounded-full border-2 border-[var(--mh-ink)] transition-colors duration-300 ${i < index ? "bg-[var(--mh-ok)]" : i === index ? "bg-[var(--mh-sun)]" : "bg-white"}`} />
                    ))}
                </div>
            </div>
            <ol className="m-0 hidden list-none items-center justify-between gap-2 p-0 md:flex">
                {steps.map((s, i) => (
                    <li key={s} aria-current={i === index ? "step" : undefined} className="flex min-w-0 items-center gap-2">
                        <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[2.5px] border-[var(--mh-ink)] text-[14px] font-extrabold transition-colors duration-300 ${i < index ? "bg-[var(--mh-ok)]" : i === index ? "bg-[var(--mh-sun)]" : "bg-white"}`}>
                            {i < index ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--mh-ink)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-label="הושלם"><path d="M5 12l5 5 9-10" /></svg> : <bdi>{i + 1}</bdi>}
                        </span>
                        <span className={`truncate text-[clamp(13px,1.1vw,15px)] ${i === index ? "font-extrabold" : i < index ? "font-semibold" : "font-semibold text-[var(--mh-ink-soft)]"}`}>{STEP_LABELS[s]}</span>
                    </li>
                ))}
            </ol>
        </nav>
    );
}
