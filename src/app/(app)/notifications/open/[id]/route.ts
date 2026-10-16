import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";

// Opening a note marks it read and goes where it points. Only paths inside the app are followed.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const s = await getSession();
    if (!s) return NextResponse.redirect(new URL("/login?next=/notifications", req.url));
    const n = await db.notification.findFirst({ where: { id, userId: s.userId } });
    if (!n) return NextResponse.redirect(new URL("/notifications", req.url));
    if (!n.readAt) await db.notification.update({ where: { id: n.id }, data: { readAt: new Date() } });
    const to = n.href && n.href.startsWith("/") && !n.href.startsWith("//") ? n.href : "/notifications";
    return NextResponse.redirect(new URL(to, req.url));
}
