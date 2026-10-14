"use server";

import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { getPack } from "@/packs";
import {
    cleanCity, cleanName, isCollection, isLogoDataUrl, isPackChoice, isPaletteColor, parsePhoneList, randomToken,
    type Collection, type StepKey,
} from "@/lib/org-setup";

// Every "המשך" saves its screen, so the wizard really is "saved automatically": leaving and coming back
// to /orgs/new resumes where the admin stopped. The org exists from screen 1 with status "setup", which
// keeps it out of search and out of the wallet until "סיום ופתיחת הארגון".

type Settings = { wizard?: { step?: StepKey }; collection?: Collection; account?: "later" | "pending_provider"; inviteWith?: string };

async function requireUser() {
    const s = await getSession();
    if (!s) redirect("/login?intent=open");
    return s.userId;
}

async function setupOrg(orgId: string) {
    const userId = await requireUser();
    const link = await db.orgUser.findFirst({ where: { orgId, userId, role: "owner", org: { status: "setup" } }, include: { org: true } });
    if (!link) redirect("/orgs/new");
    return { userId, org: link.org };
}

function merged(current: Prisma.JsonValue, patch: Settings): Prisma.InputJsonObject {
    const base = (current && typeof current === "object" && !Array.isArray(current) ? current : {}) as Settings;
    return { ...base, ...patch, wizard: { ...base.wizard, ...patch.wizard } } as Prisma.InputJsonObject;
}

export async function saveName(orgId: string | null, raw: string): Promise<{ orgId?: string; joinToken?: string | null; error?: string }> {
    const userId = await requireUser();
    const name = cleanName(raw);
    if (!name) return { error: "השם צריך להיות בין 2 ל-60 תווים" };
    if (orgId) {
        const { org } = await setupOrg(orgId);
        await db.organization.update({ where: { id: org.id }, data: { name, settings: merged(org.settings, { wizard: { step: "type" } }) } });
        return { orgId: org.id, joinToken: org.joinToken };
    }
    const org = await db.organization.create({
        data: {
            name,
            slug: randomToken(10),
            joinToken: randomToken(12),
            packId: "generic",
            status: "setup",
            settings: { wizard: { step: "type" } },
            orgUsers: { create: { userId, role: "owner" } },
        },
    });
    return { orgId: org.id, joinToken: org.joinToken };
}

export async function saveType(orgId: string, packId: string): Promise<{ error?: string }> {
    if (!isPackChoice(packId)) return { error: "בחרו סוג ארגון" };
    const { org } = await setupOrg(orgId);
    await db.organization.update({ where: { id: org.id }, data: { packId, settings: merged(org.settings, { wizard: { step: "look" } }) } });
    return {};
}

// logo: a new image (data URL), null to remove it, undefined to keep what is there.
export async function saveLook(orgId: string, input: { color: string; city: string; logo?: string | null }): Promise<{ error?: string }> {
    if (!isPaletteColor(input.color)) return { error: "בחרו צבע" };
    if (input.logo && !isLogoDataUrl(input.logo)) return { error: "הלוגו לא נקלט. נסו קובץ אחר" };
    const city = cleanCity(input.city);
    if (input.city.trim() && !city) return { error: "שם העיר ארוך מדי" };
    const { org } = await setupOrg(orgId);
    await db.organization.update({
        where: { id: org.id },
        data: {
            brandColor: input.color,
            city,
            ...(input.logo !== undefined ? { logoUrl: input.logo } : {}),
            settings: merged(org.settings, { wizard: { step: "collection" } }),
        },
    });
    return {};
}

export async function saveCollection(orgId: string, collection: string): Promise<{ error?: string }> {
    if (!isCollection(collection)) return { error: "בחרו איך תגבו" };
    const { org } = await setupOrg(orgId);
    const next: StepKey = collection === "system" ? "account" : "invite";
    await db.organization.update({ where: { id: org.id }, data: { settings: merged(org.settings, { collection, wizard: { step: next } }) } });
    return {};
}

// Decided 14.10.2026: until a payment provider is chosen (Q-T1) the account details are not saved or sent
// anywhere. Only the fact that this step is still open is kept, for the task on the overview page.
export async function saveAccountStep(orgId: string): Promise<void> {
    const { org } = await setupOrg(orgId);
    await db.organization.update({ where: { id: org.id }, data: { settings: merged(org.settings, { account: "later", wizard: { step: "invite" } }) } });
}

// Invitations by phone are recorded now and sent once a text-message provider is connected.
export async function invitePhones(orgId: string, raw: string): Promise<{ added: number; invalid: string[]; error?: string }> {
    const { userId, org } = await setupOrg(orgId);
    const { phones, invalid } = parsePhoneList(raw);
    if (!phones.length) return { added: 0, invalid, error: "לא מצאנו מספרי טלפון ברשימה" };
    const open = await db.invitation.findMany({ where: { orgId: org.id, kind: "phone", value: { in: phones }, status: "pending" }, select: { value: true } });
    const fresh = phones.filter((p) => !open.some((o) => o.value === p));
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.invitation.createMany({
        data: fresh.map((value) => ({ orgId: org.id, kind: "phone", value, invitedById: userId, expiresAt, linkToken: randomToken(16) })),
    });
    return { added: fresh.length, invalid };
}

export async function finishSetup(orgId: string, inviteWith: string): Promise<void> {
    const { org } = await setupOrg(orgId);
    const pack = getPack(org.packId);
    await db.$transaction([
        ...pack.defaultFunds.map((f) =>
            db.fund.upsert({ where: { orgId_key: { orgId: org.id, key: f.key } }, create: { orgId: org.id, key: f.key, displayName: f.displayName }, update: {} }),
        ),
        db.organization.update({
            where: { id: org.id },
            data: { status: "active", settings: merged(org.settings, { inviteWith: ["link", "phone", "import"].includes(inviteWith) ? inviteWith : "later", wizard: { step: "invite" } }) },
        }),
    ]);
    redirect(`/orgs/${org.id}`);
}
