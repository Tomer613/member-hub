"use server";

import QRCode from "qrcode";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { entryCode } from "@/lib/entry-code";

// A fresh entry code for the back of the member card, drawn as an SVG. Only for one's own active membership.
export async function freshEntry(orgId: string): Promise<{ svg: string; secondsLeft: number } | null> {
    const session = await getSession();
    const secret = process.env.SESSION_SECRET;
    if (!session || !secret) return null;
    const link = await db.orgUser.findUnique({ where: { orgId_userId: { orgId, userId: session.userId } }, select: { id: true, status: true, role: true } });
    if (!link || link.status !== "active" || link.role === "guest") return null;
    const { code, secondsLeft } = entryCode(link.id, new Date(), secret);
    // High error correction leaves room for the org mark drawn over the middle of the code.
    const svg = await QRCode.toString(code, { type: "svg", errorCorrectionLevel: "H", margin: 0, color: { dark: "#1E1633", light: "#FFFFFF" } });
    return { svg, secondsLeft };
}
