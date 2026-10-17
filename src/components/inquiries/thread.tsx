import type { ThreadItem } from "@/lib/inquiries-server";

// The conversation of one inquiry. The viewer's own side sits at the start (right in Hebrew), the other side
// at the end. An internal note is yellow and dashed, and says only managers see it.
export function Thread({ items, mine }: { items: ThreadItem[]; mine: "member" | "org" }) {
    if (!items.length) return <p className="m-0 rounded-[14px] bg-[var(--mh-ticket)] p-3 font-bold">נשלחה בלי פירוט.</p>;
    return (
        <ol className="m-0 flex list-none flex-col gap-3 p-0" aria-label="השיחה">
            {items.map((m) => {
                const own = m.side === mine;
                return (
                    <li key={m.id} className={`flex max-w-[88%] flex-col gap-1 rounded-[18px] border-2 border-[var(--mh-ink)] p-3 ${own ? "self-start" : "self-end"} ${m.internal ? "border-dashed bg-[#FFF6D1]" : own ? "bg-white" : "bg-[#E3DDFF]"}`}>
                        <span className="flex flex-wrap items-baseline gap-x-2 text-[13px] font-bold text-[var(--mh-ink-soft)]">
                            <b className="text-[14px] text-[var(--mh-ink)]">{m.author}</b>
                            <span>{m.when}</span>
                            {m.internal && <span className="rounded-full bg-[var(--mh-sun)] px-2 text-[12px] font-extrabold text-[var(--mh-ink)]">הערה פנימית · רק מנהלים רואים</span>}
                        </span>
                        <p className="m-0 whitespace-pre-line font-semibold leading-relaxed">{m.body}</p>
                    </li>
                );
            })}
        </ol>
    );
}
