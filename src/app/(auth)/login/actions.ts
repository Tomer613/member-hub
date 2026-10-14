"use server";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { CODE_TTL_MS, MAX_ATTEMPTS_PER_CODE, RESEND_AFTER_MS, codeMatches, generateCode, hashCode } from "@/lib/auth/code";
import { maskContact, normalizeContact, normalizePhone, type ContactKind } from "@/lib/auth/contact";
import { sendCode } from "@/lib/auth/send-code";
import { lockedSeconds, record } from "@/lib/auth/throttle-store";
import { requestInfo, startSession } from "@/lib/auth/session-server";
import { destinationAfterLogin } from "@/lib/auth/destination";

// Sign-in and sign-up share one flow (decided 13.10.2026): type a phone or email, get a code, type it.
// Every answer is the same whether or not the contact has an account; only after a correct code do we
// either sign the person in or ask a new person for their name.

const SIGNUP_COOKIE = "mh_signup";
const SIGNUP_TTL_SECONDS = 20 * 60;

export type Flow = { next?: string | null; intent?: string | null; invite?: string | null };

function secret() {
    const s = process.env.SESSION_SECRET;
    if (!s) throw new Error("SESSION_SECRET is not set");
    return s;
}

async function throttleKeys(kind: ContactKind, value: string) {
    const { ip } = await requestInfo();
    return [`${kind}:${value}`, ...(ip ? [`ip:${ip}`] : [])];
}

export type SendResult =
    | { ok: true; value: string; masked: string; resendIn: number }
    | { ok: false; error: "invalid" | "failed" }
    | { ok: false; locked: number };

// Also used to verify a new number in the "no access to my phone" flow and to add a backup contact.
export async function requestCode(kind: ContactKind, raw: string): Promise<SendResult> {
    const value = normalizeContact(kind, raw);
    if (!value) return { ok: false, error: "invalid" };
    const keys = await throttleKeys(kind, value);
    const already = await lockedSeconds(keys);
    if (already) return { ok: false, locked: already };

    const last = await db.contactChallenge.findFirst({ where: { kind, value, consumedAt: null }, orderBy: { createdAt: "desc" } });
    const sinceLast = last ? Date.now() - last.createdAt.getTime() : Infinity;
    if (sinceLast < RESEND_AFTER_MS) {
        return { ok: true, value, masked: maskContact(kind, value), resendIn: Math.ceil((RESEND_AFTER_MS - sinceLast) / 1000) };
    }

    const locked = await record(keys, "send");
    if (locked) return { ok: false, locked };

    const code = generateCode();
    await db.contactChallenge.updateMany({ where: { kind, value, consumedAt: null }, data: { consumedAt: new Date() } });
    await db.contactChallenge.create({ data: { kind, value, codeHash: hashCode(code, value, secret()), expiresAt: new Date(Date.now() + CODE_TTL_MS) } });
    try {
        await sendCode(kind, value, code);
    } catch (e) {
        console.error("sendCode failed", e);
        return { ok: false, error: "failed" };
    }
    const info = await requestInfo();
    await db.securityEvent.create({ data: { kind: "code_sent", contact: value, ip: info.ip, city: info.city, userAgent: info.ua } });
    return { ok: true, value, masked: maskContact(kind, value), resendIn: RESEND_AFTER_MS / 1000 };
}

type CheckResult = { ok: true } | { ok: false; error: "wrong" | "expired" } | { ok: false; locked: number };

// Consumes the code when it is right. Wrong codes count toward the growing lockout.
async function checkCode(kind: ContactKind, value: string, code: string): Promise<CheckResult> {
    const keys = await throttleKeys(kind, value);
    const already = await lockedSeconds(keys);
    if (already) return { ok: false, locked: already };
    const ch = await db.contactChallenge.findFirst({ where: { kind, value, consumedAt: null }, orderBy: { createdAt: "desc" } });
    if (ch && ch.expiresAt > new Date() && ch.attempts < MAX_ATTEMPTS_PER_CODE && codeMatches(code, value, ch.codeHash, secret())) {
        await db.contactChallenge.update({ where: { id: ch.id }, data: { consumedAt: new Date() } });
        await record(keys, "success");
        return { ok: true };
    }
    if (ch) await db.contactChallenge.update({ where: { id: ch.id }, data: { attempts: { increment: 1 } } });
    const info = await requestInfo();
    await db.securityEvent.create({ data: { kind: "code_failed", contact: value, ip: info.ip, city: info.city, userAgent: info.ua } });
    const locked = await record(keys, "failure");
    if (locked) return { ok: false, locked };
    return { ok: false, error: ch && ch.expiresAt <= new Date() ? "expired" : "wrong" };
}

