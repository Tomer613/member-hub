import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { chargeViews, moneySummary, type ChargeIn, type ChargeView } from "@/lib/billing/account";

// The Member record behind a login, made on first need (an org's founder has none yet), with its card
// number: the next free one in the org, given once.
export async function ensureMember(linkId: string): Promise<{ id: string; number: number }> {
    for (let attempt = 0; attempt < 5; attempt++) {
        const link = await db.orgUser.findUniqueOrThrow({ where: { id: linkId }, include: { member: true, user: { include: { contacts: true } } } });
        let member = link.member;
        if (!member) {
            const phone = link.user.contacts.find((c) => c.kind === "phone")?.value ?? null;
            const email = link.user.contacts.find((c) => c.kind === "email")?.value ?? null;
            member = await db.member.create({ data: { orgId: link.orgId, firstName: link.user.firstName ?? "", lastName: link.user.lastName ?? "", phone, email } });
            await db.orgUser.update({ where: { id: link.id }, data: { memberId: member.id } });
        }
        if (member.number) return { id: member.id, number: member.number };
        const top = await db.member.aggregate({ where: { orgId: link.orgId }, _max: { number: true } });
        try {
            const done = await db.member.update({ where: { id: member.id, number: null }, data: { number: (top._max.number ?? 0) + 1 } });
            return { id: done.id, number: done.number! };
        } catch (e) {
            // Someone took that number a moment ago; try the next one.
            if (!(e instanceof Prisma.PrismaClientKnownRequestError)) throw e;
        }
    }
    throw new Error("Could not give a member number");
}

// Charges the member pays: their own, and their household's when they are one of its payers today.
export async function memberChargeWhere(orgId: string, memberId: string): Promise<Prisma.ChargeWhereInput> {
    const today = new Date();
    const homes = await db.householdMember.findMany({
        where: { orgId, memberId, isPayer: true, OR: [{ endsOn: null }, { endsOn: { gte: today } }] },
        select: { householdId: true },
    });
    return { orgId, OR: [{ memberId }, ...(homes.length ? [{ householdId: { in: homes.map((h) => h.householdId) } }] : [])] };
}

export const chargeInclude = { allocations: { select: { amountMinor: true, payment: { select: { status: true } } } } } satisfies Prisma.ChargeInclude;
type ChargeRow = Prisma.ChargeGetPayload<{ include: typeof chargeInclude }>;
export const toChargeIn = (c: ChargeRow): ChargeIn => ({
    id: c.id,
    description: c.description,
    amountMinor: c.amountMinor,
    dueOn: c.dueOn,
    createdAt: c.createdAt,
    voidedAt: c.voidedAt,
    allocations: c.allocations.map((a) => ({ amountMinor: a.amountMinor, status: a.payment.status })),
    allowPartial: c.allowPartial,
    gift: !!c.pledgeId,
});

export async function memberCharges(orgId: string, memberId: string): Promise<ChargeView[]> {
    const rows = await db.charge.findMany({ where: await memberChargeWhere(orgId, memberId), include: chargeInclude, orderBy: { createdAt: "asc" } });
    return chargeViews(rows.map(toChargeIn));
}

// The next in-app receipt number in the org.
export async function nextReceiptNo(tx: Prisma.TransactionClient, orgId: string): Promise<number> {
    const top = await tx.payment.aggregate({ where: { orgId }, _max: { receiptNo: true } });
    return (top._max.receiptNo ?? 0) + 1;
}

// The member's current home in the org (a flat in a house committee), the one they head or pay for first.
export async function currentHome(orgId: string, memberId: string): Promise<string | null> {
    const today = new Date();
    const row = await db.householdMember.findFirst({
        where: { orgId, memberId, AND: [{ OR: [{ startsOn: null }, { startsOn: { lte: today } }] }, { OR: [{ endsOn: null }, { endsOn: { gte: today } }] }] },
        orderBy: [{ isHead: "desc" }, { isPayer: "desc" }, { createdAt: "asc" }],
        select: { household: { select: { label: true } } },
    });
    return row?.household.label ?? null;
}

// A member who left with a debt and has now paid it all (or the org cancelled it) has simply left: the card
// moves from the wallet to the archive (ux-spec 7).
export async function settleLeaver(orgId: string, memberId: string | null): Promise<void> {
    if (!memberId) return;
    const leavers = await db.orgUser.findMany({ where: { orgId, status: "left_with_debt", memberId }, select: { id: true } });
    if (!leavers.length) return;
    if (moneySummary(await memberCharges(orgId, memberId)).openMinor > 0) return;
    await db.orgUser.updateMany({ where: { id: { in: leavers.map((l) => l.id) }, status: "left_with_debt" }, data: { status: "left" } });
}

// A member the org listed from a file ("לייבא כרשימה בלבד") with this phone or email and no login yet: the person
// takes that record over when they join, so its household, plan and labels carry on.
export async function listedMember(orgId: string, phone: string | null, email: string | null): Promise<string | null> {
    const or = [...(phone ? [{ phone }] : []), ...(email ? [{ email }] : [])];
    if (!or.length) return null;
    const m = await db.member.findFirst({ where: { orgId, orgUser: null, OR: or }, orderBy: { createdAt: "asc" }, select: { id: true } });
    return m?.id ?? null;
}
