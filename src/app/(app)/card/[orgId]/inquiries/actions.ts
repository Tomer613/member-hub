"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { BODY_MAX, cleanBody, readNewInquiry } from "@/lib/inquiries";
import { createInquiry, inquiryMember, memberReply } from "@/lib/inquiries-server";
import { getPack } from "@/packs";

export type SendResult = { error?: string; id?: string; number?: number | null };

const done = (orgId: string) => {
    revalidatePath(`/card/${orgId}`, "layout");
    revalidatePath(`/orgs/${orgId}`, "layout");
};

// "שליחה להנהלה" (board D-InquiryNew).
export async function sendInquiry(orgId: string, input: { kind: string; body: string; fields: Record<string, string>; followsId: string | null; postId: string | null }): Promise<SendResult> {
    const m = await inquiryMember(orgId);
    if (!m) return { error: "אין לכם גישה לארגון הזה." };
    const read = readNewInquiry(input, getPack(m.link.org.packId).requestKinds);
    if (!read.ok) return { error: read.error };
    // Only the member's own earlier inquiry, and only a message that was sent to them.
    const follows = input.followsId ? await db.request.findFirst({ where: { id: input.followsId, orgId, userId: m.userId }, select: { id: true } }) : null;
    const post = input.postId ? await db.postRecipient.findFirst({ where: { postId: input.postId, userId: m.userId, post: { orgId } }, select: { postId: true } }) : null;
    const req = await createInquiry({ orgId, orgName: m.link.org.name, linkId: m.link.id, userId: m.userId, kind: read.kind, body: read.body, payload: read.payload, followsId: follows?.id ?? null, postId: post?.postId ?? null });
    done(orgId);
    return { id: req.id, number: req.number };
}

// "שליחת תגובה" and "סגירת הפנייה" (board D-InquiryView).
export async function replyInquiry(orgId: string, id: string, input: { body: string; close: boolean }): Promise<{ error?: string }> {
    const m = await inquiryMember(orgId);
    if (!m) return { error: "אין לכם גישה לארגון הזה." };
    const body = cleanBody(input.body);
    if ([...body].length > BODY_MAX) return { error: `התגובה ארוכה מ-${BODY_MAX} תווים.` };
    if (!body && !input.close) return { error: "כתבו תגובה." };
    const r = await memberReply({ orgId, id, userId: m.userId, body, close: input.close });
    if (r.error) return r;
    done(orgId);
    return {};
}
