"use server";

import { revalidatePath } from "next/cache";
import { isRecordMethod } from "@/lib/billing/account";
import { readPledge, type PledgeInput } from "@/lib/donations";
import { cancelPledge, createPledge, donationsAdmin } from "@/lib/donations-server";

export type PledgeResult = { error?: string; ok?: string; id?: string };
const deny = { error: "אין לכם הרשאה לנהל תרומות ונדרים בארגון הזה." };
const todayIL = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());

function done(orgId: string) {
    revalidatePath(`/orgs/${orgId}`, "layout");
    revalidatePath(`/card/${orgId}`, "layout");
    revalidatePath("/wallet");
}

// "יצירת חיוב" (board D-ModSynDonations).
export async function savePledge(orgId: string, input: PledgeInput): Promise<PledgeResult> {
    const a = await donationsAdmin(orgId);
    if (!a) return deny;
    const read = readPledge(input, todayIL());
    if (!read.ok) return { error: read.error };
    if (read.value.paidNow && !isRecordMethod(input.method)) return { error: "בחרו איך שולם." };
    const r = await createPledge({ userId: a.userId, org: a.org }, read.value, input.method);
    if ("error" in r) return { error: r.error };
    done(orgId);
    return { id: r.id, ok: read.value.paidNow ? "נרשם כשולם, והקבלה נשמרה בארנק של החבר." : read.value.installments > 1 ? `נוצרו ${read.value.installments} חיובים חודשיים בכרטיס החבר.` : "החיוב נוצר בכרטיס החבר." };
}

// "ביטול": what was not paid yet.
export async function cancelPledgeForm(orgId: string, id: string): Promise<PledgeResult> {
    if (!(await donationsAdmin(orgId))) return deny;
    const r = await cancelPledge(orgId, id);
    if ("error" in r) return { error: r.error };
    done(orgId);
    return { ok: r.kept ? "בוטל. מה שכבר שולם נשאר רשום, עם הקבלה." : "בוטל, והחבר קיבל הודעה." };
}
