import Link from "next/link";
import type { ReactNode } from "react";

// Shared pieces of the payment screens (boards D-PayCharge, D-PaySuccess, D-PayFailed, D-PayHistory,
// D-PayManual, D-PayReceipt; docs/boards-spec/2-payments-account.he.md "משותף").

// The yellow screen. A narrow column on phones; on wide screens the content may split into two columns
// and grows with the screen, so nothing floats in an empty field.
export function PayScreen({ children, wide = false, center = false }: { children: ReactNode; wide?: boolean; center?: boolean }) {
    return (
        <main className="min-h-dvh overflow-x-clip bg-[var(--mh-sun)]">
            <div className={`mx-auto flex min-h-dvh w-full flex-col gap-3 px-4 py-[18px] ${wide ? "max-w-[480px] lg:max-w-[980px] lg:justify-center lg:[zoom:1.15] min-[1800px]:[zoom:1.45]" : "max-w-[480px] lg:[zoom:1.25] min-[1800px]:[zoom:1.6]"} ${center ? "justify-center" : ""}`}>
                {children}
            </div>
        </main>
    );
}

export function PayHeader({ back, title }: { back: string; title: string }) {
    return (
        <header className="flex items-center gap-3">
            <Link href={back} aria-label="חזרה" className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-white shadow-[0_3px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            </Link>
            <h1 className="m-0 font-display text-[28px] font-normal leading-tight">{title}</h1>
        </header>
    );
}

export type OrgLook = { name: string; letter: string; color: string; fg: string };

export function OrgDot({ org, size = 40 }: { org: OrgLook; size?: number }) {
    return (
        <span aria-hidden="true" className="inline-flex shrink-0 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] font-display" style={{ width: size, height: size, background: org.color, color: org.fg, fontSize: size * 0.42 }}>
            {org.letter}
        </span>
    );
}

// The charge card: cream, a head strip whose tint tells the state, and "label | value" rows.
export function ChargeCard({ org, sub, tone = "plain", children }: { org: OrgLook; sub: ReactNode; tone?: "plain" | "ok" | "org"; children: ReactNode }) {
    const head = tone === "ok" ? { background: "var(--mh-tint-ok)" } : tone === "org" ? { background: org.color, color: org.fg } : { background: "var(--mh-ticket)" };
    return (
        <section className="overflow-hidden rounded-[20px] border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-ticket)] shadow-[0_4px_0_var(--mh-ink)]">
            <div className="flex min-h-[60px] items-center gap-3 border-b-2 border-[var(--mh-ink)] px-[14px] py-2" style={head}>
                <OrgDot org={org} size={44} />
                <span className="flex min-w-0 flex-col">
                    <b className="truncate text-[15px] leading-tight">{org.name}</b>
                    <span className="text-[13px] font-semibold opacity-80">{sub}</span>
                </span>
            </div>
            <div className="flex flex-col gap-[10px] px-4 py-[14px]">{children}</div>
        </section>
    );
}

export function Row({ label, children, big = false }: { label: string; children: ReactNode; big?: boolean }) {
    return (
        <div className="flex items-baseline justify-between gap-3">
            <span className="text-[14px] font-bold text-[var(--mh-ink-soft)]">{label}</span>
            <bdi className={big ? "font-display text-[34px] font-normal leading-none" : "text-[15px] font-extrabold"}>{children}</bdi>
        </div>
    );
}

const btn = "inline-flex min-h-[52px] w-full items-center justify-center rounded-[26px] border-[2.5px] border-[var(--mh-ink)] px-5 text-[17px] font-extrabold transition-transform duration-150";
export const primaryBtn = `${btn} bg-[var(--mh-sun)] shadow-[0_3px_0_var(--mh-ink)] hover:-translate-y-px active:translate-y-[2px] active:shadow-none disabled:translate-y-0 disabled:border-[#B8AFC7] disabled:bg-[#DDD6EA] disabled:text-[var(--mh-ink-soft)] disabled:shadow-none`;
export const inkBtn = `${btn} bg-[var(--mh-ink)] text-white shadow-[0_3px_0_rgba(30,22,51,0.35)] hover:-translate-y-px active:translate-y-[2px] disabled:opacity-60`;
export const secondaryBtn = `${btn} border-2 bg-white hover:-translate-y-px active:translate-y-[2px]`;
export const smallBtn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-[22px] border-2 border-[var(--mh-ink)] bg-white px-4 text-[15px] font-extrabold transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px]";

// A result stamp, tilted like a rubber stamp (red when it failed).
export function Stamp({ children, bad = false }: { children: ReactNode; bad?: boolean }) {
    const c = bad ? "#C4223B" : "var(--mh-ink)";
    return (
        <span className="pay-stamp mx-auto inline-block -rotate-6 rounded-[14px] border-[3px] bg-white px-6 py-1 font-display text-[36px] font-normal leading-tight" style={{ borderColor: c, color: c, boxShadow: `0 4px 0 ${bad ? "#C4223B" : "#1E1633"}` }}>
            {children}
        </span>
    );
}

export function Hint({ children, icon }: { children: ReactNode; icon?: string }) {
    return (
        <p className="m-0 flex items-start gap-2 text-[14px] font-bold text-[var(--mh-ink-soft)]">
            {icon && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-[1px] shrink-0"><path d={icon} /></svg>}
            <span>{children}</span>
        </p>
    );
}

export const LOCK = "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4";
export const RECEIPT = "M6 2h12v20l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6M9 15h4";

// Status tags on the history rows.
export function StatusTag({ status }: { status: "unpaid" | "paid" | "refunded" | "pending" | "rejected" }) {
    const look = {
        unpaid: { text: "לא שולם", cls: "border-[#C4223B] text-[#C4223B] bg-white" },
        paid: { text: "שולם", cls: "border-[var(--mh-ink)] bg-white" },
        refunded: { text: "הוחזר", cls: "border-[var(--mh-ink)] bg-white" },
        pending: { text: "ממתין לאישור", cls: "border-[var(--mh-ink)] bg-[#E3DDFF]" },
        rejected: { text: "לא אושר", cls: "border-[#C4223B] text-[#C4223B] bg-white" },
    }[status];
    return <span className={`inline-block rounded-[12px] border-2 px-2 text-[12px] font-extrabold ${look.cls}`}>{look.text}</span>;
}
