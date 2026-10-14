import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { hebrewAgo } from "@/lib/relative-time";
import { RequestList, type RequestRow } from "./request-list";

export const metadata: Metadata = { title: "בקשות הצטרפות · PIRI" };

const TABS = [
    { key: "pending", label: "ממתינות" },
    { key: "approved", label: "אושרו" },
    { key: "rejected", label: "נדחו" },
] as const;
type Tab = (typeof TABS)[number]["key"];

// Join requests (boards D-AdmRequests, D-MAdmRequests), first version: who asked, their phone and note,
// when, and approve / decline. Filters, tracks and labels on approval come with the member screens.
export default async function JoinRequestsPage({ params, searchParams }: {
    params: Promise<{ orgId: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { orgId } = await params;
    const sp = await searchParams;
    const tab: Tab = TABS.some((t) => t.key === sp.tab) ? (sp.tab as Tab) : "pending";
    const session = await getSession();
    if (!session) redirect("/login");
    const link = await db.orgUser.findFirst({
        where: { orgId, userId: session.userId, role: { in: ["owner", "admin"] }, status: "active" },
        include: { org: true },
    });
    if (!link || link.org.status !== "active") notFound();

    const [counts, rows] = await Promise.all([
        db.joinRequest.groupBy({ by: ["status"], where: { orgId }, _count: true }),
        db.joinRequest.findMany({
            where: { orgId, status: tab },
            include: { user: { include: { contacts: true } } },
            orderBy: { createdAt: tab === "pending" ? "asc" : "desc" },
            take: 200,
        }),
    ]);
    const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
    const now = new Date();
    const list: RequestRow[] = rows.map((r) => {
        const phone = r.user.contacts.find((c) => c.kind === "phone")?.value ?? null;
        return {
            id: r.id,
            name: [r.user.firstName, r.user.lastName].filter(Boolean).join(" ") || "בלי שם",
            phone: phone?.startsWith("+972") ? `0${phone.slice(4)}` : phone,
            note: r.message,
            when: hebrewAgo(tab === "pending" ? r.createdAt : (r.decidedAt ?? r.createdAt), now),
            adminNote: r.adminNotes,
        };
    });

    return (
        <main className="min-h-dvh bg-[var(--mh-sun)]">
            <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-4 px-[clamp(12px,3vw,32px)] py-[clamp(14px,2.5vw,28px)]">
                <header className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link href={`/orgs/${orgId}`} aria-label="חזרה לסקירה" className="inline-flex h-12 w-12 items-center justify-center rounded-full border-[2.5px] border-[var(--mh-ink)] bg-white shadow-[var(--mh-shadow)]">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
                        </Link>
                        <div>
                            <h1 className="m-0 font-display text-[clamp(26px,2.6vw,34px)] leading-tight">בקשות הצטרפות</h1>
                            <p className="m-0 font-bold text-[var(--mh-ink-soft)]">{link.org.name} · <bdi>{count("pending")}</bdi> ממתינות</p>
                        </div>
                    </div>
                </header>
                <nav aria-label="סינון לפי מצב" className="flex flex-wrap gap-2">
                    {TABS.map((t) => (
                        <Link
                            key={t.key}
                            href={t.key === "pending" ? `/orgs/${orgId}/requests` : `/orgs/${orgId}/requests?tab=${t.key}`}
                            aria-current={tab === t.key ? "page" : undefined}
                            className={`inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-[var(--mh-ink)] px-4 font-extrabold ${tab === t.key ? "bg-[var(--mh-ink)] text-white" : "bg-white hover:bg-[var(--mh-ticket)]"}`}
                        >
                            {t.label} <bdi className="opacity-80">{count(t.key)}</bdi>
                        </Link>
                    ))}
                </nav>
                <RequestList orgId={orgId} tab={tab} rows={list} />
                {tab === "pending" && list.length > 0 && (
                    <p className="m-0 text-[14px] font-bold text-[var(--mh-ink-soft)]">מי שנדחה רואה רק שהבקשה לא אושרה, בלי הסיבה. מבקשים לא רואים פרטים של חברים אחרים.</p>
                )}
            </div>
        </main>
    );
}
