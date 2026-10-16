// Wallet rules (approved board D-Wallet, docs/boards-spec/1-wallet-badge-login.he.md). Pure functions
// shared by the wallet page and its tests.

export type WalletGroup = "home" | "health" | "community" | "events";
export const GROUP_LABEL: Record<WalletGroup, string> = { home: "בית", health: "בריאות", community: "קהילה", events: "חגיגות" };
const GROUP_ORDER: WalletGroup[] = ["home", "health", "community", "events"];

// The member's own grouping wins; until they pick one, the org type suggests it.
export function groupOf(packId: string, chosen: string | null | undefined): WalletGroup {
    if (chosen && chosen in GROUP_LABEL) return chosen as WalletGroup;
    if (packId === "hoa") return "home";
    if (packId === "gym") return "health";
    if (packId === "celebration") return "events";
    return "community";
}

// Filter chips: "הכול" and then only the groups that have cards. One group alone needs no filter.
export function groupChips(groups: WalletGroup[]): WalletGroup[] {
    const present = GROUP_ORDER.filter((g) => groups.includes(g));
    return present.length > 1 ? present : [];
}

const ROLE: Record<string, string> = { owner: "מנהל/ת", admin: "מנהל/ת", treasurer: "גזבר/ית", staff: "צוות", member: "חבר/ה", guest: "אורח/ת" };
export const roleLabel = (role: string, packId: string) => (packId === "celebration" && (role === "owner" || role === "admin") ? "מארגן/ת" : ROLE[role] ?? "חבר/ה");

// Pinned first, then the member's own order, then the newest.
export function walletSort<T extends { isPinned: boolean; walletOrder: number; createdAt: Date }>(cards: T[]): T[] {
    return [...cards].sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || a.walletOrder - b.walletOrder || b.createdAt.getTime() - a.createdAt.getTime());
}

// The greeting by the hour in Israel; "הי" when something is waiting, as on the board.
export function greeting(firstName: string | null, now: Date, waiting: boolean): string {
    const name = firstName?.trim() || "";
    if (waiting) return name ? `הי ${name},` : "הי,";
    const h = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Jerusalem" }).format(now));
    const part = h >= 5 && h < 12 ? "בוקר טוב" : h >= 12 && h < 17 ? "צהריים טובים" : h >= 17 && h < 22 ? "ערב טוב" : "לילה טוב";
    return name ? `${part}, ${name}` : part;
}

// The tilt alternates down the stack, as on the board.
export const TILTS = [-0.3, 0.25, -0.2, 0.3, -0.25];

// "ב" before an org name in a sentence: "בוועד" for a name that starts with a single ו, "ב-FitZone" before Latin.
export function inOrg(name: string): string {
    const n = name.trim();
    if (!/^[֐-׿]/.test(n)) return `ב-${n}`;
    return n.startsWith("ו") && !n.startsWith("וו") ? `בו${n}` : `ב${n}`;
}

// Words on the member card that depend on the org type (boards D-Badge, D-BadgeGym).
export function badgeWords(packId: string): { since: string; people: string } {
    if (packId === "gym") return { since: "מנוי מאז", people: "מתאמנים" };
    if (packId === "hoa") return { since: "דיירים מאז", people: "דיירים" };
    return { since: "חברות מאז", people: "חברים" };
}

// "מתוך 312 חברים": neutral, since the board's "אחד/אחת" depends on gender we do not ask for (Tommy, 15.10).
export function crowdText(count: number, people: string): string {
    if (count <= 1) return "הראשונים כאן";
    return `מתוך ${count.toLocaleString("he-IL")} ${people}`;
}

// "סדר הצגה" in "סידור הארנק" (board D-WalletEdit). Pinned cards always come first.
export const SORT_MODES = [
    { id: "manual", label: "ידני" },
    { id: "recent", label: "פעילות אחרונה" },
    { id: "name", label: "לפי שם" },
    { id: "attention", label: "דורש טיפול קודם" },
] as const;
export type SortMode = (typeof SORT_MODES)[number]["id"];
export function readSortMode(preferences: unknown): SortMode {
    const v = (preferences as { walletSort?: unknown } | null)?.walletSort;
    return SORT_MODES.some((m) => m.id === v) ? (v as SortMode) : "manual";
}

type Sortable = { isPinned: boolean; walletOrder: number; createdAt: Date; name: string; lastActivity: Date; attention: boolean };
export function arrange<T extends Sortable>(cards: T[], mode: SortMode): T[] {
    const by = (a: T, b: T) => {
        if (mode === "recent") return b.lastActivity.getTime() - a.lastActivity.getTime();
        if (mode === "name") return a.name.localeCompare(b.name, "he");
        if (mode === "attention" && a.attention !== b.attention) return Number(b.attention) - Number(a.attention);
        return a.walletOrder - b.walletOrder || b.createdAt.getTime() - a.createdAt.getTime();
    };
    return [...cards].sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || by(a, b));
}

// Moves one id to a 1-based place in the list; out-of-range places clamp to the ends.
export function moveTo(ids: string[], id: string, place: number): string[] {
    const rest = ids.filter((x) => x !== id);
    if (rest.length === ids.length) return ids;
    const at = Math.min(Math.max(1, Math.round(place) || 1), ids.length) - 1;
    rest.splice(at, 0, id);
    return rest;
}

// The stamp on an archived card (board D-WalletArchive).
export function archiveStamp(link: { hiddenAt: Date | null; status: string }): string {
    if (link.status === "suspended") return "הוסרת";
    if (link.status === "left" || link.status === "left_with_debt") return "עזבת";
    return "הוסתר";
}
export const archivedOn = (link: { hiddenAt: Date | null; leftAt: Date | null; createdAt: Date }) => link.hiddenAt ?? link.leftAt ?? link.createdAt;
