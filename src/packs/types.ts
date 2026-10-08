// A pack is configuration, not code: terminology, extra fields, request kinds and enabled modules
// for one kind of organization. The core never branches on packId; it reads the pack.

export type FieldType = "text" | "number" | "select" | "date" | "boolean";

export interface FieldDef {
    key: string; // stored under customFields[key]
    label: string; // Hebrew UI label
    entity: "member" | "household";
    type: FieldType;
    options?: ReadonlyArray<{ value: string; label: string }>;
    required?: boolean;
    showInDirectory?: boolean;
}

export interface RequestKindDef {
    kind: string; // stored in Request.kind
    label: string;
    // Payload fields the member fills in; validated server-side against this list.
    fields: ReadonlyArray<{ key: string; label: string; type: FieldType; required?: boolean }>;
}

export interface PackTerms {
    member: string; // "דייר", "חבר קהילה", "מתאמן"
    household: string; // "דירה", "משפחה", "חשבון"
    admin: string; // "ועד", "גבאי", "מנהל"
    fund: string;
}

export type ModuleKey =
    | "members" | "households" | "tenancy" | "funds" | "billing" | "payments" | "expenses"
    | "letters" | "access_control_export" | "per_unit_fees"
    | "events" | "requests" | "campaigns" | "directory"
    | "hebrew_calendar" | "yahrzeit" | "donations"
    | "visits" | "freeze" | "classes";

export type RoleKey = "owner" | "admin" | "treasurer" | "staff" | "member";

// One tile on the member's card screen (docs/ux-spec.he.md section 3a). The card shows at most four main
// categories; each opens a sub-screen. "my membership" is always present and is not defined here.
export interface CardCategoryDef {
    key: string; // e.g. "finance", "prayers_events", "requests"
    label: string; // Hebrew tile title
    requiresModules: readonly ModuleKey[]; // tile is hidden unless the org has these modules on
    roles: readonly RoleKey[]; // who sees it; managers get extra entries
    statusLine: string; // key of a status provider that returns the live one-line status ("חוב ₪600")
}

// The single primary button at the bottom of the card (for example "pay", "book a class").
export interface CardPrimaryActionDef {
    key: string;
    label: string;
    requiresModules: readonly ModuleKey[];
    priority: number; // lowest number wins when several apply (debt before booking)
}

// Grouping used by the template picker when an organization is created (see NEXT-STEPS, phase 7).
export type TemplateCategory = "residential" | "religious" | "sports" | "social" | "other";

export interface PackDefinition {
    id: "hoa" | "synagogue" | "gym" | "club" | "generic";
    name: string;
    status: "ready" | "draft" | "planned"; // ready = ported from working code
    terms: PackTerms;
    modules: readonly ModuleKey[];
    customFields: readonly FieldDef[];
    requestKinds: readonly RequestKindDef[];
    eventTypes: readonly { value: string; label: string }[];
    // Seeded for a new org of this type; the org can rename or add more.
    defaultFunds: readonly { key: string; displayName: string }[];
    // Optional until each pack is filled in; the core falls back to a generic card when missing.
    templateCategory?: TemplateCategory;
    cardCategories?: readonly CardCategoryDef[];
    cardPrimaryActions?: readonly CardPrimaryActionDef[];
}
