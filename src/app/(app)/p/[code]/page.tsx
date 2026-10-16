import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { ProfileInvite } from "./profile-invite";

export const metadata: Metadata = { title: "קוד פרופיל · PIRI" };

const shell = "mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center gap-4 px-4 py-[18px] lg:[zoom:1.2] min-[1800px]:[zoom:1.5]";
const box = "flex flex-col gap-3 rounded-[24px] border-[2.5px] border-[var(--mh-ink)] bg-white p-4 shadow-[0_4px_0_var(--mh-ink)]";

// Where a person's profile code leads (ux-spec 14.29, board D-MAdmScan). Before the person accepts, a
// manager sees only the first name: no phone, no last name.
export default async function ProfileCodePage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    const session = await getSession();
    if (!session) redirect(`/login?next=${encodeURIComponent(`/p/${code}`)}`);
    const person = await db.user.findUnique({ where: { profileCode: code.toLowerCase() }, select: { id: true, firstName: true } });
    const page = (children: React.ReactNode) => <main className="min-h-dvh bg-[var(--mh-sun)]"><div className={shell}>{children}</div></main>;
    const back = <Link href="/scan" className="inline-flex min-h-11 items-center self-start font-extrabold underline">לסריקה</Link>;
    if (!person) return page(<><div className={box}><h1 className="m-0 font-display text-[26px] font-normal">הקוד הזה כבר לא בתוקף</h1><p className="m-0 font-semibold">אפשר לבקש מבעל הקוד להציג את הקוד העדכני שלו.</p></div>{back}</>);
    if (person.id === session.userId) return page(<><div className={box}><h1 className="m-0 font-display text-[26px] font-normal">זה קוד הפרופיל שלכם</h1><p className="m-0 font-semibold">מנהל של ארגון סורק אותו כדי לשלוח לכם בקשת צירוף.</p><Link href="/scan?tab=code" className="inline-flex min-h-11 items-center self-start font-extrabold underline">להצגת הקוד</Link></div></>);
    const name = person.firstName?.trim() || "חבר/ה";
    const managed = await db.orgUser.findMany({ where: { userId: session.userId, role: { in: ["owner", "admin"] }, status: "active", org: { status: "active", packId: { not: "celebration" } } }, include: { org: true }, orderBy: { createdAt: "asc" } });
    if (!managed.length) return page(<><div className={box}><h1 className="m-0 font-display text-[26px] font-normal">זה קוד פרופיל של <bdi>{name}</bdi></h1><p className="m-0 font-semibold">רק מנהלים של ארגון יכולים להשתמש בקוד כדי לצרף. כדי להצטרף לארגון בעצמכם, סורקים את הקוד של הארגון.</p></div>{back}</>);
    const orgIds = managed.map((m) => m.orgId);
    const [members, contacts] = await Promise.all([
        db.orgUser.findMany({ where: { userId: person.id, orgId: { in: orgIds }, status: "active" }, select: { orgId: true } }),
        db.userContact.findMany({ where: { userId: person.id }, select: { kind: true, value: true } }),
    ]);
    const pending = contacts.length ? await db.invitation.findMany({ where: { orgId: { in: orgIds }, status: "pending", expiresAt: { gt: new Date() }, OR: contacts.map((c) => ({ kind: c.kind, value: c.value })) }, select: { orgId: true } }) : [];
    return page(
        <ProfileInvite
            code={code.toLowerCase()}
            name={name}
            orgs={managed.map((m) => ({ id: m.orgId, name: m.org.name, state: members.some((x) => x.orgId === m.orgId) ? "member" : pending.some((x) => x.orgId === m.orgId) ? "pending" : "new" }))}
        />,
    );
}
