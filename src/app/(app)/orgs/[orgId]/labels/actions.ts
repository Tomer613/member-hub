"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { cleanLabelName, isLabelColor, LABEL_COLORS } from "@/lib/labels";
import { ensureMember } from "@/lib/billing/member-money";
import { notifyUsers } from "@/lib/notify-server";

// The org's labels (board D-AdmLabels). Only the owner and admins manage them.
async function labelAdmin(orgId: string) {
    const session = await getSession();
    if (!session) return null;
    const link = await db.orgUser.findFirst({ where: { orgId, userId: session.userId, role: { in: ["owner", "admin"] }, status: "active" }, include: { org: true } });
    if (!link || link.org.status !== "active" || link.org.packId === "celebration") return null;
    return { userId: session.userId };
}

const done = (orgId: string) => {
    revalidatePath(`/orgs/${orgId}/labels`);
    revalidatePath("/wallet");
};

export type LabelFormState = { error?: string; saved?: string; name?: string; color?: string; visibility?: string; assignment?: string; planId?: string };

export async function saveLabel(_prev: LabelFormState, form: FormData): Promise<LabelFormState> {
    const orgId = String(form.get("orgId") ?? "");
    const id = String(form.get("id") ?? "");
    const name = cleanLabelName(form.get("name"));
    const color = String(form.get("color") ?? "");
    const visibility = form.get("visibility") === "admins" ? "admins" : "all";
    const assignment = form.get("assignment") === "auto_plan" ? "auto_plan" : "manual";
    const planId = String(form.get("planId") ?? "");
    const values = { name, color, visibility, assignment, planId };
    const a = await labelAdmin(orgId);
    if (!a) return { ...values, error: "אין לכם הרשאה לנהל תוויות בארגון הזה." };
    if (!name) return { ...values, error: "כתבו שם לתווית." };
    if (!isLabelColor(color)) return { ...values, color: LABEL_COLORS[0], error: "בחרו צבע." };
    let plan: string | null = null;
    if (assignment === "auto_plan") {
        const p = await db.plan.findFirst({ where: { id: planId, orgId, isActive: true }, select: { id: true } });
        if (!p) return { ...values, error: "בחרו את המסלול שמעניק את התווית." };
        plan = p.id;
    }
    const data = { name, color, visibility, assignment, planId: plan };
    try {
        if (id) {
            const r = await db.membershipLabel.updateMany({ where: { id, orgId }, data });
            if (!r.count) return { ...values, error: "התווית כבר לא קיימת." };
            // Turning a label automatic leaves the hand-given holders aside, not deleted: they come back if
            // it is turned manual again.
        } else {
            await db.membershipLabel.create({ data: { orgId, ...data } });
        }
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { ...values, error: "כבר יש תווית בשם הזה." };
        throw e;
    }
    done(orgId);
    return { saved: name };
}

export async function deleteLabel(orgId: string, id: string): Promise<void> {
    if (!(await labelAdmin(orgId))) return;
    await db.membershipLabel.deleteMany({ where: { id, orgId } });
    done(orgId);
}

// Gives a hand-given label to a member, by their link to the org.
export async function grantLabel(orgId: string, labelId: string, linkId: string): Promise<void> {
    const a = await labelAdmin(orgId);
    if (!a) return;
    const [label, link] = await Promise.all([
        db.membershipLabel.findFirst({ where: { id: labelId, orgId, assignment: "manual" } }),
        db.orgUser.findFirst({ where: { id: linkId, orgId, status: "active", role: { not: "guest" } } }),
    ]);
    if (!label || !link) return;
    const member = await ensureMember(link.id);
    const had = await db.memberLabel.findUnique({ where: { labelId_memberId: { labelId, memberId: member.id } } });
    if (had) return;
    await db.memberLabel.create({ data: { orgId, labelId, memberId: member.id, assignedById: a.userId } });
    if (label.visibility === "all" && link.userId !== a.userId) await notifyUsers([link.userId], { orgId, kind: "update", topic: "label", refId: label.id, text: `קיבלתם תווית חדשה: ${label.name}`, href: `/card/${orgId}` });
    done(orgId);
}

export async function revokeLabel(orgId: string, labelId: string, memberId: string): Promise<void> {
    if (!(await labelAdmin(orgId))) return;
    await db.memberLabel.deleteMany({ where: { orgId, labelId, memberId } });
    done(orgId);
}
