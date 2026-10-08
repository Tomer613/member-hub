import type { PackDefinition } from "./types";

// Derived from the HOA project (building committee reports). Fund names there (general fund,
// camera fund, parking gate) are per-building configuration, so only the general fund is seeded.
export const hoaPack: PackDefinition = {
    id: "hoa",
    name: "ועד בית",
    status: "draft",
    terms: { member: "דייר", household: "דירה", admin: "ועד הבית", fund: "קופה" },
    modules: [
        "members", "households", "tenancy", "funds", "billing", "payments", "expenses",
        "letters", "access_control_export", "per_unit_fees", "events", "requests", "campaigns",
    ],
    customFields: [
        {
            key: "isOwner", label: "בעל דירה", entity: "member", type: "boolean",
        },
    ],
    requestKinds: [
        {
            kind: "maintenance_issue",
            label: "תקלה או בקשת תחזוקה",
            fields: [
                { key: "location", label: "מיקום", type: "text", required: true },
                { key: "description", label: "תיאור", type: "text", required: true },
            ],
        },
        {
            kind: "general_inquiry",
            label: "פנייה כללית",
            fields: [
                { key: "subject", label: "נושא", type: "text", required: true },
                { key: "message", label: "הודעה", type: "text", required: true },
            ],
        },
    ],
    eventTypes: [
        { value: "meeting", label: "אסיפת דיירים" },
        { value: "general", label: "כללי" },
    ],
    defaultFunds: [{ key: "general", displayName: "ועד בית" }],
};
