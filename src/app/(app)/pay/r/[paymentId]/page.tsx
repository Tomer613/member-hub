import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ilDate, ilDateTime, methodLabel } from "@/lib/billing/account";
import { orgLook } from "@/lib/billing/pay-server";
import { formatShekels } from "@/lib/money";
import { inOrg } from "@/lib/wallet";
import { ChargeCard, PayScreen, Row, Stamp, primaryBtn, secondaryBtn } from "@/components/pay/parts";
import { ownPayment } from "../../actions";

export const metadata: Metadata = { title: "תשלום · PIRI" };

// The result after paying or reporting (boards D-PaySuccess, D-PayFailed, D-PayManualSent). No header and
// no back button: the way on is one of the buttons.
export default async function PayResult({ params }: { params: Promise<{ paymentId: string }> }) {
    const { paymentId } = await params;
    const pay = await ownPayment(paymentId);
    if (!pay) notFound();
    const look = orgLook(pay.org, pay.member?.orgUser?.cardColor);
    const what = pay.allocations.map((a) => a.charge.description).join(", ");
    const ids = pay.allocations.map((a) => a.chargeId).join(",");

    if (pay.status === "failed") {
        const due = pay.allocations[0]?.charge;
        return (
            <PayScreen center>
                <Stamp bad>לא עבר</Stamp>
                <h1 className="m-0 mt-3 text-center font-display text-[28px] font-normal leading-tight">התשלום על <bdi>{formatShekels(pay.amountMinor)}</bdi> לא הושלם</h1>
                <div className="rounded-[18px] border-2 border-[#C4223B] bg-white p-4">
                    <b className="block text-[16px] text-[#C4223B]">{pay.failureReason ?? "התשלום לא אושר"}</b>
                    <p className="m-0 mt-1 text-[14px] font-bold text-[var(--mh-ink-soft)]">לא בוצע חיוב. אפשר לנסות שוב, לבחור אמצעי תשלום אחר, או לפנות לבנק.</p>
                </div>
                <p className="m-0 text-center text-[14px] font-bold text-[var(--mh-ink-soft)]">{pay.org.name} · {what}{due?.dueOn ? <>. עד <bdi>{ilDate(due.dueOn)}</bdi></> : null}</p>
                <Link href={`/pay/${pay.orgId}?c=${ids}`} className={primaryBtn}>לנסות שוב</Link>
                <Link href={`/pay/${pay.orgId}?c=${ids}&pick=1`} className={secondaryBtn}>בחירת אמצעי תשלום אחר</Link>
                <Link href={`/pay/${pay.orgId}/report?c=${ids}`} className="mx-auto inline-flex min-h-11 items-center text-[15px] font-extrabold underline underline-offset-4">שילמתי בדרך אחרת</Link>
            </PayScreen>
        );
    }

    if (pay.status === "pending" || pay.status === "rejected") {
        return (
            <PayScreen center>
                <Stamp>{pay.status === "pending" ? "נשלח" : "לא אושר"}</Stamp>
                <h1 className="m-0 mt-3 text-center font-display text-[28px] font-normal leading-tight">{pay.status === "pending" ? `הדיווח נשלח ${inOrg(pay.org.name).replace(/^ב/, "ל")}` : "הארגון לא אישר את הדיווח"}</h1>
                <p className="m-0 text-center text-[15px] font-bold text-[var(--mh-ink-soft)]">
                    {pay.status === "pending" ? "החיוב יסומן \"ממתין לאישור\" עד שהארגון יאשר שקיבל את התשלום." : "החיוב חזר להיות פתוח. אפשר לשלם באפליקציה או לדבר עם הארגון."}
                </p>
                <ChargeCard org={look} sub={what}>
                    <Row label="סכום">{formatShekels(pay.amountMinor)}</Row>
                    <Row label="איך שילמתם">{methodLabel(pay.method, null)}</Row>
                    <Row label="תאריך התשלום">{ilDate(pay.receivedAt)}</Row>
                </ChargeCard>
                <Link href="/wallet" className={primaryBtn}>חזרה לארנק</Link>
                <Link href={`/pay/history?org=${pay.orgId}`} className={secondaryBtn}>היסטוריית תשלומים</Link>
            </PayScreen>
        );
    }

    return (
        <PayScreen center>
            <Stamp>שולם</Stamp>
            <h1 className="m-0 mt-3 text-center font-display text-[28px] font-normal leading-tight">התשלום התקבל. תודה!</h1>
            <ChargeCard org={look} sub={what} tone="ok">
                <Row label="סכום">{formatShekels(pay.amountMinor)}</Row>
                <Row label="אמצעי תשלום">{methodLabel(pay.method, pay.cardLabel)}</Row>
                <Row label="תאריך">{ilDateTime(pay.receivedAt)}</Row>
                {pay.providerTxId && <Row label="אסמכתא">{pay.providerTxId}</Row>}
            </ChargeCard>
            <p className="m-0 text-center text-[14px] font-bold text-[var(--mh-ink-soft)]">הקבלה שמורה בארנק, בהיסטוריית התשלומים. אם יש מייל בחשבון, עותק נשלח גם אליו.</p>
            <Link href={`/pay/receipt/${pay.id}`} className={primaryBtn}>לקבלה</Link>
            <Link href="/wallet" className={secondaryBtn}>חזרה לארנק</Link>
        </PayScreen>
    );
}
