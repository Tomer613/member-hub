"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { endSession, getSession } from "@/lib/auth/session-server";
import { randomToken } from "@/lib/org-setup";
import { cookieName, entryFor, findReply, stageOf } from "./reply";
import { setReaction } from "@/lib/channel-server";
import { isReaction, type ReactionKind } from "@/lib/reactions";
import { MAX_PEOPLE, MAX_REPLIES, amountOwed, clampCount, cleanAnswer, cleanGuestName, isRsvpStatus, readCelebration, shekelsToMinor } from "@/lib/celebration";

// The invitation's actions. Replying needs only a name (decided with Tommy 14.10.2026): the reply is
// remembered by a random key in the guest's browser. Marking a payment or keeping the invitation in the
// wallet needs one sign-in with the phone, and then the reply is tied to the account.

async function openCelebration(token: string) {
    const org = await db.organization.findFirst({ where: { joinToken: token, status: "active", packId: "celebration" } });
    if (!org) redirect(`/c/${token}`);
    const session = await getSession();
    if ((await entryFor(org.id, org.settings, session?.userId ?? null)).entry !== "ok") redirect(`/c/${token}`);
    // A closed celebration is read only: no new replies, payments or reactions.
    if ((await stageOf(org)) === "closed") redirect(`/c/${token}`);
    return org;
}

// A signed-in guest gets the celebration in their wallet, as a guest, not as a member.
async function attach(orgId: string, rsvpId: string, userId: string) {
    const taken = await db.rsvp.findUnique({ where: { orgId_userId: { orgId, userId } } });
    if (!taken) await db.rsvp.update({ where: { id: rsvpId }, data: { userId } });
    const link = await db.orgUser.findUnique({ where: { orgId_userId: { orgId, userId } } });
    if (!link) await db.orgUser.create({ data: { orgId, userId, role: "guest" } });
}

export async function answer(token: string, _prev: { error?: string } | undefined, form: FormData): Promise<{ error?: string }> {
    const org = await openCelebration(token);
    const name = cleanGuestName(String(form.get("name") ?? ""));
    if (!name) return { error: "כתבו את השם שלכם, כדי שהמארגנים ידעו מי עונה" };
    const status = form.get("status");
    if (!isRsvpStatus(status)) return { error: "בחרו אם אתם מגיעים" };
    const people = status === "no" ? 1 : clampCount(Number(form.get("people")), 1, MAX_PEOPLE);
    const c = readCelebration(org.settings);
    const kids = status === "no" || !c.kids ? 0 : clampCount(Number(form.get("kids") || 0), 0, people);
    const reply = status === "no" ? null : cleanAnswer(c.question, String(form.get("answer") ?? ""));

    const session = await getSession();
    const jar = await cookies();
    const existing = await findReply(org.id, session?.userId ?? null, jar.get(cookieName(org.id))?.value);
    let id: string;
    if (existing) {
        await db.rsvp.update({ where: { id: existing.id }, data: { name, status, people, kids, answer: reply } });
        id = existing.id;
    } else {
        if ((await db.rsvp.count({ where: { orgId: org.id } })) >= MAX_REPLIES) return { error: "ההזמנה הגיעה למספר התשובות המרבי" };
        const guestKey = randomToken(24);
        const created = await db.rsvp.create({ data: { orgId: org.id, guestKey, name, status, people, kids, answer: reply } });
        jar.set(cookieName(org.id), guestKey, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 });
        id = created.id;
    }
    if (session) await attach(org.id, id, session.userId);
    redirect(`/c/${token}`);
}

export async function markPaid(token: string, form: FormData): Promise<void> {
    const org = await openCelebration(token);
    const session = await getSession();
    if (!session) redirect(`/login?next=${encodeURIComponent(`/c/${token}`)}`);
    const jar = await cookies();
    const reply = await findReply(org.id, session.userId, jar.get(cookieName(org.id))?.value);
    if (!reply || reply.paid === "confirmed") redirect(`/c/${token}`);
    const { money } = readCelebration(org.settings);
    const paidMinor = money.mode === "fixed" ? amountOwed(money, reply.people, reply.kids) : shekelsToMinor(String(form.get("amount") ?? ""));
    if (money.mode === "none" || !paidMinor) redirect(`/c/${token}?amount=1`);
    await db.rsvp.update({ where: { id: reply.id }, data: { paid: "claimed", paidMinor, paidAt: new Date() } });
    await attach(org.id, reply.id, session.userId);
    redirect(`/c/${token}`);
}

export async function keepInWallet(token: string): Promise<void> {
    const org = await openCelebration(token);
    const session = await getSession();
    if (!session) redirect(`/login?next=${encodeURIComponent(`/c/${token}`)}`);
    const jar = await cookies();
    const reply = await findReply(org.id, session.userId, jar.get(cookieName(org.id))?.value);
    if (reply) await attach(org.id, reply.id, session.userId);
    redirect(`/c/${token}`);
}

// Signed in with a number that is not on the list: sign out and come back here with another phone.
export async function signInAgain(token: string): Promise<void> {
    await endSession();
    redirect(`/login?next=${encodeURIComponent(`/c/${token}`)}`);
}

// A guest reacts to an organizer's update. Only someone who replied can react: as their account when signed
// in, otherwise as their reply.
export async function reactOnPost(token: string, postId: string, kind: ReactionKind | null): Promise<void> {
    if (kind !== null && !isReaction(kind)) return;
    const org = await openCelebration(token);
    const session = await getSession();
    const reply = await findReply(org.id, session?.userId ?? null, (await cookies()).get(cookieName(org.id))?.value);
    if (!reply) return;
    await setReaction(postId, org.id, session ? `u:${session.userId}` : `r:${reply.id}`, kind);
}
