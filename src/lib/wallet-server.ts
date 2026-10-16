import { db } from "@/lib/db";
import { onColor } from "@/lib/color";
import { initialOf } from "@/lib/org-setup";
import { amountOwed, celebrationStage, formatShekels, formatWhen, readCelebration, stillOwes, totals, type Stage } from "@/lib/celebration";
import { ilShortDate, memberNumber, moneySummary } from "@/lib/billing/account";
import { currentHome, memberCharges, settleLeaver } from "@/lib/billing/member-money";
import { heldLabels } from "@/lib/labels-server";
import { openCounts } from "@/lib/notify-server";
import { walletLabel } from "@/lib/labels";
import { arrange, groupOf, inOrg, readSortMode, roleLabel, type SortMode } from "@/lib/wallet";
import type { CardView } from "@/components/wallet/wallet-stack";

const ANSWER: Record<string, string> = { yes: "מגיעים", maybe: "אולי", no: "לא מגיעים" };

// "locked": a member who left with a debt keeps the card in the wallet until it is paid (ux-spec 7).
export type WalletItem = { view: CardView; current: boolean; pinned: boolean; orgId: string; locked: boolean };

// Everything the wallet and "סידור הארנק" show: the cards in the member's chosen order, what is waiting,
// and how many cards sit in the archive.
export async function loadWallet(userId: string, now: Date) {
    const user = await db.user.findUniqueOrThrow({
        where: { id: userId },
        include: {
            contacts: true,
            orgUsers: { where: { OR: [{ status: "active", hiddenAt: null }, { status: "left_with_debt" }], deletedAt: null, org: { status: { not: "setup" } } }, include: { org: true, member: { select: { number: true } } } },
        },
    });
    const mode: SortMode = readSortMode(user.preferences);
    const links = user.orgUsers;
    const archived = await db.orgUser.count({
        where: { userId, deletedAt: null, org: { status: { not: "setup" } }, status: { not: "left_with_debt" }, OR: [{ hiddenAt: { not: null } }, { status: { in: ["left", "suspended"] } }] },
    });

    const celebrationIds = links.filter((m) => m.org.packId === "celebration").map((m) => m.orgId);
    const rows = celebrationIds.length ? await db.rsvp.findMany({ where: { orgId: { in: celebrationIds } } }) : [];
    const managed = links.filter((m) => m.org.packId !== "celebration" && (m.role === "owner" || m.role === "admin")).map((m) => m.orgId);
    const requests = managed.length ? await db.joinRequest.groupBy({ by: ["orgId"], where: { orgId: { in: managed }, status: "pending" }, _count: true }) : [];
    const waiting: string[] = [];
    const notes = await openCounts(userId);

    const built = await Promise.all(
        links.map(async (m) => {
            const org = m.org;
            const color = m.cardColor ?? org.brandColor ?? "#5B3DF5";
            const view: CardView = {
                id: m.id,
                href: `/card/${org.id}`,
                name: org.name,
                color,
                fg: onColor(color),
                logo: org.logoUrl,
                letter: initialOf(org.name) || "?",
                role: roleLabel(m.role, org.packId),
                status: "פעיל",
                money: false,
                start: m.member?.number ? `מס׳ חבר ${memberNumber(m.member.number)}` : (org.city ?? ""),
                end: `מאז ${m.createdAt.getFullYear()}`,
                group: groupOf(org.packId, m.walletGroup),
            };
            const bell = notes.byOrg.get(org.id) ?? 0;
            if (bell > 0) view.bell = { count: bell, href: `/notifications?org=${org.id}` };
            let lastActivity = m.createdAt;
            let attention = false;
            let current = true;
            if (org.packId === "celebration") {
                const c = readCelebration(org.settings);
                const own = rows.filter((r) => r.orgId === org.id);
                const mine = own.find((r) => r.userId === userId) ?? null;
                const organizer = m.role === "owner" || m.role === "admin";
                const stage: Stage = celebrationStage(c, org.status, own, now);
                const owes = !organizer && stillOwes(c.money, mine) && mine ? amountOwed(c.money, mine.people, mine.kids) : null;
                view.href = m.role === "guest" ? (org.joinToken ? `/c/${org.joinToken}` : null) : `/orgs/${org.id}`;
                view.start = [formatWhen(c.startsAt), c.city].filter(Boolean).join(" · ");
                view.end = "";
                for (const r of own) if (r.updatedAt > lastActivity) lastActivity = r.updatedAt;
                if (owes && mine?.paid !== "claimed") {
                    view.status = `נשאר לשלם ${formatShekels(owes)}`;
                    view.money = attention = true;
                    waiting.push(`נשאר לשלם ${formatShekels(owes)} ${inOrg(org.name)}`);
                } else if (owes) {
                    view.status = "התשלום מחכה לאישור";
                } else if (stage !== "upcoming") {
                    view.status = stage === "closed" ? "נסגרה" : "עברה";
                } else if (organizer) {
                    const t = totals(own);
                    view.status = t.coming === 1 ? "מגיע אחד" : `${t.coming} מגיעים`;
                    if (t.claimed > 0) {
                        attention = true;
                        waiting.push(`${t.claimed === 1 ? "תשלום אחד מחכה" : `${t.claimed} תשלומים מחכים`} לאישור ${inOrg(org.name)}`);
                    }
                } else {
                    view.status = mine ? ANSWER[mine.status] ?? null : "עוד בלי תשובה";
                }
                // Celebrations a week after the event fold into "חגיגות שהיו" (14.10.2026), except for a guest
                // who still owes.
                current = stage === "upcoming" || !!owes;
            } else {
                const home = org.packId === "hoa" && m.memberId ? await currentHome(org.id, m.memberId) : null;
                if (home) view.start = `דירה ${home}`;
                if (m.memberId && m.role !== "guest") view.label = walletLabel(await heldLabels(org.id, m.memberId, true));
                if (m.memberId && m.role !== "guest") {
                    const charges = await memberCharges(org.id, m.memberId);
                    const money = moneySummary(charges);
                    if (m.status === "left_with_debt") {
                        // Left, but the debt keeps the card in the wallet, clearly marked, until it is paid.
                        // Paid in the meantime (e.g. by the other payer of the flat): the card goes to the archive.
                        if (money.openMinor === 0) {
                            await settleLeaver(org.id, m.memberId);
                            return null;
                        }
                        view.status = `עזבת · יתרה ${formatShekels(money.openMinor)}`;
                        view.left = view.money = attention = true;
                        view.end = m.leftAt ? `עזבת ב-${ilShortDate(m.leftAt)}` : "";
                        waiting.push(`${formatShekels(money.openMinor)} לתשלום ${inOrg(org.name)}, מהתקופה שהייתם חברים`);
                    } else if (money.openMinor > 0) {
                        view.status = `יתרה ${formatShekels(money.openMinor)}`;
                        view.money = attention = true;
                        waiting.push(`${formatShekels(money.openMinor)} לתשלום ${inOrg(org.name)}`);
                    }
                    const last = await db.payment.findFirst({ where: { orgId: org.id, memberId: m.memberId }, orderBy: { receivedAt: "desc" }, select: { receivedAt: true } });
                    if (last && last.receivedAt > lastActivity) lastActivity = last.receivedAt;
                }
                const n = requests.find((r) => r.orgId === org.id)?._count ?? 0;
                if (n > 0 && m.status === "active") {
                    attention = true;
                    if (!view.money) view.status = n === 1 ? "בקשה אחת מחכה" : `${n} בקשות מחכות`;
                    waiting.push(`${n === 1 ? "בקשת הצטרפות אחת מחכה" : `${n} בקשות הצטרפות מחכות`} ${inOrg(org.name)}`);
                }
            }
            return { view, current, pinned: m.isPinned, orgId: org.id, locked: m.status === "left_with_debt", sort: { isPinned: m.isPinned, walletOrder: m.walletOrder, createdAt: m.createdAt, name: org.name, lastActivity, attention } };
        }),
    );
    const items: WalletItem[] = arrange(built.filter((b) => b !== null).map((b) => ({ ...b.sort, b })), mode).map((x) => x.b);
    return { user, mode, items, waiting, archived: archived + built.filter((b) => b === null).length, notes: notes.actions };
}
