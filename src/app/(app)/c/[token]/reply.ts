import { db } from "@/lib/db";
import { isHonoree, mayEnter, readCelebration } from "@/lib/celebration";

// Which reply belongs to whoever is looking: the one tied to their account when signed in, otherwise the
// one this browser made (its random key is kept in a cookie per celebration).
export const cookieName = (orgId: string) => `mh_rsvp_${orgId}`;

export async function findReply(orgId: string, userId: string | null, key: string | undefined) {
    if (userId) {
        const mine = await db.rsvp.findUnique({ where: { orgId_userId: { orgId, userId } } });
        if (mine) return mine;
    }
    return key ? db.rsvp.findFirst({ where: { orgId, guestKey: key } }) : null;
}

export type Entry = "dead" | "signin" | "notInvited" | "ok";

// Whether this viewer may see the invitation. The honoree of a surprise gets exactly what a dead link shows;
// an invited-only celebration asks for a phone sign-in and then checks the number against the list.
export async function entryFor(orgId: string, settings: unknown, userId: string | null): Promise<{ entry: Entry; phones: string[] }> {
    const c = readCelebration(settings);
    const phones = userId ? (await db.userContact.findMany({ where: { userId, kind: "phone" }, select: { value: true } })).map((p) => p.value) : [];
    if (isHonoree(c, phones)) return { entry: "dead", phones };
    if (c.access === "link") return { entry: "ok", phones };
    if (!userId) return { entry: "signin", phones };
    const link = await db.orgUser.findUnique({ where: { orgId_userId: { orgId, userId } } });
    const organizer = link?.role === "owner" || link?.role === "admin";
    return { entry: mayEnter(c, phones, organizer) ? "ok" : "notInvited", phones };
}
