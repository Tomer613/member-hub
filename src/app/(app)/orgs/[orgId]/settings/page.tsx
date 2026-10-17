import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session-server";
import { AdminShell } from "@/components/admin/admin-shell";
import { membersAdmin } from "@/lib/members-server";
import { readJoinOpen, readPublicText, readSection, SECTIONS } from "@/lib/org-settings";
import { LookForm, DetailsForm, PublicForm } from "./settings-form";

export const metadata: Metadata = { title: "הגדרות הארגון · PIRI" };

// "הגדרות הארגון" (boards D-AdmOrgSettings and D-AdmAppearance): the list of setting groups, and the chosen
// group with a live preview. Groups whose tools are not built yet are listed but not open.
export default async function OrgSettingsPage({ params, searchParams }: { params: Promise<{ orgId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const { orgId } = await params;
    const sp = await searchParams;
    if (!(await getSession())) redirect("/login");
    const a = await membersAdmin(orgId);
    if (!a || !a.canManage || a.org.status !== "active" || a.org.packId === "celebration") notFound();
    const org = a.org;
    const section = readSection(sp.s);
    const text = readPublicText(org.settings);
    const current = SECTIONS.find((s) => s.id === section)!;

    return (
        <AdminShell orgId={orgId} org={org} me={{ ...a.me, role: a.role }} active="settings">
            <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h1 className="m-0 font-display text-[28px] leading-tight">הגדרות הארגון</h1>
                <span className="font-bold text-[var(--mh-ink-soft)]">{current.label}</span>
            </header>
            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-[14px] lg:grid-cols-[220px_minmax(0,1fr)] min-[1800px]:grid-cols-[260px_minmax(0,1fr)]">
                <nav aria-label="קבוצות הגדרות" className="-mx-[clamp(12px,2vw,24px)] overflow-x-auto px-[clamp(12px,2vw,24px)] lg:mx-0 lg:overflow-visible lg:px-0">
                    <ul className="m-0 flex list-none gap-2 p-0 lg:flex-col lg:gap-1 lg:rounded-[20px] lg:border-[2.5px] lg:border-[var(--mh-ink)] lg:bg-white lg:p-2 lg:shadow-[0_3px_0_var(--mh-ink)]">
                        {SECTIONS.map((s) => {
                            const on = s.id === section;
                            return (
                                <li key={s.label} className="shrink-0">
                                    {s.id ? (
                                        <Link href={`/orgs/${orgId}/settings${s.id === "details" ? "" : `?s=${s.id}`}`} aria-current={on ? "page" : undefined}
                                            className={`flex min-h-11 items-center whitespace-nowrap rounded-full border-2 px-4 font-extrabold transition-colors lg:rounded-[12px] lg:px-3 ${on ? "border-[var(--mh-ink)] bg-[var(--mh-ink)] text-white" : "border-[var(--mh-ink)] bg-white hover:bg-[var(--mh-ticket)] lg:border-transparent"}`}>
                                            {s.label}
                                        </Link>
                                    ) : (
                                        <span aria-disabled="true" className="flex min-h-11 items-center justify-between gap-2 whitespace-nowrap rounded-full border-2 border-dashed border-[#B8AFC7] px-4 font-bold text-[var(--mh-ink-soft)] lg:whitespace-normal lg:rounded-[12px] lg:border-transparent lg:px-3 lg:py-1">
                                            <span>{s.label}</span>
                                            <span className="shrink-0 rounded-full bg-[var(--mh-ticket)] px-2 text-[12px] font-extrabold">בקרוב</span>
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </nav>
                {section === "details" && <DetailsForm key="d" orgId={orgId} name={org.name} city={org.city ?? ""} packId={org.packId} color={org.brandColor ?? "#5B3DF5"} logo={org.logoUrl} />}
                {section === "public" && <PublicForm key="p" orgId={orgId} name={org.name} city={org.city ?? ""} color={org.brandColor ?? "#5B3DF5"} logo={org.logoUrl} listed={org.visibility === "listed"} tagline={text.tagline} about={text.about} approval={!readJoinOpen(org.settings)} isOwner={a.role === "owner"} />}
                {section === "look" && <LookForm key="l" orgId={orgId} name={org.name} city={org.city ?? ""} color={org.brandColor ?? "#5B3DF5"} logo={org.logoUrl} />}
            </div>
        </AdminShell>
    );
}
