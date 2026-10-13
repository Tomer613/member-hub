import type { Metadata } from "next";
import Landing from "@/components/landing/Landing";

export const metadata: Metadata = {
    title: "PIRI · כל החברויות שלך, בארנק אחד",
    description: "ועד הבית, בית הכנסת, חדר הכושר והמועדון. כרטיס חבר, תשלומים והודעות, במקום אחד.",
};

export default function Home() {
    return <Landing />;
}
