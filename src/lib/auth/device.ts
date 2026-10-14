// Turns a user agent into the short label shown in "connected devices" ("iPhone · Safari").
// Deliberately coarse: enough for a person to recognize their own device, nothing more.

export type DeviceKind = "phone" | "tablet" | "computer";

export function describeUserAgent(ua: string | null | undefined): { kind: DeviceKind; label: string } {
    const s = ua ?? "";
    let device = "מחשב";
    let kind: DeviceKind = "computer";
    if (/iPad/.test(s)) { device = "iPad"; kind = "tablet"; }
    else if (/iPhone/.test(s)) { device = "iPhone"; kind = "phone"; }
    else if (/Android/.test(s)) { device = "Android"; kind = /Mobile/.test(s) ? "phone" : "tablet"; }
    else if (/Windows/.test(s)) device = "מחשב Windows";
    else if (/Macintosh|Mac OS X/.test(s)) device = "Mac";
    else if (/Linux/.test(s)) device = "מחשב Linux";

    let browser = "דפדפן";
    if (/Edg\//.test(s)) browser = "Edge";
    else if (/SamsungBrowser/.test(s)) browser = "Samsung Internet";
    else if (/Firefox|FxiOS/.test(s)) browser = "Firefox";
    else if (/Chrome|CriOS/.test(s)) browser = "Chrome";
    else if (/Safari/.test(s)) browser = "Safari";

    return { kind, label: `${device} · ${browser}` };
}

// Approximate city from the hosting edge (Vercel or Cloudflare). Never from the device itself.
export function cityFromHeaders(get: (name: string) => string | null): string | null {
    const raw = get("x-vercel-ip-city") ?? get("cf-ipcity");
    if (!raw) return null;
    try {
        return decodeURIComponent(raw);
    } catch {
        return raw;
    }
}
