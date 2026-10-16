"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { ensureMember } from "@/lib/billing/member-money";
import { emailOf } from "@/lib/billing/pay-server";
import { sendEmail } from "@/lib/email";
import { DISPUTE_REASON_MAX, MESSAGE_MAX, reminderSummary } from "@/lib/members-admin";
import { fileCharges, loadMemberRows, membersAdmin } from "@/lib/members-server";
import { formatShekels } from "@/lib/money";
import { notifyMember, notifyUsers } from "@/lib/notify-server";
import { audienceText } from "@/lib/messages-admin";
import { deliverMessage } from "@/lib/messages-server";
import { POST_TITLE_MAX } from "@/lib/reactions";
import { getPack } from "@/packs";

export type BulkResult = { ok?: string; error?: string };

const done = (orgId: string) => {
    revalidatePath(`/orgs/${orgId}/members`, "layout");
    revalidatePath("/wallet");
};

async function emailUser(userId: string, subject: string, text: string) {
    const contacts = await db.userContact.findMany({ where: { userId }, select: { kind: true, value: true, isPrimary: true } });
    const email = emailOf(contacts);
    if (email) await sendEmail(email, subject, text).catch(() => undefined);
}

// Debt reminders to the chosen members (boards D-Admin, D-AdmMember). The limit of one a week per member and
// the rule that disputed charges are never reminded are enforced here, whatever the screen asked for.
// Sent in the app and by email for now; SMS and WhatsApp wait for the messages service.
export async function sendReminders(orgId: string, linkIds: string[]): Promise<BulkResult> {
    const a = await membersAdmin(orgId);
    if (!a) return { error: "אין לכם הרשאה לשלוח תזכורות בארגון הזה." };
    const rows = (await loadMemberRows(orgId, a.org.packId)).filter((r) => r.linkId && linkIds.includes(r.linkId));
    const tally = { sent: 0, recent: 0, noDebt: 0, disputed: 0 };
    for (const r of rows) {
        if (r.owedMinor <= 0) {
            if (r.disputes > 0) tally.disputed++;
            else tally.noDebt++;
            continue;
        }
        if (r.remindAfter || !r.memberId) {
            tally.recent++;
            continue;
        }
        const link = await db.orgUser.findUniqueOrThrow({ where: { id: r.linkId! }, select: { userId: true } });
        const oldest = (await fileCharges(orgId, r.memberId)).filter((c) => c.state === "open" && !c.disputeId).sort((x, y) => x.due.getTime() - y.due.getTime())[0];
        const text = `תזכורת: יש לך יתרה פתוחה של ${formatShekels(r.owedMinor)} ב${a.org.name}.`;
        await db.debtReminder.create({ data: { orgId, memberId: r.memberId, channel: "push", sentById: a.userId } });
        await notifyUsers([link.userId], { orgId, kind: "action", topic: "charge", refId: oldest?.id ?? null, text, href: `/pay/${orgId}`, actionLabel: "לתשלום" });
        await emailUser(link.userId, `תזכורת תשלום · ${a.org.name}`, `${text}\nלתשלום באפליקציה: /pay/${orgId}`);
        tally.sent++;
    }
    done(orgId);
    return { ok: reminderSummary(tally) };
}

// A short message from the members table or a member file to the chosen members. It becomes a message like
// any other (board D-AdmMessages): in their channel, in "הודעות", and by email, with who read it.
export async function sendMessage(orgId: string, linkIds: string[], raw: string): Promise<BulkResult> {
    const a = await membersAdmin(orgId);
    if (!a) return { error: "אין לכם הרשאה לשלוח הודעות בארגון הזה." };
    const text = raw.trim();
    if (!text) return { error: "כתבו את ההודעה." };
    if (text.length > MESSAGE_MAX) return { error: "ההודעה ארוכה מדי." };
    const links = await db.orgUser.findMany({ where: { orgId, id: { in: linkIds }, status: { in: ["active", "left_with_debt"] } }, select: { userId: true, memberId: true, user: { select: { firstName: true } } } });
    if (!links.length) return { error: "בחרו לפחות חבר אחד." };
    const title = `הודעה מ${a.org.name}`.slice(0, POST_TITLE_MAX);
    const audience = { to: "picked" as const, linkIds };
    const names = links.map((l) => l.user.firstName ?? "חבר/ה");
    await deliverMessage({ orgId, orgName: a.org.name, authorId: a.userId, input: { title, body: text, audience, email: true, reactable: true, dislike: true }, audienceText: audienceText(audience, { picked: names, group: null }), to: links });
    done(orgId);
    revalidatePath(`/orgs/${orgId}/messages`);
    return { ok: links.length === 1 ? "ההודעה נשלחה." : `ההודעה נשלחה ל-${links.length} חברים.` };
}

