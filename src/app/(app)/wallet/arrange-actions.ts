"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { SORT_MODES, type SortMode } from "@/lib/wallet";
import { memberCharges } from "@/lib/billing/member-money";
import { moneySummary } from "@/lib/billing/account";

// "סידור הארנק", the archive and deleting a card (boards D-WalletEdit, D-WalletMove, D-WalletArchive,
// D-WalletDelete). Everything here is the member's own view of their wallet; the org sees none of it.

async function own(linkId: string) {
    const session = await getSession();
    if (!session) return null;
    const link = await db.orgUser.findUnique({ where: { id: linkId }, include: { org: true } });
    return link && link.userId === session.userId && !link.deletedAt ? link : null;
}

export async function setSortMode(mode: SortMode): Promise<void> {
    const session = await getSession();
    if (!session || !SORT_MODES.some((m) => m.id === mode)) return;
    const user = await db.user.findUniqueOrThrow({ where: { id: session.userId }, select: { preferences: true } });
    const prefs = (user.preferences && typeof user.preferences === "object" ? user.preferences : {}) as Prisma.JsonObject;
    await db.user.update({ where: { id: session.userId }, data: { preferences: { ...prefs, walletSort: mode } } });
    revalidatePath("/wallet");
}

// The whole list as the member arranged it: the order, and which cards are pinned. Arranging by hand
// switches the display order to "ידני".
export async function saveArrangement(items: { id: string; pinned: boolean }[]): Promise<void> {
    const session = await getSession();
    if (!session || !Array.isArray(items) || items.length > 500) return;
    const mine = await db.orgUser.findMany({ where: { userId: session.userId, id: { in: items.map((i) => i.id) } }, select: { id: true } });
    const ok = new Set(mine.map((m) => m.id));
    await db.$transaction(items.filter((i) => ok.has(i.id)).map((i, n) => db.orgUser.update({ where: { id: i.id }, data: { walletOrder: n, isPinned: !!i.pinned } })));
    await setSortMode("manual");
}

export async function hideCard(linkId: string): Promise<void> {
    const link = await own(linkId);
    // A card of a member who left with a debt stays in the wallet until the debt is paid (ux-spec 7).
    if (!link || link.status === "left_with_debt") return;
    await db.orgUser.update({ where: { id: link.id }, data: { hiddenAt: new Date(), isPinned: false } });
    revalidatePath("/wallet");
}

export async function unhideCard(linkId: string): Promise<void> {
    const link = await own(linkId);
    if (!link || link.status !== "active") return;
    await db.orgUser.update({ where: { id: link.id }, data: { hiddenAt: null } });
    revalidatePath("/wallet");
    revalidatePath("/wallet/archive");
}

// Deletes a card from the archive. "Card only" leaves the org's records as they are; "and my data" also
// clears the personal details the org holds, while payments and receipts stay as the law requires.
// A card with an open debt cannot be deleted, and an org's owner hands over first.
export async function deleteCard(linkId: string, wipe: boolean): Promise<{ error?: string }> {
    const link = await own(linkId);
    if (!link) return { error: "הכרטיס לא נמצא." };
    if (link.status === "active" && !link.hiddenAt) return { error: "קודם מעבירים את הכרטיס לארכיון." };
    if (link.role === "owner" && link.org.packId !== "celebration") return { error: "את הכרטיס של מי שפתח את הארגון אי אפשר למחוק. קודם מעבירים את הניהול למישהו אחר." };
    if (link.memberId && moneySummary(await memberCharges(link.orgId, link.memberId)).openMinor > 0) return { error: "אפשר למחוק את הכרטיס אחרי סילוק החוב." };
    const now = new Date();
    await db.$transaction(async (tx) => {
        await tx.orgUser.update({ where: { id: link.id }, data: { deletedAt: now, isPinned: false, ...(link.status === "active" ? { status: "left", leftAt: now } : {}) } });
        // A guest's reply keeps its count and payment for the organizer's totals, without the name or answer.
        if (wipe) await tx.rsvp.updateMany({ where: { orgId: link.orgId, userId: link.userId }, data: { name: "אורח/ת", answer: null, userId: null } });
        if (wipe && link.memberId) {
            await tx.member.update({
                where: { id: link.memberId },
                data: { firstName: "חבר/ה לשעבר", lastName: "", email: null, phone: null, phone2: null, street: null, city: null, customFields: {}, privacy: {}, notes: null, status: "inactive" },
            });
        }
    });
    revalidatePath("/wallet");
    revalidatePath("/wallet/archive");
    return {};
}
