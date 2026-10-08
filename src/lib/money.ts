// Money is always integer minor units (agorot / cents). Convert only at the UI edge.

export function toMinor(major: number): number {
    return Math.round(major * 100);
}

export function formatMoney(minor: number, currency = "ILS", locale = "he-IL"): string {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(minor / 100);
}
