"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { admitRequest } from "@/lib/join-server";
import { membersAdmin } from "@/lib/members-server";
import { notifyUsers } from "@/lib/notify-server";
import { NOTE_MAX } from "@/lib/requests-admin";

// The admin's half of a join request. Approving creates the member (src/lib/join-server.ts); the plan and
// labels chosen on approval are applied right away (board D-AdmRequests). Only the owner and admins decide.

export type RequestResult = { ok?: string; error?: string };

async function decider(orgId: string) {
    const a = await membersAdmin(orgId);
    return a?.canManage ? a : null;
}

// One request, the ones a filter shows, or all of them: the same plan and labels go to everyone approved.
export async function approveRequests(orgId: string, ids: string[] | "all", choice: { planId: string; labelIds: string[] }): Promise<RequestResult> {
    const a = await decider(orgId);
    if (!a) return { error: "רק מנהלי הארגון מאשרים בקשות." };
    const list = ids === "all"
        ? (await db.joinRequest.findMany({ where: { orgId, status: "pending" }, select: { id: true }, orderBy: { createdAt: "asc" }, take: 500 })).map((r) => r.id)
        : ids.slice(0, 500);
    const choices = { planId: choice.planId || null, labelIds: choice.labelIds.slice(0, 20) };
    let n = 0;
    for (const id of list) if (await admitRequest(orgId, a.org.name, id, a.userId, choices)) n++;
    revalidatePath(`/orgs/${orgId}`, "layout");
    if (!n) return { error: "הבקשות האלה כבר טופלו." };
    return { ok: n === 1 ? "הבקשה אושרה. הכרטיס כבר בארנק של המבקש." : `${n} בקשות אושרו. הכרטיסים כבר בארנקים.` };
}

// The person gets a kind message and never the reason; the note stays with the admins.
export async function declineRequest(orgId: string, requestId: string, note: string): Promise<RequestResult> {
    const a = await decider(orgId);
    if (!a) return { error: "רק מנהלי הארגון דוחים בקשות." };
    const r = await db.joinRequest.updateMany({
        where: { id: requestId, orgId, status: "pending" },
        data: { status: "rejected", decidedById: a.userId, decidedAt: new Date(), adminNotes: note.trim().slice(0, NOTE_MAX) || null },
    });
    if (!r.count) return { error: "הבקשה הזו כבר טופלה." };
    const req = await db.joinRequest.findUnique({ where: { id: requestId }, select: { userId: true } });
    if (req) await notifyUsers([req.userId], { orgId, kind: "update", topic: "join_answer", refId: requestId, text: `תודה שביקשתם להצטרף ל${a.org.name}. הפעם הבקשה לא אושרה.` });
    revalidatePath(`/orgs/${orgId}`, "layout");
    return { ok: "הבקשה נדחתה. נשלחה למבקש הודעה בנוסח נעים, בלי הסיבה." };
}
