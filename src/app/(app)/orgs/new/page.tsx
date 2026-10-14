import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session-server";

export const metadata: Metadata = { title: "פתיחת ארגון · PIRI" };

// Entry point for "open an organization" from the home page and the empty wallet.
// The setup wizard (org type -> sub-type -> tools, docs/org-types.he.md) is the next flow to design.
export default async function NewOrgPage() {
    if (!(await getSession())) redirect("/login?intent=open");
    return (
        <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col justify-center gap-[14px] bg-[var(--mh-sun)] px-4">
            <h1 className="m-0 text-[30px]">פתיחת ארגון</h1>
            <p className="m-0 font-semibold">אשף הפתיחה עוד בבנייה. נחזור אליו מיד אחרי מסכי הכניסה.</p>
            <Link href="/wallet" className="font-extrabold underline">לארנק</Link>
        </main>
    );
}
