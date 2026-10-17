"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { activityMember } from "@/lib/activities-server";
import { createPledge } from "@/lib/donations-server";
import { formatShekels } from "@/lib/money";
import { notifyAdmins } from "@/lib/notify-server";
import { dedicationFor } from "@/lib/yahrzeit-server";

// "להקדשה": the chosen dedication becomes a charge in the member's card, paid like any other.
export async function dedicate(orgId: string, yahrzeitId: string, index: number): Promise<{ error?: string; ok?: true }> {
    const m = await activityMember(orgId);
    if (!m) return { error: "אין לכם גישה לארגון הזה." };
    const d = await dedicationFor(orgId, yahrzeitId, m.link.memberId);
    if (!d) return { error: "ההצעה כבר לא זמינה." };
    if (d.given) return { ok: true };
    const item = d.items[index];
    if (!item) return { error: "בחרו הקדשה." };
    const purpose = `${item.label}${/נשמת$/.test(item.label) ? "" : " לעילוי נשמת"} ${d.y.deceasedName}`;
    const r = await createPledge({ userId: m.userId, org: { id: orgId, name: m.link.org.name } },
        { memberId: m.link.memberId!, kind: "donation", purpose, amountMinor: item.priceMinor, installments: 1, first: d.today, note: null, paidNow: false, notify: false, anonymous: false }, "cash", d.ref);
    if ("error" in r && !r.taken) return { error: r.error };
    if ("id" in r) {
        // The gabbai prepares it (a kiddush, a class, a candle); the reminder's button is done.
        await notifyAdmins(orgId, { orgId, kind: "update", topic: "donation", refId: r.id, text: `הקדשה חדשה: ${purpose}, ${formatShekels(item.priceMinor)}, ליארצייט ב-${d.date}`, href: `/orgs/${orgId}/donations?e=${r.id}` });
        await db.notification.updateMany({ where: { userId: m.userId, topic: "yahrzeit", refId: yahrzeitId, kind: "action", doneAt: null }, data: { doneAt: new Date() } });
    }
    revalidatePath(`/card/${orgId}`, "layout");
    revalidatePath(`/orgs/${orgId}`, "layout");
    return { ok: true };
}
