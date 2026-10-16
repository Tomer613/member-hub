"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { appOrigin } from "@/lib/origin-server";
import { profileCode, qrSvg } from "@/lib/profile-code-server";

// "הקלדת קוד": a short code from an invitation, an org's join link or a person's profile.
export async function lookupCode(code: string): Promise<{ to?: string; error?: string }> {
    const s = await getSession();
    if (!s) return { error: "צריך להיכנס לחשבון קודם." };
    const c = String(code).trim().toLowerCase();
    if (!/^[a-z0-9_-]{4,64}$/.test(c)) return { error: "הקוד לא נמצא. בדקו שהוקלד נכון." };
    const [inv, org, person] = await Promise.all([
        db.invitation.findUnique({ where: { linkToken: c }, select: { linkToken: true } }),
        db.organization.findUnique({ where: { joinToken: c }, select: { joinToken: true, packId: true } }),
        db.user.findUnique({ where: { profileCode: c }, select: { profileCode: true } }),
    ]);
    if (inv) return { to: `/invite/${inv.linkToken}` };
    if (org) return { to: org.packId === "celebration" ? `/c/${org.joinToken}` : `/join/${org.joinToken}` };
    if (person) return { to: `/p/${person.profileCode}` };
    return { error: "הקוד לא נמצא. בדקו שהוקלד נכון." };
}

// "יצירת קוד חדש": the old code stops working at once.
export async function renewProfileCode(): Promise<{ code: string; svg: string; link: string } | null> {
    const s = await getSession();
    if (!s) return null;
    const code = await profileCode(s.userId, true);
    const { origin } = await appOrigin();
    const link = `${origin}/p/${code}`;
    return { code, svg: await qrSvg(link), link };
}
