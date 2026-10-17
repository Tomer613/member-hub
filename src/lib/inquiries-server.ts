import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { ensureMember } from "@/lib/billing/member-money";
import { emailOf } from "@/lib/billing/pay-server";
import { sendEmail } from "@/lib/email";
import { autoCloseBefore, isInquiryStatus, kindLabel, nextNumber, payloadLines, previewLine, staffSignature, waitsForOrg, type InquiryStatus } from "@/lib/inquiries";
import { notifyAdmins, notifyUsers } from "@/lib/notify-server";
import { hebrewAgo } from "@/lib/relative-time";
import { roleLabel } from "@/lib/wallet";
import { getPack } from "@/packs";

const status = (s: string): InquiryStatus => (isInquiryStatus(s) ? s : "new");
const fullName = (f: string | null | undefined, l: string | null | undefined) => `${f ?? ""} ${l ?? ""}`.trim() || "חבר/ה";
const when = (d: Date) => new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);

// An answered inquiry nobody wrote in for 14 days closes by itself (board D-AdmInquiry). Done when a list is
// read, so it needs no scheduled job.
export async function autoClose(orgId: string, now = new Date()) {
    await db.request.updateMany({ where: { orgId, status: "answered", lastAt: { lt: autoCloseBefore(now) } }, data: { status: "closed", closedAt: now } });
}

// How many wait for the org: new, or the member wrote again. For the menu, the overview and the members table.
export const waitingCount = (orgId: string) => db.request.count({ where: { orgId, status: { in: ["new", "replied"] } } });
export const openCount = (orgId: string) => db.request.count({ where: { orgId, status: { not: "closed" } } });

async function emailUser(userId: string, subject: string, text: string) {
    const contacts = await db.userContact.findMany({ where: { userId }, select: { kind: true, value: true, isPrimary: true } });
    const email = emailOf(contacts);
    if (email) await sendEmail(email, subject, text).catch(() => undefined);
}

