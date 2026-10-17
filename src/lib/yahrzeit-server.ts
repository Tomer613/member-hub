import { db } from "@/lib/db";
import { emailOf } from "@/lib/billing/pay-server";
import { sendEmail } from "@/lib/email";
import { membersAdmin } from "@/lib/members-server";
import { notifyUsers } from "@/lib/notify-server";
import { calendar, dueForReminder, hebrewLabel, nextYahrzeit, readDedications, readRemindDays, readRules, reminderState, shortDate, weekday, type ReminderState } from "@/lib/yahrzeit";
import { appOrigin } from "@/lib/origin-server";
import { getPack } from "@/packs";
import { YAHRZEIT_RELATIONS } from "@/packs/synagogue/yahrzeit";

const ilToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
export const hasYahrzeit = (packId: string) => (getPack(packId).modules as readonly string[]).includes("yahrzeit");

// "יארצייט" is managed by the owner and admins of an org whose type has it (a synagogue).
export async function yahrzeitAdmin(orgId: string) {
    const a = await membersAdmin(orgId);
    return a && a.canManage && hasYahrzeit(a.org.packId) ? a : null;
}

export type YahrzeitRow = {
    id: string; name: string; relation: string; relationText: string; day: number; month: string; hebrew: string;
    memberId: string; family: string; member: string; notes: string | null; remind: boolean; announce: boolean;
    next: { iso: string; inDays: number; year: number; key: number } | null; date: string; reminder: { state: ReminderState; text: string };
};

// The board's table, the soonest first.
export async function loadYahrzeits(orgId: string, settings: unknown): Promise<YahrzeitRow[]> {
    const list = await db.yahrzeit.findMany({ where: { orgId }, include: { member: { select: { firstName: true, lastName: true } } } });
    const today = ilToday();
    const cal = calendar(today);
    const days = readRemindDays(settings);
    const rules = readRules(settings);
    return list
        .map((y) => {
            const next = nextYahrzeit(y.hebrewDay, y.hebrewMonth, cal, today, rules);
            return {
                id: y.id, name: y.deceasedName, relation: y.relation, relationText: YAHRZEIT_RELATIONS.find((r) => r.value === y.relation)?.label ?? "אחר",
                day: y.hebrewDay, month: y.hebrewMonth, hebrew: hebrewLabel(y.hebrewDay, y.hebrewMonth),
                memberId: y.memberId, family: y.member.lastName.trim() ? `משפחת ${y.member.lastName.trim()}` : `${y.member.firstName}`.trim(), member: `${y.member.firstName} ${y.member.lastName}`.trim(),
                notes: y.notes, remind: y.remind, announce: y.announce, next, date: next ? shortDate(next.iso) : "—",
                reminder: next ? reminderState(next, y.remind, y.remindedFor, days) : { state: "planned" as const, text: "—" },
            };
        })
        .sort((a, b) => (a.next?.inDays ?? 9999) - (b.next?.inDays ?? 9999));
}

