import { db } from "@/lib/db";
import { loadRecipients } from "@/lib/billing/charge-server";
import { pastDue } from "@/lib/billing/kupa-server";
import { emailOf } from "@/lib/billing/pay-server";
import { sendEmail } from "@/lib/email";
import { firstLine, type MessageInput, type MsgRecipient } from "@/lib/messages-admin";
import { notifyUsers } from "@/lib/notify-server";
import { isReaction, REACTIONS, type ReactionKind } from "@/lib/reactions";
import { hebrewAgo } from "@/lib/relative-time";
import type { LoadedPost } from "@/lib/channel-server";

// Everyone a message can go to (active members, not guests), with what the recipient chips count by.
export async function loadMsgRecipients(orgId: string): Promise<MsgRecipient[]> {
    const [base, links, due] = await Promise.all([
        loadRecipients(orgId),
        db.orgUser.findMany({ where: { orgId, status: "active", role: { not: "guest" } }, select: { id: true, userId: true, memberId: true, member: { select: { householdLinks: { select: { householdId: true } } } } } }),
        pastDue(orgId),
    ]);
    const byId = new Map(links.map((l) => [l.id, l]));
    return base.flatMap((r) => {
        const l = byId.get(r.linkId);
        if (!l) return [];
        const owes = (!!l.memberId && due.members.has(l.memberId)) || (l.member?.householdLinks.some((h) => due.households.has(h.householdId)) ?? false);
        return [{ ...r, userId: l.userId, memberId: l.memberId, owes }];
    });
}

// The list column of "הודעות" (board D-AdmMessages): drafts and sent messages, newest first.
export async function loadMessageList(orgId: string) {
    const posts = await db.channelPost.findMany({
        where: { orgId, OR: [{ status: "draft" }, { recipients: { some: {} } }] },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: { id: true, title: true, status: true, audienceText: true, createdAt: true },
    });
    const now = new Date();
    return posts.map((p) => ({ id: p.id, title: p.title || "בלי כותרת", draft: p.status === "draft", line: `${hebrewAgo(p.createdAt, now)} · ${p.audienceText ?? "לכולם"}` }));
}

export type ReaderRow = { userId: string; name: string; readAgo: string | null; reaction: ReactionKind | null };

// One sent message for the admin: who it went to, who read it and how they reacted. Only admins see names.
export async function loadMessage(orgId: string, id: string) {
    const p = await db.channelPost.findFirst({ where: { id, orgId, status: "sent", recipients: { some: {} } }, include: { recipients: true, reactions: true } });
    if (!p) return null;
    const users = await db.user.findMany({ where: { id: { in: p.recipients.map((r) => r.userId) } }, select: { id: true, firstName: true, lastName: true } });
    const nameOf = new Map(users.map((u) => [u.id, `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "חבר/ה"]));
    const now = new Date();
    const rows: ReaderRow[] = p.recipients
        .map((r) => {
            const kind = p.reactions.find((x) => x.actorKey === `u:${r.userId}`)?.kind;
            return { userId: r.userId, name: nameOf.get(r.userId) ?? "חבר/ה", readAgo: r.readAt ? hebrewAgo(r.readAt, now) : null, reaction: isReaction(kind) ? kind : null };
        })
        .sort((a, b) => Number(!!a.readAgo) - Number(!!b.readAgo) || a.name.localeCompare(b.name, "he"));
    const counts = REACTIONS.map((r) => ({ kind: r.kind, label: r.label, count: p.reactions.filter((x) => x.kind === r.kind).length }));
    return {
        id: p.id,
        title: p.title,
        body: p.body,
        sent: `נשלחה ${hebrewAgo(p.createdAt, now)}, ${p.audienceText ?? "לכולם"}`,
        channels: p.channels,
        reactable: p.reactable,
        reminded: p.remindedAt ? hebrewAgo(p.remindedAt, now) : null,
        rows,
        read: rows.filter((r) => r.readAgo).length,
        reacted: p.reactions.length,
        counts,
    };
}

// A member's messages from one org (board D-Channel), newest first. Opening the screen marks them read.
export async function memberMessages(orgId: string, userId: string): Promise<LoadedPost[]> {
    const posts = await db.channelPost.findMany({
        where: { orgId, status: "sent", recipients: { some: { userId } } },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { reactions: { select: { kind: true, actorKey: true } }, _count: { select: { recipients: true } } },
    });
    const me = `u:${userId}`;
    return posts.map((p) => {
        const counts: Partial<Record<ReactionKind, number>> = {};
        for (const r of p.reactions) if (isReaction(r.kind)) counts[r.kind] = (counts[r.kind] ?? 0) + 1;
        const mine = p.reactions.find((r) => r.actorKey === me)?.kind;
        return {
            post: { id: p.id, title: p.title, body: p.body, ago: hebrewAgo(p.createdAt), pinned: false, reactable: p.reactable, dislike: p.dislike, personal: (p.audience as { to?: string } | null)?.to === "picked" && p._count.recipients === 1 },
            counts,
            mine: isReaction(mine) ? mine : null,
        };
    });
}

export async function markMessagesRead(orgId: string, userId: string): Promise<void> {
    const now = new Date();
    await db.postRecipient.updateMany({ where: { userId, readAt: null, post: { orgId } }, data: { readAt: now } });
    await db.notification.updateMany({ where: { userId, orgId, topic: "message", readAt: null }, data: { readAt: now } });
}

export const unreadMessages = (orgId: string, userId: string) => db.postRecipient.count({ where: { userId, readAt: null, post: { orgId, status: "sent" } } });

// Sends a message: the post with its recipients, a note in each recipient's "הודעות", and an email when
// asked. SMS waits for the messages service (docs/waiting-for-services.he.md). A draft becomes the sent post.
export async function deliverMessage(o: {
    orgId: string; orgName: string; authorId: string; input: MessageInput; audienceText: string;
    to: { userId: string; memberId: string | null }[]; draftId?: string;
}): Promise<string> {
    const { input } = o;
    const channels = ["app", ...(input.email ? ["email"] : [])];
    const data = {
        title: input.title.trim(), body: input.body.trim(), reactable: input.reactable, dislike: input.reactable && input.dislike,
        status: "sent", audience: input.audience, audienceText: o.audienceText, channels, authorId: o.authorId, createdAt: new Date(),
    };
    const post = await db.$transaction(async (tx) => {
        const draft = o.draftId ? await tx.channelPost.findFirst({ where: { id: o.draftId, orgId: o.orgId, status: "draft" }, select: { id: true } }) : null;
        const p = draft ? await tx.channelPost.update({ where: { id: draft.id }, data }) : await tx.channelPost.create({ data: { orgId: o.orgId, ...data } });
        await tx.postRecipient.createMany({ data: o.to.map((r) => ({ postId: p.id, userId: r.userId, memberId: r.memberId })), skipDuplicates: true });
        return p;
    });
    await notifyUsers(o.to.map((r) => r.userId), { orgId: o.orgId, kind: "update", topic: "message", refId: post.id, text: `${data.title}: ${firstLine(data.body, 90)}`, href: `/card/${o.orgId}/messages` });
    if (input.email) {
        const contacts = await db.userContact.findMany({ where: { userId: { in: o.to.map((r) => r.userId) } }, select: { userId: true, kind: true, value: true, isPrimary: true } });
        for (const r of o.to) {
            const email = emailOf(contacts.filter((c) => c.userId === r.userId));
            if (email) await sendEmail(email, `${data.title} · ${o.orgName}`, `${data.body}\n\nההודעה שמורה גם בכרטיס החבר שבארנק.`).catch(() => undefined);
        }
    }
    return post.id;
}
