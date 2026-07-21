import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { buildIgAuthUrl, instagramLoginConfigured } from "@/lib/instagram-oauth";
import { requireAdmin, igCallbackUri, IG_STATE_COOKIE } from "@/lib/connect";

/**
 * Starts the "Connect with Instagram" flow via Instagram Login: the user
 * authorizes on instagram.com directly — no Facebook account, no Page, and no
 * app role required once the app is live.
 */
export async function GET(req: NextRequest) {
    try {
        await requireAdmin();
    } catch {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    if (!instagramLoginConfigured()) {
        return NextResponse.redirect(
            new URL("/?connect_error=Configure+INSTAGRAM_APP_ID+e+INSTAGRAM_APP_SECRET+no+.env", req.url)
        );
    }

    const profileId = req.nextUrl.searchParams.get("profileId") || "";
    const state = randomUUID();

    const res = NextResponse.redirect(buildIgAuthUrl(igCallbackUri(req.nextUrl.origin), state));

    // `${state}:${profileId}` — verified on callback; profileId tells us whether
    // to update an existing profile or create a new one.
    res.cookies.set(IG_STATE_COOKIE, `${state}:${profileId}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600,
        path: "/",
    });
    return res;
}
