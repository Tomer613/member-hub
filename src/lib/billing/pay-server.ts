import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { onColor } from "@/lib/color";
import { initialOf } from "@/lib/org-setup";
import { ensureMember } from "@/lib/billing/member-money";
import type { OrgLook } from "@/components/pay/parts";

// Who is paying, in which org, and how that org looks. Null when this person has no card there.
export async function payer(orgId: string) {
    const session = await getSession();
    if (!session) return null;
    const link = await db.orgUser.findUnique({ where: { orgId_userId: { orgId, userId: session.userId } }, include: { org: true, user: { include: { contacts: true } } } });
    if (!link || link.org.status === "setup" || link.org.packId === "celebration" || link.role === "guest" || !["active", "left_with_debt"].includes(link.status)) return null;
    const member = await ensureMember(link.id);
    return { userId: session.userId, link, org: link.org, member, look: orgLook(link.org, link.cardColor) };
}

export function orgLook(org: { name: string; brandColor: string | null }, cardColor?: string | null): OrgLook {
    const color = cardColor ?? org.brandColor ?? "#5B3DF5";
    return { name: org.name, letter: initialOf(org.name) || "?", color, fg: onColor(color) };
}

export const emailOf = (contacts: { kind: string; value: string; isPrimary: boolean }[]) =>
    contacts.filter((c) => c.kind === "email").sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))[0]?.value ?? null;
