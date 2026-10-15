import { db } from "@/lib/db";
import { isHonoree, readCelebration } from "@/lib/celebration";

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

// A surprise party is invisible to its honoree once they are signed in with the phone the organizer gave.
export async function hiddenFrom(settings: unknown, userId: string | null): Promise<boolean> {
    const c = readCelebration(settings);
    if (!userId || !c.surprise.on || !c.surprise.phone) return false;
    const phones = await db.userContact.findMany({ where: { userId, kind: "phone" }, select: { value: true } });
    return isHonoree(c, phones.map((p) => p.value));
}
