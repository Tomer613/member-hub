import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { AdminShell } from "@/components/admin/admin-shell";
import { CopyLink } from "@/components/copy-link";
import { onColor } from "@/lib/color";
import { membersAdmin } from "@/lib/members-server";
import { appOrigin } from "@/lib/origin-server";
import { qrSvg } from "@/lib/profile-code-server";
import { hebrewAgo } from "@/lib/relative-time";

export const metadata: Metadata = { title: "הוספת חברים · PIRI" };

const panel = "flex flex-col gap-3 rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_3px_0_var(--mh-ink)]";
const btn = "inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-[var(--mh-ink)] px-[18px] text-[15px] font-extrabold shadow-[0_2px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none";

const ICON = {
    invite: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
    scan: "M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10",
    qr: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3",
    file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8",
};

function Tile({ icon, bg, size = 52 }: { icon: string; bg: string; size?: number }) {
    return (
        <span className="grid shrink-0 place-items-center rounded-[16px] border-2 border-[var(--mh-ink)]" style={{ width: size, height: size, background: bg }} aria-hidden="true">
            <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>
        </span>
    );
}

function Way({ icon, bg, title, line, children }: { icon: string; bg: string; title: string; line: string; children: ReactNode }) {
    return (
        <section className={panel}>
            <Tile icon={icon} bg={bg} />
            <h2 className="m-0 font-display text-[21px] leading-tight">{title}</h2>
            <p className="m-0 flex-1 text-[15px] font-semibold text-[var(--mh-ink-soft)]">{line}</p>
            {children}
        </section>
    );
}

