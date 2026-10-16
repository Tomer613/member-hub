"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { normalizeEmail, normalizePhone } from "@/lib/auth/contact";
import { sendEmail } from "@/lib/email";
import { DEFAULT_INVITE_TEXT, INVITE_DAYS, INVITE_TEXT_MAX, inviteText, markRows, readPerson } from "@/lib/import";
import { listedMember } from "@/lib/billing/member-money";
import { knownContacts, membersAdmin } from "@/lib/members-server";
import { notifyUsers } from "@/lib/notify-server";
import { randomToken } from "@/lib/org-setup";
import { appOrigin } from "@/lib/origin-server";
import { toWhatsAppNumber } from "@/lib/phone";

// Adding members (boards D-AdmAddMember, D-MAdmInvite, D-AdmImport1-3). Joining stays two-sided: an
// invitation is only an offer, and the person is in once they accept it. Only the owner and admins invite.

const CHANNELS = ["whatsapp", "sms", "email", "link"] as const;
type Channel = (typeof CHANNELS)[number];
const isChannel = (v: unknown): v is Channel => CHANNELS.includes(v as Channel);

async function inviter(orgId: string) {
    const a = await membersAdmin(orgId);
    if (!a?.canManage) return null;
    return { ...a, sender: a.me.firstName?.trim() || a.org.name };
}

const expiry = () => new Date(Date.now() + INVITE_DAYS * 86_400_000);
const splitName = (name: string) => {
    const [first = "", ...rest] = name.trim().split(/\s+/);
    return { firstName: first, lastName: rest.join(" ") };
};

// Only manual labels and active plans of this org.
async function cleanChoices(orgId: string, planId: string, labelIds: string[]) {
    const [plan, labels] = await Promise.all([
        planId ? db.plan.findFirst({ where: { id: planId, orgId, isActive: true }, select: { id: true } }) : null,
        labelIds.length ? db.membershipLabel.findMany({ where: { id: { in: labelIds }, orgId, assignment: "manual" }, select: { id: true } }) : [],
    ]);
    return { planId: plan?.id ?? null, labelIds: labels.map((l) => l.id) };
}

// Tells a person who already has an account, inside the app. The admin is never told whether they do.
async function tellInApp(kind: string, value: string, orgId: string, orgName: string, invitationId: string, token: string) {
    const c = await db.userContact.findUnique({ where: { kind_value: { kind, value } }, select: { userId: true } });
    if (c) await notifyUsers([c.userId], { orgId, kind: "action", topic: "invitation", refId: invitationId, text: `${orgName} מזמינים אתכם להצטרף`, href: `/invite/${token}`, actionLabel: "לצפייה בהזמנה" });
}

export type InviteResult = { error?: string; ok?: string; text?: string; link?: string; waHref?: string; smsHref?: string; again?: boolean };

