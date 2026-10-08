// Text color on top of an organization color, chosen by real WCAG contrast (not a luminance guess).
// Every org color, including the ones an admin picks freely, must give readable text.

const INK = "#1E1633";
const WHITE = "#FFFFFF";

function channel(c: number): number {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
    const n = parseInt(hex.replace("#", ""), 16);
    return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrastRatio(a: string, b: string): number {
    const la = relativeLuminance(a);
    const lb = relativeLuminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export function onColor(background: string): string {
    return contrastRatio(INK, background) >= contrastRatio(WHITE, background) ? INK : WHITE;
}

// True when even the better of ink/white is below 4.5:1 (normal text). The org color picker should reject or darken these.
export function isReadableOnBoth(background: string): boolean {
    return contrastRatio(onColor(background), background) >= 4.5;
}
