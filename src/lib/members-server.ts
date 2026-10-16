import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { chargeView, type ChargeView } from "@/lib/billing/account";
import { chargeInclude, toChargeIn } from "@/lib/billing/member-money";
import { familyText, householdLine, localPhone, memberSince, reminderBlockedUntil, rowStatus, type RowFacts, type RowStatus } from "@/lib/members-admin";
import { roleLabel } from "@/lib/wallet";
import { getPack } from "@/packs";

// Who may open the member list: the owner, admins and the treasurer. Labels and removing a member stay with
// the owner and admins.
export async function membersAdmin(orgId: string) {
    const session = await getSession();
    if (!session) return null;
    const link = await db.orgUser.findFirst({ where: { orgId, userId: session.userId, role: { in: ["owner", "admin", "treasurer"] }, status: "active" }, include: { org: true, user: { select: { firstName: true, lastName: true } } } });
    if (!link || link.org.status !== "active" || link.org.packId === "celebration") return null;
    return { userId: session.userId, role: link.role, canManage: link.role !== "treasurer", org: link.org, me: link.user };
}

export type MemberRow = {
    key: string;
    linkId: string | null;
    requestId: string | null;
    memberId: string | null;
    name: string;
    home: string;
    role: string;
    facts: RowFacts;
    status: RowStatus;
    owedMinor: number; // past due and not disputed: what a reminder is about
    balanceMinor: number; // everything still open, disputed charges included
    paidYearMinor: number;
    since: string; // ISO
    sinceText: string;
    labels: { id: string; name: string; color: string }[];
    phone: string | null;
    email: string | null;
    address: string | null;
    family: string | null;
    extra: { label: string; value: string }[];
    disputes: number;
    remindAfter: string | null; // ISO, while the weekly limit holds
};

const today = () => new Date();
const yearStartIL = (now: Date) => new Date(`${new Intl.DateTimeFormat("en", { timeZone: "Asia/Jerusalem", year: "numeric" }).format(now)}-01-01T00:00:00+02:00`);
const monthStartIL = (now: Date) => {
    const [y, m] = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit" }).format(now).split("-");
    return new Date(`${y}-${m}-01T00:00:00+02:00`);
};

