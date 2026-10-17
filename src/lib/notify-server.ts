import { db } from "@/lib/db";
import { chargeView } from "@/lib/billing/account";
import { chargeInclude, toChargeIn } from "@/lib/billing/member-money";

// Notes on the "הודעות" screen. They are only stored here for now: sending them as push, SMS or email waits
// for the messages service (docs/waiting-for-services.he.md).
type Note = { orgId: string | null; kind: "action" | "update"; topic: string; refId?: string | null; text: string; href?: string | null; actionLabel?: string | null };

export async function notifyUsers(userIds: string[], n: Note): Promise<void> {
    const ids = [...new Set(userIds)];
    if (!ids.length) return;
    await db.notification.createMany({ data: ids.map((userId) => ({ userId, ...n, refId: n.refId ?? null, href: n.href ?? null, actionLabel: n.actionLabel ?? null })) });
}

// To the person behind a member record, when they have a login.
export async function notifyMember(memberId: string | null, n: Note): Promise<void> {
    if (!memberId) return;
    const link = await db.orgUser.findUnique({ where: { memberId }, select: { userId: true } });
    if (link) await notifyUsers([link.userId], n);
}

// To the org's managers (owner and admins).
export async function notifyAdmins(orgId: string, n: Note): Promise<void> {
    const admins = await db.orgUser.findMany({ where: { orgId, status: "active", role: { in: ["owner", "admin"] } }, select: { userId: true } });
    await notifyUsers(admins.map((a) => a.userId), n);
}

// Closes notes whose matter was handled elsewhere: a charge paid or cancelled, a request answered (by any
// admin). Runs before the screen and the bells are drawn.
export async function settleNotes(userId: string): Promise<void> {
    const open = await db.notification.findMany({ where: { userId, kind: "action", doneAt: null }, select: { id: true, topic: true, refId: true } });
    if (!open.length) return;
    const ref = (t: string) => open.filter((o) => o.topic === t && o.refId).map((o) => o.refId!);
    const [charges, asked] = await Promise.all([
        ref("charge").length ? db.charge.findMany({ where: { id: { in: ref("charge") } }, include: chargeInclude }) : [],
        Promise.all([
            ref("join_request").length ? db.joinRequest.findMany({ where: { id: { in: ref("join_request") } }, select: { id: true, status: true } }) : [],
            ref("invitation").length ? db.invitation.findMany({ where: { id: { in: ref("invitation") } }, select: { id: true, status: true, expiresAt: true } }) : [],
            ref("inquiry").length ? db.request.findMany({ where: { id: { in: ref("inquiry") } }, select: { id: true, status: true } }) : [],
        ]),
    ]);
    const now = new Date();
    // An inquiry is handled once the org answered or it closed; a new reply from the member opens a new note.
    const requests = [
        ...asked[0],
        ...asked[1].map((i) => ({ id: i.id, status: i.status === "pending" && i.expiresAt < now ? "expired" : i.status })),
        ...asked[2].map((i) => ({ id: i.id, status: i.status === "new" || i.status === "replied" ? "pending" : "done" })),
    ];
    const closed = new Set<string>();
    for (const c of charges) if (chargeView(toChargeIn(c))?.state !== "open") closed.add(c.id);
    for (const r of requests) if (r.status !== "pending") closed.add(r.id);
    const gone = open.filter((o) => o.refId && !charges.some((c) => c.id === o.refId) && !requests.some((r) => r.id === o.refId)).map((o) => o.id);
    const done = open.filter((o) => o.refId && closed.has(o.refId)).map((o) => o.id);
    if (done.length || gone.length) await db.notification.updateMany({ where: { id: { in: [...done, ...gone] } }, data: { doneAt: new Date() } });
}

// What waits for the person: open actions plus unread updates, in all and per org.
export async function openCounts(userId: string): Promise<{ total: number; actions: number; byOrg: Map<string, number> }> {
    await settleNotes(userId);
    const rows = await db.notification.groupBy({ by: ["orgId", "kind"], where: { userId, OR: [{ kind: "action", doneAt: null }, { kind: "update", readAt: null }] }, _count: true });
    const byOrg = new Map<string, number>();
    let total = 0;
    let actions = 0;
    for (const r of rows) {
        total += r._count;
        if (r.kind === "action") actions += r._count;
        if (r.orgId) byOrg.set(r.orgId, (byOrg.get(r.orgId) ?? 0) + r._count);
    }
    return { total, actions, byOrg };
}

// A new join request waits for the org's managers.
export async function notifyJoinRequest(orgId: string, requestId: string, userId: string): Promise<void> {
    const u = await db.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } });
    const name = `${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim() || "מישהו";
    await notifyAdmins(orgId, { orgId, kind: "action", topic: "join_request", refId: requestId, text: `בקשת הצטרפות חדשה מ${name}`, href: `/orgs/${orgId}/requests`, actionLabel: "לבקשות" });
}
