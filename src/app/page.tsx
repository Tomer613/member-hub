import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Landing from "@/components/landing/Landing";
import { getSession } from "@/lib/auth/session-server";

export const metadata: Metadata = {
    title: "PIRI · כל החברויות שלך, בארנק אחד",
    description: "ועד הבית, בית הכנסת, חדר הכושר והמועדון. כרטיס חבר, תשלומים והודעות, במקום אחד.",
};

// Signed-in people go straight to their wallet (decided 13.10.2026); everyone else sees the public home page.
export default async function Home() {
    if (await getSession()) redirect("/wallet");
    return <Landing />;
}
