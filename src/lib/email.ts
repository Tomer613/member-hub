// Sends a plain email through Resend when RESEND_API_KEY is set. Until the keys are in place
// (docs/waiting-for-services.he.md, "מייל"), and always in development, the email is printed to the
// server log instead, so flows that send mail can be tried end to end.
export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
    if (process.env.RESEND_API_KEY) {
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL ?? "PIRI <no-reply@example.com>", to: [to], subject, text }),
        });
        if (!res.ok) throw new Error(`Email provider error ${res.status}`);
        return;
    }
    console.info(`[email to ${to}] ${subject}\n${text}`);
}
