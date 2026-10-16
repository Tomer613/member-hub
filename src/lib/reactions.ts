// Icon reactions on channel updates (boards D-Channel, D-ChannelReact): one per person per update, in a fixed
// order. No text replies: the channel is not a chat.

export const REACTIONS = [
    { kind: "heart", label: "לב" },
    { kind: "bravo", label: "כל הכבוד" },
    { kind: "like", label: "אהבתי" },
    { kind: "dislike", label: "לא אהבתי" },
    { kind: "funny", label: "מצחיק" },
    { kind: "got", label: "הבנתי" },
] as const;

export type ReactionKind = (typeof REACTIONS)[number]["kind"];

export const isReaction = (v: unknown): v is ReactionKind => REACTIONS.some((r) => r.kind === v);

export type ReactionCount = { kind: ReactionKind; label: string; count: number };

// Only reactions someone used, in the set's order, so the row stays stable as numbers change.
export function reactionCounts(rows: { kind: string }[]): ReactionCount[] {
    return REACTIONS.map((r) => ({ ...r, count: rows.filter((x) => x.kind === r.kind).length })).filter((r) => r.count > 0);
}

export const POST_TITLE_MAX = 80;
export const POST_BODY_MAX = 2000;

export function cleanPost(title: string, body: string): { title: string; body: string } | { error: string } {
    const t = title.replace(/\s+/g, " ").trim();
    const b = body.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    if (t.length < 2 || t.length > POST_TITLE_MAX) return { error: "כתבו כותרת קצרה" };
    if (!b || b.length > POST_BODY_MAX) return { error: "כתבו מה רוצים לעדכן" };
    return { title: t, body: b };
}
