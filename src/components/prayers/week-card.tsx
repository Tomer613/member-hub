import Link from "next/link";
import { DAYS, shortDate } from "@/lib/prayers";
import type { WeekTimes } from "@/lib/zmanim";

const dayOf = (iso: string) => DAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()];

// "השבוע" (board D-ModSynSchedule): the parasha, the week's special days, and Shabbat and holiday times,
// worked out for the org's city. Without a city from the list there is nothing to work them out by.
export function WeekCard({ times, city, settingsHref, children }: { times: WeekTimes | null; city: string | null; settingsHref: string | null; children?: React.ReactNode }) {
    return (
        <section aria-labelledby="wk-h" className="flex flex-col gap-3 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-tint-sun)] p-4 shadow-[0_3px_0_var(--mh-ink)] md:p-5">
            <span className="flex flex-col gap-1">
                <h2 id="wk-h" className="m-0 font-display text-[22px] leading-tight">השבוע</h2>
                <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">{times ? `מחושב אוטומטית לפי ${times.city}` : "מחושב אוטומטית לפי העיר של בית הכנסת"}</span>
            </span>
            {times ? (
                <>
                    {times.parasha && <b className="text-[20px] leading-tight">{times.parasha}</b>}
                    {times.days.length > 0 && (
                        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                            {times.days.map((d) => <li key={d.date + d.name} className="rounded-full border-2 border-[var(--mh-ink)] bg-white px-3 py-[2px] text-[14px] font-extrabold">{d.name} <span className="font-bold text-[var(--mh-ink-soft)]">· {dayOf(d.date)}</span></li>)}
                        </ul>
                    )}
                    <dl className="m-0 flex flex-col gap-2">
                        {times.times.map((t) => (
                            <div key={t.date + t.kind} className="flex items-baseline justify-between gap-3 rounded-[14px] bg-white px-3 py-2">
                                <dt className="font-bold">{t.label} <span className="text-[14px] text-[var(--mh-ink-soft)]">· {dayOf(t.date)} {shortDate(t.date)}</span></dt>
                                <dd className="m-0 text-[20px] font-extrabold"><bdi>{t.time}</bdi></dd>
                            </div>
                        ))}
                    </dl>
                </>
            ) : (
                <p className="m-0 font-semibold">
                    {city ? `את העיר "${city}" עוד אין לנו ברשימה, ולכן אין זמנים.` : "לבית הכנסת עוד לא נבחרה עיר."}
                    {settingsHref && <> <Link href={settingsHref} className="font-extrabold underline underline-offset-4">לבחירת עיר בהגדרות</Link></>}
                </p>
            )}
            {children}
        </section>
    );
}
