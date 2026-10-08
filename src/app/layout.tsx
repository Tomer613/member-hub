import type { Metadata } from "next";
import { Assistant, Secular_One } from "next/font/google";
import "./globals.css";

// next/font self-hosts the fonts at build time (no request to Google from the visitor's browser).
const body = Assistant({ subsets: ["hebrew", "latin"], weight: ["400", "600", "700", "800"], variable: "--font-body" });
const display = Secular_One({ subsets: ["hebrew", "latin"], weight: "400", variable: "--font-display" });

export const metadata: Metadata = {
    title: "MemberHub",
    description: "Membership and community management",
};

// RTL by default. The locale will come from the active organization once tenancy is wired up.
export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="he" dir="rtl" className={`${body.variable} ${display.variable}`}>
            <body>{children}</body>
        </html>
    );
}
