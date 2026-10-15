"use client";

import { useActionState } from "react";
import { addInvited } from "./actions";

// Paste more invited phones from the organizer's page.
export function AddInvited({ orgId }: { orgId: string }) {
    const [state, action, pending] = useActionState(addInvited.bind(null, orgId), undefined);
    return (
        <form action={action} className="flex flex-col gap-2">
            <label className="flex flex-col gap-2">
                <span className="text-[14px] font-extrabold">להוסיף מוזמנים</span>
                <textarea name="phones" rows={3} dir="ltr" placeholder={"050-1234567\n052-7654321"} className="rounded-[14px] border-2 border-[var(--mh-ink)] bg-white px-[14px] py-3 text-end font-semibold outline-none placeholder:text-[var(--mh-ink-soft)] focus-visible:ring-[3px] focus-visible:ring-[var(--mh-ink)]" />
            </label>
            <button disabled={pending} className="inline-flex min-h-11 items-center justify-center self-start rounded-full border-[2.5px] border-[var(--mh-ink)] bg-white px-5 font-extrabold shadow-[var(--mh-shadow)] hover:bg-[var(--mh-ticket)] active:translate-y-[2px] active:shadow-none disabled:opacity-60">
                {pending ? "מוסיפים…" : "להוסיף לרשימה"}
            </button>
            {state && (
                <p role="status" className="m-0 font-bold">
                    {state.added === 1 ? "נוסף מספר אחד." : state.added ? `נוספו ${state.added} מספרים.` : "לא נוספו מספרים חדשים."}
                    {state.invalid && state.invalid.length > 0 && <span className="block text-[var(--mh-danger)]">לא הצלחנו לקרוא: <bdi dir="ltr">{state.invalid.join(", ")}</bdi></span>}
                </p>
            )}
        </form>
    );
}
