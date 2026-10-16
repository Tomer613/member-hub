import { db } from "@/lib/db";
import { hebrewAgo } from "@/lib/relative-time";
import { isReaction, type ReactionKind } from "@/lib/reactions";
import type { PostView } from "@/components/channel/post-card";

export type LoadedPost = { post: PostView; counts: Partial<Record<ReactionKind, number>>; mine: ReactionKind | null };

// An org's updates, newest first, with reaction counts and the viewer's own reaction.
export async function loadPosts(orgId: string, actorKey: string | null): Promise<LoadedPost[]> {
    const posts = await db.channelPost.findMany({ where: { orgId }, orderBy: { createdAt: "desc" }, take: 100, include: { reactions: { select: { kind: true, actorKey: true } } } });
    return posts.map((p) => {
        const counts: Partial<Record<ReactionKind, number>> = {};
        for (const r of p.reactions) if (isReaction(r.kind)) counts[r.kind] = (counts[r.kind] ?? 0) + 1;
        const mineKind = actorKey ? p.reactions.find((r) => r.actorKey === actorKey)?.kind : undefined;
        return {
            post: { id: p.id, title: p.title, body: p.body, ago: hebrewAgo(p.createdAt), pinned: p.pinned, reactable: p.reactable, dislike: p.dislike },
            counts,
            mine: isReaction(mineKind) ? mineKind : null,
        };
    });
}

// One reaction per person per update; null removes it.
export async function setReaction(postId: string, orgId: string, actorKey: string, kind: ReactionKind | null): Promise<void> {
    const post = await db.channelPost.findFirst({ where: { id: postId, orgId, reactable: true } });
    if (!post || (kind === "dislike" && !post.dislike)) return;
    if (!kind) {
        await db.postReaction.deleteMany({ where: { postId, actorKey } });
        return;
    }
    await db.postReaction.upsert({ where: { postId_actorKey: { postId, actorKey } }, create: { postId, actorKey, kind }, update: { kind } });
}
