"use server";

import { revalidatePath } from "next/cache";
import { activityMember, registerActivity, unregisterActivity } from "@/lib/activities-server";
import { formatShekels } from "@/lib/money";

export type SignupResult = { error?: string; ok?: string; pay?: boolean };

const done = (orgId: string) => {
    revalidatePath(`/card/${orgId}`, "layout");
    revalidatePath(`/orgs/${orgId}`, "layout");
    revalidatePath(`/pay/${orgId}`);
};

// "להירשם" (activities in the member's card). A member who left the org with a debt can still see, not sign up.
export async function signUp(orgId: string, eventId: string): Promise<SignupResult> {
    const m = await activityMember(orgId);
    if (!m) return { error: "אין לכם גישה לארגון הזה." };
    if (m.link.status !== "active") return { error: "ההרשמה פתוחה לחברים פעילים." };
    const r = await registerActivity({ orgId, eventId, userId: m.userId, linkId: m.link.id });
    if ("error" in r) return { error: r.error };
    done(orgId);
    return "priceMinor" in r && r.priceMinor ? { ok: `נרשמתם. נוסף חיוב של ${formatShekels(r.priceMinor)} בכספים, לתשלום עד יום הפעילות.`, pay: true } : { ok: "נרשמתם. נתראה שם!" };
}

// "ביטול ההרשמה".
export async function signOff(orgId: string, eventId: string): Promise<SignupResult> {
    const m = await activityMember(orgId);
    if (!m) return { error: "אין לכם גישה לארגון הזה." };
    const r = await unregisterActivity({ orgId, eventId, userId: m.userId });
    if ("error" in r) return { error: r.error };
    done(orgId);
    return { ok: r.kept ? "ההרשמה בוטלה. כבר שילמתם, אז ההנהלה תחזיר לכם את הכסף." : "ההרשמה בוטלה." };
}