// "שליחת הזמנה" to one person. WhatsApp and SMS open on the admin's own phone with the text ready (no
// messages service needed); email is sent by us; "קישור" gives the link to share any way.
export async function sendInvite(orgId: string, input: { name: string; contact: string; planId: string; labelIds: string[]; channel: string }): Promise<InviteResult> {
    const a = await inviter(orgId);
    if (!a) return { error: "רק מנהלי הארגון שולחים הזמנות." };
    if (!isChannel(input.channel)) return { error: "בחרו איך לשלוח." };
    const raw = input.contact.trim();
    const kind = raw.includes("@") ? "email" : "phone";
    const value = kind === "email" ? normalizeEmail(raw) : normalizePhone(raw);
    if (!raw) return { error: "כתבו מספר טלפון או מייל." };
    if (!value || (kind === "phone" && value.startsWith("+972") && (value.length < 12 || value.length > 13))) return { error: kind === "email" ? "כתובת המייל לא תקינה." : "מספר הטלפון לא תקין." };
    if (kind === "email" && (input.channel === "whatsapp" || input.channel === "sms")) return { error: "לוואטסאפ או SMS צריך מספר טלפון." };
    if (kind === "phone" && input.channel === "email") return { error: "למייל צריך כתובת מייל." };
    const known = await knownContacts(orgId);
    if ((kind === "phone" ? known.members.phones : known.members.emails).includes(value)) return { error: "זה כבר חבר בארגון." };
    const name = input.name.trim().slice(0, 80);
    const { origin } = await appOrigin();
    let inv = await db.invitation.findFirst({ where: { orgId, kind, value, status: "pending", expiresAt: { gt: new Date() } } });
    const again = !!inv;
    if (!inv) {
        const choices = await cleanChoices(orgId, input.planId, input.labelIds);
        // Someone already listed from a file gets their own record when they accept.
        const memberId = await listedMember(orgId, kind === "phone" ? value : null, kind === "email" ? value : null);
        inv = await db.invitation.create({ data: { orgId, kind, value, memberId, invitedById: a.userId, expiresAt: expiry(), linkToken: randomToken(16), name: name || null, channel: input.channel, ...choices } });
        await tellInApp(kind, value, orgId, a.org.name, inv.id, inv.linkToken!);
    }
    const link = `${origin}/invite/${inv.linkToken}`;
    const text = inviteText(DEFAULT_INVITE_TEXT, { name: inv.name ?? name, sender: a.sender, org: a.org.name, link });
    if (input.channel === "email") await sendEmail(value, `הזמנה להצטרף ל${a.org.name}`, text).catch(() => undefined);
    revalidatePath(`/orgs/${orgId}/members/add`);
    return {
        ok: again ? "כבר נשלחה הזמנה לפרטים האלה והיא עדיין בתוקף. אפשר לשלוח אותה שוב." : input.channel === "email" ? "ההזמנה נשלחה במייל." : "ההזמנה מוכנה לשליחה.",
        again,
        text,
        link,
        ...(kind === "phone" ? { waHref: `https://wa.me/${toWhatsAppNumber(value)}?text=${encodeURIComponent(text)}`, smsHref: `sms:${value}?&body=${encodeURIComponent(text)}` } : {}),
    };
}

export type ImportPerson = { line: number; name: string; phone: string; email: string; home: string; note: string };
export type ImportInput = { fileName: string; rowsInFile: number; people: ImportPerson[]; mode: string; channel: string; remind: boolean; template: string; planId: string; labelIds: string[] };

