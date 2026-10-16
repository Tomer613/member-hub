import { NextResponse } from "next/server";
import { balanceCell, STATUS_CHIP, toCsv } from "@/lib/members-admin";
import { loadMemberRows, membersAdmin } from "@/lib/members-server";

// "ייצוא" on the member list: a CSV of the members with what each one agreed to share with the org.
export async function GET(_req: Request, { params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    const a = await membersAdmin(orgId);
    if (!a) return new NextResponse("Not found", { status: 404 });
    const rows = (await loadMemberRows(orgId, a.org.packId)).filter((r) => r.facts.kind === "member").sort((x, y) => x.name.localeCompare(y.name, "he"));
    const csv = toCsv([
        ["שם", "משק בית", "סטטוס", "יתרה", "חבר מאז", "תוויות", "טלפון", "מייל", "כתובת"],
        ...rows.map((r) => [r.name, r.home, STATUS_CHIP[r.status].label, balanceCell("member", r.balanceMinor).text, r.sinceText, r.labels.map((l) => l.name).join(" | "), r.phone ?? "", r.email ?? "", r.address ?? ""]),
    ]);
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="members-${day}.csv"`,
            "Cache-Control": "no-store",
        },
    });
}
