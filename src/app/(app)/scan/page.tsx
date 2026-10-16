import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { appOrigin } from "@/lib/origin-server";
import { profileCode, qrSvg } from "@/lib/profile-code-server";
import { ScanScreen } from "./scan-screen";

export const metadata: Metadata = { title: "סריקה · PIRI" };

// The scanner (boards D-QrScan, D-QrMyCode; ux-spec 14.28): reading a code of an org, an invitation or a
// celebration, and the person's own profile code to show to an org's manager.
export default async function ScanPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
    const session = await getSession();
    if (!session) redirect("/login?next=/scan");
    const { tab } = await searchParams;
    const [user, code, { origin, host }] = await Promise.all([
        db.user.findUniqueOrThrow({ where: { id: session.userId }, select: { firstName: true, lastName: true } }),
        profileCode(session.userId),
        appOrigin(),
    ]);
    const link = `${origin}/p/${code}`;
    const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "הפרופיל שלי";
    return <ScanScreen hosts={[host]} start={tab === "code" ? "code" : "scan"} profile={{ name, letter: name.slice(0, 1), link, svg: await qrSvg(link) }} />;
}
