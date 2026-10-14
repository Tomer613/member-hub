import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { isCollection, isPackChoice, wizardSteps, type StepKey } from "@/lib/org-setup";
import { Wizard, type Draft } from "./wizard";

export const metadata: Metadata = { title: "פתיחת ארגון · PIRI" };

// The org setup wizard. An org whose setup is not finished (status "setup") is picked up again here,
// on the screen where its owner stopped.
export default async function NewOrgPage() {
    const session = await getSession();
    if (!session) redirect("/login?intent=open");
    const link = await db.orgUser.findFirst({
        where: { userId: session.userId, role: "owner", org: { status: "setup" } },
        include: { org: true },
        orderBy: { createdAt: "desc" },
    });
    const org = link?.org;
    const settings = (org?.settings ?? {}) as { wizard?: { step?: StepKey }; collection?: string };
    const collection = isCollection(settings.collection) ? settings.collection : null;
    const saved = settings.wizard?.step;
    const step: StepKey = org && saved && wizardSteps(collection ?? "system").includes(saved) ? saved : org ? "type" : "name";

    const draft: Draft = {
        orgId: org?.id ?? null,
        step,
        name: org?.name ?? "",
        // A fresh org is stored as "generic" until the type screen is answered.
        packId: org && step !== "type" && isPackChoice(org.packId) ? org.packId : null,
        color: org?.brandColor ?? null,
        city: org?.city ?? "",
        logo: org?.logoUrl ?? null,
        collection,
        joinToken: org?.joinToken ?? null,
    };
    return <Wizard draft={draft} />;
}
