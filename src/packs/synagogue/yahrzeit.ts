// Shared allowlists for Yahrzeit fields, used by both the server action
// (validation) and the client form (dropdown options) so they can't drift.

export const HEBREW_MONTHS = [
    "תשרי", "מרחשוון", "כסלו", "טבת", "שבט", "אדר", "אדר א'", "אדר ב'",
    "ניסן", "אייר", "סיוון", "תמוז", "אב", "אלול",
] as const;

export const YAHRZEIT_RELATIONS = [
    { value: "father", label: "אב" },
    { value: "mother", label: "אם" },
    { value: "brother", label: "אח" },
    { value: "sister", label: "אחות" },
    { value: "husband", label: "בעל" },
    { value: "wife", label: "אישה" },
    { value: "son", label: "בן" },
    { value: "daughter", label: "בת" },
    { value: "other", label: "אחר" },
] as const;

// Traditional Hebrew-letter day numbering (1-30), with 15 and 16 rendered as
// ט"ו / ט"ז rather than the literal יה / יו, which spell out one of God's
// names - the standard convention on Hebrew calendars.
const HEBREW_DAY_LETTERS = [
    "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י",
    "יא", "יב", "יג", "יד", "טו", "טז", "יז", "יח", "יט", "כ",
    "כא", "כב", "כג", "כד", "כה", "כו", "כז", "כח", "כט", "ל",
] as const;

function formatHebrewDayLetters(letters: string): string {
    return letters.length === 1
        ? `${letters}׳`
        : `${letters.slice(0, -1)}״${letters.slice(-1)}`;
}

export const HEBREW_DAYS = HEBREW_DAY_LETTERS.map((letters, index) => ({
    value: index + 1,
    label: formatHebrewDayLetters(letters),
}));

export function getHebrewDayLabel(day: number): string {
    return HEBREW_DAYS.find((d) => d.value === day)?.label ?? String(day);
}
