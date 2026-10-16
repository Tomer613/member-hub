import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ilDateTime, methodLabel } from "@/lib/billing/account";
import { orgLook } from "@/lib/billing/pay-server";
import { formatShekels } from "@/lib/money";
import { ChargeCard, PayHeader, PayScreen, Row } from "@/components/pay/parts";
import { ownPayment } from "../../actions";
import { ReceiptActions } from "./receipt-actions";

export const metadata: Metadata = { title: "קבלה · PIRI" };

// The receipt (board D-PayReceipt). Kept in the wallet for good; the official tax receipt is the org's,
// through its invoicing provider.
export default async function ReceiptPage({ params, searchParams }: { params: Promise<{ paymentId: string }>; searchParams: Promise<{ from?: string }> }) {
    const { paymentId } = await params;
    const { from } = await searchParams;
    const pay = await ownPayment(paymentId);
    if (!pay || !["succeeded", "refunded"].includes(pay.status)) notFound();
    const look = orgLook(pay.org, pay.member?.orgUser?.cardColor);
    return (
        <PayScreen wide>
            <span className="print:hidden"><PayHeader back={from === "history" ? `/pay/history?org=${pay.orgId}` : `/pay/r/${pay.id}`} title="קבלה" /></span>
            <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[1.2fr_1fr] lg:items-start lg:gap-6">
                <div className="flex flex-col gap-3">
                    <ChargeCard org={look} sub={<>קבלה מספר <bdi>{pay.receiptNo ?? "-"}</bdi></>} tone="ok">
                        <Row label="תאריך">{ilDateTime(pay.receivedAt)}</Row>
                        <Row label="שולם על ידי">{pay.payerName ?? `${pay.member?.firstName ?? ""} ${pay.member?.lastName ?? ""}`.trim()}</Row>
                        <Row label="עבור">{pay.allocations.map((a) => a.charge.description).join(", ")}</Row>
                        <Row label="אמצעי תשלום">{methodLabel(pay.method, pay.cardLabel)}</Row>
                        <hr className="my-1 border-0 border-t-2 border-[var(--mh-line-soft)]" />
                        <div className="flex items-baseline justify-between gap-3">
                            <span className="text-[15px] font-extrabold">סה״כ שולם</span>
                            <bdi className="font-display text-[32px] leading-none">{formatShekels(pay.amountMinor)}</bdi>
                        </div>
                        {pay.providerTxId && <Row label="אסמכתא">{pay.providerTxId}</Row>}
                        {pay.status === "refunded" && <p className="m-0 text-[14px] font-extrabold">התשלום הזה הוחזר.</p>}
                    </ChargeCard>
                    <p className="m-0 text-[12.5px] font-bold text-[var(--mh-ink-soft)]">הקבלה הרשמית מונפקת על ידי הארגון דרך ספק החשבוניות שלו, ושמורה כאן ללא הגבלת זמן.</p>
                </div>
                <ReceiptActions paymentId={pay.id} title={`קבלה מ${pay.org.name}`} />
            </div>
        </PayScreen>
    );
}
