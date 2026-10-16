"use server";

import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session-server";
import { allocate, ilDateTime, isReportMethod, methodLabel, NOTE_MAX, openCharges, payAmount } from "@/lib/billing/account";
import { memberCharges, nextReceiptNo, settleLeaver } from "@/lib/billing/member-money";
import { emailOf, payer } from "@/lib/billing/pay-server";
import { chargeCard } from "@/lib/payments/provider";
import { sendEmail } from "@/lib/email";
import { formatShekels, shekelsToMinor } from "@/lib/money";

// The charges this payment is for: the ones asked for, if they are still open and the member's own;
// otherwise everything open, soonest due first.
async function chosenCharges(orgId: string, memberId: string, ids: string[]) {
    const open = openCharges(await memberCharges(orgId, memberId));
    const picked = ids.length ? open.filter((c) => ids.includes(c.id)) : open;
    return picked;
}

const idsOf = (form: FormData) => String(form.get("charges") ?? "").split(",").map((s) => s.trim()).filter(Boolean);

// Saves a payment with its allocations and, when it went through, the next receipt number. A clash on the
// receipt number (two payments in the same org at the same moment) simply takes the next one.
async function savePayment(data: Omit<Prisma.PaymentUncheckedCreateInput, "allocations" | "receiptNo">, parts: { chargeId: string; amountMinor: number }[], numbered: boolean) {
    for (let attempt = 0; ; attempt++) {
        try {
            return await db.$transaction(async (tx) => {
                const receiptNo = numbered ? await nextReceiptNo(tx, data.orgId) : null;
                return tx.payment.create({ data: { ...data, receiptNo, allocations: { create: parts.map((p) => ({ orgId: data.orgId, chargeId: p.chargeId, amountMinor: p.amountMinor })) } } });
            });
        } catch (e) {
            if (attempt < 4 && e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") continue;
            throw e;
        }
    }
}

export type PayState = { error?: string };

// Pays the chosen charges by card through the processor (board D-PayCharge). The result screen follows
// either way: D-PaySuccess or D-PayFailed. A failed attempt is kept, with what it was for, so "לנסות שוב"
// knows what to retry; it never counts against a charge.
export async function payNow(_prev: PayState, form: FormData): Promise<PayState> {
    const orgId = String(form.get("orgId") ?? "");
    const p = await payer(orgId);
    if (!p) return { error: "אין לך כרטיס בארגון הזה." };
    const charges = await chosenCharges(orgId, p.member.id, idsOf(form));
    if (!charges.length) redirect(`/pay/history?org=${orgId}`);
    const left = charges.reduce((t, c) => t + c.leftMinor, 0);
    const typed = form.get("amount");
    const total = payAmount(typed === null ? null : (shekelsToMinor(String(typed)) ?? -1), left, charges);
    if (total === null) return { error: `הסכום צריך להיות בין ₪1 ל־${formatShekels(left)}.` };
    const outcome = await chargeCard(String(form.get("method") ?? ""), total);
    const parts = allocate(total, charges);
    const base = { orgId, memberId: p.member.id, amountMinor: total, method: "card", source: "app", payerName: `${p.link.user.firstName ?? ""} ${p.link.user.lastName ?? ""}`.trim() || null };
    if (!outcome.ok) {
        const failed = await savePayment({ ...base, status: "failed", failureReason: outcome.reason }, parts, false);
        redirect(`/pay/r/${failed.id}`);
    }
    const paid = await savePayment({ ...base, status: "succeeded", provider: outcome.provider, providerTxId: outcome.txId, cardLabel: outcome.cardLabel }, parts, true);
    await settleLeaver(orgId, p.member.id);
    const email = emailOf(p.link.user.contacts);
    if (email) {
        await sendEmail(
            email,
            `קבלה מ${p.org.name}: ${formatShekels(total)}`,
            `התשלום התקבל. תודה!\n${charges.map((c) => c.description).join(", ")}\nסכום: ${formatShekels(total)}\nתאריך: ${ilDateTime(paid.receivedAt)}\nאסמכתא: ${outcome.txId}\nהקבלה שמורה גם בארנק, בהיסטוריית התשלומים.`,
        ).catch(() => undefined);
    }
    redirect(`/pay/r/${paid.id}`);
}

export type ReportState = { error?: string; method?: string; date?: string; note?: string };
const MAX_PROOF = 400_000; // characters of a data URL, after the browser shrank the photo

// "שילמתי מחוץ לאפליקציה" (board D-PayManual): the report waits as "ממתין לאישור" until the org confirms.
export async function reportPayment(_prev: ReportState, form: FormData): Promise<ReportState> {
    const orgId = String(form.get("orgId") ?? "");
    const method = String(form.get("method") ?? "bank");
    const dateRaw = String(form.get("date") ?? "");
    const note = String(form.get("note") ?? "").trim().slice(0, NOTE_MAX);
    const proof = String(form.get("proof") ?? "");
    const typed = { method, date: dateRaw, note };
    const p = await payer(orgId);
    if (!p) return { ...typed, error: "אין לך כרטיס בארגון הזה." };
    if (!isReportMethod(method)) return { ...typed, error: "בחרו איך שילמתם." };
    const date = /^\d{4}-\d{2}-\d{2}$/.test(dateRaw) ? new Date(`${dateRaw}T12:00:00Z`) : null;
    if (!date || Number.isNaN(date.getTime()) || date.getTime() > Date.now() + 86_400_000 || date.getFullYear() < 2000) return { ...typed, error: "התאריך לא תקין." };
    if (proof && (!/^data:image\/(jpeg|png|webp);base64,/.test(proof) || proof.length > MAX_PROOF)) return { ...typed, error: "את התמונה לא הצלחנו לצרף. נסו תמונה אחרת." };
    const charges = await chosenCharges(orgId, p.member.id, idsOf(form));
    if (!charges.length) redirect(`/pay/history?org=${orgId}`);
    const total = charges.reduce((t, c) => t + c.leftMinor, 0);
    const saved = await savePayment(
        { orgId, memberId: p.member.id, amountMinor: total, method, source: "report", status: "pending", receivedAt: date, note: note || null, proof: proof || null, payerName: `${p.link.user.firstName ?? ""} ${p.link.user.lastName ?? ""}`.trim() || null },
        allocate(total, charges),
        false,
    );
    redirect(`/pay/r/${saved.id}`);
}

// A payment the signed-in person may see: their own, in an org where they still hold a card.
export async function ownPayment(paymentId: string) {
    const session = await getSession();
    if (!session) return null;
    const pay = await db.payment.findUnique({
        where: { id: paymentId },
        include: { org: true, member: { include: { orgUser: true } }, allocations: { include: { charge: true } } },
    });
    if (!pay || pay.member?.orgUser?.userId !== session.userId) return null;
    return pay;
}

export async function emailReceipt(paymentId: string): Promise<{ ok: boolean; message: string }> {
    const pay = await ownPayment(paymentId);
    if (!pay || pay.status !== "succeeded") return { ok: false, message: "הקבלה לא נמצאה." };
    const contacts = await db.userContact.findMany({ where: { userId: pay.member!.orgUser!.userId } });
    const email = emailOf(contacts);
    if (!email) return { ok: false, message: "אין מייל בחשבון. אפשר להוסיף בהגדרות." };
    await sendEmail(
        email,
        `קבלה מספר ${pay.receiptNo} מ${pay.org.name}`,
        `${pay.allocations.map((a) => a.charge.description).join(", ")}\nסה״כ שולם: ${formatShekels(pay.amountMinor)}\nתאריך: ${ilDateTime(pay.receivedAt)}\nאמצעי תשלום: ${methodLabel(pay.method, pay.cardLabel)}\nאסמכתא: ${pay.providerTxId ?? "-"}`,
    );
    return { ok: true, message: "הקבלה נשלחה למייל." };
}
