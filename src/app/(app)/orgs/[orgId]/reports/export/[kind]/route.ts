import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ilDate } from "@/lib/billing/account";
import { loadMovements } from "@/lib/billing/kupa-server";
import { STATUS_CHIP, toCsv } from "@/lib/members-admin";
import { loadMemberRows, membersAdmin } from "@/lib/members-server";
import { isReportId, readMonths, REPORTS } from "@/lib/reports";
import { collectionRows, debtRows, receiptRows } from "@/lib/reports-server";

const FILE: Record<string, string> = { collection: "collection", debts: "debts", members: "members", kupa: "kupa", receipts: "receipts" };

// "ייצוא" on "דוחות" (board D-AdmReports): a CSV that opens in Excel. The owner, admins and the treasurer.
export async function GET(req: Request, { params }: { params: Promise<{ orgId: string; kind: string }> }) {
    const { orgId, kind } = await params;
    const a = await membersAdmin(orgId);
    if (!a || !isReportId(kind)) return new NextResponse("Not found", { status: 404 });
    const months = readMonths(new URL(req.url).searchParams.get("m"));
    let rows: string[][];
    if (kind === "collection") rows = await collectionRows(orgId, months);
    else if (kind === "debts") rows = await debtRows(orgId);
    else if (kind === "receipts") rows = await receiptRows(orgId, months);
    else if (kind === "kupa") {
        const list = await loadMovements(orgId, 100_000);
        rows = [["תאריך", "תיאור", "מי", "הכנסה", "הוצאה", "סטטוס"], ...list.map((m) => [ilDate(m.at), m.what, m.who, m.dir === "in" ? (m.amountMinor / 100).toFixed(2) : "", m.dir === "out" ? (m.amountMinor / 100).toFixed(2) : "", m.status])];
    } else {
        const list = (await loadMemberRows(orgId, a.org.packId)).filter((r) => r.facts.kind === "member").sort((x, y) => x.name.localeCompare(y.name, "he"));
        const subs = await db.subscription.findMany({ where: { orgId, status: { in: ["active", "frozen"] } }, select: { memberId: true, status: true, plan: { select: { name: true } } } });
        const plan = (id: string | null) => subs.filter((s) => s.memberId === id).map((s) => s.plan.name + (s.status === "frozen" ? " (מוקפא)" : "")).join(" | ");
        rows = [["שם", "משק בית", "סטטוס", "מסלול", "תוויות", "חבר מאז", "טלפון", "מייל"], ...list.map((r) => [r.name, r.home, STATUS_CHIP[r.status].label, plan(r.memberId), r.labels.map((l) => l.name).join(" | "), r.sinceText, r.phone ?? "", r.email ?? ""])];
    }
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
    const title = REPORTS.find((r) => r.id === kind)!.title;
    return new NextResponse(toCsv(rows), {
        headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${FILE[kind]}-${day}.csv"; filename*=UTF-8''${encodeURIComponent(`${title} ${day}.csv`)}`, "Cache-Control": "no-store" },
    });
}
