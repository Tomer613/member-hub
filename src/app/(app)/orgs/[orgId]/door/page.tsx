import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { DoorScanner } from "./door-scanner";

export const metadata: Metadata = { title: "סריקה בכניסה · PIRI" };

// Checking member cards at the door: the manager's phone reads the entry code on the back of the card.
export default async function DoorPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;
    const session = await getSession();
    if (!session) redirect(`/login?next=/orgs/${orgId}/door`);
    const link = await db.orgUser.findFirst({ where: { orgId, userId: session.userId, role: { in: ["owner", "admin"] }, status: "active" }, include: { org: true } });
    if (!link || link.org.status !== "active" || link.org.packId === "celebration") notFound();
    return <DoorScanner orgId={orgId} orgName={link.org.name} />;
}
