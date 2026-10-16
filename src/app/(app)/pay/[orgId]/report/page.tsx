import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session-server";
import { openCharges } from "@/lib/billing/account";
import { memberCharges } from "@/lib/billing/member-money";
import { payer } from "@/lib/billing/pay-server";
import { formatShekels } from "@/lib/money";
import { ChargeCard, PayHeader, PayScreen, Row } from "@/components/pay/parts";
import { ReportForm } from "./report-form";

export const metadata: Metadata = { title: "דיווח על תשלום · PIRI" };

// "שילמתי מחוץ לאפליקציה" (board D-PayManual).
export default async function ReportPage({ params, searchParams }: { params: Promise<{ orgId: string }>; searchParams: Promise<{ c?: string }> }) {
    const { orgId } = await params;
    const { c } = await searchParams;
    const p = await payer(orgId);
    if (!p) {
        if (!(await getSession())) redirect(`/login?next=/pay/${orgId}/report`);
        notFound();
    }
    const asked = (c ?? "").split(",").filter(Boolean);
    const open = openCharges(await memberCharges(orgId, p.member.id));
    const charges = asked.length ? open.filter((x) => asked.includes(x.id)) : open;
    if (!charges.length) redirect(`/pay/history?org=${orgId}`);
    const total = charges.reduce((t, x) => t + x.leftMinor, 0);
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
    return (
        <PayScreen wide>
            <PayHeader back={`/pay/${orgId}?c=${charges.map((x) => x.id).join(",")}`} title="דיווח על תשלום" />
            <div className="flex flex-1 flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
                <div className="flex flex-col gap-3">
                    <p className="m-0 text-[16px] font-bold">שילמתם מחוץ לאפליקציה? ספרו לארגון, והוא יאשר.</p>
                    <ChargeCard org={p.look} sub={charges.length === 1 ? charges[0].description : `${charges.length} חיובים`}>
                        <Row label="סכום לתשלום" big>{formatShekels(total)}</Row>
                    </ChargeCard>
                </div>
                <ReportForm orgId={orgId} charges={charges.map((x) => x.id).join(",")} today={today} />
            </div>
        </PayScreen>
    );
}
