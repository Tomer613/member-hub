"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";

// The organizer confirms a payment a guest marked as paid, or returns it to "not paid" when nothing arrived.
// Money itself never moves through us in phase 1 (decided with Tommy 14.10.2026).
export async function setPayment(orgId: string, rsvpId: string, to: "confirmed" | "none"): Promise<void> {
    const session = await getSession();
    if (!session) return;
    const link = await db.orgUser.findFirst({ where: { orgId, userId: session.userId, role: { in: ["owner", "admin"] }, status: "active" } });
    if (!link) return;
    await db.rsvp.updateMany({
        where: { id: rsvpId, orgId, paid: to === "confirmed" ? "claimed" : { in: ["claimed", "confirmed"] } },
        data: to === "confirmed" ? { paid: "confirmed" } : { paid: "none", paidMinor: null, paidAt: null },
    });
    revalidatePath(`/orgs/${orgId}`);
}
