import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { chargeView } from "@/lib/billing/account";
import { chargeInclude, ensureMember, settleLeaver, toChargeIn } from "@/lib/billing/member-money";
import { formatShekels } from "@/lib/money";
import { notifyUsers } from "@/lib/notify-server";
import { typeLabel, whenLabel, type ActivityValues } from "@/lib/activities";
import { getPack } from "@/packs";

export type ActivityStatus = "draft" | "published" | "cancelled";
const status = (s: string): ActivityStatus => (s === "draft" || s === "cancelled" ? s : "published");
const fullName = (f: string | null | undefined, l: string | null | undefined) => `${f ?? ""} ${l ?? ""}`.trim() || "חבר/ה";
const flags = (p: Prisma.JsonValue): Record<string, boolean> => (p && typeof p === "object" && !Array.isArray(p) ? Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v === true])) : {});
const dayOf = (d: Date) => new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(d)}T00:00:00Z`);

// A member of the org who may see its activities. Signing up needs an active membership.
export async function activityMember(orgId: string) {
    const session = await getSession();
    if (!session) return null;
    const link = await db.orgUser.findUnique({ where: { orgId_userId: { orgId, userId: session.userId } }, include: { org: true } });
    if (!link || link.org.status !== "active" || link.org.packId === "celebration" || !["active", "left_with_debt"].includes(link.status)) return null;
    return { userId: session.userId, link };
}

export type ActivityRow = { id: string; title: string; type: string; typeText: string; startsAt: Date; when: string; status: ActivityStatus; signup: boolean; seats: number | null; going: number; priceMinor: number | null; past: boolean; fields: Record<string, boolean> };

function toRow(e: { id: string; title: string; type: string; startsAt: Date; status: string; signup: boolean; seats: number | null; priceMinor: number | null; payload: Prisma.JsonValue; _count: { registrations: number } }, pack: readonly { value: string; label: string }[], now: Date): ActivityRow {
    return { id: e.id, title: e.title, type: e.type, typeText: typeLabel(e.type, pack), startsAt: e.startsAt, when: whenLabel(e.startsAt, now), status: status(e.status), signup: e.signup, seats: e.seats, going: e._count.registrations, priceMinor: e.priceMinor, past: e.startsAt < now, fields: flags(e.payload) };
}
const rowSelect = { id: true, title: true, type: true, startsAt: true, status: true, signup: true, seats: true, priceMinor: true, payload: true, _count: { select: { registrations: { where: { status: "going" } } } } } satisfies Prisma.EventSelect;

// The admin table (board D-AdmActivities): what is coming first, soonest on top, then what already happened.
export async function loadOrgActivities(orgId: string, packId: string, now = new Date()): Promise<ActivityRow[]> {
    const pack = getPack(packId).eventTypes;
    const [coming, past] = await Promise.all([
        db.event.findMany({ where: { orgId, startsAt: { gte: now } }, orderBy: { startsAt: "asc" }, select: rowSelect }),
        db.event.findMany({ where: { orgId, startsAt: { lt: now } }, orderBy: { startsAt: "desc" }, take: 50, select: rowSelect }),
    ]);
    return [...coming, ...past].map((e) => toRow(e, pack, now));
}

// "בקרוב" on the overview: the next published activities.
export async function nextActivities(orgId: string, packId: string, take = 3, now = new Date()): Promise<ActivityRow[]> {
    const pack = getPack(packId).eventTypes;
    const rows = await db.event.findMany({ where: { orgId, status: "published", startsAt: { gte: now } }, orderBy: { startsAt: "asc" }, take, select: rowSelect });
    return rows.map((e) => toRow(e, pack, now));
}

export async function loadActivity(orgId: string, id: string) {
    const e = await db.event.findFirst({
        where: { id, orgId },
        include: { registrations: { where: { status: "going" }, orderBy: { createdAt: "asc" }, select: { id: true, userId: true, createdAt: true, chargeId: true } } },
    });
    if (!e) return null;
    const users = await db.user.findMany({ where: { id: { in: e.registrations.map((r) => r.userId) } }, select: { id: true, firstName: true, lastName: true } });
    const name = new Map(users.map((u) => [u.id, fullName(u.firstName, u.lastName)]));
    return {
        ...e, status: status(e.status), fields: flags(e.payload),
        people: e.registrations.map((r) => ({ id: r.id, name: name.get(r.userId) ?? "חבר/ה", at: r.createdAt, paid: !!r.chargeId })),
    };
}

// "שמירה כטיוטה" and "פרסום". Publishing for the first time can tell all the members.
export async function saveActivity(input: { orgId: string; orgName: string; id: string | null; userId: string; values: ActivityValues; publish: boolean; notify: boolean }) {
    const prev = input.id ? await db.event.findFirst({ where: { id: input.id, orgId: input.orgId }, select: { id: true, status: true, priceMinor: true, startsAt: true, _count: { select: { registrations: { where: { status: "going" } } } } } }) : null;
    if (input.id && !prev) return { error: "הפעילות לא נמצאה." };
    if (prev?.status === "cancelled") return { error: "הפעילות בוטלה, ואי אפשר לערוך אותה." };
    const going = prev?._count.registrations ?? 0;
    // Charges already made stay as they were, so the price is fixed once someone signed up.
    if (prev && going && (prev.priceMinor ?? null) !== input.values.priceMinor) return { error: "כבר יש נרשמים שחויבו לפי המחיר הקיים, ולכן אי אפשר לשנות את המחיר." };
    if (prev && going && !input.values.signup) return { error: "כבר יש נרשמים. כדי לסגור את ההרשמה, בטלו את הפעילות." };
    if (prev && input.values.seats !== null && input.values.seats < going) return { error: `כבר נרשמו ${going}, אז מספר המקומות לא יכול להיות קטן מזה.` };
    const v = input.values;
    const data = { title: v.title, type: v.type, startsAt: v.startsAt, location: v.location, description: v.description, seats: v.seats, signup: v.signup, priceMinor: v.priceMinor, payload: v.payload };
    const firstPublish = input.publish && prev?.status !== "published";
    const e = prev
        ? await db.event.update({ where: { id: prev.id }, data: { ...data, ...(input.publish ? { status: "published" } : {}) } })
        : await db.event.create({ data: { ...data, orgId: input.orgId, status: input.publish ? "published" : "draft", createdById: input.userId } });
    // A new date moves the due date of the sign-up charges with it (paid ones are left alone).
    if (prev && going && v.priceMinor && prev.startsAt.getTime() !== v.startsAt.getTime()) {
        const regs = await db.eventRegistration.findMany({ where: { eventId: prev.id, status: "going", chargeId: { not: null } }, select: { chargeId: true } });
        await db.charge.updateMany({ where: { id: { in: regs.map((r) => r.chargeId!) }, voidedAt: null, allocations: { none: {} } }, data: { dueOn: dayOf(v.startsAt) } });
    }
    // Those who signed up hear about a new date.
    if (prev?.status === "published" && going && prev.startsAt.getTime() !== v.startsAt.getTime()) {
        const regs = await db.eventRegistration.findMany({ where: { eventId: prev.id, status: "going" }, select: { userId: true } });
        await notifyUsers(regs.map((r) => r.userId), { orgId: input.orgId, kind: "update", topic: "activity", refId: prev.id, text: `המועד של "${v.title}" השתנה: ${whenLabel(v.startsAt, new Date())}`, href: `/card/${input.orgId}/activities` });
    }
    if (firstPublish && input.notify) {
        const members = await db.orgUser.findMany({ where: { orgId: input.orgId, status: "active", role: { not: "guest" }, userId: { not: input.userId } }, select: { userId: true } });
        await notifyUsers(members.map((m) => m.userId), { orgId: input.orgId, kind: "update", topic: "activity", refId: e.id, text: `${v.title} · ${whenLabel(v.startsAt, new Date())}${v.signup ? ". אפשר להירשם באפליקציה" : ""}`, href: `/card/${input.orgId}/activities` });
    }
    return { id: e.id };
}

// Cancels the member's unpaid charge for the activity. A paid one stays: a refund waits for the payments service.
async function dropCharge(chargeId: string | null): Promise<"none" | "voided" | "kept"> {
    if (!chargeId) return "none";
    const c = await db.charge.findUnique({ where: { id: chargeId }, include: chargeInclude });
    if (!c || c.voidedAt) return "none";
    const v = chargeView(toChargeIn(c));
    if (!v || v.state !== "open" || v.leftMinor !== v.amountMinor) return "kept";
    // The dedupe key is freed, so signing up again makes a new charge.
    await db.charge.update({ where: { id: c.id }, data: { voidedAt: new Date(), dedupeKey: null } });
    await settleLeaver(c.orgId, c.memberId);
    return "voided";
}

// "ביטול הפעילות": the people who signed up are told, and their unpaid charges are cancelled.
export async function cancelActivity(orgId: string, orgName: string, id: string) {
    const e = await db.event.findFirst({ where: { id, orgId }, include: { registrations: { where: { status: "going" } } } });
    if (!e) return { error: "הפעילות לא נמצאה." };
    if (e.status === "cancelled") return { error: "הפעילות כבר בוטלה." };
    await db.event.update({ where: { id }, data: { status: "cancelled" } });
    let kept = 0;
    for (const r of e.registrations) if ((await dropCharge(r.chargeId)) === "kept") kept++;
    if (e.status === "published") await notifyUsers(e.registrations.map((r) => r.userId), { orgId, kind: "update", topic: "activity", refId: id, text: `הפעילות "${e.title}" בוטלה. ${orgName} עדכנו שהיא לא תתקיים`, href: `/card/${orgId}/activities` });
    return { kept };
}

// What a member sees: published activities still to come, with their own sign-up.
export async function memberActivities(orgId: string, packId: string, userId: string, now = new Date()) {
    const pack = getPack(packId).eventTypes;
    const rows = await db.event.findMany({
        where: { orgId, status: { in: ["published", "cancelled"] }, startsAt: { gte: now } },
        orderBy: { startsAt: "asc" },
        select: { ...rowSelect, location: true, description: true, registrations: { where: { userId }, select: { status: true, chargeId: true } } },
    });
    // A cancelled activity stays in the list only for those who had signed up, so they see it will not happen.
    return rows.map((e) => ({ ...toRow(e, pack, now), location: e.location, description: e.description, mine: e.registrations[0]?.status === "going" })).filter((e) => e.status === "published" || e.mine);
}

// How many coming activities the member can still sign up to, for the card tile.
export async function openActivityCount(orgId: string, userId: string, now = new Date()) {
    const [all, mine] = await Promise.all([
        db.event.count({ where: { orgId, status: "published", startsAt: { gte: now } } }),
        db.eventRegistration.count({ where: { orgId, userId, status: "going", event: { status: "published", startsAt: { gte: now } } } }),
    ]);
    return { coming: all, mine };
}

// "להירשם". The event row is locked so two members never take the last seat together. A paid activity makes
// a one-time charge, due on the day of the activity.
export async function registerActivity(input: { orgId: string; eventId: string; userId: string; linkId: string }) {
    const member = await ensureMember(input.linkId);
    return db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Event" WHERE id = ${input.eventId} FOR UPDATE`;
        const e = await tx.event.findFirst({ where: { id: input.eventId, orgId: input.orgId }, include: { _count: { select: { registrations: { where: { status: "going" } } } } } });
        if (!e || e.status !== "published") return { error: "הפעילות לא פתוחה להרשמה." };
        if (!e.signup) return { error: "לפעילות הזו לא צריך להירשם. פשוט מגיעים." };
        if (e.startsAt < new Date()) return { error: "הפעילות כבר התחילה." };
        const had = await tx.eventRegistration.findUnique({ where: { eventId_userId: { eventId: e.id, userId: input.userId } } });
        if (had?.status === "going") return { ok: true as const };
        if (e.seats !== null && e._count.registrations >= e.seats) return { error: "כל המקומות נתפסו." };
        let chargeId: string | null = null;
        if (e.priceMinor) {
            const key = `event|${e.id}|${member.id}`;
            const old = await tx.charge.findUnique({ where: { orgId_dedupeKey: { orgId: input.orgId, dedupeKey: key } }, select: { id: true } });
            chargeId = old?.id ?? (await tx.charge.create({ data: { orgId: input.orgId, memberId: member.id, kind: "one_time", description: `הרשמה: ${e.title}`, amountMinor: e.priceMinor, dueOn: dayOf(e.startsAt), dedupeKey: key }, select: { id: true } })).id;
        }
        await tx.eventRegistration.upsert({
            where: { eventId_userId: { eventId: e.id, userId: input.userId } },
            create: { eventId: e.id, orgId: input.orgId, userId: input.userId, memberId: member.id, chargeId },
            update: { status: "going", memberId: member.id, chargeId },
        });
        return { ok: true as const, chargeId, priceMinor: e.priceMinor, title: e.title };
    });
}

// "ביטול ההרשמה", until the activity starts.
export async function unregisterActivity(input: { orgId: string; eventId: string; userId: string }) {
    const r = await db.eventRegistration.findUnique({ where: { eventId_userId: { eventId: input.eventId, userId: input.userId } }, include: { event: { select: { orgId: true, startsAt: true } } } });
    if (!r || r.event.orgId !== input.orgId || r.status !== "going") return { ok: true as const, kept: false };
    if (r.event.startsAt < new Date()) return { error: "הפעילות כבר התחילה, ואי אפשר לבטל את ההרשמה." };
    await db.eventRegistration.update({ where: { id: r.id }, data: { status: "cancelled", chargeId: null } });
    const drop = await dropCharge(r.chargeId);
    // A paid charge stays with the registration it paid for, so the admin can see it.
    if (drop === "kept") await db.eventRegistration.update({ where: { id: r.id }, data: { chargeId: r.chargeId } });
    return { ok: true as const, kept: drop === "kept" };
}

export const priceText = (minor: number | null) => (minor ? formatShekels(minor) : "ללא תשלום");
