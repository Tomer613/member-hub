"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { MAX_INVITED, celebrationStage, cleanPayLink, cleanQuestion, cleanWhatsAppGroup, nextYear, readCelebration } from "@/lib/celebration";
import { randomToken } from "@/lib/org-setup";
import { cleanPost } from "@/lib/reactions";
import { parsePhoneList } from "@/lib/org-setup";
import type { Prisma } from "@prisma/client";

// The organizer confirms a payment a guest marked as paid, or returns it to "not paid" when nothing arrived.
// Money itself never moves through us in phase 1 (decided with Tommy 14.10.2026).
// A closed celebration is read only, so changes are refused unless the action is about closing itself.
async function organizerOf(orgId: string, evenClosed = false) {
    const session = await getSession();
    if (!session) return null;
    const link = await db.orgUser.findFirst({ where: { orgId, userId: session.userId, role: { in: ["owner", "admin"] }, status: "active" }, include: { org: true } });
    if (!link || evenClosed || link.org.packId !== "celebration") return link;
    const rows = await db.rsvp.findMany({ where: { orgId }, select: { status: true, people: true, kids: true, paid: true, paidMinor: true } });
    return celebrationStage(readCelebration(link.org.settings), link.org.status, rows, new Date()) === "closed" ? null : link;
}

export async function setPayment(orgId: string, rsvpId: string, to: "confirmed" | "none"): Promise<void> {
    if (!(await organizerOf(orgId))) return;
    await db.rsvp.updateMany({
        where: { id: rsvpId, orgId, paid: to === "confirmed" ? "claimed" : { in: ["claimed", "confirmed"] } },
        data: to === "confirmed" ? { paid: "confirmed" } : { paid: "none", paidMinor: null, paidAt: null },
    });
    revalidatePath(`/orgs/${orgId}`);
}

async function saveInvited(orgId: string, change: (current: string[]) => string[]) {
    const link = await organizerOf(orgId);
    if (!link) return;
    const settings = (link.org.settings ?? {}) as Record<string, unknown>;
    const c = readCelebration(settings);
    const invited = change(c.invited).slice(0, MAX_INVITED);
    await db.organization.update({ where: { id: orgId }, data: { settings: { ...settings, celebration: { ...c, invited } } as Prisma.InputJsonObject } });
    revalidatePath(`/orgs/${orgId}`);
}

// More invited phones, pasted from the organizer's page. Returns what could not be read.
export async function addInvited(orgId: string, _prev: { invalid?: string[]; added?: number } | undefined, form: FormData): Promise<{ invalid?: string[]; added?: number }> {
    const { phones, invalid } = parsePhoneList(String(form.get("phones") ?? ""), MAX_INVITED);
    let added = 0;
    await saveInvited(orgId, (current) => {
        const fresh = phones.filter((p) => !current.includes(p));
        added = fresh.length;
        return [...current, ...fresh];
    });
    return { invalid, added };
}

export async function removeInvited(orgId: string, phone: string): Promise<void> {
    await saveInvited(orgId, (current) => current.filter((p) => p !== phone));
}

// The organizer writes an update to the channel. Everyone who replied sees it in the invitation.
export async function publishPost(orgId: string, _prev: { error?: string; ok?: number } | undefined, form: FormData): Promise<{ error?: string; ok?: number }> {
    const link = await organizerOf(orgId);
    if (!link) return { error: "רק המארגנים יכולים לכתוב כאן" };
    const clean = cleanPost(String(form.get("title") ?? ""), String(form.get("body") ?? ""));
    if ("error" in clean) return { error: clean.error };
    const reactable = form.get("reactable") === "on";
    await db.channelPost.create({
        data: { orgId, authorId: link.userId, ...clean, pinned: form.get("pinned") === "on", reactable, dislike: reactable && form.get("dislike") === "on" },
    });
    revalidatePath(`/orgs/${orgId}`);
    return { ok: Date.now() };
}

export async function deletePost(orgId: string, postId: string): Promise<void> {
    if (!(await organizerOf(orgId))) return;
    await db.channelPost.deleteMany({ where: { id: postId, orgId } });
    revalidatePath(`/orgs/${orgId}`);
}

