import { NextResponse } from "next/server";
import { toCsv } from "@/lib/members-admin";
import { membersAdmin } from "@/lib/members-server";
import { getPack } from "@/packs";

// "הורדת תבנית" (board D-AdmAddMember): the columns the import recognizes by itself, with one example row.
export async function GET(_req: Request, { params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    const a = await membersAdmin(orgId);
    if (!a?.canManage) return new NextResponse("Not found", { status: 404 });
    const home = getPack(a.org.packId).terms.household;
    const csv = toCsv([
        ["שם פרטי", "שם משפחה", "טלפון", "דוא״ל", home === "דירה" ? "דירה" : "משק בית", "הערה"],
        ["דנה", "כהן", "050-1234567", "dana@example.com", home === "דירה" ? "14" : "משפחת כהן", ""],
    ]);
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="members-template.csv"', "Cache-Control": "no-store" } });
}
