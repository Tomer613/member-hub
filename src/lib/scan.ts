// What a scanned or pasted code means (boards D-QrScan, D-QrMyCode; ux-spec 14.28 to 14.31). Pure, so the
// scanner, "הדבקת קישור" and "הקלדת קוד" all read codes the same way.

export type ScanResult =
    | { kind: "go"; to: string } // a page of ours: an org to join, an invitation, a celebration, a profile
    | { kind: "code"; code: string } // a short typed code, looked up on the server
    | { kind: "entry" } // the member card's entry code: it is checked at the door, not here
    | { kind: "foreign" } // a link or text that is not ours
    | { kind: "empty" };

const ROUTES: [RegExp, (t: string) => string][] = [
    [/^\/(?:join|j)\/([A-Za-z0-9_-]{4,64})\/?$/, (t) => `/join/${t}`],
    [/^\/c\/([A-Za-z0-9_-]{4,64})\/?$/, (t) => `/c/${t}`],
    [/^\/invite\/([A-Za-z0-9_-]{4,64})\/?$/, (t) => `/invite/${t}`],
    [/^\/p\/([A-Za-z0-9_-]{4,64})\/?$/, (t) => `/p/${t}`],
];

// "hosts" are the addresses of the app itself; a link to anywhere else is not followed.
export function parseScan(raw: string, hosts: string[]): ScanResult {
    const text = raw.trim();
    if (!text) return { kind: "empty" };
    if (text.startsWith("piri1.")) return { kind: "entry" };
    let path: string | null = null;
    let query = "";
    if (/^https?:\/\//i.test(text)) {
        let u: URL;
        try {
            u = new URL(text);
        } catch {
            return { kind: "foreign" };
        }
        if (!hosts.includes(u.host.toLowerCase())) return { kind: "foreign" };
        path = u.pathname;
        query = u.search;
    } else if (text.startsWith("/")) {
        path = text.split("?")[0];
        query = text.includes("?") ? text.slice(text.indexOf("?")) : "";
    } else if (/^[a-z0-9.-]+\.[a-z]{2,}\//i.test(text)) {
        // A link without "https://", as printed under a code ("app.example/p/abc").
        return parseScan(`https://${text}`, hosts);
    } else if (/^[A-Za-z0-9_-]{4,64}$/.test(text)) {
        return { kind: "code", code: text.toLowerCase() };
    } else {
        return { kind: "foreign" };
    }
    for (const [re, to] of ROUTES) {
        const m = path.match(re);
        if (m) return { kind: "go", to: to(m[1]) };
    }
    const invite = new URLSearchParams(query).get("invite");
    if (path === "/login" && invite && /^[A-Za-z0-9_-]{4,64}$/.test(invite)) return { kind: "go", to: `/invite/${invite}` };
    return { kind: "foreign" };
}

// The link printed under a profile code: "piri.app/p/abc" without the scheme.
export const shortLink = (origin: string, path: string) => `${origin.replace(/^https?:\/\//, "")}${path}`;
