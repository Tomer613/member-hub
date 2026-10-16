"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { verifyEntryCode } from "@/lib/entry-code";
import { roleLabel } from "@/lib/wallet";

export type EntryCheck = { ok: true; name: string; role: string } | { ok: false; reason: string };

// Checks the entry code on the back of a member card at the door (board D-BadgeBack): genuine, from this
// minute, of this org, and of an active membership.
export async function checkEntry(orgId: string, code: string): Promise<EntryCheck> {
    const s = await getSession();
    const secret = process.env.SESSION_SECRET;
    if (!s || !secret) return { ok: false, reason: "צריך להיכנס לחשבון קודם." };
    const staff = await db.orgUser.findFirst({ where: { orgId, userId: s.userId, role: { in: ["owner", "admin"] }, status: "active" } });
    if (!staff) return { ok: false, reason: "רק מנהלים של הארגון יכולים לסרוק בכניסה." };
    const id = verifyEntryCode(String(code).trim(), new Date(), secret);
    if (!id) return { ok: false, reason: String(code).startsWith("piri1.") ? "הקוד פג תוקף. הוא מתחלף כל דקה: בקשו להציג את הכרטיס שוב." : "זה לא קוד כניסה של כרטיס חבר." };
    const link = await db.orgUser.findUnique({ where: { id }, include: { user: { select: { firstName: true, lastName: true } }, org: { select: { packId: true } } } });
    if (!link || link.orgId !== orgId) return { ok: false, reason: "הכרטיס הזה שייך לארגון אחר." };
    if (link.status !== "active" || link.role === "guest") return { ok: false, reason: "החברות הזו לא פעילה כרגע." };
    return { ok: true, name: `${link.user.firstName ?? ""} ${link.user.lastName ?? ""}`.trim() || "חבר/ה", role: roleLabel(link.role, link.org.packId) };
}
