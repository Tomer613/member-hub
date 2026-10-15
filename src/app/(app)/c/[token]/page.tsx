import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { onColor } from "@/lib/color";
import { amountOwed, formatShekels, formatWhen, guestLabel, isRsvpStatus, readCelebration } from "@/lib/celebration";
import { keepInWallet, markPaid } from "./actions";
import { WalletArt } from "@/components/wallet-art";
import { ReplyForm } from "./reply-form";
import { cookieName, findReply, hiddenFrom } from "./reply";

// The invitation a celebration's link opens (decided with Tommy 14.10.2026, docs/open-questions.he.md
// 'ערכת "חגיגה ואירוע"'). Anyone with the link sees the name, the day and the city and can reply with a
// name only. The exact place and who else is coming open only after answering "מגיע/ה".

type Props = { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

async function load(token: string) {
    return db.organization.findFirst({ where: { joinToken: token, status: "active", packId: "celebration" } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const org = await load((await params).token);
    // A surprise keeps its name out of the tab title and link previews.
    const named = org && !readCelebration(org.settings).surprise.on;
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
    const org = found && !(await hiddenFrom(found.settings, session?.userId ?? null)) ? found : null;
    if (!org)
        return (
            <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col justify-center gap-3 bg-[var(--mh-sun)] px-4">
                <h1 className="m-0 font-display text-[30px]">ההזמנה כבר לא פעילה</h1>
                <p className="m-0 font-semibold">אולי המארגנים שלחו קישור חדש. כדאי לבדוק איתם.</p>
            </main>
        );

    const c = readCelebration(org.settings);
    const reply = await findReply(org.id, session?.userId ?? null, (await cookies()).get(cookieName(org.id))?.value);
    const link = session ? await db.orgUser.findUnique({ where: { orgId_userId: { orgId: org.id, userId: session.userId } } }) : null;
    const organizer = link?.role === "owner" || link?.role === "admin";
    const coming = reply?.status === "yes" || organizer;
    const guests = coming ? await db.rsvp.findMany({ where: { orgId: org.id, status: "yes" }, orderBy: { createdAt: "asc" }, select: { id: true, name: true, people: true } }) : [];
    const headcount = guests.reduce((n, g) => n + g.people, 0);
    const color = org.brandColor ?? "#FF5A36";
    const when = formatWhen(c.startsAt);
    const owed = reply && reply.status !== "no" ? amountOwed(c.money, reply.people, reply.kids) : null;
    const showMoney = c.money.mode !== "none" && reply && reply.status !== "no";

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
                                {c.surprise.on && (
                                    <p className="m-0 rounded-[16px] border-2 border-[var(--mh-ink)] bg-[var(--mh-tint-pink)] p-3 text-[17px] font-extrabold">
                                        <span aria-hidden="true">🤫 </span>מסיבת הפתעה. {c.surprise.honoree ? `לא לספר ל${c.surprise.honoree}!` : "לא לספר!"}
                                    </p>
                                )}
                                {when && <Line icon="cal">{when}</Line>}
                                {coming && c.place ? <Line icon="pin">{c.place}{c.city ? `, ${c.city}` : ""}</Line> : c.city && <Line icon="pin">{c.city}</Line>}
                                {!coming && c.place && <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">הכתובת המדויקת תופיע אחרי שתאשרו הגעה.</span>}
                            </div>
                        </header>

                        <section className={box} aria-labelledby="reply-h">
                            <h2 id="reply-h" className="m-0 font-display text-[24px]">
                                {reply ? `התשובה שלכם: ${STATUS_TEXT[isRsvpStatus(reply.status) ? reply.status : "no"]}` : "מגיעים?"}
                            </h2>
                            {reply && reply.status !== "no" && (
                                <p className="m-0 font-semibold">
                                    {reply.people === 1 ? "רק אתם" : `${reply.people} אנשים`}{reply.kids > 0 ? `, מתוכם ${reply.kids === 1 ? "ילד אחד" : `${reply.kids} ילדים`}` : ""}. אפשר לשנות בכל רגע.
                                </p>
                            )}
                            {!reply && <p className="m-0 font-semibold text-[var(--mh-ink-soft)]">בלי הרשמה. רק השם שלכם, כדי שהמארגנים ידעו מי מגיע.</p>}
                            {reply ? (
                                <details className="group">
                                    <summary className="min-h-10 cursor-pointer content-center font-extrabold underline marker:content-none">לשנות את התשובה</summary>
                                    <div className="pt-3">
                                        <ReplyForm token={token} kids={c.kids} initial={{ name: reply.name, status: isRsvpStatus(reply.status) ? reply.status : null, people: reply.people, kids: reply.kids }} />
                                    </div>
                                </details>
                            ) : (
                                <ReplyForm token={token} kids={c.kids} initial={{ name: "", status: null, people: 1, kids: 0 }} />
                            )}
                        </section>
                    </div>

                    <div className="flex flex-col gap-4">
                        {showMoney && reply && (
                            <section className={box} aria-labelledby="pay-h">
                                <h2 id="pay-h" className="m-0 font-display text-[24px]">
                                    {reply.paid === "confirmed" ? "התשלום התקבל" : reply.paid === "claimed" ? "סימנתם ששילמתם" : owed ? `להעביר ${formatShekels(owed)}` : "השתתפות בתשלום"}
                                </h2>
                                {reply.paid === "confirmed" && <p className="m-0 font-semibold">המארגנים אישרו שהגיעו {formatShekels(reply.paidMinor ?? 0)}. תודה!</p>}
                                {reply.paid === "claimed" && <p className="m-0 font-semibold">{formatShekels(reply.paidMinor ?? 0)}. מחכה לאישור של המארגנים.</p>}
                                {reply.paid === "none" && (
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

                        {reply && !link && (
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
