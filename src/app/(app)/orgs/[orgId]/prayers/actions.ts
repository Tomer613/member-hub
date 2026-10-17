"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { deliverMessage, loadMsgRecipients } from "@/lib/messages-server";
import { isTime, PLACE_MAX, readPrayer, readUpdate, weekDates, type PrayerInput } from "@/lib/prayers";
import { ilToday, prayersAdmin } from "@/lib/prayers-server";
import { CANDLE_MINUTES, readCandleMinutes, restUntil } from "@/lib/zmanim";

export type PrayersResult = { error?: string; ok?: string; id?: string };
const deny = { error: "אין לכם הרשאה לנהל את לוח התפילות בארגון הזה." };
const atDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
const done = (orgId: string) => { revalidatePath(`/orgs/${orgId}/prayers`); revalidatePath(`/card/${orgId}/prayers`); };

// "קבוע": a prayer of the regular week, added or edited.
export async function savePrayer(orgId: string, id: string | null, input: PrayerInput): Promise<PrayersResult> {
    if (!(await prayersAdmin(orgId))) return deny;
    const read = readPrayer(input);
    if (!read.ok) return { error: read.error };
    if (id) {
        const r = await db.prayer.updateMany({ where: { id, orgId }, data: read.value });
        if (!r.count) return { error: "התפילה לא נמצאה." };
    } else {
        id = (await db.prayer.create({ data: { ...read.value, orgId } })).id;
    }
    done(orgId);
    return { id, ok: "נשמר בלוח הקבוע." };
}

export async function deletePrayer(orgId: string, id: string): Promise<PrayersResult> {
    if (!(await prayersAdmin(orgId))) return deny;
    await db.prayer.deleteMany({ where: { id, orgId } });
    done(orgId);
    return { ok: "התפילה הוסרה מהלוח הקבוע." };
}

const thisWeek = (date: string) => weekDates(ilToday()).includes(date);
const cleanPlace = (p: string) => p.replace(/\s+/g, " ").trim();

// "שבוע זה": a regular prayer moved or cancelled for this week only. Back to the regular time and place
// with nothing cancelled is no change at all, so it is removed.
export async function changeThisWeek(orgId: string, v: { prayerId: string; date: string; cancelled: boolean; time: string; place: string }): Promise<PrayersResult> {
    if (!(await prayersAdmin(orgId))) return deny;
    if (!thisWeek(v.date)) return { error: "אפשר לשנות רק את השבוע הזה." };
    const p = await db.prayer.findFirst({ where: { id: v.prayerId, orgId } });
    if (!p) return { error: "התפילה לא נמצאה." };
    if (!v.cancelled && !isTime(v.time)) return { error: "בחרו שעה." };
    const place = cleanPlace(v.place);
    if ([...place].length > PLACE_MAX) return { error: `שם המקום ארוך מ-${PLACE_MAX} תווים.` };
    const time = v.cancelled || v.time === p.time ? null : v.time;
    const where = place === (p.place ?? "") || v.cancelled ? null : place || null;
    const key = { prayerId_date: { prayerId: p.id, date: atDate(v.date) } };
    if (!v.cancelled && !time && !where) {
        await db.prayerChange.deleteMany({ where: { orgId, prayerId: p.id, date: atDate(v.date) } });
        done(orgId);
        return { ok: "חזר ללוח הקבוע." };
    }
    await db.prayerChange.upsert({ where: key, create: { orgId, prayerId: p.id, date: atDate(v.date), cancelled: v.cancelled, time, place: where }, update: { cancelled: v.cancelled, time, place: where } });
    done(orgId);
    return { ok: v.cancelled ? "בוטל לשבוע הזה. בשבוע הבא חוזר כרגיל." : "שונה לשבוע הזה. בשבוע הבא חוזר כרגיל." };
}

// "שבוע זה": a prayer this week only (סליחות, a minyan for an event), or one already added edited.
export async function saveOneTime(orgId: string, id: string | null, input: PrayerInput & { date: string }): Promise<PrayersResult> {
    if (!(await prayersAdmin(orgId))) return deny;
    if (!thisWeek(input.date)) return { error: "בחרו יום בשבוע הזה." };
    const read = readPrayer({ ...input, day: String(weekDates(ilToday()).indexOf(input.date)) });
    if (!read.ok) return { error: read.error };
    const data = { name: read.value.name, time: read.value.time, place: read.value.place, date: atDate(input.date) };
    if (id) {
        const r = await db.prayerChange.updateMany({ where: { id, orgId, prayerId: null }, data });
        if (!r.count) return { error: "התפילה לא נמצאה." };
    } else {
        id = (await db.prayerChange.create({ data: { ...data, orgId } })).id;
    }
    done(orgId);
    return { id, ok: "נוסף לשבוע הזה בלבד." };
}

// "חזרה ללוח הקבוע", or removing a prayer added for this week.
export async function undoChange(orgId: string, id: string): Promise<PrayersResult> {
    if (!(await prayersAdmin(orgId))) return deny;
    const c = await db.prayerChange.findFirst({ where: { id, orgId }, select: { prayerId: true } });
    await db.prayerChange.deleteMany({ where: { id, orgId } });
    done(orgId);
    return { ok: c?.prayerId ? "חזר ללוח הקבוע." : "הוסר מהשבוע." };
}

// "עדכון ידני": a short message to the whole community in the org's channel ("הודעות"). Nothing goes out
// from candle lighting to Havdalah (hebrew-calendar C3).
export async function sendPrayerUpdate(orgId: string, text: string): Promise<PrayersResult> {
    const a = await prayersAdmin(orgId);
    if (!a) return deny;
    const read = readUpdate(text);
    if (!read.ok) return { error: read.error };
    if (a.org.city) {
        const until = restUntil(new Date(), a.org.city, readCandleMinutes(a.org.settings, a.org.city).minutes);
        if (until) return { error: `שבת או חג עכשיו. אפשר לשלוח אחרי ${until}.` };
    }
    const to = (await loadMsgRecipients(orgId)).map((r) => ({ userId: r.userId, memberId: r.memberId }));
    if (!to.length) return { error: "עוד אין חברים שיקבלו את ההודעה." };
    await deliverMessage({
        orgId, orgName: a.org.name, authorId: a.userId, audienceText: "כל החברים", to,
        input: { title: "עדכון תפילות", body: read.value, audience: { to: "all" }, email: false, reactable: false, dislike: false },
    });
    revalidatePath(`/orgs/${orgId}/messages`);
    return { ok: to.length === 1 ? "נשלח לחבר אחד, בהודעות." : `נשלח ל-${to.length} חברים, בהודעות.` };
}

// How many minutes before sunset candles are lit here: the city's custom, or the community's own.
export async function saveCandleMinutes(orgId: string, minutes: number | null): Promise<PrayersResult> {
    const a = await prayersAdmin(orgId);
    if (!a) return deny;
    if (minutes !== null && !(CANDLE_MINUTES as readonly number[]).includes(minutes)) return { error: "בחרו כמה דקות." };
    const base = (a.org.settings && typeof a.org.settings === "object" && !Array.isArray(a.org.settings) ? a.org.settings : {}) as Prisma.JsonObject;
    const { prayersCandleMins: _old, ...rest } = base;
    await db.organization.update({ where: { id: orgId }, data: { settings: minutes === null ? rest : { ...rest, prayersCandleMins: minutes } } });
    done(orgId);
    return { ok: `נשמר: ${readCandleMinutes(minutes === null ? {} : { prayersCandleMins: minutes }, a.org.city).minutes} דקות לפני השקיעה.` };
}
