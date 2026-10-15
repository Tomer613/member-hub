import type { PackDefinition } from "./types";

// A celebration between friends: a birthday, sheva brachot, a farewell party, also one-off (decided with
// Tommy 14.10.2026, docs/open-questions.he.md 'ערכת "חגיגה ואירוע"'). Guests rather than members; replies,
// headcount and money tracking live in the Rsvp table and the event details in Organization.settings.
export const celebrationPack: PackDefinition = {
    id: "celebration",
    name: "אירוע או חגיגה",
    status: "draft",
    terms: { member: "אורח", household: "משפחה", admin: "מארגן", fund: "קופה" },
    modules: ["events"],
    customFields: [],
    requestKinds: [],
    eventTypes: [{ value: "celebration", label: "חגיגה" }],
    defaultFunds: [],
};
