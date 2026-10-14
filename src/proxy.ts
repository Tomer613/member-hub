import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS, createSessionToken, verifySessionToken } from "@/lib/session";

// Optimistic check only (signature and expiry of the cookie). Pages re-check the session in the
// database, where a disconnected device is caught.
const PRIVATE = ["/wallet", "/settings", "/invite", "/orgs", "/join"];
// A phone session's cookie is re-issued at most once a day, so it lasts 180 days from last use.
const REISSUE_AFTER_SECONDS = 24 * 60 * 60;

export async function proxy(req: NextRequest) {
    const { pathname, search } = req.nextUrl;
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const payload = token ? await verifySessionToken(token) : null;
    const signedIn = !!payload;
    if (!signedIn && PRIVATE.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        const invite = pathname.match(/^\/invite\/([^/]+)/);
        url.search = invite ? `?invite=${invite[1]}` : `?next=${encodeURIComponent(pathname + search)}`;
        return NextResponse.redirect(url);
    }
    const res = NextResponse.next();
    if (payload?.sliding && payload.iat && Date.now() / 1000 - payload.iat > REISSUE_AFTER_SECONDS) {
        res.cookies.set(SESSION_COOKIE_NAME, await createSessionToken(payload), SESSION_COOKIE_OPTIONS);
    }
    return res;
}

export const config = { matcher: ["/wallet/:path*", "/settings/:path*", "/invite/:path*", "/orgs/:path*", "/join/:path*"] };
