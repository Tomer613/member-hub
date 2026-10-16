// Join requests for admins (boards D-AdmRequests, D-MAdmRequests, D-MAdmRequestsFilter). Pure, so it is
// tested without a database.

export const REQUEST_TABS = [
    { key: "pending", label: "ממתינות" },
    { key: "approved", label: "אושרו" },
    { key: "rejected", label: "נדחו" },
] as const;
export type RequestTab = (typeof REQUEST_TABS)[number]["key"];
export const readRequestTab = (v: unknown): RequestTab => (REQUEST_TABS.some((t) => t.key === v) ? (v as RequestTab) : "pending");

// Where the request came from. The board also names "חבר הזמין" and "סריקה בפגישה"; in this app a member
// cannot refer anyone yet, and a scan at a meeting sends an invitation, not a request.
export const REQUEST_SOURCES = [
    { key: "link", label: "קוד פרופיל ארגון" },
    { key: "search", label: "חיפוש באפליקציה" },
] as const;
export type RequestSource = (typeof REQUEST_SOURCES)[number]["key"];
export const sourceLabel = (s: string | null): string => REQUEST_SOURCES.find((x) => x.key === s)?.label ?? "קישור הצטרפות";

export type RequestRow = {
    id: string;
    name: string;
    phone: string | null; // local form, 052-123-4567
    email: string | null;
    note: string | null;
    source: string | null;
    listed: boolean; // matches someone already on the org's list (an import "list only")
    when: string; // relative time of asking (pending) or deciding, made on the server
    decidedBy: string | null;
    adminNote: string | null;
    linkId: string | null; // the membership, once approved
};

// "פרטים מלאים": first and last name, and both a phone and an email.
export const fullDetails = (r: Pick<RequestRow, "name" | "phone" | "email">) => r.name.trim().split(/\s+/).length >= 2 && !!r.phone && !!r.email;

export type RequestFilter = { source: RequestSource | ""; listed: boolean; full: boolean; q: string };
export const NO_FILTER: RequestFilter = { source: "", listed: false, full: false, q: "" };
export const filterActive = (f: RequestFilter) => !!f.source || f.listed || f.full || !!f.q.trim();

export function inRequestFilter(r: RequestRow, f: RequestFilter): boolean {
    if (f.source && (r.source ?? "link") !== f.source) return false;
    if (f.listed && !r.listed) return false;
    if (f.full && !fullDetails(r)) return false;
    const q = f.q.trim().toLowerCase();
    if (!q) return true;
    const digits = q.replace(/\D/g, "");
    return r.name.toLowerCase().includes(q) || (!!digits && (r.phone ?? "").replace(/\D/g, "").includes(digits)) || (r.email ?? "").includes(q) || (r.note ?? "").toLowerCase().includes(q);
}

export const NOTE_MAX = 300;
