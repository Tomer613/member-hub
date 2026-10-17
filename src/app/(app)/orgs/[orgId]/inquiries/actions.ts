"use server";

import { revalidatePath } from "next/cache";
import { BODY_MAX, cleanBody } from "@/lib/inquiries";
import { orgReply } from "@/lib/inquiries-server";
import { membersAdmin } from "@/lib/members-server";

// "שליחת תשובה", "הערה פנימית" and "סגירת הפנייה" (board D-AdmInquiry). The owner, admins and the treasurer
// handle inquiries, as they send messages.
export async function answerInquiry(orgId: string, id: string, input: { body: string; internal: boolean; close: boolean }): Promise<{ error?: string; ok?: string }> {
    const a = await membersAdmin(orgId);
    if (!a) return { error: "אין לכם הרשאה לענות לפניות בארגון הזה." };
    const body = cleanBody(input.body);
    if ([...body].length > BODY_MAX) return { error: `התשובה ארוכה מ-${BODY_MAX} תווים.` };
    if (!body && !input.close) return { error: input.internal ? "כתבו את ההערה." : "כתבו תשובה." };
    const r = await orgReply({ orgId, orgName: a.org.name, id, authorId: a.userId, body, internal: input.internal, close: input.close });
    if (r.error) return r;
    revalidatePath(`/orgs/${orgId}`, "layout");
    revalidatePath(`/card/${orgId}`, "layout");
    return { ok: input.close ? "הפנייה נסגרה." : input.internal ? "ההערה נשמרה." : "התשובה נשלחה." };
}
