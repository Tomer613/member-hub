import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session-server";
import { ilDate, openCharges } from "@/lib/billing/account";
import { memberCharges } from "@/lib/billing/member-money";
import { emailOf, payer } from "@/lib/billing/pay-server";
import { paymentsMode, savedMethods } from "@/lib/payments/provider";
import { formatShekels } from "@/lib/money";
import { ChargeCard, Hint, PayHeader, PayScreen, RECEIPT, Row } from "@/components/pay/parts";
import { PayForm } from "./pay-form";

export const metadata: Metadata = { title: "תשלום · PIRI" };

// Paying a charge (board D-PayCharge). ?c= picks charges; without it, everything open in this org.
export default async function PayPage({ params, searchParams }: { params: Promise<{ orgId: string }>; searchParams: Promise<{ c?: string; pick?: string }> }) {
    const { orgId } = await params;
    const { c, pick } = await searchParams;
    const p = await payer(orgId);
    if (!p) {
        if (!(await getSession())) redirect(`/login?next=/pay/${orgId}`);
        notFound();
    }
    const asked = (c ?? "").split(",").filter(Boolean);
    const open = openCharges(await memberCharges(orgId, p.member.id));
    const charges = asked.length ? open.filter((x) => asked.includes(x.id)) : open;
    if (!charges.length) redirect(`/pay/history?org=${orgId}`);
    const total = charges.reduce((t, x) => t + x.leftMinor, 0);
    const email = emailOf(p.link.user.contacts);
    const ids = charges.map((x) => x.id).join(",");
    return (
        <PayScreen wide>
            <PayHeader back={`/card/${orgId}`} title="תשלום" />
            <div className="flex flex-1 flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
                <div className="flex flex-col gap-3">
                    <ChargeCard org={p.look} sub={charges.length === 1 ? charges[0].description : `${charges.length} חיובים`}>
                        {charges.length > 1 && charges.map((x) => <Row key={x.id} label={x.description}>{formatShekels(x.leftMinor)}</Row>)}
                        <Row label="סכום לתשלום" big>{formatShekels(total)}</Row>
                        <Row label="לתשלום עד">{ilDate(charges[0].due)}</Row>
                    </ChargeCard>
                    <Hint icon={RECEIPT}>
                        {email ? (
                            <>הקבלה תישמר בארנק, ותישלח גם למייל <bdi dir="ltr">{email}</bdi>{" "}</>
                        ) : (
                            <>הקבלה תישמר בארנק. כדי לקבל עותק במייל, אפשר להוסיף מייל{" "}</>
                        )}
                        <Link href="/settings" className="inline-flex min-h-11 min-w-11 items-center underline underline-offset-4">{email ? "שינוי" : "בהגדרות"}</Link>
                    </Hint>
                </div>
                <PayForm orgId={orgId} charges={ids} total={formatShekels(total)} partialMax={charges.every((x) => x.partial) ? total : null} methods={await savedMethods()} mode={paymentsMode()} openSheet={pick === "1"} />
            </div>
        </PayScreen>
    );
}
