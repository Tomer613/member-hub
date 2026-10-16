// "הודעה לחברים" and "הודעות" for admins (boards D-AdmMessage, D-AdmCompose, D-AdmMessages), merged into one
// writing screen. Pure, so it is tested without a database.
import { POST_BODY_MAX, POST_TITLE_MAX } from "./reactions.ts";

// Who gets the message: everyone active, those with a debt past its date, one plan or label, or people picked
// by hand. One picked person makes it personal ("אישית, רק לכם" in their channel).
export type MsgAudience =
    | { to: "all" }
    | { to: "debt" }
    | { to: "plan"; planId: string }
    | { to: "label"; labelId: string }
    | { to: "picked"; linkIds: string[] };

export type MsgRecipient = { linkId: string; userId: string; memberId: string | null; name: string; planIds: string[]; labelIds: string[]; owes: boolean };

export function pickMsgRecipients<R extends Pick<MsgRecipient, "linkId" | "planIds" | "labelIds" | "owes">>(all: R[], a: MsgAudience): R[] {
    switch (a.to) {
        case "all": return all;
        case "debt": return all.filter((r) => r.owes);
        case "plan": return all.filter((r) => r.planIds.includes(a.planId));
        case "label": return all.filter((r) => r.labelIds.includes(a.labelId));
        case "picked": return all.filter((r) => a.linkIds.includes(r.linkId));
    }
}

export type MessageInput = { title: string; body: string; audience: MsgAudience; email: boolean; reactable: boolean; dislike: boolean };
export const EMPTY_MESSAGE: MessageInput = { title: "", body: "", audience: { to: "all" }, email: true, reactable: true, dislike: true };

// Reads a stored draft or a posted form safely.
export function readMessageInput(v: unknown): MessageInput {
    const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
    const s = (x: unknown, max: number) => (typeof x === "string" ? x.slice(0, max) : "");
    const a = (o.audience && typeof o.audience === "object" ? o.audience : {}) as Record<string, unknown>;
    const audience: MsgAudience =
        a.to === "debt" ? { to: "debt" }
        : a.to === "plan" && typeof a.planId === "string" ? { to: "plan", planId: a.planId }
        : a.to === "label" && typeof a.labelId === "string" ? { to: "label", labelId: a.labelId }
        : a.to === "picked" && Array.isArray(a.linkIds) ? { to: "picked", linkIds: a.linkIds.filter((x): x is string => typeof x === "string").slice(0, 2000) }
        : { to: "all" };
    const reactable = o.reactable !== false;
    return { title: s(o.title, POST_TITLE_MAX), body: s(o.body, POST_BODY_MAX), audience, email: o.email !== false, reactable, dislike: reactable && o.dislike !== false };
}

// The line under a sent message in the list: "לכולם", "אישית לדנה", "לפי תווית: מתנדבים".
export function audienceText(a: MsgAudience, names: { picked: string[]; group: string | null }): string {
    switch (a.to) {
        case "all": return "לכולם";
        case "debt": return "למי שבחוב";
        case "plan": return `לפי מסלול: ${names.group ?? "מסלול"}`;
        case "label": return `לפי תווית: ${names.group ?? "תווית"}`;
        case "picked": return names.picked.length === 1 ? `אישית ל${names.picked[0]}` : `ל-${names.picked.length} חברים נבחרים`;
    }
}

// The preview shows one line of the body, cut with "…".
export function firstLine(body: string, max = 70): string {
    const line = body.trim().split("\n")[0] ?? "";
    return line.length > max ? `${line.slice(0, max - 1).trimEnd()}…` : line;
}

// Readers table filter (board D-AdmMessages: "מסנן: לא קראו").
export type ReaderFilter = "all" | "unread";
export const readReaderFilter = (v: unknown): ReaderFilter => (v === "unread" ? "unread" : "all");

// "נקראה על ידי 12 מתוך 40".
export const readByText = (read: number, total: number) => `נקראה על ידי ${read} מתוך ${total}`;
export const reactedText = (n: number) => (n === 1 ? "אחד הגיב" : `${n} הגיבו`);
export const remindLabel = (n: number) => (n === 1 ? "שליחת תזכורת לאחד שלא קרא" : `שליחת תזכורת ל-${n} שלא קראו`);
