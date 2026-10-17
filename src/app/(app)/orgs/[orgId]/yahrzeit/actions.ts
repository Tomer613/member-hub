"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { readYahrzeit, REMIND_DAYS, type YahrzeitInput } from "@/lib/yahrzeit";
import { sendDueYahrzeitReminders, yahrzeitAdmin } from "@/lib/yahrzeit-server";
import { YAHRZEIT_RELATIONS } from "@/packs/synagogue/yahrzeit";

export type YahrzeitResult = { error?: string; ok?: string; id?: string };
const deny = { error: "אין לכם הרשאה לנהל יארצייט בארגון הזה." };

// "הוספת יארצייט" and editing one (board D-ModSynYahrzeit).
export async function saveYahrzeit(orgId: string, id: string | null, input: YahrzeitInput): Promise<YahrzeitResult> {
    const a = await yahrzeitAdmin(orgId);
    if (!a) return deny;
    const read = readYahrzeit(input, YAHRZEIT_RELATIONS);
    if (!read.ok) return { error: read.error };
    if (!(await db.member.findFirst({ where: { id: read.value.memberId, orgId }, select: { id: true } }))) return { error: "המשפחה לא נמצאה בארגון." };
    let saved: string;
    if (id) {
        const prev = await db.yahrzeit.findFirst({ where: { id, orgId }, select: { hebrewDay: true, hebrewMonth: true } });
        if (!prev) return { error: "היארצייט לא נמצא." };
        // A new date means this year's reminder was not sent for it yet.
        const moved = prev.hebrewDay !== read.value.hebrewDay || prev.hebrewMonth !== read.value.hebrewMonth;
        saved = (await db.yahrzeit.update({ where: { id }, data: { ...read.value, ...(moved ? { remindedFor: null } : {}) } })).id;
    } else {
        saved = (await db.yahrzeit.create({ data: { ...read.value, orgId, createdById: a.userId } })).id;
    }
    await sendDueYahrzeitReminders(orgId);
    revalidatePath(`/orgs/${orgId}/yahrzeit`);
    return { id: saved, ok: id ? "השינויים נשמרו." : "היארצייט נוסף." };
}

export async function deleteYahrzeit(orgId: string, id: string): Promise<YahrzeitResult> {
    if (!(await yahrzeitAdmin(orgId))) return deny;
    await db.yahrzeit.deleteMany({ where: { id, orgId } });
    revalidatePath(`/orgs/${orgId}/yahrzeit`);
    return { ok: "היארצייט נמחק." };
}

// "הגדרות תזכורת": how many days before.
export async function saveRemindDays(orgId: string, days: number): Promise<YahrzeitResult> {
    const a = await yahrzeitAdmin(orgId);
    if (!a) return deny;
    if (!(REMIND_DAYS as readonly number[]).includes(days)) return { error: "בחרו מתי לשלוח." };
    const base = (a.org.settings && typeof a.org.settings === "object" && !Array.isArray(a.org.settings) ? a.org.settings : {}) as Prisma.JsonObject;
    await db.organization.update({ where: { id: orgId }, data: { settings: { ...base, yahrzeitDays: days } } });
    await sendDueYahrzeitReminders(orgId);
    revalidatePath(`/orgs/${orgId}/yahrzeit`);
    return { ok: "נשמר." };
}
