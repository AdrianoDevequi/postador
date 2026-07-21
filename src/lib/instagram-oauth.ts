import axios from "axios";
import type { DiscoveredAccount } from "@/lib/connected-account";

/**
 * "Instagram API with Instagram Login" — the user authorizes directly on
 * instagram.com, with no Facebook Page and no Facebook account involved.
 * Different hosts from the Facebook path: authorization on www.instagram.com,
 * the code exchange on api.instagram.com, everything else on graph.instagram.com.
 */
const AUTHORIZE = "https://www.instagram.com/oauth/authorize";
const TOKEN = "https://api.instagram.com/oauth/access_token";
const GRAPH = "https://graph.instagram.com";

/**
 * Only two permissions — read the account and publish to it. Notably this
 * drops `pages_show_list`, `pages_read_engagement` and `business_management`,
 * which are the hardest to get through App Review.
 */
export const IG_SCOPES = ["instagram_business_basic", "instagram_business_content_publish"].join(",");

export function instagramLoginConfigured(): boolean {
    return !!(process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET);
}

/** Builds the instagram.com authorization URL the user is redirected to. */
export function buildIgAuthUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
        client_id: process.env.INSTAGRAM_APP_ID || "",
        redirect_uri: redirectUri,
        response_type: "code",
        scope: IG_SCOPES,
        state,
    });
    return `${AUTHORIZE}?${params.toString()}`;
}

/** Exchanges the OAuth `code` for a short-lived (1h) Instagram user token. */
async function exchangeCode(code: string, redirectUri: string): Promise<string> {
    const body = new URLSearchParams({
        client_id: process.env.INSTAGRAM_APP_ID || "",
        client_secret: process.env.INSTAGRAM_APP_SECRET || "",
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        // Instagram appends a literal "#_" to the code in the browser redirect.
        code: code.replace(/#_$/, ""),
    });
    const res = await axios.post(TOKEN, body, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return res.data.access_token as string;
}

/** Upgrades the short-lived token to a long-lived one (60 days). */
async function getLongLivedToken(shortToken: string): Promise<{ token: string; expiresAt: Date | null }> {
    const res = await axios.get(`${GRAPH}/access_token`, {
        params: {
            grant_type: "ig_exchange_token",
            client_secret: process.env.INSTAGRAM_APP_SECRET,
            access_token: shortToken,
        },
    });
    const expiresIn = Number(res.data?.expires_in);
    return {
        token: res.data.access_token as string,
        expiresAt: expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000) : null,
    };
}

/**
 * Runs the whole callback exchange and returns the single connected account.
 * Unlike the Facebook path there is never more than one — the user logs into
 * exactly the Instagram account they want to connect, so there is no picker.
 */
export async function getAccountFromCode(code: string, redirectUri: string): Promise<DiscoveredAccount> {
    const shortToken = await exchangeCode(code, redirectUri);
    const { token, expiresAt } = await getLongLivedToken(shortToken);

    const me = await axios.get(`${GRAPH}/me`, {
        params: { fields: "user_id,username", access_token: token },
    });

    return {
        // `user_id` is the IG Business id used by the /media endpoints; `id` is
        // the app-scoped fallback for the rare response that omits it.
        igUserId: String(me.data?.user_id || me.data?.id || ""),
        igUsername: me.data?.username || "",
        accessToken: token,
        pageName: "",
        authProvider: "instagram",
        expiresAt,
    };
}

/**
 * Extends a long-lived token by another 60 days. Only works on tokens that are
 * at least 24h old and not yet expired — once expired the user must reconnect.
 */
export async function refreshIgToken(token: string): Promise<{ token: string; expiresAt: Date | null }> {
    const res = await axios.get(`${GRAPH}/refresh_access_token`, {
        params: { grant_type: "ig_refresh_token", access_token: token },
    });
    const expiresIn = Number(res.data?.expires_in);
    return {
        token: res.data.access_token as string,
        expiresAt: expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000) : null,
    };
}
