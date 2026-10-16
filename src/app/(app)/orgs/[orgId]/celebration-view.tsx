import Link from "next/link";
import type { Organization, Rsvp } from "@prisma/client";
import type { ReactNode } from "react";
import { CopyLink, WhatsAppShare } from "@/components/copy-link";
import { amountOwed, answerCounts, celebrationStage, collectionTarget, formatShekels, formatWhen, localPhone, readCelebration, totals } from "@/lib/celebration";
import { CollectBar } from "@/components/collect-bar";
import { celebrateAgain, deletePost, removeInvited, removeQuestion, setClosed, setPayment } from "./actions";
import { Compose, Links, QuestionForm } from "./channel-forms";
import { PostCard } from "@/components/channel/post-card";
import type { LoadedPost } from "@/lib/channel-server";
import { AddInvited } from "./invited-form";

// The organizer's page of a celebration (decided with Tommy 14.10.2026): how many are coming and how many
// of them are kids, who has not answered, who paid, and the link to send.

const box = "flex flex-col gap-3 rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-white p-[clamp(16px,2vw,24px)] shadow-[0_4px_0_var(--mh-ink)]";
const small = "inline-flex min-h-10 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] px-4 text-[14px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[1px] active:shadow-none";
const STATUS = { yes: "מגיעים", maybe: "אולי", no: "לא מגיעים" } as Record<string, string>;

