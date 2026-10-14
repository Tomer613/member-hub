import type { ContactKind } from "./contact";

// Delivers a one-time code. Email goes through Resend when RESEND_API_KEY is set. SMS needs a provider
// that is not chosen yet (VERIFY: provider, sender ID and international delivery per country,
// docs/open-questions.he.md, 13.10 item 9). Until then, and always in development, the code is printed
// to the server log so the flow can be tested end to end.

export async function sendCode(kind: ContactKind, value: string, code: string): Promise<void> {
    const text = `קוד הכניסה שלך: ${code}. הקוד תקף ל־10 דקות. אם לא ביקשתם קוד, אפשר להתעלם מההודעה.`;
    if (kind === "email" && process.env.RESEND_API_KEY) {
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                from: process.env.RESEND_FROM_EMAIL ?? "PIRI <no-reply@example.com>",
                to: [value],
                subject: `קוד הכניסה שלך: ${code}`,
                text,
            }),
        });
        if (!res.ok) throw new Error(`Email provider error ${res.status}`);
        return;
    }
    if (process.env.NODE_ENV === "production") {
        throw new Error(`No ${kind} provider configured`);
    }
    console.info(`[dev] sign-in code for ${value}: ${code}`);
}
