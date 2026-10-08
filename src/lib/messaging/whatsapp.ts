// Formats content as plain text suitable for pasting into a WhatsApp
// group/broadcast - WhatsApp's own markdown (*bold*, _italic_), not HTML.
// Shared between the newsletter editor and event announcements.

export interface WhatsAppShareItem {
    category?: string;
    title: string;
    body: string;
}

export function buildWhatsAppMessage(heading: string, items: WhatsAppShareItem[]): string {
    const sections = items.map((item) => {
        const categoryLine = item.category ? `_${item.category}_\n` : "";
        return `${categoryLine}*${item.title}*\n${item.body}`;
    });
    return [`*${heading}*`, "", sections.join("\n\n")].join("\n");
}
