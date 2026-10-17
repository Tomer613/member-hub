import Link from "next/link";
import type { ReactNode } from "react";
import { onColor } from "@/lib/color";
import { db } from "@/lib/db";
import { hasDonations } from "@/lib/donations-server";
import { hasPrayers } from "@/lib/prayers-server";
import { hasYahrzeit, sendDueYahrzeitReminders } from "@/lib/yahrzeit-server";

// The shared admin frame (boards D-Admin and D-Adm*): a 232px side menu in the org's color on a computer, and
// a top bar with a scrolling row of the same items on a phone and tablet. Text on the org color is picked by
// contrast (pickOn). The active item is white with an ink frame and aria-current.
export type AdminSection = "overview" | "members" | "money" | "activities" | "messages" | "inquiries" | "requests" | "reports" | "settings" | "labels" | "door" | "yahrzeit" | "donations" | "prayers";

const ICONS: Record<AdminSection, string> = {
    overview: "M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z",
    members: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
    money: "M2 6h20v12H2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 12h.01M18 12h.01",
    activities: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8 15h3",
    messages: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
    inquiries: "M4 4h16v12H8l-4 4zM8 9h8M8 12h5",
    reports: "M3 3v18h18M7 15v2M11 11v6M15 7v10M19 13v4",
    requests: "M15 3h6v6M10 14L21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
    settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
    labels: "M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01",
    donations: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z",
    prayers: "M12 7v5l3 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
    yahrzeit: "M12 2c1.5 2.5 3 3.6 3 6a3 3 0 0 1-6 0c0-2.4 1.5-3.5 3-6zM9 13h6v9H9zM6 22h12",
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
    const [joins, asks, kind] = await Promise.all([
        db.joinRequest.count({ where: { orgId, status: "pending" } }),
        db.request.count({ where: { orgId, status: { in: ["new", "replied"] } } }),
        db.organization.findUnique({ where: { id: orgId }, select: { packId: true } }),
    ]);
    type Group = { title: string | null; items: { id: AdminSection; label: string; href: string; count?: { n: number; aria: string } }[] };
    const synagogue = !!kind && hasYahrzeit(kind.packId);
    const tools: Group["items"] = [
        ...(kind && hasPrayers(kind.packId) ? [{ id: "prayers" as const, label: "תפילות ולוח זמנים", href: `/orgs/${orgId}/prayers` }] : []),
        ...(kind && hasDonations(kind.packId) ? [{ id: "donations" as const, label: "תרומות ונדרים", href: `/orgs/${orgId}/donations` }] : []),
        ...(synagogue ? [{ id: "yahrzeit" as const, label: "יארצייט", href: `/orgs/${orgId}/yahrzeit` }] : []),
    ];
    // Yahrzeit reminders go out when the admin area is opened, until there is a scheduled job.
    if (synagogue) await sendDueYahrzeitReminders(orgId);
    const all: Group[] = [
        {
            title: null,
            items: [
                { id: "overview", label: "סקירה", href: `/orgs/${orgId}` },
                { id: "members", label: "חברים", href: `/orgs/${orgId}/members` },
                { id: "money", label: "כספים וחיובים", href: `/orgs/${orgId}/money` },
                { id: "activities", label: "פעילויות ואירועים", href: `/orgs/${orgId}/activities` },
                { id: "messages", label: "הודעות", href: `/orgs/${orgId}/messages` },
                { id: "inquiries", label: "פניות", href: `/orgs/${orgId}/inquiries`, count: asks ? { n: asks, aria: asks === 1 ? "פנייה אחת מחכה" : `${asks} פניות מחכות` } : undefined },
                { id: "reports", label: "דוחות", href: `/orgs/${orgId}/reports` },
                { id: "requests", label: "בקשות הצטרפות", href: `/orgs/${orgId}/requests`, count: joins ? { n: joins, aria: joins === 1 ? "בקשת הצטרפות אחת מחכה" : `${joins} בקשות הצטרפות מחכות` } : undefined },
            ],
        },
        ...(tools.length ? [{ title: "כלים של בית כנסת", items: tools }] : []),
        {
            title: "ארגון",
            items: [
                { id: "settings", label: "הגדרות הארגון", href: `/orgs/${orgId}/settings` },
                { id: "labels", label: "תוויות", href: `/orgs/${orgId}/labels` },
                { id: "door", label: "סריקה בכניסה", href: `/orgs/${orgId}/door` },
            ],
        },
    ];
    // The treasurer handles money and messages; activities, settings, labels and the door stay with the owner and admins.
    const hidden: AdminSection[] = me.role === "treasurer" ? ["activities", "settings", "labels", "door", "yahrzeit", "prayers"] : [];
    const groups = all.map((g) => ({ ...g, items: g.items.filter((it) => !hidden.includes(it.id)) })).filter((g) => g.items.length);
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
