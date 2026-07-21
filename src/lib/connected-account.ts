/**
 * An Instagram account discovered during an OAuth flow, before it is saved
 * onto a profile. Shared by both connection paths (Facebook Login and
 * Instagram Login) so `persistConnectedAccount` doesn't care which one ran.
 */
export type AuthProvider = "facebook" | "instagram";

export interface DiscoveredAccount {
    igUserId: string;
    igUsername: string;
    /** Token used to publish to this account. Page token (facebook) or IG user token (instagram). */
    accessToken: string;
    /** Facebook Page name. Empty for the Instagram Login flow — there is no Page. */
    pageName: string;
    /** Which API the token belongs to; decides the Graph host used when publishing. */
    authProvider: AuthProvider;
    /**
     * Known expiry, when the OAuth response told us (Instagram Login returns
     * `expires_in`). Null means "ask the Graph API" / unknown.
     */
    expiresAt?: Date | null;
}