// Every member of the org with what the list and the member panel need, in a fixed number of queries.
export async function loadMemberRows(orgId: string, packId: string, onlyLinkId?: string): Promise<MemberRow[]> {
    const now = today();
    const pack = getPack(packId);
    const [links, pending, charges, payments, manualLabels, autoSubs, reminders] = await Promise.all([
        db.orgUser.findMany({
            where: { orgId, role: { not: "guest" }, status: { in: ["active", "left_with_debt"] }, ...(onlyLinkId ? { id: onlyLinkId } : {}) },
            include: {
                user: { select: { firstName: true, lastName: true, contacts: { select: { kind: true, value: true, isPrimary: true } } } },
                member: { include: { householdLinks: { where: { OR: [{ endsOn: null }, { endsOn: { gte: now } }] }, include: { household: { include: { members: { where: { OR: [{ endsOn: null }, { endsOn: { gte: now } }] }, select: { isPayer: true } } } } }, orderBy: [{ isHead: "desc" }, { isPayer: "desc" }, { createdAt: "asc" }] } } },
            },
            orderBy: { createdAt: "asc" },
        }),
        onlyLinkId ? [] : db.joinRequest.findMany({ where: { orgId, status: "pending" }, include: { user: { select: { firstName: true, lastName: true, contacts: { select: { kind: true, value: true, isPrimary: true } } } } }, orderBy: { createdAt: "asc" } }),
        db.charge.findMany({ where: { orgId, voidedAt: null }, include: { ...chargeInclude, disputes: { where: { status: "open" }, select: { id: true } } } }),
        db.payment.groupBy({ by: ["memberId"], where: { orgId, status: "succeeded", receivedAt: { gte: yearStartIL(now) }, memberId: { not: null } }, _sum: { amountMinor: true } }),
        db.memberLabel.findMany({ where: { orgId, label: { assignment: "manual" } }, include: { label: { select: { id: true, name: true, color: true } } }, orderBy: { since: "desc" } }),
        db.subscription.findMany({ where: { orgId, status: "active", memberId: { not: null }, plan: { labels: { some: { assignment: "auto_plan" } } } }, include: { plan: { include: { labels: { where: { assignment: "auto_plan" }, select: { id: true, name: true, color: true } } } } } }),
        db.debtReminder.groupBy({ by: ["memberId"], where: { orgId }, _max: { sentAt: true } }),
    ]);

    const views = charges.map((c) => ({ c, v: chargeView(toChargeIn(c)) }));
    const ilToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(now);
    const paidYear = new Map(payments.map((p) => [p.memberId!, p._sum.amountMinor ?? 0]));
    const lastReminder = new Map(reminders.map((r) => [r.memberId, r._max.sentAt]));
    const labelsOf = new Map<string, MemberRow["labels"]>();
    const addLabel = (memberId: string, l: { id: string; name: string; color: string }) => {
        const list = labelsOf.get(memberId) ?? [];
        if (!list.some((x) => x.id === l.id)) list.push(l);
        labelsOf.set(memberId, list);
    };
    for (const m of manualLabels) addLabel(m.memberId, m.label);
    for (const s of autoSubs) for (const l of s.plan.labels) addLabel(s.memberId!, l);

    const rows: MemberRow[] = links.map((link) => {
        const m = link.member;
        const contact = (kind: string) => link.user.contacts.find((c) => c.kind === kind && c.isPrimary)?.value ?? link.user.contacts.find((c) => c.kind === kind)?.value ?? null;
        const hidden = new Set(link.hiddenFields);
        const homes = m?.householdLinks ?? [];
        const payerHomes = new Set(homes.filter((h) => h.isPayer).map((h) => h.householdId));
        const mine = views.filter(({ c }) => (m && c.memberId === m.id) || (c.householdId && payerHomes.has(c.householdId)));
        let owed = 0;
        let balance = 0;
        let disputes = 0;
        for (const { c, v } of mine) {
            if (!v || v.state !== "open") continue;
            balance += v.leftMinor;
            if (c.disputes.length) disputes++;
            // A debt only once its last day to pay has passed (as in the kupa and the member's "כספים").
            else if (v.due.toISOString().slice(0, 10) < ilToday) owed += v.leftMinor;
        }
        const home = homes[0] ?? null;
        const name = `${m?.firstName || link.user.firstName || ""} ${m?.lastName || link.user.lastName || ""}`.trim() || "חבר/ה";
        const facts: RowFacts = { kind: "member", linkStatus: link.status, owedMinor: owed, disputes };
        const address = [m?.street, m?.city].filter(Boolean).join(", ") || null;
        const fields = (m?.customFields ?? {}) as Record<string, unknown>;
        const extra = pack.customFields
            .filter((f) => f.entity === "member" && fields[f.key] !== undefined && fields[f.key] !== null && fields[f.key] !== "")
            .map((f) => ({ label: f.label, value: f.options?.find((o) => o.value === fields[f.key])?.label ?? (typeof fields[f.key] === "boolean" ? (fields[f.key] ? "כן" : "לא") : String(fields[f.key])) }));
        const blocked = m ? reminderBlockedUntil(lastReminder.get(m.id) ?? null, now) : null;
        return {
            key: link.id,
            linkId: link.id,
            requestId: null,
            memberId: m?.id ?? null,
            name,
            home: householdLine(home ? { label: home.household.label, relation: home.relation, isHead: home.isHead, isPayer: home.isPayer } : null, packId),
            role: roleLabel(link.role, packId),
            facts,
            status: rowStatus(facts),
            owedMinor: owed,
            balanceMinor: balance,
            paidYearMinor: m ? paidYear.get(m.id) ?? 0 : 0,
            since: link.createdAt.toISOString(),
            sinceText: memberSince(link.createdAt, now),
            labels: m ? labelsOf.get(m.id) ?? [] : [],
            phone: hidden.has("phone") ? null : localPhone(m?.phone ?? contact("phone")),
            email: hidden.has("email") ? null : m?.email ?? contact("email"),
            address: hidden.has("address") ? null : address,
            family: home ? familyText(home.household.members.length, home.household.members.filter((x) => x.isPayer).length) : null,
            extra,
            disputes,
            remindAfter: blocked?.toISOString() ?? null,
        };
    });
    for (const p of pending) {
        const facts: RowFacts = { kind: "pending", linkStatus: "", owedMinor: 0, disputes: 0 };
        rows.push({
            key: p.id,
            linkId: null,
            requestId: p.id,
            memberId: null,
            name: `${p.user.firstName ?? ""} ${p.user.lastName ?? ""}`.trim() || "מבקש/ת",
            home: "בקשת הצטרפות",
            role: "",
            facts,
            status: "pending",
            owedMinor: 0,
            balanceMinor: 0,
            paidYearMinor: 0,
            since: p.createdAt.toISOString(),
            sinceText: memberSince(p.createdAt, now),
            labels: [],
            // Contact details are shared with the org only once the request is approved.
            phone: null,
            email: null,
            address: null,
            family: null,
            extra: [],
            disputes: 0,
            remindAfter: null,
        });
    }
    return rows;
}

