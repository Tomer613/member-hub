import type { PackDefinition } from "./types";

// PLANNED - no source project yet. Only the shape is reserved so the core stays generic.
export const gymPack: PackDefinition = {
    id: "gym",
    name: "חדר כושר",
    status: "planned",
    terms: { member: "מתאמן", household: "חשבון", admin: "מנהל", fund: "קופה" },
    modules: ["members", "households", "funds", "billing", "payments", "visits", "freeze", "classes", "campaigns"],
    customFields: [],
    requestKinds: [],
    eventTypes: [{ value: "class", label: "שיעור" }],
    defaultFunds: [{ key: "general", displayName: "מנויים" }],
};
