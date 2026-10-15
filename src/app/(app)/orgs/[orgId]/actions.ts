"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { MAX_INVITED, readCelebration } from "@/lib/celebration";
import { parsePhoneList } from "@/lib/org-setup";
import type { Prisma } from "@prisma/client";

// The organizer confirms a payment a guest marked as paid, or returns it to "not paid" when nothing arrived.
// Money itself never moves through us in phase 1 (decided with Tommy 14.10.2026).
async function organizerOf(orgId: string) {
    const session = await getSession();
    if (!session) return null;
    return db.orgUser.findFirst({ where: { orgId, userId: session.userId, role: { in: ["owner", "admin"] }, status: "active" }, include: { org: true } });
}

export async function setPayment(orgId: string, rsvpId: string, to: "confirmed" | "none"): Promise<void> {
    if (!(await organizerOf(orgId))) return;
    await db.rsvp.updateMany({
        where: { id: rsvpId, orgId, paid: to === "confirmed" ? "claimed" : { in: ["claimed", "confirmed"] } },
        data: to === "confirmed" ? { paid: "confirmed" } : { paid: "none", paidMinor: null, paidAt: null },
    });
    revalidatePath(`/orgs/${orgId}`);
}

async function saveInvited(orgId: string, change: (current: string[]) => string[]) {
    const link = await organizerOf(orgId);
    if (!link) return;
    const settings = (link.org.settings ?? {}) as Record<string, unknown>;
    const c = readCelebration(settings);
    const invited = change(c.invited).slice(0, MAX_INVITED);
    await db.organization.update({ where: { id: orgId }, data: { settings: { ...settings, celebration: { ...c, invited } } as Prisma.InputJsonObject } });
    revalidatePath(`/orgs/${orgId}`);
}

// More invited phones, pasted from the organizer's page. Returns what could not be read.
export async function addInvited(orgId: string, _prev: { invalid?: string[]; added?: number } | undefined, form: FormData): Promise<{ invalid?: string[]; added?: number }> {
    const { phones, invalid } = parsePhoneList(String(form.get("phones") ?? ""), MAX_INVITED);
    let added = 0;
    await saveInvited(orgId, (current) => {
        const fresh = phones.filter((p) => !current.includes(p));
        added = fresh.length;
        return [...current, ...fresh];
    });
    return { invalid, added };
}

export async function removeInvited(orgId: string, phone: string): Promise<void> {
    await saveInvited(orgId, (current) => current.filter((p) => p !== phone));
}
