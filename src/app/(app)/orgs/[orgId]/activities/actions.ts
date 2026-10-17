"use server";

import { revalidatePath } from "next/cache";
import { activityTypes, readActivity, type ActivityInput } from "@/lib/activities";
import { cancelActivity, saveActivity } from "@/lib/activities-server";
import { membersAdmin } from "@/lib/members-server";
import { getPack } from "@/packs";

export type ActivityResult = { error?: string; ok?: string; id?: string };

// "פעילויות ואירועים" is managed by the owner and admins; the treasurer does not see it, as with settings.
async function activitiesAdmin(orgId: string) {
    const a = await membersAdmin(orgId);
    return a && a.canManage ? a : null;
}

function done(orgId: string) {
    revalidatePath(`/orgs/${orgId}`, "layout");
    revalidatePath(`/card/${orgId}`, "layout");
}

// "שמירה כטיוטה" and "פרסום" (board D-AdmActivities).
export async function saveActivityForm(orgId: string, id: string | null, input: ActivityInput, opts: { publish: boolean; notify: boolean }): Promise<ActivityResult> {
    const a = await activitiesAdmin(orgId);
    if (!a) return { error: "אין לכם הרשאה לנהל פעילויות בארגון הזה." };
    const pack = getPack(a.org.packId);
    const read = readActivity(input, activityTypes(pack.eventTypes), pack.activityFields ?? [], new Date(), opts.publish);
    if (!read.ok) return { error: read.error };
    const r = await saveActivity({ orgId, orgName: a.org.name, id, userId: a.userId, values: read.value, publish: opts.publish, notify: opts.notify });
    if ("error" in r) return { error: r.error };
    done(orgId);
    return { id: r.id, ok: opts.publish ? (id ? "השינויים פורסמו." : "הפעילות פורסמה.") : "נשמר כטיוטה. רק מנהלים רואים אותה." };
}

// "ביטול הפעילות".
export async function cancelActivityForm(orgId: string, id: string): Promise<ActivityResult> {
    const a = await activitiesAdmin(orgId);
    if (!a) return { error: "אין לכם הרשאה." };
    const r = await cancelActivity(orgId, a.org.name, id);
    if ("error" in r) return { error: r.error };
    done(orgId);
    return { ok: r.kept ? `הפעילות בוטלה. ${r.kept === 1 ? "נרשם אחד כבר שילם" : `${r.kept} נרשמים כבר שילמו`}. בינתיים מחזירים להם את הכסף מחוץ לאפליקציה.` : "הפעילות בוטלה, והנרשמים קיבלו הודעה." };
}