// Gives one hand-given label to many members at once.
export async function addLabelMany(orgId: string, labelId: string, linkIds: string[]): Promise<BulkResult> {
    const a = await membersAdmin(orgId);
    if (!a?.canManage) return { error: "רק מנהלי הארגון נותנים תוויות." };
    const label = await db.membershipLabel.findFirst({ where: { id: labelId, orgId, assignment: "manual" } });
    if (!label) return { error: "בחרו תווית." };
    const links = await db.orgUser.findMany({ where: { orgId, id: { in: linkIds }, status: "active", role: { not: "guest" } }, select: { id: true, userId: true } });
    let added = 0;
    for (const l of links) {
        const m = await ensureMember(l.id);
        const had = await db.memberLabel.findUnique({ where: { labelId_memberId: { labelId, memberId: m.id } } });
        if (had) continue;
        await db.memberLabel.create({ data: { orgId, labelId, memberId: m.id, assignedById: a.userId } });
        if (label.visibility === "all" && l.userId !== a.userId) await notifyUsers([l.userId], { orgId, kind: "update", topic: "label", refId: label.id, text: `קיבלתם תווית חדשה: ${label.name}`, href: `/card/${orgId}` });
        added++;
    }
    done(orgId);
    revalidatePath(`/orgs/${orgId}/labels`);
    const skipped = links.length - added;
    const head = added === 0 ? "לא נוספו תוויות" : added === 1 ? `התווית ״${label.name}״ נוספה לחבר אחד` : `התווית ״${label.name}״ נוספה ל-${added} חברים`;
    return { ok: skipped ? `${head}. ${skipped === 1 ? "לחבר אחד היא כבר הייתה" : `ל-${skipped} חברים היא כבר הייתה`}.` : `${head}.` };
}

export async function removeLabel(orgId: string, labelId: string, memberId: string): Promise<void> {
    const a = await membersAdmin(orgId);
    if (!a?.canManage) return;
    await db.memberLabel.deleteMany({ where: { orgId, labelId, memberId } });
    done(orgId);
    revalidatePath(`/orgs/${orgId}/labels`);
}

// The org marks a charge as disputed. Reminders on it stop until the dispute is closed (ux-spec 7). The
// platform records it and does not decide who is right.
export async function openDispute(orgId: string, chargeId: string, raw: string): Promise<BulkResult> {
    const a = await membersAdmin(orgId);
    if (!a) return { error: "אין לכם הרשאה." };
    const reason = raw.trim();
    if (!reason) return { error: "כתבו בקצרה על מה המחלוקת." };
    if (reason.length > DISPUTE_REASON_MAX) return { error: "ההסבר ארוך מדי." };
    const charge = await db.charge.findFirst({ where: { id: chargeId, orgId, voidedAt: null }, include: { disputes: { where: { status: "open" } } } });
    if (!charge) return { error: "החיוב לא נמצא." };
    if (charge.disputes.length) return { error: "על החיוב הזה כבר פתוחה מחלוקת." };
    await db.chargeDispute.create({ data: { orgId, chargeId, openedById: a.userId, openedBySide: "org", reason } });
    await notifyMember(charge.memberId, { orgId, kind: "update", topic: "dispute", refId: chargeId, text: `החיוב ״${charge.description}״ סומן במחלוקת. עד שהעניין ייסגר לא יישלחו עליו תזכורות.` });
    done(orgId);
    return { ok: "החיוב סומן במחלוקת. התזכורות עליו נעצרו." };
}

export async function closeDispute(orgId: string, disputeId: string): Promise<void> {
    const a = await membersAdmin(orgId);
    if (!a) return;
    await db.chargeDispute.updateMany({ where: { id: disputeId, orgId, status: "open" }, data: { status: "resolved", resolvedAt: new Date() } });
    done(orgId);
}

// The member's current subscriptions: their own, or their household's when they pay for it.
async function currentSubs(orgId: string, memberId: string) {
    const homes = await db.householdMember.findMany({ where: { orgId, memberId, isPayer: true, OR: [{ endsOn: null }, { endsOn: { gte: new Date() } }] }, select: { householdId: true } });
    return db.subscription.findMany({
        where: { orgId, status: { in: ["active", "frozen"] }, OR: [{ memberId }, ...(homes.length ? [{ householdId: { in: homes.map((h) => h.householdId) } }] : [])] },
        include: { plan: true },
        orderBy: { startsOn: "desc" },
    });
}

