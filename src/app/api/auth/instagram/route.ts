import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { buildAuthUrl, facebookConfigured } from "@/lib/facebook-oauth";
import { requireAdmin, callbackUri, OAUTH_STATE_COOKIE } from "@/lib/connect";

/**
 * Starts the "Connect with Instagram" flow: verifies the admin session,
 * stores an anti-CSRF state (plus the target profile id) in an httpOnly
 * cookie, and redirects to Facebook's OAuth dialog.
 */
export async function GET(req: NextRequest) {
    try {
        await requireAdmin();
    } catch {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    if (!facebookConfigured()) {
        return NextResponse.redirect(
            new URL("/?connect_error=Configure+FACEBOOK_APP_ID+e+FACEBOOK_APP_SECRET+no+.env", req.url)
        );
    }

    const profileId = req.nextUrl.searchParams.get("profileId") || "";
    const state = randomUUID();

    const authUrl = buildAuthUrl(callbackUri(req.nextUrl.origin), state);
    const res = NextResponse.redirect(authUrl);

    // `${state}:${profileId}` — verified on callback; profileId tells us whether
    // to update an existing profile or create a new one.
    res.cookies.set(OAUTH_STATE_COOKIE, `${state}:${profileId}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600,
        path: "/",
    });
    return res;
}