// The five numbers above the list (board D-AdmOverview style).
export async function memberMetrics(orgId: string, rows: MemberRow[]) {
    const now = today();
    const [collected, inquiries] = await Promise.all([
        db.payment.aggregate({ where: { orgId, status: "succeeded", receivedAt: { gte: monthStartIL(now) } }, _sum: { amountMinor: true } }),
        db.request.count({ where: { orgId, status: "pending" } }),
    ]);
    return {
        active: rows.filter((r) => r.facts.kind === "member" && r.facts.linkStatus === "active").length,
        collectedMinor: collected._sum.amountMinor ?? 0,
        owedMinor: rows.reduce((t, r) => t + r.balanceMinor, 0),
        inquiries,
        joins: rows.filter((r) => r.facts.kind === "pending").length,
    };
}

// The member's charges for the member file, newest first, with any open dispute.
export type FileCharge = ChargeView & { createdAt: string; disputeId: string | null; disputeReason: string | null; disputeSide: string | null };
export async function fileCharges(orgId: string, memberId: string): Promise<FileCharge[]> {
    const now = today();
    const homes = await db.householdMember.findMany({ where: { orgId, memberId, isPayer: true, OR: [{ endsOn: null }, { endsOn: { gte: now } }] }, select: { householdId: true } });
    const rows = await db.charge.findMany({
        where: { orgId, voidedAt: null, OR: [{ memberId }, ...(homes.length ? [{ householdId: { in: homes.map((h) => h.householdId) } }] : [])] },
        include: { ...chargeInclude, disputes: { where: { status: "open" }, select: { id: true, reason: true, openedBySide: true }, take: 1 } },
        orderBy: { createdAt: "desc" },
    });
    return rows.flatMap((c) => {
        const v = chargeView(toChargeIn(c));
        const d = c.disputes[0] ?? null;
        return v ? [{ ...v, createdAt: c.createdAt.toISOString(), disputeId: d?.id ?? null, disputeReason: d?.reason ?? null, disputeSide: d?.openedBySide ?? null }] : [];
    });
}

// Phones and emails the org already has: its members (with a login, or listed from a file) and people with an
// invitation still open. The import marks them "כבר חברים" and does not invite them twice.
export async function knownContacts(orgId: string) {
    const [links, listed, pending] = await Promise.all([
        db.orgUser.findMany({ where: { orgId, status: { in: ["active", "left_with_debt"] } }, select: { user: { select: { contacts: { select: { kind: true, value: true } } } }, member: { select: { phone: true, email: true } } } }),
        db.member.findMany({ where: { orgId, orgUser: null, OR: [{ phone: { not: null } }, { email: { not: null } }] }, select: { phone: true, email: true } }),
        db.invitation.findMany({ where: { orgId, status: "pending", expiresAt: { gt: new Date() } }, select: { kind: true, value: true } }),
    ]);
    const phones = new Set<string>();
    const emails = new Set<string>();
    for (const l of links) {
        for (const c of l.user.contacts) (c.kind === "phone" ? phones : emails).add(c.value);
        if (l.member?.phone) phones.add(l.member.phone);
        if (l.member?.email) emails.add(l.member.email);
    }
    return {
        members: { phones: [...phones], emails: [...emails] },
        listed: { phones: listed.flatMap((m) => (m.phone ? [m.phone] : [])), emails: listed.flatMap((m) => (m.email ? [m.email] : [])) },
        pending: { phones: pending.filter((p) => p.kind === "phone").map((p) => p.value), emails: pending.filter((p) => p.kind === "email").map((p) => p.value) },
    };
}