// replyByPhone: an account phone -> that account's reply id, to show which invited numbers answered.
export function CelebrationView({ org, rsvps, replyByPhone, posts }: { org: Organization; rsvps: Rsvp[]; replyByPhone: Record<string, string>; posts: LoadedPost[] }) {
    const c = readCelebration(org.settings);
    const t = totals(rsvps);
    const stage = celebrationStage(c, org.status, rsvps, new Date());
    const locked = stage === "closed";
    const when = formatWhen(c.startsAt);
    const money = c.money.mode !== "none";
    const target = collectionTarget(c.money, rsvps.filter((r) => r.status === "yes"));
    const path = `/c/${org.joinToken}`;
    const order = { claimed: 0, none: 1, confirmed: 2 } as Record<string, number>;
    const list = [...rsvps].sort((a, b) => (a.status === "no" ? 1 : 0) - (b.status === "no" ? 1 : 0) || (order[a.paid] ?? 1) - (order[b.paid] ?? 1) || a.name.localeCompare(b.name, "he"));

    return (
        <main className="min-h-dvh bg-[var(--mh-sun)]">
            <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-[clamp(12px,3vw,32px)] py-[clamp(14px,2.5vw,28px)]">
                <header className="flex flex-wrap items-baseline justify-between gap-3">
                    <div className="flex min-w-0 flex-col">
                        <h1 className="m-0 font-display text-[clamp(26px,2.6vw,36px)] leading-tight [text-wrap:balance]">{org.name}</h1>
                        <span className="font-extrabold text-[var(--mh-ink-soft)]">{[when, c.city].filter(Boolean).join(" · ")}{c.surprise.on ? " · 🤫 מסיבת הפתעה" : ""}</span>
                    </div>
                    <span className="flex gap-4">
                        <Link href={path} className="min-h-10 content-center font-extrabold underline">איך האורחים רואים</Link>
                        <Link href="/wallet" className="min-h-10 content-center font-extrabold underline">לארנק</Link>
                    </span>
                </header>

                {stage !== "upcoming" && <AfterBanner orgId={org.id} locked={locked} byHand={org.status === "closed"} owing={rsvps.filter((r) => r.status === "yes" && r.paid !== "confirmed" && amountOwed(c.money, r.people, r.kids)).length} goalLeft={c.money.mode === "free" && c.money.goalMinor ? Math.max(c.money.goalMinor - t.paidMinor, 0) : null} claimed={t.claimed} />}

                <div className={`grid gap-3 ${c.kids ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
                    <Stat k="מגיעים" v={t.coming} tone="bg-[var(--mh-ok)]" />
                    {c.kids && <Stat k="מתוכם ילדים" v={t.kids} />}
                    <Stat k="אולי" v={t.maybe} />
                    <Stat k="לא מגיעים" v={t.no} />
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
                    {/* Two independent columns, so a long side column never pushes the updates down. */}
                    <div className="flex min-w-0 flex-col gap-4">
                        <section className={box} aria-labelledby="guests-h">
                            <h2 id="guests-h" className="m-0 font-display text-[24px]">האורחים <span className="text-[var(--mh-ink-soft)]">(<bdi>{t.replies}</bdi> ענו)</span></h2>
                            {list.length === 0 ? (
                                <p className="m-0 font-semibold text-[var(--mh-ink-soft)]">עוד אף אחד לא ענה. שלחו את הקישור, והתשובות יופיעו כאן.</p>
                            ) : (
                                <ul className="m-0 flex list-none flex-col p-0">
                                    {list.map((r) => (
                                        <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b-2 border-[var(--mh-line-soft)] py-3 last:border-0">
                                            <span className="flex min-w-0 flex-1 basis-[180px] flex-col">
                                                <b className="break-words text-[17px]"><bdi>{r.name}</bdi></b>
                                                <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">
                                                    {STATUS[r.status] ?? r.status}
                                                    {r.status !== "no" && (r.people > 1 ? `, ${r.people} אנשים` : ", לבד")}
                                                    {r.status !== "no" && r.kids > 0 ? ` (${r.kids === 1 ? "ילד אחד" : `${r.kids} ילדים`})` : ""}
                                                </span>
                                                {c.question && r.status !== "no" && r.answer && <span className="break-words text-[14px] font-bold"><span aria-hidden="true">💬 </span><bdi>{r.answer}</bdi></span>}
                                            </span>
                                            {money && (r.status === "yes" || r.paid !== "none") && <Payment orgId={org.id} r={r} owed={amountOwed(c.money, r.people, r.kids)} locked={locked} />}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        {!(locked && posts.length === 0) && (
                            <section className={box} aria-labelledby="updates-h">
                                <h2 id="updates-h" className="m-0 font-display text-[24px]">עדכונים לאורחים</h2>
                                {!locked && <p className="m-0 font-semibold text-[var(--mh-ink-soft)]">כל מי שענה רואה את העדכונים בהזמנה ויכול להגיב באייקון. אין כאן צ׳אט.</p>}
                                {!locked && <Compose orgId={org.id} />}
                                {posts.length > 0 && (
                                    <div className="flex flex-col gap-3 border-t-2 border-[var(--mh-line-soft)] pt-3">
                                        {posts.map((p) => (
                                            <div key={p.post.id} className="flex flex-col gap-1">
                                                <PostCard post={p.post} counts={p.counts} mine={null} react={null} />
                                                {!locked && <form action={deletePost.bind(null, org.id, p.post.id)} className="self-end"><button className="min-h-10 text-[14px] font-extrabold underline">למחוק</button></form>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}

                    </div>

                    <aside className="flex flex-col gap-4">
                        <section className={box} aria-labelledby="share-h">
                            <h2 id="share-h" className="m-0 font-display text-[22px]">הקישור להזמנה</h2>
                            <p className="m-0 font-semibold text-[var(--mh-ink-soft)]">{c.access === "invited" ? "אותו קישור לכולם. רק מי שברשימת המוזמנים יוכל לפתוח אותו, עם קוד לטלפון." : "מי שמקבל אותו עונה עם השם שלו, בלי הרשמה."}</p>
                            {org.joinToken && (
                                <>
                                    <CopyLink path={path} label="קישור ההזמנה" />
                                    <WhatsAppShare path={path} text={`הוזמנתם ל${org.name}${when ? `, ${when}` : ""}. לאישור הגעה:`} />
                                </>
                            )}
                        </section>
                        {c.access === "invited" && (
                            <section className={box} aria-labelledby="invited-h">
                                <h2 id="invited-h" className="m-0 font-display text-[22px]">המוזמנים</h2>
                                <Row k="ברשימה" v={String(c.invited.length)} />
                                <Row k="ענו" v={String(c.invited.filter((p) => replyByPhone[p]).length)} />
                                {c.invited.some((p) => !replyByPhone[p]) && (
                                    <details className="group">
                                        <summary className="min-h-10 cursor-pointer content-center font-extrabold underline marker:content-none">
                                            עוד לא ענו ({c.invited.filter((p) => !replyByPhone[p]).length})
                                        </summary>
                                        <ul className="m-0 flex list-none flex-col p-0 pt-2">
                                            {c.invited.filter((p) => !replyByPhone[p]).map((p) => (
                                                <li key={p} className="flex items-center justify-between gap-3 border-b-2 border-[var(--mh-line-soft)] py-2 last:border-0">
                                                    <bdi dir="ltr" className="font-extrabold">{localPhone(p)}</bdi>
                                                    {!locked && <form action={removeInvited.bind(null, org.id, p)}><button className="min-h-10 text-[14px] font-extrabold underline">להסיר</button></form>}
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                )}
                                {!locked && <AddInvited orgId={org.id} />}
                            </section>
                        )}
                        {(c.question || !locked) && (
                            <section className={box} aria-labelledby="question-h">
                                <h2 id="question-h" className="m-0 font-display text-[22px]">שאלה לאורחים</h2>
                                {c.question ? (
                                    <>
                                        <p className="m-0 text-[17px] font-extrabold"><bdi>{c.question.text}</bdi></p>
                                        {c.question.options.length > 0 ? (
                                            answerCounts(c.question, rsvps.filter((r) => r.status !== "no").map((r) => r.answer)).map((a) => <Row key={a.option} k={a.option} v={String(a.count)} />)
                                        ) : (
                                            <Row k="ענו" v={String(rsvps.filter((r) => r.status !== "no" && r.answer).length)} />
                                        )}
                                        <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">התשובות מופיעות גם ליד כל אורח ברשימה.</span>
                                        {!locked && (
                                            <span className="flex flex-wrap items-start gap-4">
                                                <details className="group w-full">
                                                    <summary className="min-h-10 cursor-pointer content-center font-extrabold underline marker:content-none">לשנות את השאלה</summary>
                                                    <div className="pt-2"><QuestionForm orgId={org.id} question={c.question} /></div>
                                                </details>
                                                <form action={removeQuestion.bind(null, org.id)}><button className="min-h-10 text-[14px] font-extrabold underline">להסיר את השאלה</button></form>
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <details className="group">
                                        <summary className="min-h-10 cursor-pointer content-center font-extrabold underline marker:content-none">+ להוסיף שאלה</summary>
                                        <p className="m-0 pb-2 pt-1 font-semibold text-[var(--mh-ink-soft)]">שאלה אחת משלכם למי שמגיע, למשל מה לאכול או איזה שיר לנגן.</p>
                                        <QuestionForm orgId={org.id} question={null} />
                                    </details>
                                )}
                            </section>
                        )}
                        {!locked && (
                            <section className={box} aria-labelledby="links-h">
                                <h2 id="links-h" className="m-0 font-display text-[22px]">כפתורים לאורחים</h2>
                                <Links orgId={org.id} whatsapp={c.links.whatsapp} album={c.links.album} />
                            </section>
                        )}
                        {money && (
                            <section className={box} aria-labelledby="money-h">
                                <h2 id="money-h" className="m-0 font-display text-[22px]">כסף</h2>
                                {target ? (
                                    <CollectBar collected={t.paidMinor} target={target} note={c.money.mode === "fixed" ? "״מתוך״ הוא מה שאמור להגיע מכל מי שאישר הגעה." : "״מתוך״ הוא היעד שקבעתם."} />
                                ) : (
                                    <Row k="נאסף עד עכשיו" v={formatShekels(t.paidMinor)} />
                                )}
                                <Row k="מחכים לאישור שלכם" v={String(t.claimed)} />
                                <p className="m-0 text-[14px] font-semibold text-[var(--mh-ink-soft)]">הכסף עובר ישירות אליכם. אורח מסמן ״שילמתי״, ואתם מאשרים כשרואים שזה הגיע.</p>
                            </section>
                        )}
                        {stage === "upcoming" && (
                            <details className="group self-start">
                                <summary className="min-h-10 cursor-pointer content-center font-extrabold underline marker:content-none">לסגור את החגיגה</summary>
                                <div className={`${box} mt-2`}>
                                    <p className="m-0 font-semibold">אחרי שסוגרים, ההזמנה נשארת לקריאה בלבד: אי אפשר לענות, לסמן תשלום או להגיב. אפשר לפתוח אותה שוב.</p>
                                    <form action={setClosed.bind(null, org.id, true)}><button className={`${small} bg-white`}>כן, לסגור</button></form>
                                </div>
                            </details>
                        )}
                    </aside>
                </div>
            </div>
        </main>
    );
}

// After the event (decided with Tommy 14.10.2026): a week on it waits for the last payments and nudges the
// organizer to close; once closed, "לחגוג שוב" starts next year's celebration from this one.
function AfterBanner({ orgId, locked, byHand, owing, goalLeft, claimed }: { orgId: string; locked: boolean; byHand: boolean; owing: number; goalLeft: number | null; claimed: number }) {
    return (
        <section className={`${box} bg-[var(--mh-tint-ok)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between`} aria-labelledby="after-h">
            <div className="flex min-w-0 flex-1 basis-[280px] flex-col gap-1">
                <h2 id="after-h" className="m-0 font-display text-[22px]"><span aria-hidden="true">🎉 </span>{locked ? "החגיגה סגורה" : "החגיגה עברה"}</h2>
                <p className="m-0 font-semibold">
                    {locked
                        ? "ההזמנה נשארת לקריאה בלבד, אצלכם ואצל האורחים, בקיפול ״חגיגות שהיו״ בארנק."
                        : owing > 0
                          ? `${owing === 1 ? "אורח אחד עוד לא סגר" : `${owing} אורחים עוד לא סגרו`} תשלום. כשהכול יאושר, החגיגה תיסגר לבד. אפשר גם לסגור עכשיו.`
                          : claimed > 0
                            ? "יש תשלומים שמחכים לאישור שלכם. אחרי שתאשרו אותם, החגיגה תיסגר לבד אם הכול שולם."
                            : goalLeft
                              ? `חסרים ${formatShekels(goalLeft)} ליעד. כשהיעד יושג, החגיגה תיסגר לבד. אפשר גם לסגור עכשיו.`
                              : "אפשר לסגור אותה. אחרי הסגירה ההזמנה נשארת לקריאה בלבד."}
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                {locked ? (
                    <>
                        <form action={celebrateAgain.bind(null, orgId)}><button className={`${small} min-h-12 bg-[var(--mh-org-violet)] px-5 text-[16px] text-white`}>לחגוג שוב בשנה הבאה</button></form>
                        {byHand && <form action={setClosed.bind(null, orgId, false)}><button className="min-h-10 text-[14px] font-extrabold underline">לפתוח שוב</button></form>}
                    </>
                ) : (
                    <form action={setClosed.bind(null, orgId, true)}><button className={`${small} min-h-12 bg-white px-5 text-[16px]`}>לסגור את החגיגה</button></form>
                )}
            </div>
        </section>
    );
}

function Payment({ orgId, r, owed, locked }: { orgId: string; r: Rsvp; owed: number | null; locked: boolean }) {
    if (locked) return <Pill tone={r.paid === "confirmed" ? "bg-[var(--mh-tint-ok)]" : "bg-[var(--mh-tint-pink)]"}>{r.paid === "confirmed" ? `שולם ${formatShekels(r.paidMinor ?? 0)}` : "לא שולם"}</Pill>;
    if (r.paid === "confirmed")
        return (
            <span className="flex items-center gap-2">
                <Pill tone="bg-[var(--mh-tint-ok)]">שולם {formatShekels(r.paidMinor ?? 0)}</Pill>
                <form action={setPayment.bind(null, orgId, r.id, "none")}><button className="min-h-10 text-[14px] font-extrabold underline">ביטול</button></form>
            </span>
        );
    if (r.paid === "claimed")
        return (
            <span className="flex flex-wrap items-center gap-2">
                <Pill tone="bg-[var(--mh-ticket)]">סימן ששילם {formatShekels(r.paidMinor ?? 0)}</Pill>
                <form action={setPayment.bind(null, orgId, r.id, "confirmed")}><button className={`${small} bg-[var(--mh-ok)]`}>הגיע, לאשר</button></form>
                <form action={setPayment.bind(null, orgId, r.id, "none")}><button className="min-h-10 text-[14px] font-extrabold underline">לא הגיע</button></form>
            </span>
        );
    return <Pill tone="bg-[var(--mh-tint-pink)]">{owed ? `לא שילם ${formatShekels(owed)}` : "לא שילם"}</Pill>;
}

function Pill({ tone, children }: { tone: string; children: ReactNode }) {
    return <span className={`inline-flex min-h-8 items-center rounded-full border-2 border-[var(--mh-ink)] px-3 text-[14px] font-extrabold ${tone}`}>{children}</span>;
}

function Stat({ k, v, tone = "bg-white" }: { k: string; v: number; tone?: string }) {
    return (
        <div className={`flex flex-col gap-1 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] p-[clamp(12px,1.6vw,18px)] shadow-[0_3px_0_var(--mh-ink)] ${tone}`}>
            <span className="font-extrabold">{k}</span>
            <b className="font-display text-[clamp(28px,3vw,40px)] leading-none"><bdi>{v}</bdi></b>
        </div>
    );
}

function Row({ k, v }: { k: string; v: string }) {
    return (
        <div className="flex items-center justify-between gap-3 border-b-2 border-[var(--mh-line-soft)] pb-2">
            <span className="font-semibold text-[var(--mh-ink-soft)]">{k}</span>
            <b className="font-display text-[20px]"><bdi>{v}</bdi></b>
        </div>
    );
}
