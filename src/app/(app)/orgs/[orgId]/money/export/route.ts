import { NextResponse } from "next/server";
import { ilDate } from "@/lib/billing/account";
import { loadMovements } from "@/lib/billing/kupa-server";
import { toCsv } from "@/lib/members-admin";
import { membersAdmin } from "@/lib/members-server";

// "ייצוא" of "תנועות בקופה": every movement, as a CSV that opens in Excel.
export async function GET(_req: Request, { params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    if (!(await membersAdmin(orgId))) return new NextResponse("Not found", { status: 404 });
    const rows = await loadMovements(orgId, 100_000);
    const sum = (m: (typeof rows)[number]) => (m.amountMinor / 100).toFixed(2);
    const csv = toCsv([["תאריך", "תיאור", "מי", "הכנסה", "הוצאה", "סטטוס"], ...rows.map((m) => [ilDate(m.at), m.what, m.who, m.dir === "in" ? sum(m) : "", m.dir === "out" ? sum(m) : "", m.status])]);
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="kupa-${day}.csv"`, "Cache-Control": "no-store" } });
}