// The WhatsApp group and shared album buttons guests see after replying. Empty removes a button.
export async function saveLinks(orgId: string, _prev: { error?: string; ok?: number } | undefined, form: FormData): Promise<{ error?: string; ok?: number }> {
    const link = await organizerOf(orgId);
    if (!link) return { error: "רק המארגנים יכולים לשנות את זה" };
    const rawWa = String(form.get("whatsapp") ?? "").trim();
    const rawAlbum = String(form.get("album") ?? "").trim();
    const whatsapp = rawWa ? cleanWhatsAppGroup(rawWa) : null;
    const album = rawAlbum ? cleanPayLink(rawAlbum) : null;
    if (rawWa && !whatsapp) return { error: "קישור לקבוצה מתחיל ב-https://chat.whatsapp.com/" };
    if (rawAlbum && !album) return { error: "קישור לאלבום צריך להתחיל ב-https://" };
    const settings = (link.org.settings ?? {}) as Record<string, unknown>;
    const c = readCelebration(settings);
    await db.organization.update({ where: { id: orgId }, data: { settings: { ...settings, celebration: { ...c, links: { whatsapp, album } } } as Prisma.InputJsonObject } });
    revalidatePath(`/orgs/${orgId}`);
    return { ok: Date.now() };
}

// Closing locks the celebration for everyone: the invitation stays readable but nothing can change.
// Reopening is only for a celebration the organizer closed by hand.
export async function setClosed(orgId: string, closed: boolean): Promise<void> {
    const link = await organizerOf(orgId, true);
    if (!link || link.org.packId !== "celebration") return;
    await db.organization.update({ where: { id: orgId }, data: { status: closed ? "closed" : "active" } });
    revalidatePath(`/orgs/${orgId}`);
}

// "לחגוג שוב": a new celebration with the same details a year later. It opens in the setup wizard on the
// "when" screen, so the organizer checks the date and place before anything is sent. Guests, payments
// and updates stay with the old one; the group and album links start empty.
export async function celebrateAgain(orgId: string): Promise<void> {
    const link = await organizerOf(orgId, true);
    if (!link || link.org.packId !== "celebration") return;
    const old = link.org;
    const c = readCelebration(old.settings);
    const fresh = await db.organization.create({
        data: {
            name: old.name,
            slug: randomToken(10),
            joinToken: randomToken(12),
            packId: "celebration",
            status: "setup",
            brandColor: old.brandColor,
            city: old.city,
            settings: { celebration: { ...c, startsAt: nextYear(c.startsAt), links: { whatsapp: null, album: null } }, wizard: { step: "when" }, againOf: old.id } as Prisma.InputJsonObject,
            orgUsers: { create: { userId: link.userId, role: "owner" } },
        },
    });
    if (fresh) redirect("/orgs/new");
}

// "שאלה משלכם": add, change or remove the one question for those coming. Answers already given stay.
type QuestionState = { error?: string; ok?: number; text?: string; options?: string };
// On an error the typed text comes back, because the form clears itself after every submit.
export async function saveQuestion(orgId: string, _prev: QuestionState | undefined, form: FormData): Promise<QuestionState> {
    const link = await organizerOf(orgId);
    if (!link) return { error: "רק המארגנים יכולים לשנות את זה" };
    const typed = { text: String(form.get("text") ?? ""), options: String(form.get("options") ?? "") };
    // The options box is only on the form when "בחירה מאפשרויות" is picked.
    const options = form.has("options") ? typed.options.split("\n") : [];
    if (form.has("options") && options.filter((o) => o.trim()).length === 0) return { ...typed, error: "כתבו את האפשרויות, כל אחת בשורה" };
    const cleaned = cleanQuestion(String(form.get("text") ?? ""), options);
    if ("error" in cleaned) return { ...typed, error: cleaned.error };
    const settings = (link.org.settings ?? {}) as Record<string, unknown>;
    await db.organization.update({ where: { id: orgId }, data: { settings: { ...settings, celebration: { ...readCelebration(settings), question: cleaned.question } } as Prisma.InputJsonObject } });
    revalidatePath(`/orgs/${orgId}`);
    return { ok: Date.now() };
}

export async function removeQuestion(orgId: string): Promise<void> {
    const link = await organizerOf(orgId);
    if (!link) return;
    const settings = (link.org.settings ?? {}) as Record<string, unknown>;
    await db.organization.update({ where: { id: orgId }, data: { settings: { ...settings, celebration: { ...readCelebration(settings), question: null } } as Prisma.InputJsonObject } });
    revalidatePath(`/orgs/${orgId}`);
}