export type VerifyResult =
    | { ok: true; goTo: string }
    | { ok: true; needsName: true; first: string; last: string }
    | { ok: false; error: "wrong" | "expired" }
    | { ok: false; locked: number };

export async function verifyCode(kind: ContactKind, value: string, code: string, remember: boolean, flow: Flow): Promise<VerifyResult> {
    const res = await checkCode(kind, value, code);
    if (!res.ok) return res;
    const contact = await db.userContact.findUnique({ where: { kind_value: { kind, value } } });
    if (contact) {
        await startSession(contact.userId, remember);
        return { ok: true, goTo: destinationAfterLogin(flow) };
    }
    // New person: remember the verified contact for a few minutes while they type their name.
    const ticket = await new SignJWT({ kind, value, remember })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime(`${SIGNUP_TTL_SECONDS}s`)
        .sign(new TextEncoder().encode(secret()));
    (await cookies()).set(SIGNUP_COOKIE, ticket, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SIGNUP_TTL_SECONDS });
    const prefill = await invitePrefill(flow.invite);
    return { ok: true, needsName: true, first: prefill?.first ?? "", last: prefill?.last ?? "" };
}

export type SignupResult = { ok: true; goTo: string } | { ok: false; error: "names" | "expired" };

export async function completeSignup(firstName: string, lastName: string, flow: Flow): Promise<SignupResult> {
    const first = firstName.trim().slice(0, 60), last = lastName.trim().slice(0, 60);
    if (!first || !last) return { ok: false, error: "names" };
    const jar = await cookies();
    const raw = jar.get(SIGNUP_COOKIE)?.value;
    if (!raw) return { ok: false, error: "expired" };
    let ticket: { kind: ContactKind; value: string; remember: boolean };
    try {
        const { payload } = await jwtVerify(raw, new TextEncoder().encode(secret()));
        ticket = payload as unknown as typeof ticket;
    } catch {
        return { ok: false, error: "expired" };
    }
    // If the same contact finished sign-up in another tab meanwhile, sign in to that account instead.
    const existing = await db.userContact.findUnique({ where: { kind_value: { kind: ticket.kind, value: ticket.value } } });
    const userId =
        existing?.userId ??
        (
            await db.user.create({
                data: {
                    firstName: first,
                    lastName: last,
                    displayName: `${first} ${last}`,
                    contacts: { create: { kind: ticket.kind, value: ticket.value, isPrimary: true } },
                },
            })
        ).id;
    jar.delete(SIGNUP_COOKIE);
    await startSession(userId, ticket.remember);
    if (!existing) await db.securityEvent.create({ data: { userId, kind: "signup", contact: ticket.value } });
    return { ok: true, goTo: destinationAfterLogin(flow) };
}

// The invitation behind an invite link: its org for the "הוזמנתם ל..." line, and the name the admin typed.
export async function invitePrefill(token: string | null | undefined) {
    if (!token) return null;
    const inv = await db.invitation.findUnique({ where: { linkToken: token }, include: { org: true } });
    if (!inv || inv.status !== "pending" || inv.expiresAt < new Date()) return null;
    const member = inv.memberId ? await db.member.findUnique({ where: { id: inv.memberId } }) : null;
    return { orgName: inv.org.name, first: member?.firstName ?? "", last: member?.lastName ?? "" };
}

// "No access to my phone" (decided 13.10.2026): the person proves the new number with a code and names an
// org they belong to; an admin of that org confirms, then a 3-day wait with a notice to the old number.
// The answer is always the same, so the form cannot be used to learn who is registered or where.
export async function requestPhoneChange(oldRaw: string, newRaw: string, code: string, orgName: string): Promise<CheckResult | { ok: true }> {
    const oldValue = normalizePhone(oldRaw), newValue = normalizePhone(newRaw);
    if (!oldValue || !newValue) return { ok: false, error: "wrong" };
    const res = await checkCode("phone", newValue, code);
    if (!res.ok) return res;
    const owner = await db.userContact.findUnique({ where: { kind_value: { kind: "phone", value: oldValue } } });
    const taken = await db.userContact.findUnique({ where: { kind_value: { kind: "phone", value: newValue } } });
    const name = orgName.trim();
    if (owner && !taken && name.length >= 2) {
        const membership = await db.orgUser.findFirst({
            where: { userId: owner.userId, status: "active", org: { name: { contains: name, mode: "insensitive" } } },
        });
        if (membership) {
            await db.phoneChangeRequest.create({ data: { userId: owner.userId, orgId: membership.orgId, oldValue, newValue } });
            await db.securityEvent.create({ data: { userId: owner.userId, kind: "phone_change_requested", contact: newValue } });
        }
    }
    return { ok: true };
}
