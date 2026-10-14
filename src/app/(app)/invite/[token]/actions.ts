"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";

// Accepting is the member's half of the two-sided join. The invitation must be addressed to one of the
// person's verified contacts, so a forwarded link cannot attach someone to another person's record.
export async function answerInvitation(token: string, accept: boolean) {
    const s = await getSession();
    if (!s) redirect(`/login?invite=${encodeURIComponent(token)}`);
    const inv = await db.invitation.findUnique({ where: { linkToken: token } });
    if (!inv || inv.status !== "pending" || inv.expiresAt < new Date()) redirect("/wallet");
    const mine = await db.userContact.findUnique({ where: { kind_value: { kind: inv.kind, value: inv.value } } });
    if (mine?.userId !== s.userId) redirect(`/invite/${encodeURIComponent(token)}`);
    if (accept) {
        const memberTaken = inv.memberId ? await db.orgUser.findUnique({ where: { memberId: inv.memberId } }) : null;
        await db.orgUser.upsert({
            where: { orgId_userId: { orgId: inv.orgId, userId: s.userId } },
            create: { orgId: inv.orgId, userId: s.userId, role: inv.role, memberId: memberTaken ? null : inv.memberId },
            update: { status: "active", leftAt: null },
        });
    }
    await db.invitation.update({
        where: { id: inv.id },
        data: { status: accept ? "accepted" : "declined", respondedAt: new Date(), acceptedByUserId: accept ? s.userId : null },
    });
    redirect("/wallet");
}
