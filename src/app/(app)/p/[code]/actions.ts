"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { randomToken } from "@/lib/org-setup";
import { notifyUsers } from "@/lib/notify-server";

const INVITE_DAYS = 30;

// A manager scanned a person's profile code and sends them an invitation to the org (ux-spec 14.29, board
// D-MAdmScan). Nothing is added until the person accepts it on their phone.
export async function inviteByProfile(orgId: string, code: string): Promise<{ sent?: boolean; error?: string }> {
    const s = await getSession();
    if (!s) return { error: "צריך להיכנס לחשבון קודם." };
    const admin = await db.orgUser.findFirst({ where: { orgId, userId: s.userId, role: { in: ["owner", "admin"] }, status: "active", org: { status: "active", packId: { not: "celebration" } } }, include: { org: true } });
    if (!admin) return { error: "רק מנהלים של הארגון יכולים לצרף." };
    const person = await db.user.findUnique({ where: { profileCode: code }, include: { contacts: true } });
    if (!person) return { error: "הקוד כבר לא בתוקף." };
    if (person.id === s.userId) return { error: "זה הקוד שלכם." };
    const member = await db.orgUser.findUnique({ where: { orgId_userId: { orgId, userId: person.id } } });
    if (member && member.status === "active") return { error: "כבר חברים בארגון." };
    const contact = person.contacts.find((c) => c.kind === "phone") ?? person.contacts.find((c) => c.kind === "email");
    if (!contact) return { error: "אי אפשר לצרף את החשבון הזה כרגע." };
    const open = await db.invitation.findFirst({ where: { orgId, kind: contact.kind, value: contact.value, status: "pending", expiresAt: { gt: new Date() } } });
    if (open) return { error: "כבר נשלחה בקשת צירוף, והיא מחכה לאישור." };
    const inv = await db.invitation.create({
        data: { orgId, kind: contact.kind, value: contact.value, invitedById: s.userId, expiresAt: new Date(Date.now() + INVITE_DAYS * 86_400_000), linkToken: randomToken(16) },
    });
    await notifyUsers([person.id], { orgId, kind: "action", topic: "invitation", refId: inv.id, text: `${admin.org.name} מזמינים אתכם להצטרף`, href: `/invite/${inv.linkToken}`, actionLabel: "לצפייה בהזמנה" });
    revalidatePath(`/p/${code}`);
    return { sent: true };
}
