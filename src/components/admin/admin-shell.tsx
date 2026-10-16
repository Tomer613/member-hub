import Link from "next/link";
import type { ReactNode } from "react";
import { onColor } from "@/lib/color";
import { db } from "@/lib/db";

// The shared admin frame (boards D-Admin and D-Adm*): a 232px side menu in the org's color on a computer, and
// a top bar with a scrolling row of the same items on a phone and tablet. Text on the org color is picked by
// contrast (pickOn). The active item is white with an ink frame and aria-current.
export type AdminSection = "overview" | "members" | "money" | "messages" | "requests" | "labels" | "door";

const ICONS: Record<AdminSection, string> = {
    overview: "M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z",
    members: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
    money: "M2 6h20v12H2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 12h.01M18 12h.01",
    messages: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
    requests: "M15 3h6v6M10 14L21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
    labels: "M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01",
    door: "M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10",
};

const ROLE: Record<string, string> = { owner: "מנהל ראשי", admin: "מנהל", treasurer: "גזבר" };

export async function AdminShell({ orgId, org, me, active, children }: {
    orgId: string;
    org: { name: string; brandColor: string | null };
    me: { firstName: string | null; lastName: string | null; role: string };
    active: AdminSection;
    children: ReactNode;
}) {
    const color = org.brandColor ?? "#5B3DF5";
    const on = onColor(color);
    const joins = await db.joinRequest.count({ where: { orgId, status: "pending" } });
    const groups: { title: string | null; items: { id: AdminSection; label: string; href: string; count?: { n: number; aria: string } }[] }[] = [
        {
            title: null,
            items: [
                { id: "overview", label: "סקירה", href: `/orgs/${orgId}` },
                { id: "members", label: "חברים", href: `/orgs/${orgId}/members` },
                { id: "money", label: "כספים וחיובים", href: `/orgs/${orgId}/money` },
                { id: "messages", label: "הודעות", href: `/orgs/${orgId}/messages` },
                { id: "requests", label: "בקשות הצטרפות", href: `/orgs/${orgId}/requests`, count: joins ? { n: joins, aria: joins === 1 ? "בקשת הצטרפות אחת מחכה" : `${joins} בקשות הצטרפות מחכות` } : undefined },
            ],
        },
        {
            title: "ארגון",
            items: [
                { id: "labels", label: "תוויות", href: `/orgs/${orgId}/labels` },
                { id: "door", label: "סריקה בכניסה", href: `/orgs/${orgId}/door` },
            ],
        },
    ];
    const meName = `${me.firstName ?? ""} ${me.lastName ?? ""}`.trim() || "מנהל";
    const item = (it: (typeof groups)[number]["items"][number], compact: boolean) => {
        const isOn = it.id === active;
        return (
            <Link
                key={it.id}
                href={it.href}
                aria-current={isOn ? "page" : undefined}
                className={`flex shrink-0 items-center gap-[10px] rounded-[12px] border-2 px-[10px] font-extrabold transition-colors ${compact ? "min-h-11 text-[15px]" : "min-h-10 text-[15px]"} ${isOn ? "border-[var(--mh-ink)] bg-white text-[var(--mh-ink)]" : "border-transparent hover:bg-white/25"}`}
                style={isOn ? undefined : { color: on }}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[it.id]} /></svg>
                <span className="whitespace-nowrap">{it.label}</span>
                {it.count && (
                    <span aria-label={it.count.aria} className="ms-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-[#FF5A36] px-1 text-[11px] font-extrabold text-[var(--mh-ink)]">
                        <bdi aria-hidden="true">{it.count.n}</bdi>
                    </span>
                )}
            </Link>
        );
    };
    return (
        <div className="min-h-dvh bg-[var(--mh-bg)] lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
            <aside className="flex flex-col gap-[14px] border-b-[2.5px] border-[var(--mh-ink)] px-3 py-3 lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:border-b-0 lg:border-e-[2.5px] lg:py-4" style={{ background: color, color: on }} aria-label="תפריט ניהול">
                <div className="flex items-center gap-[10px]">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-[var(--mh-ink)] bg-white font-display text-[20px] text-[var(--mh-ink)]" aria-hidden="true">{[...org.name][0]}</span>
                    <span className="flex min-w-0 flex-col">
                        <b className="truncate text-[17px]">{org.name}</b>
                        <span className="flex items-center gap-[6px] text-[12px] font-bold">
                            <span className="grid h-[18px] w-[18px] place-items-center rounded-full border-2 border-white bg-[#FFD9E8] text-[9px] text-[var(--mh-ink)]" aria-hidden="true">{[...meName][0]}</span>
                            <span className="truncate"><span className="sr-only">מחובר כ</span>{meName} · {ROLE[me.role] ?? "מנהל"}</span>
                        </span>
                    </span>
                </div>
                {/* Phone and tablet: one scrolling row. */}
                <nav aria-label="ניהול" className="-mx-3 flex gap-1 overflow-x-auto px-3 pb-1 lg:hidden">
                    {groups.flatMap((g) => g.items).map((it) => item(it, true))}
                </nav>
                {/* Computer: the side menu with its groups. */}
                <nav aria-label="ניהול" className="hidden flex-col gap-[14px] lg:flex">
                    {groups.map((g) => (
                        <div key={g.title ?? "base"} className="flex flex-col gap-1">
                            {g.title && <span className="px-[10px] text-[12.5px] font-extrabold">{g.title}</span>}
                            {g.items.map((it) => item(it, false))}
                        </div>
                    ))}
                </nav>
                <Link href="/wallet" className="mt-auto hidden rounded-[12px] border-2 border-dashed px-3 py-2 text-[13px] font-bold lg:block" style={{ borderColor: on, background: "rgba(255,255,255,.18)" }}>
                    למעבר לתצוגת חבר: הארנק שלי
                </Link>
            </aside>
            <div className="flex min-w-0 flex-col gap-[14px] px-[clamp(12px,2vw,24px)] pb-8 pt-[18px]">{children}</div>
        </div>
    );
}
