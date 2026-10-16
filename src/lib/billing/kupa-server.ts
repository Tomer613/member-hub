import { db } from "@/lib/db";
import { chargeView } from "@/lib/billing/account";
import { kindLabel, type Movement } from "@/lib/billing/charge-plan";
import { chargeInclude, toChargeIn } from "@/lib/billing/member-money";

const nameOf = (m: { firstName: string; lastName: string } | null, fallback: string | null) => (m ? `${m.firstName} ${m.lastName}`.trim() : fallback) || "חבר/ה";

// "תנועות בקופה" (board D-AdmKupa). Money in is every payment that went through. Paid in the app it is
// "בדרך" until the provider transfers it; recorded by hand or confirmed from a report it is "נקלט". Money
// out (withdrawals, refunds, paying suppliers) waits for the provider (docs/waiting-for-services.he.md).
export async function loadMovements(orgId: string, take = 300): Promise<Movement[]> {
    const pays = await db.payment.findMany({
        where: { orgId, status: "succeeded" },
        include: { member: { select: { firstName: true, lastName: true } }, allocations: { include: { charge: { select: { description: true, kind: true } } } } },
        orderBy: { receivedAt: "desc" },
        take,
    });
    return pays.map((p) => {
        const c = p.allocations[0]?.charge;
        const more = p.allocations.length > 1 ? ` ועוד ${p.allocations.length - 1}` : "";
        return {
            id: p.id,
            at: p.receivedAt,
            what: c ? `${kindLabel(c.kind)} · ${c.description}${more}` : "תשלום",
            who: nameOf(p.member, p.payerName),
            amountMinor: p.amountMinor,
            dir: "in" as const,
            status: p.source === "app" ? ("בדרך" as const) : ("נקלט" as const),
        };
    });
}

// The four numbers at the top of the page. Until a payment provider is connected nothing is transferred into
// the org's balance: what members paid in the app stays "בדרך לקופה".
export async function kupaNumbers(orgId: string) {
    const [inApp, charges] = await Promise.all([
        db.payment.aggregate({ where: { orgId, status: "succeeded", source: "app" }, _sum: { amountMinor: true } }),
        db.charge.findMany({ where: { orgId, voidedAt: null }, include: chargeInclude }),
    ]);
    const now = new Date();
    let owed = 0;
    const owers = new Set<string>();
    for (const c of charges) {
        const v = chargeView(toChargeIn(c));
        // A charge whose date has not come yet is not a debt (board D-MemberFinance).
        if (!v || v.state !== "open" || v.due > now) continue;
        owed += v.leftMinor;
        owers.add(c.memberId ?? c.householdId ?? c.id);
    }
    return { balanceMinor: 0, availableMinor: 0, transitMinor: inApp._sum.amountMinor ?? 0, owedMinor: owed, owers: owers.size };
}
