import { formatShekels } from "@/lib/celebration";

// "נאסף ₪X מתוך ₪Y" with a bar that fills toward the target (a celebration's money).
export function CollectBar({ collected, target, note }: { collected: number; target: number; note?: string }) {
    const pct = Math.min(100, (collected / target) * 100);
    return (
        <div className="flex flex-col gap-2">
            <span className="text-[18px] font-extrabold">נאסף <bdi>{formatShekels(collected)}</bdi> מתוך <bdi>{formatShekels(target)}</bdi></span>
            <div className="h-4 overflow-hidden rounded-full border-2 border-[var(--mh-ink)] bg-white" role="progressbar" aria-label="כמה כבר נאסף" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
                <div className="h-full bg-[var(--mh-ok)] transition-[width] duration-500" style={{ width: `${pct}%` }} />
            </div>
            {note && <span className="text-[14px] font-semibold text-[var(--mh-ink-soft)]">{note}</span>}
        </div>
    );
}
