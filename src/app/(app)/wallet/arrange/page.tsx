import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session-server";
import { loadWallet } from "@/lib/wallet-server";
import { Arrange } from "./arrange";

export const metadata: Metadata = { title: "סידור הארנק · PIRI" };

// "סידור הארנק" (boards D-WalletEdit, D-WalletMove).
export default async function ArrangePage() {
    const session = await getSession();
    if (!session) redirect("/login?next=/wallet/arrange");
    const { items, mode, archived } = await loadWallet(session.userId, new Date());
    return (
        <Arrange
            mode={mode}
            archived={archived}
            rows={items.map((x) => ({ id: x.view.id, name: x.view.name, role: x.view.role, letter: x.view.letter, logo: x.view.logo, color: x.view.color, fg: x.view.fg, pinned: x.pinned, locked: x.locked }))}
        />
    );
}
