import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { fetchTokenExpiry } from "@/lib/instagram";
import type { DiscoveredAccount } from "@/lib/facebook-oauth";

export const OAUTH_STATE_COOKIE = "ig_oauth_state";
export const OAUTH_PENDING_COOKIE = "ig_connect_pending";

/** Throws unless the current request carries a valid admin session cookie. */
export async function requireAdmin(): Promise<void> {
    const store = await cookies();
    if (store.get("admin_session")?.value !== process.env.ADMIN_PASSWORD) {
        throw new Error("Unauthorized");
    }
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
 * Saves a discovered Instagram account onto a profile. When `profileId` is null
 * a new profile is created named after the Instagram handle. Returns the profile id.
 */
export async function persistConnectedAccount(
    profileId: number | null,
    account: DiscoveredAccount
): Promise<number> {
    // Page tokens from a long-lived user token don't expire; debug_token returns
    // expires_at = 0 -> null, which we store as "unknown/never" expiry.
    const tokenExpiresAt = await fetchTokenExpiry(account.accessToken);

    const data = {
        igUserId: account.igUserId,
        igUsername: account.igUsername || null,
        accessToken: account.accessToken,
        tokenExpiresAt,
    };

    if (profileId) {
        await prisma.profile.update({ where: { id: profileId }, data });
        return profileId;
    }

    const created = await prisma.profile.create({
        data: { ...data, name: account.igUsername || account.pageName || "Novo Perfil" },
    });
    return created.id;
}
