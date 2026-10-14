// Where to send a person after sign-in. Only same-site paths are accepted, so a crafted link cannot
// bounce someone to another website after they type their code.

export function safePath(raw: string | null | undefined): string | null {
    if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return null;
    return raw;
}

export function destinationAfterLogin(opts: { next?: string | null; intent?: string | null; invite?: string | null }): string {
    if (opts.invite && /^[A-Za-z0-9_-]{6,64}$/.test(opts.invite)) return `/invite/${opts.invite}`;
    if (opts.intent === "open") return "/orgs/new";
    if (opts.intent === "join") return "/wallet?join=1";
    return safePath(opts.next) ?? "/wallet";
}