const todayDate = () => new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date())}T00:00:00Z`);

// "שינוי מסלול": the current subscription ends today and the new one starts today. Charges already made stay.
export async function changePlan(orgId: string, linkId: string, planId: string): Promise<BulkResult> {
    const a = await membersAdmin(orgId);
    if (!a) return { error: "אין לכם הרשאה." };
    const plan = await db.plan.findFirst({ where: { id: planId, orgId, isActive: true } });
    if (!plan) return { error: "בחרו מסלול." };
    const link = await db.orgUser.findFirst({ where: { id: linkId, orgId, status: "active" } });
    if (!link) return { error: "החבר לא נמצא." };
    const m = await ensureMember(link.id);
    const subs = await currentSubs(orgId, m.id);
    if (subs.some((s) => s.planId === planId)) return { error: "זה כבר המסלול הנוכחי." };
    const day = todayDate();
    const was = subs[0] ?? null;
    await db.$transaction([
        ...(was ? [db.subscription.update({ where: { id: was.id }, data: { status: "ended", endsOn: day } })] : []),
        db.subscription.create({ data: { orgId, planId, memberId: was?.householdId ? null : m.id, householdId: was?.householdId ?? null, startsOn: day, quantity: was?.quantity ?? 1 } }),
    ]);
    await notifyMember(m.id, { orgId, kind: "update", topic: "plan", text: `המסלול שלך עודכן ל״${plan.name}״.`, href: `/card/${orgId}` });
    done(orgId);
    return { ok: `המסלול עודכן ל״${plan.name}״.` };
}

// "הקפאת מנוי", only where the org's type has freezing (gym). An empty date unfreezes.
export async function setFreeze(orgId: string, linkId: string, until: string): Promise<BulkResult> {
    const a = await membersAdmin(orgId);
    if (!a) return { error: "אין לכם הרשאה." };
    if (!getPack(a.org.packId).modules.includes("freeze")) return { error: "הקפאה לא קיימת בסוג הארגון הזה." };
    const link = await db.orgUser.findFirst({ where: { id: linkId, orgId, status: "active" } });
    if (!link?.memberId) return { error: "לחבר אין מנוי פעיל." };
    const sub = (await currentSubs(orgId, link.memberId))[0];
    if (!sub) return { error: "לחבר אין מנוי פעיל." };
    const day = todayDate();
    if (!until) {
        await db.subscription.update({ where: { id: sub.id }, data: { status: "active", frozenUntil: day } });
        done(orgId);
        return { ok: "המנוי חזר לפעול." };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(until)) return { error: "התאריך לא תקין." };
    const end = new Date(`${until}T00:00:00Z`);
    if (end <= day) return { error: "תאריך הסיום צריך להיות אחרי היום." };
    await db.subscription.update({ where: { id: sub.id }, data: { status: "frozen", frozenFrom: day, frozenUntil: end } });
    await notifyMember(link.memberId, { orgId, kind: "update", topic: "plan", text: `המנוי שלך הוקפא עד ${until.split("-").reverse().join(".")}.`, href: `/card/${orgId}` });
    done(orgId);
    return { ok: "המנוי הוקפא." };
}

// "הסרת חבר". With an open balance the member becomes "left with a debt": the debt stays and the card stays in
// their wallet until it is paid (ux-spec 7, Q-L1). Owners are not removed here (that is a transfer of ownership).
export async function removeMember(orgId: string, linkId: string): Promise<BulkResult> {
    const a = await membersAdmin(orgId);
    if (!a?.canManage) return { error: "רק מנהלי הארגון מסירים חברים." };
    const link = await db.orgUser.findFirst({ where: { id: linkId, orgId, status: "active" } });
    if (!link) return { error: "החבר לא נמצא." };
    if (link.userId === a.userId) return { error: "אי אפשר להסיר את עצמכם מכאן." };
    if (link.role === "owner") return { error: "את בעל החשבון לא מסירים. קודם מעבירים את הבעלות." };
    const row = (await loadMemberRows(orgId, a.org.packId, link.id))[0];
    const owes = !!row && row.balanceMinor > 0;
    await db.orgUser.update({ where: { id: link.id }, data: { status: owes ? "left_with_debt" : "left", leftAt: new Date() } });
    await notifyUsers([link.userId], {
        orgId,
        kind: "update",
        topic: "membership",
        text: owes ? `החברות שלך ב${a.org.name} הסתיימה. היתרה הפתוחה נשארת, והכרטיס יישאר בארנק עד שתיסגר.` : `החברות שלך ב${a.org.name} הסתיימה. הכרטיס עבר לארכיון.`,
    });
    done(orgId);
    return { ok: owes ? "החבר הוסר. החוב נשמר והוא מופיע תחת ״עזבו עם חוב״." : "החבר הוסר." };
}
