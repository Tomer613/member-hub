"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ADAR_RULES, MISSING30_RULES, readDedicationInput, readYahrzeit, REMIND_DAYS, type YahrzeitInput } from "@/lib/yahrzeit";
import { sendDueYahrzeitReminders, sendTurnedOn, yahrzeitAdmin } from "@/lib/yahrzeit-server";
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
        const prev = await db.yahrzeit.findFirst({ where: { id, orgId }, select: { hebrewDay: true, hebrewMonth: true, remind: true, announce: true, remindedFor: true } });
        if (!prev) return { error: "היארצייט לא נמצא." };
        // A new date means this year's reminder was not sent for it yet.
        const moved = prev.hebrewDay !== read.value.hebrewDay || prev.hebrewMonth !== read.value.hebrewMonth;
        saved = (await db.yahrzeit.update({ where: { id }, data: { ...read.value, ...(moved ? { remindedFor: null } : {}) } })).id;
        if (!moved) await sendTurnedOn(orgId, id, prev);
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

// "הגדרות": how many days before, and the org's custom where customs differ.
export async function saveYahrzeitSettings(orgId: string, v: { days: number; adar: string; missing30: string }): Promise<YahrzeitResult> {
    const a = await yahrzeitAdmin(orgId);
    if (!a) return deny;
    if (!(REMIND_DAYS as readonly number[]).includes(v.days)) return { error: "בחרו מתי לשלוח." };
    if (!ADAR_RULES.some((r) => r.value === v.adar) || !MISSING30_RULES.some((r) => r.value === v.missing30)) return { error: "בחרו מנהג." };
    const base = (a.org.settings && typeof a.org.settings === "object" && !Array.isArray(a.org.settings) ? a.org.settings : {}) as Prisma.JsonObject;
    await db.organization.update({ where: { id: orgId }, data: { settings: { ...base, yahrzeitDays: v.days, yahrzeitAdar: v.adar, yahrzeitMissing30: v.missing30 } } });
    await sendDueYahrzeitReminders(orgId);
    revalidatePath(`/orgs/${orgId}/yahrzeit`);
    return { ok: "נשמר." };
}

// "הצעת הקדשה": which dedications the reminder offers and their price, or no offer at all.
export async function saveDedications(orgId: string, raw: { on: boolean; items: { label: string; price: string }[] }): Promise<YahrzeitResult> {
    const a = await yahrzeitAdmin(orgId);
    if (!a) return deny;
    const read = readDedicationInput(raw);
    if (!read.ok) return { error: read.error };
    const base = (a.org.settings && typeof a.org.settings === "object" && !Array.isArray(a.org.settings) ? a.org.settings : {}) as Prisma.JsonObject;
    await db.organization.update({ where: { id: orgId }, data: { settings: { ...base, yahrzeitDedicate: read.value } } });
    revalidatePath(`/orgs/${orgId}/yahrzeit`);
    return { ok: read.value.on ? "נשמר. ההצעה תצורף לתזכורות הבאות." : "נשמר. התזכורות יישלחו בלי הצעה." };
}
