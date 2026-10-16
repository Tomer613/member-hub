"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";

export async function markRead(id: string): Promise<void> {
    const s = await getSession();
    if (!s) return;
    await db.notification.updateMany({ where: { id, userId: s.userId, readAt: null }, data: { readAt: new Date() } });
    revalidatePath("/notifications");
    revalidatePath("/wallet");
}

// "סימון הכול כנקרא": every update is read. What still needs doing stays until it is done.
export async function markAllRead(orgId: string | null): Promise<void> {
    const s = await getSession();
    if (!s) return;
    await db.notification.updateMany({ where: { userId: s.userId, readAt: null, ...(orgId ? { orgId } : {}) }, data: { readAt: new Date() } });
    revalidatePath("/notifications");
    revalidatePath("/wallet");
}
