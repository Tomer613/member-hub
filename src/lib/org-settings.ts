// "הגדרות הארגון" (boards D-AdmOrgSettings, D-AdmAppearance). Pure, so it is tested without a database.

export const TAGLINE_MAX = 140;
export const ABOUT_MAX = 600;

export type SettingsSection = "details" | "public" | "look";
export const SECTIONS: { id: SettingsSection | null; label: string }[] = [
    { id: "details", label: "פרטי הארגון" },
    { id: "public", label: "נראות והזמנה" },
    { id: "look", label: "מראה וצבע" },
    { id: null, label: "שדות ופרטיות" },
    { id: null, label: "מה החברים רואים בכרטיס" },
    { id: null, label: "סוגי חברות וחיובים" },
    { id: null, label: "תשלומים ותזכורות" },
    { id: null, label: "פניות ובקשות" },
    { id: null, label: "צוות והרשאות" },
    { id: null, label: "חשבון והסכם" },
];
export const readSection = (v: unknown): SettingsSection => (v === "public" || v === "look" ? v : "details");

// The invitation sentence and the longer text, kept in the org's settings.
export type PublicText = { tagline: string; about: string };
export function readPublicText(settings: unknown): PublicText {
    const s = (settings && typeof settings === "object" && !Array.isArray(settings) ? settings : {}) as Record<string, unknown>;
    return { tagline: typeof s.tagline === "string" ? s.tagline : "", about: typeof s.about === "string" ? s.about : "" };
}

// "הצטרפות באישור מנהל" off = "הצטרפות מיידית": whoever joins from search or the link is a member at once.
// Approval is the default; only the owner changes it.
export const readJoinOpen = (settings: unknown): boolean =>
    !!settings && typeof settings === "object" && !Array.isArray(settings) && (settings as Record<string, unknown>).joinMode === "open";

// Whitespace is folded in the one-line sentence; the longer text keeps its line breaks.
export function cleanPublicText(input: { tagline: unknown; about: unknown }): { ok: true; value: PublicText } | { ok: false; error: string } {
    const tagline = String(input.tagline ?? "").replace(/\s+/g, " ").trim();
    const about = String(input.about ?? "").replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    if ([...tagline].length > TAGLINE_MAX) return { ok: false, error: `משפט ההזמנה ארוך מ-${TAGLINE_MAX} תווים.` };
    if ([...about].length > ABOUT_MAX) return { ok: false, error: `הפירוט ארוך מ-${ABOUT_MAX} תווים.` };
    return { ok: true, value: { tagline, about } };
}

// "בית כנסת קהילתי בלב השכונה. מזמינים…": the search result shows the start of the sentence.
export function shortLine(text: string, max = 60): string {
    const chars = [...text];
    if (chars.length <= max) return text;
    const cut = chars.slice(0, max).join("");
    const space = cut.lastIndexOf(" ");
    return `${(space > max / 2 ? cut.slice(0, space) : cut).trimEnd().replace(/[,;:\-–]+$/, "")}…`;
}
