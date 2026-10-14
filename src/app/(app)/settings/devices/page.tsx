import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { timeAgoHe } from "@/lib/auth/relative-time";
import { DeviceList } from "./device-list";

export const metadata: Metadata = { title: "מכשירים מחוברים · PIRI" };

export default async function DevicesPage() {
    const session = await getSession();
    if (!session) redirect("/login?next=/settings/devices");
    const rows = await db.authSession.findMany({
        where: { userId: session.userId, revokedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { lastSeenAt: "desc" },
    });
    const list = rows
        .map((r) => ({ id: r.id, label: r.label, deviceKind: r.deviceKind, city: r.city, lastSeen: timeAgoHe(r.lastSeenAt), current: r.id === session.sessionId }))
        .sort((a, b) => Number(b.current) - Number(a.current));
    return (
        <main className="mx-auto flex min-h-dvh max-w-[480px] flex-col gap-[14px] bg-[var(--mh-sun)] px-4 py-[18px]">
            <Link href="/settings" className="inline-flex min-h-11 items-center self-start rounded-full border-2 border-[var(--mh-ink)] bg-white px-[14px] text-sm font-extrabold">להגדרות</Link>
            <h1 className="m-0 text-[30px]">מכשירים מחוברים</h1>
            <DeviceList rows={list} />
        </main>
    );
}