// "שליחה להנהלה": numbered per org from #1001. Two at once may race for the same number; the second retries.
export async function createInquiry(input: { orgId: string; orgName: string; linkId: string; userId: string; kind: string; body: string; payload: Record<string, string | number>; followsId: string | null; postId: string | null }) {
    const member = await ensureMember(input.linkId);
    for (let attempt = 0; ; attempt++) {
        try {
            const req = await db.$transaction(async (tx) => {
                const max = await tx.request.aggregate({ where: { orgId: input.orgId }, _max: { number: true } });
                return tx.request.create({
                    data: {
                        orgId: input.orgId, memberId: member.id, userId: input.userId, number: nextNumber(max._max.number), kind: input.kind, payload: input.payload,
                        followsId: input.followsId, postId: input.postId,
                        messages: input.body ? { create: { authorId: input.userId, side: "member", body: input.body } } : undefined,
                    },
                });
            });
            const u = await db.user.findUnique({ where: { id: input.userId }, select: { firstName: true, lastName: true } });
            const pack = getPack((await db.organization.findUniqueOrThrow({ where: { id: input.orgId }, select: { packId: true } })).packId).requestKinds;
            await notifyAdmins(input.orgId, { orgId: input.orgId, kind: "action", topic: "inquiry", refId: req.id, text: `פנייה חדשה מ${fullName(u?.firstName, u?.lastName)}: ${kindLabel(input.kind, pack)}`, href: `/orgs/${input.orgId}/inquiries?i=${req.id}`, actionLabel: "לפנייה" });
            return req;
        } catch (e) {
            if (attempt < 3 && e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
            throw e;
        }
    }
}

// The org answers, or writes a note only managers see. The first manager to answer takes the inquiry.
export async function orgReply(input: { orgId: string; orgName: string; id: string; authorId: string; body: string; internal: boolean; close: boolean }) {
    const req = await db.request.findFirst({ where: { id: input.id, orgId: input.orgId } });
    if (!req) return { error: "הפנייה לא נמצאה." };
    if (req.status === "closed") return { error: "הפנייה כבר נסגרה." };
    const now = new Date();
    const answers = !!input.body && !input.internal;
    await db.$transaction([
        ...(input.body ? [db.requestMessage.create({ data: { requestId: req.id, authorId: input.authorId, side: "org", internal: input.internal, body: input.body } })] : []),
        db.request.update({
            where: { id: req.id },
            data: {
                assigneeId: req.assigneeId ?? input.authorId,
                ...(input.close ? { status: "closed", closedAt: now } : answers ? { status: "answered" } : {}),
                ...(input.body ? { lastAt: now } : {}),
            },
        }),
    ]);
    if (req.userId && (answers || input.close)) {
        const text = answers ? `יש תשובה לפנייה #${req.number} ב${input.orgName}` : `הפנייה #${req.number} ב${input.orgName} נסגרה`;
        await notifyUsers([req.userId], { orgId: input.orgId, kind: "update", topic: "inquiry_answer", refId: req.id, text, href: `/card/${input.orgId}/inquiries/${req.id}` });
        if (answers) await emailUser(req.userId, `תשובה לפנייה · ${input.orgName}`, `${text}.\n\n${input.body}\n\nלתגובה באפליקציה: /card/${input.orgId}/inquiries/${req.id}`);
    }
    return {};
}

// The member writes again, or closes it. A reply after an answer waits for the org again.
export async function memberReply(input: { orgId: string; id: string; userId: string; body: string; close: boolean }) {
    const req = await db.request.findFirst({ where: { id: input.id, orgId: input.orgId, userId: input.userId } });
    if (!req) return { error: "הפנייה לא נמצאה." };
    if (req.status === "closed") return { error: "הפנייה נסגרה ואי אפשר להגיב בה." };
    const now = new Date();
    await db.$transaction([
        ...(input.body ? [db.requestMessage.create({ data: { requestId: req.id, authorId: input.userId, side: "member", body: input.body } })] : []),
        db.request.update({
            where: { id: req.id },
            data: input.close ? { status: "closed", closedAt: now } : { status: req.status === "new" ? "new" : "replied", lastAt: now },
        }),
    ]);
    if (input.body && !input.close) {
        const note = { orgId: input.orgId, kind: "action" as const, topic: "inquiry", refId: req.id, text: `תגובה חדשה בפנייה #${req.number}`, href: `/orgs/${input.orgId}/inquiries?i=${req.id}`, actionLabel: "לפנייה" };
        if (req.assigneeId) await notifyUsers([req.assigneeId], note);
        else await notifyAdmins(input.orgId, note);
    }
    return {};
}

export type InquiryRow = { id: string; number: number | null; kind: string; kindText: string; status: InquiryStatus; who: string; line: string; ago: string; assignee: string | null };

// The org's list (boards D-AdmInquiries, D-AdmInquiry): what waits first, then the latest.
export async function loadOrgInquiries(orgId: string, packId: string): Promise<InquiryRow[]> {
    await autoClose(orgId);
    const pack = getPack(packId).requestKinds;
    const rows = await db.request.findMany({
        where: { orgId },
        include: { member: { select: { firstName: true, lastName: true } }, messages: { where: { side: "member" }, orderBy: { createdAt: "asc" }, take: 1, select: { body: true } } },
        orderBy: { lastAt: "desc" },
        take: 300,
    });
    const staff = await staffNames(orgId, rows.flatMap((r) => (r.assigneeId ? [r.assigneeId] : [])));
    const now = new Date();
    return rows
        .map((r) => ({
            id: r.id, number: r.number, kind: r.kind, kindText: kindLabel(r.kind, pack), status: status(r.status),
            who: fullName(r.member.firstName, r.member.lastName),
            line: previewLine(r.messages[0]?.body ?? null, payloadLines(r.kind, r.payload, pack)),
            ago: hebrewAgo(r.lastAt, now), assignee: r.assigneeId ? staff.get(r.assigneeId)?.first ?? null : null,
        }))
        .sort((a, b) => Number(waitsForOrg(b.status)) - Number(waitsForOrg(a.status)));
}

async function staffNames(orgId: string, userIds: string[]) {
    const ids = [...new Set(userIds)];
    const links = ids.length ? await db.orgUser.findMany({ where: { orgId, userId: { in: ids } }, include: { user: { select: { firstName: true, lastName: true } }, org: { select: { packId: true } } } }) : [];
    return new Map(links.map((l) => [l.userId, { first: l.user.firstName?.trim() || "מנהל", full: fullName(l.user.firstName, l.user.lastName), role: roleLabel(l.role, l.org.packId) }]));
}

export type ThreadItem = { id: string; side: "member" | "org"; internal: boolean; author: string; when: string; body: string };

// One inquiry with its conversation. The member never gets the internal notes, and sees the managers by first
// name and role.
export async function loadInquiry(orgId: string, id: string, viewer: { userId: string; staff: boolean }) {
    const r = await db.request.findFirst({
        where: { id, orgId, ...(viewer.staff ? {} : { userId: viewer.userId }) },
        include: { member: { select: { firstName: true, lastName: true } }, org: { select: { packId: true, name: true } }, messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!r) return null;
    const pack = getPack(r.org.packId).requestKinds;
    const staff = await staffNames(orgId, [...r.messages.filter((m) => m.side === "org").map((m) => m.authorId), ...(r.assigneeId ? [r.assigneeId] : [])]);
    const [follows, post] = await Promise.all([
        r.followsId ? db.request.findFirst({ where: { id: r.followsId, orgId }, select: { id: true, number: true } }) : null,
        r.postId ? db.channelPost.findFirst({ where: { id: r.postId, orgId }, select: { title: true } }) : null,
    ]);
    const thread: ThreadItem[] = r.messages
        .filter((m) => viewer.staff || !m.internal)
        .map((m) => {
            const s = staff.get(m.authorId);
            const author = m.side === "member" ? (viewer.staff ? fullName(r.member.firstName, r.member.lastName) : "אתם") : viewer.staff ? `${s?.full ?? "מנהל"} · ${s?.role ?? ""}` : staffSignature(s?.first, s?.role ?? "ההנהלה");
            return { id: m.id, side: m.side === "org" ? "org" : "member", internal: m.internal, author, when: when(m.createdAt), body: m.body };
        });
    const assignee = r.assigneeId ? staff.get(r.assigneeId) ?? null : null;
    return {
        id: r.id, number: r.number, kind: r.kind, kindText: kindLabel(r.kind, pack), status: status(r.status), who: fullName(r.member.firstName, r.member.lastName),
        lines: payloadLines(r.kind, r.payload, pack), follows, post: post?.title ?? null, thread, assignee: assignee ? `${assignee.full} · ${assignee.role}` : null, sent: when(r.createdAt),
    };
}

export type MemberInquiry = { id: string; number: number | null; kindText: string; status: InquiryStatus; line: string; ago: string };

// "הפניות שלי" in one org (board D-InquiryList).
export async function memberInquiries(orgId: string, userId: string): Promise<MemberInquiry[]> {
    await autoClose(orgId);
    const org = await db.organization.findUniqueOrThrow({ where: { id: orgId }, select: { packId: true } });
    const pack = getPack(org.packId).requestKinds;
    const rows = await db.request.findMany({ where: { orgId, userId }, include: { messages: { where: { side: "member" }, orderBy: { createdAt: "asc" }, take: 1, select: { body: true } } }, orderBy: { lastAt: "desc" }, take: 100 });
    const posts = await db.channelPost.findMany({ where: { id: { in: rows.flatMap((r) => (r.postId ? [r.postId] : [])) } }, select: { id: true, title: true } });
    const now = new Date();
    return rows.map((r) => ({
        id: r.id, number: r.number, kindText: kindLabel(r.kind, pack), status: status(r.status), ago: hebrewAgo(r.lastAt, now),
        line: r.postId && posts.find((p) => p.id === r.postId) ? `בהמשך להודעה: ${posts.find((p) => p.id === r.postId)!.title}` : previewLine(r.messages[0]?.body ?? null, payloadLines(r.kind, r.payload, pack)),
    }));
}

// The member's "פניות" tile: answers not opened yet.
export async function memberInquiryCounts(orgId: string, userId: string) {
    const [open, answered] = await Promise.all([
        db.request.count({ where: { orgId, userId, status: { not: "closed" } } }),
        db.notification.count({ where: { orgId, userId, topic: "inquiry_answer", readAt: null } }),
    ]);
    return { open, answered };
}
export const markInquiryRead = (orgId: string, userId: string, id: string) =>
    db.notification.updateMany({ where: { orgId, userId, topic: "inquiry_answer", refId: id, readAt: null }, data: { readAt: new Date() } });

// The member's own link to the org, for the member's inquiry screens and actions. Not in a celebration.
export async function inquiryMember(orgId: string) {
    const session = await getSession();
    if (!session) return null;
    const link = await db.orgUser.findUnique({ where: { orgId_userId: { orgId, userId: session.userId } }, include: { org: true } });
    if (!link || link.org.status !== "active" || link.org.packId === "celebration" || !["active", "left_with_debt"].includes(link.status)) return null;
    return { userId: session.userId, link };
}
