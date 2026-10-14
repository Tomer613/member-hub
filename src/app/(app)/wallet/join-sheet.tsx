"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestJoin, searchOrgs, type OrgHit } from "../actions";

export const CATEGORIES = [
    { label: "ועד בית", packId: "hoa" },
    { label: "בית כנסת", packId: "synagogue" },
    { label: "חדר כושר", packId: "gym" },
    { label: "חוגים ומועדונים", packId: "club" },
];

// "Join an existing org": an invite code, or a search among orgs that chose to be found.
export function JoinSheet({ open, onClose, packId }: { open: boolean; onClose: () => void; packId?: string }) {
    const router = useRouter();
    const [code, setCode] = useState("");
    const [q, setQ] = useState("");
    const [hits, setHits] = useState<OrgHit[]>([]);
    const [sentTo, setSentTo] = useState<string | null>(null);
    const [pending, start] = useTransition();

    useEffect(() => {
        if (!open) return;
        const t = setTimeout(() => {
            start(async () => setHits(await searchOrgs(q, packId)));
        }, 250);
        return () => clearTimeout(t);
    }, [q, packId, open]);

    function close() {
        setSentTo(null);
        setQ("");
        setCode("");
        onClose();
    }

    return (
        <Modal open={open} onClose={close} title={sentTo ? "הבקשה נשלחה" : "הצטרפות לארגון"}>
            {sentTo ? (
                <div className="flex flex-col gap-3">
                    <p className="m-0 font-semibold">הבקשה שלכם נשלחה ל{sentTo}. תקבלו הודעה כשהמנהל יענה.</p>
                    <Button variant="secondary" onClick={close}>חזרה לארנק</Button>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    <form
                        className="flex items-end gap-2"
                        onSubmit={(e) => {
                            e.preventDefault();
                            const c = code.trim().split("/").pop() ?? "";
                            if (c) router.push(`/invite/${encodeURIComponent(c)}`);
                        }}
                    >
                        <div className="flex-1">
                            <Input label="יש לכם קוד או קישור הזמנה?" value={code} onChange={(e) => setCode(e.target.value)} ltr />
                        </div>
                        <Button variant="highlight" type="submit">המשך</Button>
                    </form>
                    <Input label="או חיפוש לפי שם ועיר" placeholder="למשל: מקהלה תל אביב" value={q} onChange={(e) => setQ(e.target.value)} />
                    <div className="flex flex-col gap-2" aria-busy={pending}>
                        {hits.map((o) => (
                            <button
                                key={o.id}
                                type="button"
                                onClick={() => start(async () => { const r = await requestJoin(o.id); if (r.ok) setSentTo(r.orgName ?? o.name); })}
                                className="flex min-h-[var(--mh-hit)] items-center gap-[10px] rounded-2xl border-2 border-[var(--mh-ink)] bg-white p-3 text-start"
                            >
                                <span className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border-2 border-[var(--mh-ink)] bg-[var(--mh-pastel-teal)] font-display">{o.name.slice(0, 1)}</span>
                                <span>
                                    <b className="block">{o.name}</b>
                                    {o.city && <span className="text-[13px] font-semibold text-[var(--mh-ink-soft)]">{o.city}</span>}
                                </span>
                            </button>
                        ))}
                        {!pending && (q.trim().length >= 2 || packId) && hits.length === 0 && (
                            <p className="m-0 font-semibold text-[var(--mh-ink-soft)]">לא מצאנו. יש ארגונים שמצטרפים אליהם רק בהזמנה.</p>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
}
