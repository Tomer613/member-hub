// Money is always integer minor units (agorot / cents). Convert only at the UI edge.

export function toMinor(major: number): number {
    return Math.round(major * 100);
}

export function formatMoney(minor: number, currency = "ILS", locale = "he-IL"): string {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(minor / 100);
}

// "120" or "120.50" typed in shekels -> agorot. Null when empty or not a sensible amount.
export function shekelsToMinor(raw: string): number | null {
    const v = raw.replace(/[₪,\s]/g, "");
    if (!/^\d{1,6}(\.\d{1,2})?$/.test(v)) return null;
    const n = Math.round(Number(v) * 100);
    return n > 0 ? n : null;
}

// "₪600", "₪600.50", "-₪50" (a credit), as on the boards: the sign before the symbol.
export function formatShekels(minor: number): string {
    const abs = Math.abs(minor);
    const whole = abs % 100 === 0;
    const n = (abs / 100).toLocaleString("he-IL", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 });
    return `${minor < 0 ? "-" : ""}₪${n}`;
}
