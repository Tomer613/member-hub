import Link from "next/link";
import { OrgDot, type OrgLook } from "@/components/pay/parts";

const big = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-[2.5px] border-[var(--mh-ink)] px-6 text-[17px] font-extrabold shadow-[0_3px_0_var(--mh-ink)] transition-transform duration-150 hover:-translate-y-px active:translate-y-[2px] active:shadow-none disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none";
export const bigBtn = `${big} bg-[var(--mh-sun)]`;
export const bigBtnPlain = `${big} bg-white hover:bg-[var(--mh-ticket)]`;

// The org-colored bar at the top of a member's screens in one org: back, the title and the org.
export function MemberHeader({ back, backLabel, title, org, max = "max-w-[760px]" }: { back: string; backLabel: string; title: string; org: OrgLook; max?: string }) {
    return (
        <header className="sticky top-0 z-20 border-b-[2.5px] border-[var(--mh-ink)]" style={{ background: org.color, color: org.fg }}>
            <div className={`mx-auto flex ${max} items-center gap-3 px-4 py-3`}>
                <Link href={back} aria-label={backLabel} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-[var(--mh-ink)] bg-white text-[var(--mh-ink)] transition-transform hover:scale-105">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
                </Link>
                <span className="flex min-w-0 flex-1 flex-col">
                    <h1 className="m-0 font-display text-[24px] leading-tight">{title}</h1>
                    <span className="truncate text-[14px] font-bold">{org.name}</span>
                </span>
                <OrgDot org={org} size={40} />
            </div>
        </header>
    );
}