// Whom a reminder can go to: the members of the org, also those only on the list (no login yet).
export async function familyOptions(orgId: string) {
    const ms = await db.member.findMany({
        where: { orgId, OR: [{ orgUser: { is: { status: { in: ["active", "left_with_debt"] } } } }, { orgUser: { is: null } }] },
        select: { id: true, firstName: true, lastName: true },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
    return ms.map((m) => ({ id: m.id, label: `${m.firstName} ${m.lastName}`.trim() || "חבר/ה" }));
}

// Reminders whose day came. There is no scheduled job yet (docs/waiting-for-services.he.md), so this runs when
// anyone opens the org's admin area or a member card: a reminder can come late, never twice.
export async function sendDueYahrzeitReminders(orgId: string): Promise<number> {
    const org = await db.organization.findUnique({ where: { id: orgId }, select: { name: true, packId: true, settings: true } });
    if (!org || !hasYahrzeit(org.packId)) return 0;
    const list = await db.yahrzeit.findMany({ where: { orgId, OR: [{ remind: true }, { announce: true }] }, include: withFamily });
    if (!list.length) return 0;
    const today = ilToday();
    const cal = calendar(today, 1, 40);
    const days = readRemindDays(org.settings);
    const rules = readRules(org.settings);
    const offer = offersDedication(org.packId, org.settings);
    let sent = 0;
    for (const y of list) {
        const next = nextYahrzeit(y.hebrewDay, y.hebrewMonth, cal, today, rules);
        if (!next || !dueForReminder(next, true, y.remindedFor, days)) continue;
        // Claimed first, so two screens opened together send it once.
        const claim = await db.yahrzeit.updateMany({ where: { id: y.id, OR: [{ remindedFor: null }, { remindedFor: { not: next.key } }] }, data: { remindedFor: next.key } });
        if (!claim.count) continue;
        await deliver(orgId, org.name, y, next, { remind: y.remind, announce: y.announce, offer });
        sent++;
    }
    return sent;
}

const withFamily = { member: { select: { orgUser: { select: { userId: true, status: true } } } } } as const;
type Due = { id: string; deceasedName: string; hebrewDay: number; hebrewMonth: string; member: { orgUser: { userId: string; status: string } | null } };

// The reminder to the family and the message to the whole community; each part only when asked.
// The invitation goes only where there is "תרומות ונדרים" to record it, and the gabbai did not turn it off.
const offersDedication = (packId: string, settings: unknown) => (getPack(packId).modules as readonly string[]).includes("donations") && readDedications(settings).on;

async function deliver(orgId: string, orgName: string, y: Due, next: { iso: string; inDays: number }, parts: { remind: boolean; announce: boolean; offer: boolean }) {
    const when = next.inDays === 0 ? "היום" : next.inDays === 1 ? "מחר" : `ביום ${weekday(next.iso)}, ${shortDate(next.iso)}`;
    const text = `היארצייט של ${y.deceasedName} חל ${when} (${hebrewLabel(y.hebrewDay, y.hebrewMonth)})`;
    const userId = y.member.orgUser?.status === "active" ? y.member.orgUser.userId : null;
    if (parts.remind && userId) {
        const href = `/card/${orgId}/dedicate/${y.id}`;
        const invite = `אפשר להקדיש לעילוי נשמת ${y.deceasedName}, אם תרצו`;
        await notifyUsers([userId], parts.offer
            ? { orgId, kind: "action", topic: "yahrzeit", refId: y.id, text: `${text}. ${invite}`, href, actionLabel: "להקדשה" }
            : { orgId, kind: "update", topic: "yahrzeit", refId: y.id, text });
        const contacts = await db.userContact.findMany({ where: { userId }, select: { kind: true, value: true, isPrimary: true } });
        const email = emailOf(contacts);
        const link = parts.offer ? await appOrigin().then((o) => `\n\n${invite}: ${o.origin}${href}`).catch(() => "") : "";
        if (email) await sendEmail(email, `תזכורת יארצייט · ${orgName}`, `${text}.${link}\n\nמ${orgName}, באפליקציה PIRI.`).catch(() => undefined);
    }
    if (parts.announce) {
        const all = await db.orgUser.findMany({ where: { orgId, status: "active", role: { not: "guest" }, ...(userId ? { userId: { not: userId } } : {}) }, select: { userId: true } });
        await notifyUsers(all.map((m) => m.userId), { orgId, kind: "update", topic: "yahrzeit", refId: y.id, text: `${text}. הקהל מוזמן להשתתף` });
    }
}

// After an edit: when this year's message already went out and the admin now turned on a part that was off
// (the family reminder, or the message to the community), that part goes now, alone, so nobody gets it twice.
export async function sendTurnedOn(orgId: string, id: string, was: { remind: boolean; announce: boolean; remindedFor: number | null }) {
    const org = await db.organization.findUnique({ where: { id: orgId }, select: { name: true, packId: true, settings: true } });
    const y = await db.yahrzeit.findFirst({ where: { id, orgId }, include: withFamily });
    if (!org || !y || was.remindedFor === null || y.remindedFor !== was.remindedFor) return;
    const today = ilToday();
    const next = nextYahrzeit(y.hebrewDay, y.hebrewMonth, calendar(today, 1, 40), today, readRules(org.settings));
    if (!next || next.key !== was.remindedFor || next.inDays > readRemindDays(org.settings)) return;
    const parts = { remind: y.remind && !was.remind, announce: y.announce && !was.announce, offer: offersDedication(org.packId, org.settings) };
    if (parts.remind || parts.announce) await deliver(orgId, org.name, y, next, parts);
}

// "להקדשה" from the reminder: the family's own yahrzeit, its coming day, the offer, and what was already given
// for that day (one dedication per yahrzeit day).
export async function dedicationFor(orgId: string, yahrzeitId: string, memberId: string | null) {
    if (!memberId) return null;
    const org = await db.organization.findUnique({ where: { id: orgId }, select: { packId: true, settings: true } });
    const y = await db.yahrzeit.findFirst({ where: { id: yahrzeitId, orgId, memberId }, select: { id: true, deceasedName: true, hebrewDay: true, hebrewMonth: true } });
    if (!org || !y || !offersDedication(org.packId, org.settings)) return null;
    const today = ilToday();
    const next = nextYahrzeit(y.hebrewDay, y.hebrewMonth, calendar(today, 1, 400), today, readRules(org.settings));
    if (!next) return null;
    const ref = `yahrzeit|${y.id}|${next.key}`;
    const given = await db.pledge.findFirst({ where: { orgId, ref, cancelledAt: null }, select: { purpose: true, amountMinor: true } });
    return { y, next, ref, given, items: readDedications(org.settings).items, today, hebrew: hebrewLabel(y.hebrewDay, y.hebrewMonth), date: shortDate(next.iso) };
}
