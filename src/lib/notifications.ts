// The "הודעות" screen (boards D-Notifications, D-NotificationsDone): pure rules for its filters, day groups
// and sender names.

export type NoteState = { kind: string; readAt: Date | null; doneAt: Date | null };
export const NOTE_FILTERS = [
    { id: "all", label: "הכל" },
    { id: "action", label: "דורש טיפול" },
    { id: "update", label: "עדכונים" },
    { id: "done", label: "הושלמו" },
] as const;
export type NoteFilter = (typeof NOTE_FILTERS)[number]["id"];
export const readNoteFilter = (v: unknown): NoteFilter => (NOTE_FILTERS.some((f) => f.id === v) ? (v as NoteFilter) : "all");

// Open: an action not handled yet, or an update not read yet. Everything else is "הושלמו".
export const isOpen = (n: NoteState) => (n.kind === "action" ? !n.doneAt : !n.readAt);
export function inFilter(n: NoteState, f: NoteFilter): boolean {
    if (f === "done") return !isOpen(n);
    if (!isOpen(n)) return false;
    return f === "all" || n.kind === f;
}

// Calendar days in Israel time between two moments.
const ilDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(d);
function daysBetween(a: Date, b: Date): number {
    return Math.round((Date.parse(ilDay(b)) - Date.parse(ilDay(a))) / 86_400_000);
}

// "היום", "אתמול", "לפני 3 ימים", "לפני שבוע", then the date.
export function dayGroup(d: Date, now: Date): string {
    const n = daysBetween(d, now);
    if (n <= 0) return "היום";
    if (n === 1) return "אתמול";
    if (n < 7) return `לפני ${n} ימים`;
    if (n < 14) return "לפני שבוע";
    const [y, m, day] = ilDay(d).split("-");
    return `${day}.${m}.${y}`;
}

export const ilTime = (d: Date) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);

// Who it is from: the org, with its kind first in a house committee; the wallet itself for system notes.
export function senderName(org: { name: string; packId: string } | null): string {
    if (!org) return "ארנק";
    return org.packId === "hoa" && !org.name.startsWith("ועד") ? `ועד בית · ${org.name}` : org.name;
}

// The stamp on a closed note: when it was handled or read.
export function closedText(n: NoteState): string {
    const at = n.kind === "action" ? n.doneAt : n.readAt;
    if (!at) return "";
    const [, m, d] = ilDay(at).split("-");
    return `${n.kind === "action" ? "טופל" : "נקרא"} ${Number(d)}.${Number(m)}`;
}
