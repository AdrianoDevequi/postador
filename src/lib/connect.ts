import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { fetchTokenExpiry } from "@/lib/instagram";
import type { DiscoveredAccount } from "@/lib/connected-account";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export const OAUTH_STATE_COOKIE = "ig_oauth_state";
export const OAUTH_PENDING_COOKIE = "ig_connect_pending";
export const IG_STATE_COOKIE = "ig_login_state";

/**
 * Returns the signed-in user id, or throws. Note this is only "is there a
 * session" — it says nothing about User.isAdmin, which gates /admin.
 */
export async function requireSession(): Promise<number> {
    const store = await cookies();
    const userId = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
    if (!userId) throw new Error("Unauthorized");
    return userId;
}

/**
 * The OAuth redirect URI. Must EXACTLY match a "Valid OAuth Redirect URI"
 * registered in the Meta app dashboard. Prefers BASE_URL; falls back to the
 * request origin for local development.
 */
export function callbackUri(origin: string): string {
    const base = process.env.BASE_URL || origin;
    return `${base.replace(/\/$/, "")}/api/auth/instagram/callback`;
}

/**
 * Redirect URI for the Instagram Login flow. Registered separately in the app
 * dashboard (Instagram → API setup → OAuth redirect URIs) and, unlike the
 * Facebook one, Instagram requires it to be HTTPS — plain http://localhost is
 * rejected, so local testing needs a tunnel with BASE_URL pointed at it.
 */
export function igCallbackUri(origin: string): string {
    const base = process.env.BASE_URL || origin;
    return `${base.replace(/\/$/, "")}/api/auth/instagram-login/callback`;
}

/**
 * Saves a discovered Instagram account onto a profile. When `profileId` is null
 * a new profile is created named after the Instagram handle. Returns the profile id.
 */
export async function persistConnectedAccount(
    profileId: number | null,
    account: DiscoveredAccount,
    userId: number
): Promise<number> {
    // Instagram Login tells us the expiry up front (60 days). For Page tokens we
    // ask debug_token; those don't expire, so it returns expires_at = 0 -> null,
    // which we store as "unknown/never" expiry.
    const tokenExpiresAt =
        account.expiresAt !== undefined
            ? account.expiresAt
            : await fetchTokenExpiry(account.accessToken);

    const data = {
        igUserId: account.igUserId,
        igUsername: account.igUsername || null,
        accessToken: account.accessToken,
        tokenExpiresAt,
        authProvider: account.authProvider,
    };

    if (profileId) {
        // Scoped by userId so a profile can only be rewired by its owner.
        const { count } = await prisma.profile.updateMany({ where: { id: profileId, userId }, data });
        if (count === 0) throw new Error("Unauthorized");
        return profileId;
    }

    const created = await prisma.profile.create({
        data: { ...data, userId, name: account.igUsername || account.pageName || "Novo Perfil" },
    });
    return created.id;
}
