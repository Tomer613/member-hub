"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { membersAdmin } from "@/lib/members-server";
import { cleanCity, cleanName, isLogoDataUrl, isPaletteColor } from "@/lib/org-setup";
import { cleanPublicText, readJoinOpen } from "@/lib/org-settings";

export type SaveResult = { error?: string; saved?: string };

// "הגדרות הארגון": the owner and admins change them; the treasurer does not see the screen.
async function settingsAdmin(orgId: string) {
    const a = await membersAdmin(orgId);
    if (!a || !a.canManage || a.org.status !== "active" || a.org.packId === "celebration") return null;
    return a;
}

// Everything that shows the org's name, color or logo: the admin area, the wallet, the card and the join page.
function done(orgId: string) {
    revalidatePath(`/orgs/${orgId}`, "layout");
    revalidatePath(`/card/${orgId}`, "layout");
    revalidatePath("/wallet");
}

const deny: SaveResult = { error: "אין לכם הרשאה לשנות את הגדרות הארגון." };

export async function saveOrgDetails(orgId: string, input: { name: string; city: string }): Promise<SaveResult> {
    const a = await settingsAdmin(orgId);
    if (!a) return deny;
    const name = cleanName(input.name);
    if (!name) return { error: "השם צריך להיות בין 2 ל-60 תווים." };
    const city = cleanCity(input.city);
    if (input.city.trim() && !city) return { error: "שם העיר ארוך מדי." };
    await db.organization.update({ where: { id: orgId }, data: { name, city } });
    done(orgId);
    return { saved: "פרטי הארגון נשמרו." };
}

export async function saveOrgPublic(orgId: string, input: { listed: boolean; approval: boolean; tagline: string; about: string }): Promise<SaveResult> {
    const a = await settingsAdmin(orgId);
    if (!a) return deny;
    // "הצטרפות באישור מנהל" is the owner's call (Tommy, 17.10.2026).
    const wasOpen = readJoinOpen(a.org.settings);
    if (wasOpen === input.approval && a.role !== "owner") return { error: "רק המנהל הראשי יכול לשנות את ההצטרפות באישור מנהל." };
    const text = cleanPublicText(input);
    if (!text.ok) return { error: text.error };
    const base = (a.org.settings && typeof a.org.settings === "object" && !Array.isArray(a.org.settings) ? a.org.settings : {}) as Prisma.JsonObject;
    await db.organization.update({
        where: { id: orgId },
        data: { visibility: input.listed ? "listed" : "private", settings: { ...base, tagline: text.value.tagline, about: text.value.about, joinMode: input.approval ? "approval" : "open" } },
    });
    done(orgId);
    const join = input.approval ? "" : " מי שמצטרף נכנס מיד, בלי אישור.";
    return { saved: (input.listed ? "נשמר. הארגון מופיע עכשיו בחיפוש." : "נשמר. הארגון לא מופיע בחיפוש.") + join };
}

// logo: a new image (data URL), null to remove it, undefined to keep what is there.
export async function saveOrgLook(orgId: string, input: { color: string; logo?: string | null }): Promise<SaveResult> {
    const a = await settingsAdmin(orgId);
    if (!a) return deny;
    if (!isPaletteColor(input.color)) return { error: "בחרו צבע." };
    if (input.logo && !isLogoDataUrl(input.logo)) return { error: "הלוגו לא נקלט. נסו קובץ אחר." };
    await db.organization.update({ where: { id: orgId }, data: { brandColor: input.color, ...(input.logo !== undefined ? { logoUrl: input.logo } : {}) } });
    done(orgId);
    return { saved: "המראה נשמר. החברים יראו אותו בכרטיס, חוץ ממי שבחר לכרטיס צבע משלו." };
}
