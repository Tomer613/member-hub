import { normalizeEmail, normalizePhone } from "./auth/contact.ts";

// "ייבוא חברים מקובץ" (boards D-AdmImport1-3, ux-spec 14.32-14.33): reading the file, matching columns,
// checking each row, and the invitation text. Pure, so the browser and the server agree and it is tested.
// Decided 16.10.2026: a row needs a phone or an email (a name is only recommended), and rows to fix are fixed
// in place on the "מי יוזמן" step rather than on a separate errors screen (ux-spec 14.33 over D-AdmImportErrors).

export const IMPORT_FIELDS = [
    { id: "name", label: "שם מלא" },
    { id: "first", label: "שם פרטי" },
    { id: "last", label: "שם משפחה" },
    { id: "phone", label: "טלפון" },
    { id: "email", label: "דוא״ל" },
    { id: "home", label: "משק בית" },
    { id: "note", label: "הערה" },
    { id: "skip", label: "לא לייבא" },
] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number]["id"];
export const isImportField = (v: unknown): v is ImportField => IMPORT_FIELDS.some((f) => f.id === v);

export const IMPORT_MAX_ROWS = 2000;

const SYNONYMS: [ImportField, RegExp][] = [
    ["first", /^(שם פרטי|פרטי|first ?name|first|given ?name)$/],
    ["last", /^(שם משפחה|משפחה|last ?name|last|surname|family ?name)$/],
    ["name", /^(שם|שם מלא|full ?name|name|חבר|דייר|מתאמן)$/],
    ["phone", /(טלפון|נייד|פלאפון|סלולרי|phone|mobile|cell|tel)/],
    ["email", /(מייל|דוא"?ל|דואל|דואר אלקטרוני|e-?mail)/],
    ["home", /^(דירה|מספר דירה|משק בית|משפחה\/משק בית|חשבון|apartment|apt|flat|unit|household)$/],
    ["note", /(הערה|הערות|note|notes|comment)/],
];

// Which field a column header most likely is; null when unsure (the screen then says "לבחור").
export function detectField(header: string): ImportField | null {
    const h = header.trim().toLowerCase().replace(/[׳']/g, "").replace(/״/g, '"').replace(/\s+/g, " ");
    if (!h) return null;
    for (const [f, re] of SYNONYMS) if (re.test(h)) return f;
    return null;
}

// Guesses a mapping for every column, never the same field twice (the first column wins).
export function autoMapping(headers: string[]): (ImportField | null)[] {
    const used = new Set<ImportField>();
    return headers.map((h) => {
        const f = detectField(h);
        if (!f || used.has(f)) return null;
        used.add(f);
        return f;
    });
}

// A small CSV reader: quoted cells, doubled quotes, and comma, semicolon or tab as the separator (Excel in
// Hebrew often saves with semicolons). Empty lines are dropped.
export function parseCsv(text: string): string[][] {
    const src = text.replace(/^﻿/, "");
    const first = src.split(/\r?\n/, 1)[0] ?? "";
    const sep = [",", ";", "\t"].map((c) => [c, first.split(c).length] as const).sort((a, b) => b[1] - a[1])[0][0];
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < src.length; i++) {
        const ch = src[i];
        if (quoted) {
            if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
            else if (ch === '"') quoted = false;
            else cell += ch;
        } else if (ch === '"' && cell === "") quoted = true;
        else if (ch === sep) { row.push(cell); cell = ""; }
        else if (ch === "\n" || ch === "\r") {
            if (ch === "\r" && src[i + 1] === "\n") i++;
            row.push(cell); cell = "";
            if (row.some((c) => c.trim())) rows.push(row);
            row = [];
        } else cell += ch;
    }
    row.push(cell);
    if (row.some((c) => c.trim())) rows.push(row);
    return rows.map((r) => r.map((c) => c.trim()));
}

export type ImportRow = {
    line: number; // the row number in the file, header is 1
    name: string;
    phone: string | null; // E.164
    email: string | null;
    phoneRaw: string;
    emailRaw: string;
    home: string;
    note: string;
    problem: string | null; // to fix before it can be invited
    already: boolean; // already a member, or already has a pending invitation
};

// Israeli numbers have 9 or 10 digits written locally; anything else in +972 is a typo.
function checkPhone(input: string): { value: string | null; problem: string | null } {
    if (!input.trim()) return { value: null, problem: null };
    // Excel drops the leading 0 of a number stored as a number: 501234567 is 0501234567.
    const raw = /^[5-9]\d{7,8}$/.test(input.trim()) ? `0${input.trim()}` : input;
    const v = normalizePhone(raw);
    if (!v) return { value: null, problem: /^[\d\s\-+().]+$/.test(raw.trim()) && raw.replace(/\D/g, "").length < 9 ? "מספר הטלפון קצר מדי" : "מספר הטלפון לא תקין" };
    if (v.startsWith("+972") && v.length < 12) return { value: null, problem: "מספר הטלפון קצר מדי" };
    if (v.startsWith("+972") && v.length > 13) return { value: null, problem: "מספר הטלפון ארוך מדי" };
    return { value: v, problem: null };
}

// One person from the cells of one row (also used when a row is fixed in place).
export function readPerson(line: number, cells: { name: string; phone: string; email: string; home: string; note: string }): ImportRow {
    const p = checkPhone(cells.phone);
    const email = cells.email.trim() ? normalizeEmail(cells.email) : null;
    let problem = p.problem;
    if (!problem && cells.email.trim() && !email) problem = "כתובת המייל לא תקינה";
    if (!problem && !p.value && !email) problem = "חסר טלפון או מייל";
    return { line, name: cells.name.trim().slice(0, 80), phone: p.value, email, phoneRaw: cells.phone.trim(), emailRaw: cells.email.trim(), home: cells.home.trim().slice(0, 40), note: cells.note.trim().slice(0, 120), problem, already: false };
}

// Every data row of the file as a person, with duplicates within the file and people already in the org
// marked. "table" includes the header row.
export function buildRows(table: string[][], mapping: (ImportField | null)[], known: { phones: Set<string>; emails: Set<string> }): ImportRow[] {
    const col = (r: string[], f: ImportField) => {
        const i = mapping.indexOf(f);
        return i >= 0 ? r[i] ?? "" : "";
    };
    const people = table.slice(1, IMPORT_MAX_ROWS + 1).map((r, i) => {
        const name = col(r, "name") || [col(r, "first"), col(r, "last")].filter(Boolean).join(" ");
        return readPerson(i + 2, { name, phone: col(r, "phone"), email: col(r, "email"), home: col(r, "home"), note: col(r, "note") });
    });
    return markRows(people, known);
}

// Duplicates and people already in the org, again after any fix.
export function markRows(people: ImportRow[], known: { phones: Set<string>; emails: Set<string> }): ImportRow[] {
    const seen = new Map<string, number>();
    return people.map((p) => {
        const out = { ...p, already: false };
        if (out.problem?.startsWith("כפול")) out.problem = null;
        if (out.problem) return out;
        const keys = [out.phone && `p:${out.phone}`, out.email && `e:${out.email}`].filter(Boolean) as string[];
        const twin = keys.map((k) => seen.get(k)).find((n) => n !== undefined);
        if (twin !== undefined) {
            out.problem = `כפול, שורה ${twin}`;
            return out;
        }
        for (const k of keys) seen.set(k, out.line);
        out.already = (!!out.phone && known.phones.has(out.phone)) || (!!out.email && known.emails.has(out.email));
        return out;
    });
}

export const DEFAULT_INVITE_TEXT = "שלום {שם}, {שולח} מזמינים אתכם להצטרף ל{ארגון} באפליקציית PIRI. לאישור:";
export const INVITE_TEXT_MAX = 300;

// The invitation for one person: {שם} becomes the first name (or nothing, leaving a general "שלום"),
// {שולח} the sender and {ארגון} the org. The link is added at the end.
export function inviteText(template: string, v: { name: string; sender: string; org: string; link: string }): string {
    const first = v.name.trim().split(/\s+/)[0] ?? "";
    const body = template
        .replace(/\{שם\}/g, first)
        .replace(/\{שולח\}/g, v.sender)
        .replace(/\{ארגון\}/g, v.org)
        .replace(/ +,/g, ",")
        .replace(/ {2,}/g, " ")
        .trim();
    return `${body} ${v.link}`.trim();
}

export const INVITE_DAYS = 14;
