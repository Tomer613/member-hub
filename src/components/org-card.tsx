import { onColor } from "@/lib/color";
import { initialOf } from "@/lib/org-setup";

// The organization's card as members see it in the wallet: a header in the org color with the logo
// (or the first letter of the name), the name and the city. Used by the setup wizard's live preview,
// the join link page and the overview.
export function OrgCard({ name, city, color, logo, note, size = "md" }: {
    name: string;
    city?: string | null;
    color: string;
    logo?: string | null;
    note?: string;
    size?: "md" | "lg";
}) {
    const ink = onColor(color);
    const big = size === "lg";
    return (
        <div className="overflow-hidden rounded-[22px] border-[2.5px] border-[var(--mh-ink)] bg-[var(--mh-ticket)] shadow-[var(--mh-shadow)]">
            <div className={`flex items-center gap-3 border-b-[2.5px] border-[var(--mh-ink)] transition-colors duration-300 ${big ? "min-h-[104px] px-5" : "min-h-[80px] px-4"}`} style={{ background: color, color: ink }}>
                <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-[2.5px] border-[var(--mh-ink)] bg-white font-display text-[var(--mh-ink)] ${big ? "h-[60px] w-[60px] text-[28px]" : "h-12 w-12 text-[22px]"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- the logo is an inline data URL */}
                    {logo ? <img src={logo} alt="" className="h-full w-full object-cover" /> : initialOf(name) || "?"}
                </span>
                <span className="flex min-w-0 flex-col">
                    <b className={`truncate font-display leading-[1.15] ${big ? "text-[26px]" : "text-[21px]"}`}>{name || "שם הארגון"}</b>
                    {city && <span className="truncate text-[14px] font-bold opacity-90">{city}</span>}
                </span>
            </div>
            {note && <p className="m-0 px-4 py-3 text-[15px] font-semibold text-[var(--mh-ink-soft)]">{note}</p>}
        </div>
    );
}
