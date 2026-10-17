import { db } from "@/lib/db";
import { listedMember } from "@/lib/billing/member-money";
import { applyJoinChoices } from "@/lib/join-choices-server";
import { notifyAdmins, notifyJoinRequest, notifyUsers } from "@/lib/notify-server";
import { readJoinOpen } from "@/lib/org-settings";

// Accepting a join request creates the person's record in the org (Member) and their membership (OrgUser),
// so the card appears in their wallet. An admin does it from "בקשות הצטרפות"; in an org whose owner opened
// joining ("הצטרפות מיידית") it happens right away, with no one deciding (decidedById stays empty).
export async function admitRequest(orgId: string, orgName: string, requestId: string, adminId: string | null, choices: { planId: string | null; labelIds: string[] }): Promise<boolean> {
    const req = await db.joinRequest.findFirst({ where: { id: requestId, orgId, status: "pending" }, include: { user: { include: { contacts: true } } } });
    if (!req) return false;
    const { user } = req;
    const phone = user.contacts.find((c) => c.kind === "phone")?.value ?? null;
    const email = user.contacts.find((c) => c.kind === "email")?.value ?? null;
    const memberId = await db.$transaction(async (tx) => {
        const existing = await tx.orgUser.findUnique({ where: { orgId_userId: { orgId, userId: user.id } } });
        let id: string | null;
        if (existing) {
            await tx.orgUser.update({ where: { id: existing.id }, data: { status: "active", leftAt: null } });
            id = existing.memberId;
        } else {
            // Someone already on the list (an import "list only") gets their own record.
            const listed = await listedMember(orgId, phone, email);
            id = listed ?? (await tx.member.create({ data: { orgId, firstName: user.firstName ?? "", lastName: user.lastName ?? "", phone, email } })).id;
            await tx.orgUser.create({ data: { orgId, userId: user.id, role: "member", memberId: id } });
        }
        await tx.joinRequest.update({ where: { id: req.id }, data: { status: "approved", decidedById: adminId, decidedAt: new Date() } });
        return id;
    });
    if (memberId && adminId) await applyJoinChoices(orgId, memberId, choices, adminId);
    if (adminId) await notifyUsers([user.id], { orgId, kind: "update", topic: "join_answer", refId: req.id, text: `הבקשה להצטרף ל${orgName} אושרה. הכרטיס כבר בארנק.`, href: `/card/${orgId}` });
    return true;
}

// "להצטרף" from search or from the join link. With approval (the default) it is a request the admins see;
// with "הצטרפות מיידית" the person is a member at once and the admins are only told.
export async function joinOrRequest(org: { id: string; name: string; settings: unknown }, userId: string, source: "search" | "link", message: string | null): Promise<"joined" | "requested"> {
    // Someone the admins already declined is not let in by the open door; their new ask waits for a decision.
    const declined = await db.joinRequest.findFirst({ where: { orgId: org.id, userId, status: "rejected" }, select: { id: true } });
    const req = await db.joinRequest.create({ data: { orgId: org.id, userId, message, source } });
    if (!declined && readJoinOpen(org.settings) && (await admitRequest(org.id, org.name, req.id, null, { planId: null, labelIds: [] }))) {
        const u = await db.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } });
        const name = `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim() || "חבר חדש";
        await notifyAdmins(org.id, { orgId: org.id, kind: "update", topic: "member_joined", refId: req.id, text: `${name} הצטרף/ה ל${org.name} ${source === "link" ? "בקישור ההצטרפות" : "מהחיפוש"}, בלי אישור (הצטרפות מיידית)`, href: `/orgs/${org.id}/members` });
        return "joined";
    }
    await notifyJoinRequest(org.id, req.id, userId);
    return "requested";
}
