import type { PackDefinition } from "./types";

// PLANNED - no source project yet.
export const clubPack: PackDefinition = {
    id: "club",
    name: "מועדון",
    status: "planned",
    terms: { member: "חבר", household: "חשבון", admin: "ועד", fund: "קופה" },
    modules: ["members", "households", "funds", "billing", "payments", "events", "campaigns"],
    customFields: [],
    requestKinds: [],
    eventTypes: [{ value: "general", label: "אירוע" }],
    defaultFunds: [{ key: "general", displayName: "דמי חבר" }],
};
