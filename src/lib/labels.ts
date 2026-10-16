// Labels (תוויות): pure rules shared by the admin editor, the wallet and the member card
// (ux-spec 14.9, 14.10, 14.25; boards D-Labels, D-AdmLabels).

export const LABEL_NAME_MAX = 14;
export const LABEL_COLORS = ["#5EE0C0", "#FF8FB8", "#FF9B6B", "#7CC4FF", "#B9A4FF", "#FFD84A"] as const;
export const isLabelColor = (v: unknown): v is (typeof LABEL_COLORS)[number] => LABEL_COLORS.includes(v as never);

// Each label keeps its own small tilt, between -5° and 4°, taken from its id so it never changes between
// visits. In RTL the tilt mirrors (rtl-ltr 2), which the caller does by flipping the sign.
export function labelTilt(id: string): number {
    let h = 0;
    for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
    return (Math.abs(h) % 10) - 5;
}

export function cleanLabelName(v: unknown): string {
    return String(v ?? "").replace(/\s+/g, " ").trim().slice(0, LABEL_NAME_MAX);
}

export type HeldLabel = { id: string; name: string; color: string; since: Date; how: "manual" | "auto_plan"; plan: string | null };

// The member's labels, newest first: the wallet card shows the newest one and "+N" for the rest.
export function newestFirst(labels: HeldLabel[]): HeldLabel[] {
    return [...labels].sort((a, b) => b.since.getTime() - a.since.getTime() || a.name.localeCompare(b.name, "he"));
}

export function walletLabel(labels: HeldLabel[]): { name: string; color: string; more: number; all: string } | null {
    const l = newestFirst(labels);
    if (!l.length) return null;
    const names = l.map((x) => x.name);
    const all = names.length === 1 ? `תווית: ${names[0]}` : `תוויות: ${names.slice(0, -1).join(", ")} ו${names.at(-1)}`;
    return { name: l[0].name, color: l[0].color, more: l.length - 1, all };
}

// The line under a tapped stamp: "הוענקה ב-03.2025, ידנית" or "..., אוטומטית, בזכות מנוי שנתי".
export function grantedText(l: Pick<HeldLabel, "since" | "how" | "plan">): string {
    const m = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jerusalem", month: "2-digit", year: "numeric" }).format(l.since).replace("/", ".");
    return l.how === "auto_plan" ? `הוענקה ב-${m}, אוטומטית${l.plan ? `, בזכות ${l.plan}` : ""}` : `הוענקה ב-${m}, ידנית`;
}
