import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session-server";
import { destinationAfterLogin } from "@/lib/auth/destination";
import { invitePrefill } from "./actions";
import { LoginFlow } from "./login-flow";

export const metadata: Metadata = { title: "כניסה · PIRI" };

// Desktop: the same split as the public home page, with the flow in the cream column.
// Phone: one column on the yellow background.
export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
    const sp = await searchParams;
    const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : null);
    const flow = { next: one("next"), intent: one("intent"), invite: one("invite") };
    if (await getSession()) redirect(destinationAfterLogin(flow));
    const invite = await invitePrefill(flow.invite);

    return (
        <div className="min-h-dvh bg-[var(--mh-sun)] lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(360px,1fr)]">
            <section className="hidden flex-col justify-center gap-[18px] px-12 lg:flex">
                <Link href="/" className="font-display text-[24px]"><bdi>PIRI</bdi></Link>
                <p className="m-0 font-display text-[52px] leading-[1.05]">כל החברויות שלך<br />בארנק אחד</p>
                <p className="m-0 max-w-[24em] text-[19px] font-semibold">ועד הבית, בית הכנסת, חדר הכושר והמועדון. כרטיס חבר, תשלומים והודעות, במקום אחד.</p>
            </section>
            <main className="flex min-h-dvh flex-col justify-center gap-4 px-4 py-6 lg:border-s-[3px] lg:border-[var(--mh-ink)] lg:bg-[var(--mh-ticket)] lg:px-7">
                <Link href="/" className="font-display text-[22px] lg:hidden"><bdi>PIRI</bdi></Link>
                <LoginFlow flow={flow} inviteOrg={invite?.orgName ?? null} />
            </main>
        </div>
    );
}