// The last step of the file import. Every row is checked again here, whatever the browser sent.
export async function runImport(orgId: string, input: ImportInput): Promise<{ error?: string; ok?: string }> {
    const a = await inviter(orgId);
    if (!a) return { error: "רק מנהלי הארגון מייבאים חברים." };
    const mode = input.mode === "list" ? "list" : "invite";
    if (mode === "invite" && !["whatsapp", "sms", "email"].includes(input.channel)) return { error: "בחרו ערוץ שליחה." };
    const template = input.template.trim().slice(0, INVITE_TEXT_MAX) || DEFAULT_INVITE_TEXT;
    const known = await knownContacts(orgId);
    const knownSets = { phones: new Set([...known.members.phones, ...known.listed.phones, ...known.pending.phones]), emails: new Set([...known.members.emails, ...known.listed.emails, ...known.pending.emails]) };
    const people = markRows(input.people.slice(0, 2000).map((p) => readPerson(p.line, { name: String(p.name ?? ""), phone: String(p.phone ?? ""), email: String(p.email ?? ""), home: String(p.home ?? ""), note: String(p.note ?? "") })), knownSets).filter((p) => !p.problem && !p.already);
    if (!people.length) return { error: "אין ברשימה אנשים חדשים לייבא." };
    if (mode === "invite" && input.channel === "email" && people.some((p) => !p.email)) return { error: "במייל אפשר לשלוח רק למי שיש לו כתובת. בחרו ערוץ אחר או הוציאו את מי שאין לו מייל." };
    if (mode === "invite" && input.channel !== "email" && people.some((p) => !p.phone)) return { error: "בוואטסאפ או SMS אפשר לשלוח רק למי שיש לו טלפון. בחרו מייל או הוציאו את מי שאין לו טלפון." };
    const choices = await cleanChoices(orgId, input.planId, input.labelIds);
    const batch = await db.importBatch.create({
        data: { orgId, fileName: input.fileName.slice(0, 120) || "קובץ", rows: Math.max(0, Math.min(input.rowsInFile, 100_000)), imported: people.length, mode, channel: mode === "invite" ? input.channel : null, remind: mode === "invite" && input.remind, createdById: a.userId },
    });
    const { origin } = await appOrigin();
    const homes = new Map<string, string>();
    let emailed = 0;
    for (const p of people) {
        const member = await db.member.create({ data: { orgId, ...splitName(p.name), phone: p.phone, email: p.email } });
        if (p.home) {
            let hid = homes.get(p.home);
            const first = !hid;
            if (!hid) {
                hid = (await db.household.upsert({ where: { orgId_label: { orgId, label: p.home } }, create: { orgId, label: p.home }, update: {} })).id;
                homes.set(p.home, hid);
            }
            await db.householdMember.create({ data: { orgId, householdId: hid, memberId: member.id, isHead: first, isPayer: first } });
        }
        if (mode === "list") {
            // Listed people get the plan and labels now; the person takes the record over when they join.
            if (choices.planId) await db.subscription.create({ data: { orgId, planId: choices.planId, memberId: member.id, startsOn: new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date())}T00:00:00Z`) } });
            for (const l of choices.labelIds) await db.memberLabel.create({ data: { orgId, labelId: l, memberId: member.id, assignedById: a.userId } });
            continue;
        }
        const kind = input.channel === "email" ? "email" : "phone";
        const value = (kind === "email" ? p.email : p.phone)!;
        const inv = await db.invitation.create({ data: { orgId, kind, value, memberId: member.id, invitedById: a.userId, expiresAt: expiry(), linkToken: randomToken(16), name: p.name || null, channel: input.channel, batchId: batch.id, ...choices } });
        await tellInApp(kind, value, orgId, a.org.name, inv.id, inv.linkToken!);
        if (kind === "email") {
            await sendEmail(value, `הזמנה להצטרף ל${a.org.name}`, inviteText(template, { name: p.name, sender: a.sender, org: a.org.name, link: `${origin}/invite/${inv.linkToken}` })).catch(() => undefined);
            emailed++;
        }
    }
    revalidatePath(`/orgs/${orgId}/members`, "layout");
    const n = people.length === 1 ? "אדם אחד" : `${people.length} אנשים`;
    if (mode === "list") return { ok: `יובאו ${n} כרשימה. כל אחד יתחבר לרשומה שלו כשיצטרף עם אותו טלפון או מייל.` };
    return { ok: emailed ? `נשלחו ${emailed === 1 ? "הזמנה אחת" : `${emailed} הזמנות`} במייל.` : `${people.length === 1 ? "ההזמנה נשמרה" : `${people.length} הזמנות נשמרו`}. הן יישלחו ב${input.channel === "sms" ? "SMS" : "וואטסאפ"} ברגע שיחובר שירות ההודעות.` };
}

// "שליחת הזמנה לדוגמה אליי": the admin gets the message as members will, inside the app.
export async function sendSample(orgId: string, template: string): Promise<{ ok?: string; error?: string }> {
    const a = await inviter(orgId);
    if (!a) return { error: "אין לכם הרשאה." };
    const { origin } = await appOrigin();
    const text = inviteText(template.trim().slice(0, INVITE_TEXT_MAX) || DEFAULT_INVITE_TEXT, { name: a.me.firstName ?? "", sender: a.sender, org: a.org.name, link: `${origin}/invite/…` });
    await notifyUsers([a.userId], { orgId, kind: "update", topic: "sample", text: `דוגמה להזמנה: ${text}` });
    return { ok: "שלחנו לך דוגמה. היא מחכה במסך ההודעות." };
}
