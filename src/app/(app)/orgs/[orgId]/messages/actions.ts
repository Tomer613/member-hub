"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { membersAdmin } from "@/lib/members-server";
import { audienceText, pickMsgRecipients, readMessageInput } from "@/lib/messages-admin";
import { deliverMessage, loadMsgRecipients } from "@/lib/messages-server";
import { notifyUsers } from "@/lib/notify-server";
import { cleanPost } from "@/lib/reactions";

export type MessageResult = { ok?: string; error?: string; draftId?: string; sentId?: string };

// Who writes to members: owner, admins and the treasurer (who also sends debt reminders), as in the members table.
const writer = membersAdmin;

async function groupName(orgId: string, a: ReturnType<typeof readMessageInput>["audience"]) {
    if (a.to === "plan") return (await db.plan.findFirst({ where: { id: a.planId, orgId }, select: { name: true } }))?.name ?? null;
    if (a.to === "label") return (await db.membershipLabel.findFirst({ where: { id: a.labelId, orgId }, select: { name: true } }))?.name ?? null;
    return null;
}

// "שליחה" (boards D-AdmMessage, D-AdmCompose).
export async function sendOrgMessage(orgId: string, raw: unknown, draftId?: string): Promise<MessageResult> {
    const a = await writer(orgId);
    if (!a) return { error: "אין לך הרשאה לשלוח הודעות בארגון הזה." };
    const input = readMessageInput(raw);
    const clean = cleanPost(input.title, input.body);
    if ("error" in clean) return { error: clean.error.endsWith(".") ? clean.error : `${clean.error}.` };
    const to = pickMsgRecipients(await loadMsgRecipients(orgId), input.audience);
    if (!to.length) return { error: input.audience.to === "picked" ? "בחרו לפחות חבר אחד." : "אין חברים שמתאימים לבחירה הזו." };
    const text = audienceText(input.audience, { picked: to.map((r) => r.name.split(" ")[0]), group: await groupName(orgId, input.audience) });
    const id = await deliverMessage({ orgId, orgName: a.org.name, authorId: a.userId, input: { ...input, ...clean }, audienceText: text, to, draftId });
    revalidatePath(`/orgs/${orgId}`, "layout");
    return { ok: to.length === 1 ? "ההודעה נשלחה לחבר אחד." : `ההודעה נשלחה ל-${to.length} חברים.`, sentId: id };
}

// "שמירה כטיוטה": kept as a post in draft state, seen by nobody but the admins.
export async function saveMessageDraft(orgId: string, raw: unknown, draftId?: string): Promise<MessageResult> {
    const a = await writer(orgId);
    if (!a) return { error: "אין לך הרשאה." };
    const input = readMessageInput(raw);
    if (!input.title.trim() && !input.body.trim()) return { error: "כתבו לפחות כותרת או תוכן כדי לשמור טיוטה." };
    const data = { title: input.title.trim(), body: input.body, audience: input.audience, reactable: input.reactable, dislike: input.dislike, channels: input.email ? ["app", "email"] : ["app"], audienceText: "טיוטה", authorId: a.userId };
    const existing = draftId ? await db.channelPost.findFirst({ where: { id: draftId, orgId, status: "draft" }, select: { id: true } }) : null;
    const d = existing ? await db.channelPost.update({ where: { id: existing.id }, data }) : await db.channelPost.create({ data: { orgId, status: "draft", ...data } });
    revalidatePath(`/orgs/${orgId}/messages`);
    return { ok: "הטיוטה נשמרה. היא מחכה ברשימת ההודעות.", draftId: d.id };
}

export async function deleteMessageDraft(orgId: string, id: string): Promise<void> {
    if (!(await writer(orgId))) return;
    await db.channelPost.deleteMany({ where: { id, orgId, status: "draft" } });
    revalidatePath(`/orgs/${orgId}/messages`);
}

// "שליחת תזכורת ל-N שלא קראו": once per message, to whoever has not opened it yet.
export async function remindUnread(orgId: string, id: string): Promise<MessageResult> {
    const a = await writer(orgId);
    if (!a) return { error: "אין לך הרשאה." };
    const p = await db.channelPost.findFirst({ where: { id, orgId, status: "sent" }, include: { recipients: { where: { readAt: null }, select: { userId: true } } } });
    if (!p) return { error: "ההודעה לא נמצאה." };
    if (p.remindedAt) return { error: "כבר נשלחה תזכורת על ההודעה הזו." };
    if (!p.recipients.length) return { error: "כולם כבר קראו." };
    await notifyUsers(p.recipients.map((r) => r.userId), { orgId, kind: "update", topic: "message", refId: p.id, text: `תזכורת: ${p.title}`, href: `/card/${orgId}/messages` });
    await db.channelPost.update({ where: { id: p.id }, data: { remindedAt: new Date() } });
    revalidatePath(`/orgs/${orgId}/messages`);
    return { ok: p.recipients.length === 1 ? "נשלחה תזכורת לאחד." : `נשלחה תזכורת ל-${p.recipients.length}.` };
}
