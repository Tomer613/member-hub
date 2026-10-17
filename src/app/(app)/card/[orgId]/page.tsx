import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { onColor } from "@/lib/color";
import { initialOf } from "@/lib/org-setup";
import { badgeWords, crowdText, roleLabel } from "@/lib/wallet";
import { Badge, type TileView } from "@/components/wallet/badge";
import { memberInquiryCounts } from "@/lib/inquiries-server";
import { openActivityCount } from "@/lib/activities-server";
import { accountShown, moneySummary, moneyTileText, nextLine, nextRenewal, noticeText } from "@/lib/billing/account";
import { currentHome, ensureMember, memberCharges } from "@/lib/billing/member-money";
import { formatShekels } from "@/lib/money";
import { heldLabels } from "@/lib/labels-server";
import { grantedText, newestFirst } from "@/lib/labels";
import { unreadMessages } from "@/lib/messages-server";

export const metadata: Metadata = { title: "כרטיס חבר · PIRI" };

// The member card (approved boards D-Badge, D-BadgeBack, D-BadgeFlip): the card on its lanyard, and on its
// back the entry code that changes every minute. Below it: what waits, the tiles, and the main action.
export default async function CardPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    const session = await getSession();
    if (!session) redirect(`/login?next=/card/${orgId}`);
    const link = await db.orgUser.findUnique({ where: { orgId_userId: { orgId, userId: session.userId } }, include: { org: true, user: { select: { firstName: true, lastName: true } } } });
    if (!link || link.org.status === "setup" || !["active", "left_with_debt"].includes(link.status)) notFound();
    const org = link.org;
    // A celebration has an invitation instead of a member card.
    if (org.packId === "celebration") redirect(link.role === "guest" && org.joinToken ? `/c/${org.joinToken}` : `/orgs/${org.id}`);
    const admin = link.role === "owner" || link.role === "admin";
    const member = await ensureMember(link.id);
    const [count, requests, charges, sub, home, labels, unread, asked, acts] = await Promise.all([
        db.orgUser.count({ where: { orgId, status: "active", role: { not: "guest" } } }),
        admin ? db.joinRequest.count({ where: { orgId, status: "pending" } }) : Promise.resolve(0),
        memberCharges(orgId, member.id),
        db.subscription.findFirst({ where: { orgId, memberId: member.id, status: "active" }, include: { plan: true }, orderBy: { startsOn: "asc" } }),
        org.packId === "hoa" ? currentHome(orgId, member.id) : Promise.resolve(null),
        heldLabels(orgId, member.id, true),
        unreadMessages(orgId, session.userId),
        memberInquiryCounts(orgId, session.userId),
        openActivityCount(orgId, session.userId),
    ]);
    const money = moneySummary(charges);
    const notice = noticeText(money);
    const tiles: TileView[] = [{ kind: "money", href: `/card/${org.id}/money`, label: "כספים", sub: moneyTileText(money) }];
    tiles.push({ kind: "messages", href: `/card/${org.id}/messages`, label: "הודעות", sub: unread === 1 ? "הודעה אחת חדשה" : unread > 1 ? `${unread} הודעות חדשות` : "מה ההנהלה כתבה" });
    tiles.push({ kind: "activities", href: `/card/${org.id}/activities`, label: "פעילויות", sub: acts.mine === 1 ? "נרשמתם לפעילות אחת" : acts.mine > 1 ? `נרשמתם ל-${acts.mine} פעילויות` : acts.coming === 1 ? "פעילות אחת בקרוב" : acts.coming > 1 ? `${acts.coming} פעילויות בקרוב` : "מה קורה בארגון" });
    tiles.push({ kind: "inquiries", href: `/card/${org.id}/inquiries`, label: "פניות", sub: asked.answered === 1 ? "תשובה אחת חדשה" : asked.answered > 1 ? `${asked.answered} תשובות חדשות` : asked.open === 1 ? "פנייה אחת פתוחה" : asked.open > 1 ? `${asked.open} פניות פתוחות` : "שאלה או בקשה להנהלה" });
    if (admin) tiles.push({ kind: "manage", href: `/orgs/${org.id}`, label: "ניהול הארגון", sub: requests === 1 ? "בקשת הצטרפות אחת" : requests > 1 ? `${requests} בקשות הצטרפות` : "סקירה, חיובים ובקשות" });
    const color = link.cardColor ?? org.brandColor ?? "#5B3DF5";
    const words = badgeWords(org.packId);
    const joined = link.createdAt;
    return (
        <Badge
            orgId={org.id}
            orgName={org.name}
            letter={initialOf(org.name) || "?"}
            logo={org.logoUrl}
            color={color}
            fg={onColor(color)}
            role={roleLabel(link.role, org.packId)}
            memberName={`${link.user.firstName ?? ""} ${link.user.lastName ?? ""}`.trim() || "החבר/ה"}
            joined={`הצטרפות ב-${joined.getDate()}.${joined.getMonth() + 1}.${joined.getFullYear()}`}
            sinceWord={words.since}
            sinceYear={String(joined.getFullYear())}
            crowd={crowdText(count, words.people)}
            account={accountShown(org.packId, home, member.number)}
            next={nextLine(org.packId, money, sub ? nextRenewal(sub.startsOn, sub.plan.interval, new Date()) : null)}
            canEnter={link.status === "active"}
            notice={notice ? { text: notice, href: money.openMinor > 0 ? `/pay/${org.id}` : `/card/${org.id}/money` } : null}
            tiles={tiles}
            labels={newestFirst(labels).map((l) => ({ id: l.id, name: l.name, color: l.color, granted: grantedText(l) }))}
            pay={money.openMinor > 0 ? { label: `לתשלום ${formatShekels(money.openMinor)}`, href: `/pay/${org.id}` } : null}
        />
    );
}
