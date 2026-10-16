import { test } from "node:test";
import assert from "node:assert/strict";
import { autoMapping, buildRows, detectField, inviteText, markRows, parseCsv, readPerson } from "./import.ts";

test("columns are recognized in Hebrew and English", () => {
    assert.equal(detectField("שם פרטי"), "first");
    assert.equal(detectField("Last Name"), "last");
    assert.equal(detectField("טלפון נייד"), "phone");
    assert.equal(detectField("דוא״ל"), "email");
    assert.equal(detectField("E-mail"), "email");
    assert.equal(detectField("דירה"), "home");
    assert.equal(detectField("סוג"), null);
    assert.deepEqual(autoMapping(["שם", "טלפון", "נייד", "סוג"]), ["name", "phone", null, null]);
});

test("CSV with quotes and semicolons", () => {
    assert.deepEqual(parseCsv('﻿שם;טלפון\r\n"כהן; משה";050-1234567\r\n\r\n'), [["שם", "טלפון"], ["כהן; משה", "050-1234567"]]);
    assert.deepEqual(parseCsv('a,b\n"x ""y""",2'), [["a", "b"], ['x "y"', "2"]]);
});

test("rows: phone or email, duplicates, already members", () => {
    const table = [
        ["שם פרטי", "שם משפחה", "טלפון", "מייל"],
        ["דנה", "כהן", "050-1234567", ""],
        ["", "", "", "a@b.co"],
        ["יוסי", "", "05012", ""],
        ["רון", "", "", ""],
        ["דנה", "שוב", "0501234567", ""],
        ["טל", "", "052-7654321", ""],
    ];
    const rows = buildRows(table, ["first", "last", "phone", "email"], { phones: new Set(["+972527654321"]), emails: new Set() });
    assert.equal(rows[0].name, "דנה כהן");
    assert.equal(rows[0].phone, "+972501234567");
    assert.equal(rows[1].problem, null);
    assert.equal(rows[2].problem, "מספר הטלפון קצר מדי");
    assert.equal(rows[3].problem, "חסר טלפון או מייל");
    assert.equal(rows[4].problem, "כפול, שורה 2");
    assert.equal(rows[5].already, true);
});

test("a fixed row is checked again", () => {
    const rows = [readPerson(2, { name: "א", phone: "050-1234567", email: "", home: "", note: "" }), readPerson(3, { name: "ב", phone: "050-1234567", email: "", home: "", note: "" })];
    const marked = markRows(rows, { phones: new Set(), emails: new Set() });
    assert.equal(marked[1].problem, "כפול, שורה 2");
    const fixed = markRows([marked[0], readPerson(3, { name: "ב", phone: "050-7654321", email: "", home: "", note: "" })], { phones: new Set(), emails: new Set() });
    assert.equal(fixed[1].problem, null);
});

test("invitation text", () => {
    const t = "שלום {שם}, {שולח} מזמינים אתכם להצטרף ל{ארגון}. לאישור:";
    assert.equal(inviteText(t, { name: "דנה כהן", sender: "יוסי", org: "ועד הבית", link: "https://x/i/1" }), "שלום דנה, יוסי מזמינים אתכם להצטרף לועד הבית. לאישור: https://x/i/1");
    assert.equal(inviteText(t, { name: "", sender: "יוסי", org: "ועד", link: "L" }), "שלום, יוסי מזמינים אתכם להצטרף לועד. לאישור: L");
});

test("a number that lost its leading 0 in Excel", () => {
    assert.equal(readPerson(2, { name: "", phone: "501234567", email: "", home: "", note: "" }).phone, "+972501234567");
});
