import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { AdminShell } from "@/components/admin/admin-shell";
import { onColor } from "@/lib/color";
import { heldLabels } from "@/lib/labels-server";
import { fileCharges, loadMemberRows, membersAdmin } from "@/lib/members-server";
import { initial } from "@/lib/members-admin";
import { getPack } from "@/packs";
import { MemberFile } from "./member-file";

export const metadata: Metadata = { title: "תיק חבר · PIRI" };

// The member file (board D-AdmMember): a band in the org's color with the open states, then details and
// labels, charges and payments, and the actions.
export default async function MemberFilePage({ params, searchParams }: {
    params: Promise<{ orgId: string; linkId: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { orgId, linkId } = await params;
    const sp = await searchParams;
    if (!(await getSession())) redirect("/login");
    const a = await membersAdmin(orgId);
    if (!a) notFound();
    const r = (await loadMemberRows(orgId, a.org.packId, linkId))[0];
    if (!r) notFound();
    const pack = getPack(a.org.packId);
    const link = await db.orgUser.findUniqueOrThrow({ where: { id: linkId }, select: { role: true, userId: true } });
    const [charges, held, manual, plans, subs] = await Promise.all([
        r.memberId ? fileCharges(orgId, r.memberId) : [],
        r.memberId ? heldLabels(orgId, r.memberId, false) : [],
        db.membershipLabel.findMany({ where: { orgId, assignment: "manual" }, select: { id: true, name: true, color: true }, orderBy: { name: "asc" } }),
        db.plan.findMany({ where: { orgId, isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
        r.memberId
            ? db.subscription.findMany({ where: { orgId, status: { in: ["active", "frozen"] }, OR: [{ memberId: r.memberId }, { household: { members: { some: { memberId: r.memberId, isPayer: true, endsOn: null } } } }] }, include: { plan: { select: { name: true } } }, orderBy: { startsOn: "desc" }, take: 1 })
            : [],
    ]);
    const sub = subs[0] ?? null;
    const color = a.org.brandColor ?? "#5B3DF5";
    const on = onColor(color);
    const year = new Intl.DateTimeFormat("en", { timeZone: "Asia/Jerusalem", year: "numeric" }).format(new Date(r.since));
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
    return (
        <AdminShell orgId={orgId} org={a.org} me={{ ...a.me, role: a.role }} active="members">
            <nav aria-label="מיקום" className="text-[14px] font-bold"><Link href={`/orgs/${orgId}/members`} className="underline">חברים</Link> <span aria-hidden="true">‹</span> {r.name}</nav>
            <header className="flex flex-wrap items-center gap-4 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] p-4 shadow-[0_3px_0_var(--mh-ink)]" style={{ background: color, color: on }}>
                <span className="grid h-[60px] w-[60px] shrink-0 place-items-center rounded-full border-[2.5px] border-[var(--mh-ink)] bg-white font-display text-[28px] text-[var(--mh-ink)]" aria-hidden="true">{initial(r.name)}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <h1 className="m-0 font-display text-[clamp(24px,2.4vw,30px)] leading-tight">{r.name}</h1>
                    <span className="text-[14px] font-bold">{r.home}{link.role !== "member" ? ` · ${r.role}` : ""} · חבר מאז {year}</span>
                </span>
                <span className="flex flex-wrap gap-2">
                    {r.owedMinor > 0 && <span className="inline-flex min-h-6 items-center rounded-[12px] border-2 border-[var(--mh-ink)] bg-[var(--mh-sun)] px-2 text-[12.5px] font-extrabold text-[var(--mh-ink)]">חוב פתוח</span>}
                    {r.disputes > 0 && <span className="inline-flex min-h-6 items-center rounded-[12px] border-2 border-[var(--mh-ink)] bg-[#CFF0FC] px-2 text-[12.5px] font-extrabold text-[var(--mh-ink)]">מחלוקת על חיוב</span>}
                    {r.status === "left_debt" && <span className="inline-flex min-h-6 items-center rounded-[12px] border-2 border-[var(--mh-ink)] bg-[#FFDCD3] px-2 text-[12.5px] font-extrabold text-[var(--mh-ink)]">עזב עם חוב</span>}
                    {sub?.status === "frozen" && <span className="inline-flex min-h-6 items-center rounded-[12px] border-2 border-[var(--mh-ink)] bg-[#E3DDFF] px-2 text-[12.5px] font-extrabold text-[var(--mh-ink)]">מנוי מוקפא</span>}
                </span>
            </header>
            <MemberFile
                orgId={orgId}
                linkId={linkId}
                r={r}
                charges={charges}
                held={held.map((l) => ({ id: l.id, name: l.name, color: l.color, how: l.how, plan: l.plan, since: l.since.toISOString() }))}
                manual={manual}
                plans={plans}
                plan={sub ? { name: sub.plan.name, planId: sub.planId, frozen: sub.status === "frozen", until: sub.frozenUntil?.toISOString().slice(0, 10) ?? null } : null}
                canFreeze={pack.modules.includes("freeze")}
                canManage={a.canManage}
                removable={a.canManage && r.status !== "left_debt" && link.role !== "owner" && link.userId !== a.userId}
                today={today}
                startDispute={sp.dispute === "1"}
            />
        </AdminShell>
    );
}
