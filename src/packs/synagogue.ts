import type { PackDefinition } from "./types";
import { HEBREW_MONTHS } from "./synagogue/yahrzeit";

export { HEBREW_MONTHS };

// Derived from d3teman (community and synagogue portal). Its five request tables collapse into
// requestKinds; its children-count columns and halachic status become custom fields.
export const synagoguePack: PackDefinition = {
    id: "synagogue",
    name: "בית כנסת וקהילה",
    status: "draft",
    terms: { member: "חבר קהילה", household: "משפחה", admin: "גבאי", fund: "קרן" },
    modules: [
        "members", "households", "funds", "payments", "donations", "events", "requests",
        "campaigns", "directory", "hebrew_calendar", "yahrzeit",
    ],
    customFields: [
        {
            key: "halachicStatus", label: "מעמד", entity: "member", type: "select",
            options: [
                { value: "kohen", label: "כהן" },
                { value: "levi", label: "לוי" },
                { value: "yisrael", label: "ישראל" },
            ],
        },
        { key: "toddlerChildren", label: "ילדים עד גיל 3", entity: "household", type: "number" },
        { key: "elementaryChildren", label: "ילדי בית ספר יסודי", entity: "household", type: "number" },
        { key: "teenChildren", label: "בני נוער", entity: "household", type: "number" },
    ],
    requestKinds: [
        {
            kind: "kiddush_sponsorship",
            label: "בקשה לנדיבות קידוש",
            fields: [
                { key: "occasion", label: "אירוע", type: "text", required: true },
                { key: "preferredDate", label: "תאריך מבוקש", type: "text", required: true },
                { key: "amount", label: "סכום", type: "number" },
                { key: "notes", label: "הערות", type: "text" },
            ],
        },
        {
            kind: "haftarah",
            label: "בקשה להפטרה",
            fields: [
                { key: "parsha", label: "פרשה", type: "text", required: true },
                { key: "occasion", label: "אירוע", type: "text" },
                { key: "notes", label: "הערות", type: "text" },
            ],
        },
        {
            kind: "aliyah",
            label: "בקשה לעלייה לתורה",
            fields: [
                { key: "parsha", label: "פרשה", type: "text", required: true },
                { key: "aliyahType", label: "סוג עלייה", type: "text" },
                { key: "occasion", label: "אירוע", type: "text" },
                { key: "notes", label: "הערות", type: "text" },
            ],
        },
        {
            kind: "event_notice",
            label: "הודעה על שמחה או אבל",
            fields: [
                { key: "category", label: "שמחה או אבל", type: "text", required: true },
                { key: "eventType", label: "סוג", type: "text", required: true },
                { key: "description", label: "תיאור", type: "text", required: true },
                { key: "eventDate", label: "תאריך", type: "date", required: true },
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
        { value: "brit", label: "ברית" },
        { value: "shabbat_chatan", label: "שבת חתן" },
        { value: "bar_mitzvah", label: "בר מצווה" },
        { value: "wedding", label: "חתונה" },
        { value: "general", label: "כללי" },
    ],
    defaultFunds: [{ key: "general", displayName: "כללי" }],
};
