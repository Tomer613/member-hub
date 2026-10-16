import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { onColor } from "@/lib/color";
import { amountOwed, formatShekels, formatWhen, guestLabel, isRsvpStatus, readCelebration } from "@/lib/celebration";
import { keepInWallet, markPaid, reactOnPost, signInAgain } from "./actions";
import { PostCard } from "@/components/channel/post-card";
import { loadPosts } from "@/lib/channel-server";
import { CollectBar } from "@/components/collect-bar";
import { WalletArt } from "@/components/wallet-art";
import { ReplyForm } from "./reply-form";
import { cookieName, entryFor, findReply, stageOf } from "./reply";

// The invitation a celebration's link opens (decided with Tommy 14.10.2026, docs/open-questions.he.md
// 'ערכת "חגיגה ואירוע"'). Anyone with the link sees the name, the day and the city and can reply with a
// name only. The exact place and who else is coming open only after answering "מגיע/ה".

type Props = { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

async function load(token: string) {
    return db.organization.findFirst({ where: { joinToken: token, status: { in: ["active", "closed"] }, packId: "celebration" } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const org = await load((await params).token);
    // A surprise keeps its name out of the tab title and link previews.
    const c = org ? readCelebration(org.settings) : null;
    const named = org && c && !c.surprise.on && c.access === "link";
    return { title: named ? `${org.name} · הזמנה` : "הזמנה · PIRI", robots: { index: false } };
}

const box = "flex flex-col gap-3 rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-white p-[clamp(16px,2vw,24px)] shadow-[0_4px_0_var(--mh-ink)]";
const button = "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border-[2.5px] border-[var(--mh-ink)] px-6 text-[17px] font-extrabold shadow-[var(--mh-shadow)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none";
const STATUS_TEXT = { yes: "מגיעים", maybe: "אולי", no: "לא מגיעים" } as const;

export default async function InvitationPage({ params, searchParams }: Props) {
    const { token } = await params;
    const sp = await searchParams;
    const found = await load(token);
    const session = await getSession();
    // The honoree sees exactly what anyone sees for a dead link, so nothing gives the surprise away.
    const entry = found ? (await entryFor(found.id, found.settings, session?.userId ?? null)).entry : "dead";
    const org = found && entry !== "dead" ? found : null;
    if (!org)
        return (
            <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col justify-center gap-3 bg-[var(--mh-sun)] px-4">
                <h1 className="m-0 font-display text-[30px]">ההזמנה כבר לא פעילה</h1>
                <p className="m-0 font-semibold">אולי המארגנים שלחו קישור חדש. כדאי לבדוק איתם.</p>
            </main>
        );

    const c = readCelebration(org.settings);
    if (entry === "signin" || entry === "notInvited") return <Gate token={token} color={org.brandColor ?? "#FF5A36"} notInvited={entry === "notInvited"} />;
    const stage = await stageOf(org);
    const locked = stage === "closed";
    const reply = await findReply(org.id, session?.userId ?? null, (await cookies()).get(cookieName(org.id))?.value);
    const link = session ? await db.orgUser.findUnique({ where: { orgId_userId: { orgId: org.id, userId: session.userId } } }) : null;
    const organizer = link?.role === "owner" || link?.role === "admin";
    const coming = reply?.status === "yes" || organizer;
    // A signed-in guest does not retype their name.
    const me = session && !reply ? await db.user.findUnique({ where: { id: session.userId }, select: { firstName: true, lastName: true } }) : null;
    const guests = coming ? await db.rsvp.findMany({ where: { orgId: org.id, status: "yes" }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, people: true } }) : [];
    const headcount = guests.reduce((n, g) => n + g.people, 0);
    const color = org.brandColor ?? "#FF5A36";
    const when = formatWhen(c.startsAt);
    const owed = reply && reply.status !== "no" ? amountOwed(c.money, reply.people, reply.kids) : null;
    const showMoney = c.money.mode !== "none" && reply && reply.status !== "no";
    // Guests see the shared progress toward the organizer's goal (only "any amount" with a goal).
    const goal = showMoney && c.money.mode === "free" ? c.money.goalMinor : null;
    // Updates and the group/album buttons are for whoever replied (and the organizers).
    const insider = !!reply || organizer;
    const posts = insider ? await loadPosts(org.id, session ? `u:${session.userId}` : reply ? `r:${reply.id}` : null) : [];
    const pinned = posts.filter((p) => p.post.pinned);
    const collected = goal ? (await db.rsvp.aggregate({ where: { orgId: org.id, paid: "confirmed" }, _sum: { paidMinor: true } }))._sum.paidMinor ?? 0 : 0;

    return (
        <main className="min-h-dvh bg-[var(--mh-sun)]">
            <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-4 px-[clamp(12px,3vw,32px)] py-[clamp(14px,2.5vw,28px)]">
                {organizer && (
                    <p className="m-0 flex flex-wrap items-center justify-between gap-2 rounded-[18px] border-2 border-[var(--mh-ink)] bg-white p-3 font-bold">
                        כך האורחים רואים את ההזמנה.
                        <Link href={`/orgs/${org.id}`} className="font-extrabold underline">לדף המארגנים</Link>
                    </p>
                )}
                <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,1fr)]">
                    <div className="flex flex-col gap-4">
                        <header className="overflow-hidden rounded-[28px] border-[2.5px] border-[var(--mh-ink)] bg-white shadow-[0_5px_0_var(--mh-ink)]">
                            <div className="flex flex-col gap-1 p-[clamp(18px,3vw,30px)]" style={{ background: color, color: onColor(color) }}>
                                <span className="font-extrabold opacity-90">הוזמנתם ל</span>
                                <h1 className="m-0 font-display text-[clamp(30px,4vw,46px)] leading-[1.1] [text-wrap:balance]">{org.name}</h1>
                            </div>
                            <div className="flex flex-col gap-2 p-[clamp(16px,2.4vw,24px)]">
                                {stage !== "upcoming" && (
                                    <p className="m-0 rounded-[16px] border-2 border-[var(--mh-ink)] bg-[var(--mh-tint-ok)] p-3 text-[17px] font-extrabold">
                                        <span aria-hidden="true">🎉 </span>{locked ? "החגיגה הסתיימה. תודה שחגגתם! ההזמנה נשארת לזיכרון, ואי אפשר לשנות בה יותר." : "החגיגה כבר הייתה. אם נשאר לסדר תשלום, אפשר עדיין לעשות את זה כאן."}
                                    </p>
                                )}
                                {c.surprise.on && stage === "upcoming" && (
                                    <p className="m-0 rounded-[16px] border-2 border-[var(--mh-ink)] bg-[var(--mh-tint-pink)] p-3 text-[17px] font-extrabold">
                                        <span aria-hidden="true">🤫 </span>מסיבת הפתעה. {c.surprise.honoree ? `לא לספר ל${c.surprise.honoree}!` : "לא לספר!"}
                                    </p>
                                )}
                                {pinned.map((p) => (
                                    <div key={p.post.id} className="rounded-[16px] border-2 border-[var(--mh-ink)] bg-[var(--mh-tint-sun)] p-3">
                                        <b className="block text-[16px]"><span aria-hidden="true">📌 </span>{p.post.title}</b>
                                        <span className="block whitespace-pre-line font-semibold">{p.post.body}</span>
                                    </div>
                                ))}
                                {when && <Line icon="cal">{when}</Line>}
                                {coming && c.place ? <Line icon="pin">{c.place}{c.city ? `, ${c.city}` : ""}</Line> : c.city && <Line icon="pin">{c.city}</Line>}
                                {!coming && c.place && <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">הכתובת המדויקת תופיע אחרי שתאשרו הגעה.</span>}
                            </div>
                        </header>

                        <section className={box} aria-labelledby="reply-h">
                            <h2 id="reply-h" className="m-0 font-display text-[24px]">
                                {reply ? `התשובה שלכם: ${STATUS_TEXT[isRsvpStatus(reply.status) ? reply.status : "no"]}` : locked ? "ההזמנה נסגרה" : "מגיעים?"}
                            </h2>
                            {reply && reply.status !== "no" && (
                                <p className="m-0 font-semibold">
                                    {reply.people === 1 ? "רק אתם" : `${reply.people} אנשים`}{reply.kids > 0 ? `, מתוכם ${reply.kids === 1 ? "ילד אחד" : `${reply.kids} ילדים`}` : ""}.{locked ? "" : " אפשר לשנות בכל רגע."}
                                </p>
                            )}
                            {reply && reply.status !== "no" && c.question && reply.answer && (
                                <p className="m-0 font-semibold"><span className="text-[var(--mh-ink-soft)]">{c.question.text}</span> <b><bdi>{reply.answer}</bdi></b></p>
                            )}
                            {!reply && <p className="m-0 font-semibold text-[var(--mh-ink-soft)]">{locked ? "החגיגה כבר הסתיימה, ואי אפשר לענות עליה." : "בלי הרשמה. רק השם שלכם, כדי שהמארגנים ידעו מי מגיע."}</p>}
                            {locked ? null : reply ? (
                                <details className="group">
                                    <summary className="min-h-10 cursor-pointer content-center font-extrabold underline marker:content-none">לשנות את התשובה</summary>
                                    <div className="pt-3">
                                        <ReplyForm token={token} kids={c.kids} question={c.question} initial={{ name: reply.name, status: isRsvpStatus(reply.status) ? reply.status : null, people: reply.people, kids: reply.kids, answer: reply.answer }} />
                                    </div>
                                </details>
                            ) : (
                                <ReplyForm token={token} kids={c.kids} question={c.question} initial={{ name: me ? `${me.firstName ?? ""} ${me.lastName ?? ""}`.trim() : "", status: null, people: 1, kids: 0, answer: null }} />
                            )}
                        </section>
                    </div>

                    <div className="flex flex-col gap-4">
                        {insider && (c.links.whatsapp || c.links.album) && (
                            <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)] xl:grid-cols-2">
                                {c.links.whatsapp && <a href={c.links.whatsapp} target="_blank" rel="noopener noreferrer" className={`${button} bg-[var(--mh-ok)]`}>לקבוצת הווטסאפ</a>}
                                {c.links.album && <a href={c.links.album} target="_blank" rel="noopener noreferrer" className={`${button} bg-white`}>לאלבום התמונות</a>}
                            </div>
                        )}
                        {showMoney && reply && (
                            <section className={box} aria-labelledby="pay-h">
                                <h2 id="pay-h" className="m-0 font-display text-[24px]">
                                    {reply.paid === "confirmed" ? "התשלום התקבל" : reply.paid === "claimed" ? "סימנתם ששילמתם" : owed ? `להעביר ${formatShekels(owed)}` : "השתתפות בתשלום"}
                                </h2>
                                {goal && <CollectBar collected={collected} target={goal} />}
                                {reply.paid === "confirmed" && <p className="m-0 font-semibold">המארגנים אישרו שהגיעו {formatShekels(reply.paidMinor ?? 0)}. תודה!</p>}
                                {reply.paid === "claimed" && <p className="m-0 font-semibold">שילמתם <bdi>{formatShekels(reply.paidMinor ?? 0)}</bdi>, וזה מחכה לאישור של המארגנים.</p>}
                                {reply.paid === "none" && !locked && (
                                    <>
                                        <p className="m-0 font-semibold text-[var(--mh-ink-soft)]">
                                            {c.money.mode === "fixed"
                                                ? c.money.per === "family" ? "סכום אחד לכל משפחה." : "לפי מספר האנשים שמגיעים."
                                                : "כל אחד כמה שרוצה."}{" "}
                                            הכסף עובר ישירות למארגנים.
                                        </p>
                                        {c.money.payLink && (
                                            <a href={c.money.payLink} target="_blank" rel="noopener noreferrer" className={`${button} bg-[var(--mh-org-violet)] text-white`}>לתשלום בביט או בפייבוקס</a>
                                        )}
                                        {session ? (
                                            <form action={markPaid.bind(null, token)} className="flex flex-col gap-2">
                                                {c.money.mode === "free" && (
                                                    <label className="flex flex-col gap-2">
                                                        <span className="text-[14px] font-extrabold">כמה העברתם? (בשקלים)</span>
                                                        <input name="amount" inputMode="decimal" dir="ltr" required placeholder="100" className="min-h-[var(--mh-hit)] rounded-[14px] border-2 border-[var(--mh-ink)] bg-white px-[14px] text-end font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)]" />
                                                    </label>
                                                )}
                                                {sp.amount && <p role="alert" className="m-0 font-extrabold text-[var(--mh-danger)]">הסכום לא נקלט. כתבו מספר בשקלים.</p>}
                                                <button className={`${button} bg-white`}>שילמתי</button>
                                            </form>
                                        ) : (
                                            <>
                                                <Link href={`/login?next=${encodeURIComponent(`/c/${token}`)}`} className={`${button} bg-white`}>שילמתי</Link>
                                                <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">כדי לסמן תשלום נכנסים פעם אחת עם הטלפון, כדי שהמארגנים ידעו בדיוק מי שילם.</span>
                                            </>
                                        )}
                                    </>
                                )}
                            </section>
                        )}

                        {coming && (
                            <section className={box} aria-labelledby="who-h">
                                <h2 id="who-h" className="m-0 font-display text-[24px]">מי מגיע {headcount > 0 && <span className="text-[var(--mh-ink-soft)]">(<bdi>{headcount}</bdi>)</span>}</h2>
                                {guests.length ? (
                                    <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                                        {guests.map((g) => (
                                            <li key={g.id} className="rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-ticket)] px-3 py-1 font-extrabold"><bdi>{guestLabel(g.name, g.people)}</bdi></li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="m-0 font-semibold text-[var(--mh-ink-soft)]">עוד אף אחד לא אישר. אתם יכולים להיות הראשונים.</p>
                                )}
                            </section>
                        )}

                        {insider && !(locked && posts.length === 0) && (
                            <section className="flex flex-col gap-3" aria-labelledby="updates-h">
                                <h2 id="updates-h" className="m-0 font-display text-[24px]">עדכונים מהמארגנים</h2>
                                {posts.length ? posts.map((p) => (
                                    <PostCard key={p.post.id} post={p.post} counts={p.counts} mine={p.mine} react={reply && !locked ? reactOnPost.bind(null, token) : null} />
                                )) : null}
                                {!locked && <p className="m-0 flex items-center gap-2 rounded-[18px] border-2 border-dashed border-[var(--mh-ink)] bg-white/60 p-3 text-[14px] font-bold">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0"><path d="M4 5h16v11H8l-4 4z" /></svg>
                                    {posts.length ? "כאן המארגנים כותבים. אפשר להגיב באייקון." : "כשהמארגנים יעדכנו משהו, זה יופיע כאן."}
                                </p>}
                            </section>
                        )}
                        {reply && !link && !locked && (
                            <section className="wl-tile flex flex-col items-center gap-3 overflow-hidden rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-tint-sun)] p-[clamp(16px,2vw,24px)] text-center shadow-[0_4px_0_var(--mh-ink)]">
                                <WalletArt color={color} />
                                <h2 className="m-0 font-display text-[clamp(22px,2.2vw,26px)]">לשמור את ההזמנה בארנק</h2>
                                <p className="m-0 font-semibold">ככה היא תמיד בהישג יד, ותקבלו עדכון אם משהו משתנה.</p>
                                {session ? (
                                    <form action={keepInWallet.bind(null, token)} className="w-full"><button className={`${button} w-full bg-[var(--mh-org-violet)] text-white`}>לשמור בארנק</button></form>
                                ) : (
                                    <Link href={`/login?next=${encodeURIComponent(`/c/${token}`)}`} className={`${button} w-full bg-[var(--mh-org-violet)] text-white`}>לשמור בארנק</Link>
                                )}
                                {!session && <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">כניסה אחת עם הטלפון, בלי סיסמה.</span>}
                            </section>
                        )}
                        {link && !organizer && <Link href="/wallet" className="min-h-11 self-center content-center font-extrabold underline">ההזמנה שמורה בארנק שלכם</Link>}
                    </div>
                </div>
            </div>
        </main>
    );
}

function Line({ icon, children }: { icon: "cal" | "pin"; children: ReactNode }) {
    return (
        <span className="flex items-start gap-2 text-[18px] font-extrabold">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-[2px] shrink-0">
                {icon === "cal" ? <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></> : <><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>}
            </svg>
            <span className="min-w-0">{children}</span>
        </span>
    );
}

// An invited-only celebration before the phone check: nothing about the event is shown yet.
function Gate({ token, color, notInvited }: { token: string; color: string; notInvited: boolean }) {
    const next = `/login?next=${encodeURIComponent(`/c/${token}`)}`;
    return (
        <main className="flex min-h-dvh items-center justify-center bg-[var(--mh-sun)] px-4 py-6">
            <div className="flex w-full max-w-[480px] flex-col overflow-hidden rounded-[28px] border-[2.5px] border-[var(--mh-ink)] bg-white shadow-[0_5px_0_var(--mh-ink)]">
                <div className="flex flex-col gap-1 p-6" style={{ background: color, color: onColor(color) }}>
                    <span className="text-[34px]" aria-hidden="true">{notInvited ? "🔒" : "💌"}</span>
                    <h1 className="m-0 font-display text-[clamp(26px,6vw,34px)] leading-tight">{notInvited ? "ההזמנה הזו רק למוזמנים" : "הוזמנתם לחגיגה"}</h1>
                </div>
                <div className="flex flex-col gap-3 p-6">
                    {notInvited ? (
                        <>
                            <p className="m-0 font-semibold">המספר שאיתו נכנסתם לא ברשימת המוזמנים. אם הוזמנתם במספר אחר, צריך להיכנס איתו.</p>
                            <form action={signInAgain.bind(null, token)}><button className="min-h-[52px] w-full rounded-full border-[2.5px] border-[var(--mh-ink)] bg-white text-[17px] font-extrabold shadow-[var(--mh-shadow)]">כניסה עם מספר אחר</button></form>
                            <p className="m-0 text-[14px] font-semibold text-[var(--mh-ink-soft)]">חושבים שזו טעות? כדאי לבקש מהמארגנים להוסיף את המספר שלכם.</p>
                        </>
                    ) : (
                        <>
                            <p className="m-0 font-semibold">ההזמנה פתוחה רק למוזמנים. נכנסים עם הטלפון שקיבל את ההזמנה, ומקבלים קוד אחד. בלי סיסמה.</p>
                            <Link href={next} className="flex min-h-[52px] items-center justify-center rounded-full border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-org-violet)] text-[17px] font-extrabold text-white shadow-[var(--mh-shadow)]">כניסה עם הטלפון</Link>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