// "הוספת חברים" (board D-AdmAddMember, ux-spec 14.32): three ways to bring in one person, and the file import
// for many, with the recent imports and how they went.
export default async function AddMembersPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    if (!(await getSession())) redirect("/login");
    const a = await membersAdmin(orgId);
    if (!a?.canManage) notFound();
    const color = a.org.brandColor ?? "#5B3DF5";
    const { origin } = await appOrigin();
    const joinUrl = a.org.joinToken ? `${origin}/join/${a.org.joinToken}` : null;
    const [qr, batches] = await Promise.all([
        joinUrl ? qrSvg(joinUrl) : null,
        db.importBatch.findMany({ where: { orgId }, orderBy: { createdAt: "desc" }, take: 8, include: { invitations: { select: { status: true } } } }),
    ]);
    return (
        <AdminShell orgId={orgId} org={a.org} me={{ ...a.me, role: a.role }} active="members">
            <nav aria-label="מיקום" className="text-[14px] font-bold"><Link href={`/orgs/${orgId}/members`} className="underline">חברים</Link> <span aria-hidden="true">‹</span> הוספת חברים</nav>
            <header className="flex flex-col gap-1">
                <h1 className="m-0 font-display text-[28px] leading-tight">הוספת חברים</h1>
                <p className="m-0 font-bold text-[var(--mh-ink-soft)]">שלוש דרכים לצרף אחד, וייבוא לצירוף של הרבה.</p>
            </header>
            <div className="grid grid-cols-1 gap-[14px] md:grid-cols-3">
                <Way icon={ICON.invite} bg="#D7F5E8" title="שליחת הזמנה" line="אדם מסוים. הוא מאשר בלחיצה ונכנס מיד, בלי שתצטרכו לאשר שוב.">
                    <Link href={`/orgs/${orgId}/members/invite`} className={btn} style={{ background: color, color: onColor(color) }}>שליחת הזמנה</Link>
                </Way>
                <Way icon={ICON.scan} bg="#FFD9E8" title="סריקת קוד פרופיל משתמש" line="האדם יושב מולכם. סורקים מהאפליקציה בטלפון, והוא מאשר אצלו.">
                    <details className="group">
                        <summary className={`${btn} cursor-pointer list-none bg-white [&::-webkit-details-marker]:hidden`}>איך סורקים</summary>
                        <ol className="m-0 mt-3 flex list-decimal flex-col gap-1 ps-5 text-[14px] font-semibold">
                            <li>האדם פותח אצלו את האפליקציה, לוחץ על כפתור הסריקה בראש הארנק, ובוחר ״קוד פרופיל״.</li>
                            <li>אתם פותחים בטלפון שלכם את אותו כפתור סריקה, וסורקים את הקוד שעל המסך שלו.</li>
                            <li>בוחרים את הארגון ושולחים בקשת צירוף. הוא מאשר אצלו, והכרטיס מופיע לו בארנק.</li>
                        </ol>
                    </details>
                </Way>
                <Way icon={ICON.qr} bg="#E3DDFF" title="שיתוף קוד פרופיל ארגון" line="כל מי שמעוניין שולח בקשה, ואתם מאשרים. כרזה, תמונה או קישור.">
                    {joinUrl ? (
                        <details className="group">
                            <summary className={`${btn} cursor-pointer list-none bg-white [&::-webkit-details-marker]:hidden`}>לקוד הארגון</summary>
                            <div className="mt-3 flex flex-col items-center gap-3">
                                {qr && <div role="img" aria-label="קוד הארגון לסריקה" className="w-[180px] rounded-[14px] border-2 border-[var(--mh-ink)] bg-white p-3 [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />}
                                <div className="w-full"><CopyLink path={`/join/${a.org.joinToken}`} /></div>
                            </div>
                        </details>
                    ) : <p className="m-0 font-semibold">לארגון עוד אין קוד הצטרפות.</p>}
                </Way>
            </div>
            <section className={`${panel} md:flex-row md:items-center md:gap-4`} aria-labelledby="import-title">
                <Tile icon={ICON.file} bg="#FFF6D1" size={60} />
                <div className="flex flex-1 flex-col gap-1">
                    <h2 id="import-title" className="m-0 font-display text-[21px]">ייבוא חברים מקובץ</h2>
                    <p className="m-0 text-[15px] font-semibold text-[var(--mh-ink-soft)]">קובץ אקסל או CSV. מתאימים עמודות, רואים מי יוזמן ומתקנים במקום, ורק אז שולחים.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <a href={`/orgs/${orgId}/members/import/template`} download className={`${btn} bg-white`}>הורדת תבנית</a>
                    <Link href={`/orgs/${orgId}/members/import`} className={btn} style={{ background: color, color: onColor(color) }}>טעינת קובץ</Link>
                </div>
            </section>
            <section className={panel} aria-labelledby="recent-title">
                <h2 id="recent-title" className="m-0 font-display text-[19px]">ייבואים אחרונים</h2>
                {!batches.length ? (
                    <p className="m-0 font-semibold text-[var(--mh-ink-soft)]">עוד לא היו ייבואים.</p>
                ) : (
                    <ul className="m-0 flex list-none flex-col p-0">
                        {batches.map((b) => {
                            const accepted = b.invitations.filter((i) => i.status === "accepted").length;
                            const state = b.mode === "list" ? "יובא כרשימה" : accepted === b.invitations.length && accepted > 0 ? "הושלם · כולם אישרו" : `${accepted === 1 ? "אחד אישר" : `${accepted} אישרו`}`;
                            return (
                                <li key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b-[1.5px] border-[var(--mh-line-soft)] py-3 last:border-0">
                                    <span className="flex min-w-0 flex-1 flex-col">
                                        <bdi dir="ltr" className="truncate text-end font-extrabold">{b.fileName}</bdi>
                                        <span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">{b.rows} שורות · {b.mode === "list" ? `${b.imported} יובאו` : `${b.imported} הזמנות`}</span>
                                    </span>
                                    <span className="inline-flex min-h-6 items-center rounded-[12px] border-2 border-[var(--mh-ink)] bg-[#D7F5E8] px-2 text-[12.5px] font-extrabold">{state}</span>
                                    <span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">{hebrewAgo(b.createdAt, new Date())}</span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </AdminShell>
    );
}
