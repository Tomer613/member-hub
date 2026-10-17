import { db } from "@/lib/db";
import { membersAdmin } from "@/lib/members-server";
import { activityMember } from "@/lib/activities-server";
import { weekDates, weekView, type ChangeRow, type PrayerRow, type WeekRow } from "@/lib/prayers";
import { readCandleMinutes, weekTimes, type WeekTimes } from "@/lib/zmanim";
import { getPack } from "@/packs";

export const ilToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
export const hasPrayers = (packId: string) => (getPack(packId).modules as readonly string[]).includes("prayers");

// "תפילות ולוח זמנים" is run by the owner and admins of an org whose type has it (a synagogue).
export async function prayersAdmin(orgId: string) {
    const a = await membersAdmin(orgId);
    return a && a.canManage && hasPrayers(a.org.packId) ? a : null;
}

// A member of the org (or its admin looking as a member) sees this week's board in the card.
export async function prayersMember(orgId: string) {
    const m = await activityMember(orgId);
    return m && hasPrayers(m.link.org.packId) ? m : null;
}

const day = (d: Date) => d.toISOString().slice(0, 10);
const atDate = (iso: string) => new Date(`${iso}T00:00:00Z`);

export async function loadTemplate(orgId: string): Promise<PrayerRow[]> {
    const list = await db.prayer.findMany({ where: { orgId }, select: { id: true, day: true, name: true, time: true, place: true } });
    return list.sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
}

// "שבוע זה": the regular week on this week's dates with its one-time changes, and the week's times.
export async function loadWeek(orgId: string, org: { city: string | null; settings: unknown }, today = ilToday()): Promise<{ dates: string[]; rows: WeekRow[]; template: PrayerRow[]; times: WeekTimes | null }> {
    const dates = weekDates(today);
    const [template, changes] = await Promise.all([
        loadTemplate(orgId),
        db.prayerChange.findMany({ where: { orgId, date: { gte: atDate(dates[0]), lte: atDate(dates[6]) } } }),
    ]);
    const rows = weekView(template, changes.map((c): ChangeRow => ({ id: c.id, prayerId: c.prayerId, date: day(c.date), cancelled: c.cancelled, name: c.name, time: c.time, place: c.place })), dates);
    const times = org.city ? weekTimes(org.city, dates, readCandleMinutes(org.settings, org.city).minutes) : null;
    return { dates, rows, template, times };
}

// Changes from before this week are not needed anymore.
export const dropOldChanges = (orgId: string, today = ilToday()) => db.prayerChange.deleteMany({ where: { orgId, date: { lt: atDate(weekDates(today)[0]) } } });
