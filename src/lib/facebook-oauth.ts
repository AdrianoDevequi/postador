import axios from "axios";

const GRAPH = "https://graph.facebook.com/v22.0";
const DIALOG = "https://www.facebook.com/v22.0/dialog/oauth";

/**
 * Permissions needed to list the user's Pages and publish to the Instagram
 * Business account linked to each Page. In an unreviewed (development-mode)
 * app these are grantable only to users who have a role on the app
 * (admin / developer / tester) — which is fine for connecting your own accounts.
 */
export const FB_SCOPES = [
    "instagram_basic",
    "instagram_content_publish",
    "pages_show_list",
    "pages_read_engagement",
    "business_management",
].join(",");

export function facebookConfigured(): boolean {
    return !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET);
}

export interface DiscoveredAccount {
    igUserId: string;
    igUsername: string;
    /** Long-lived Page access token — used to publish to this IG account. */
    accessToken: string;
    pageName: string;
}

/** Builds the Facebook login URL the admin is redirected to. */
export function buildAuthUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
        client_id: process.env.FACEBOOK_APP_ID || "",
        redirect_uri: redirectUri,
        state,
        response_type: "code",
        scope: FB_SCOPES,
    });
    return `${DIALOG}?${params.toString()}`;
}

/** Exchanges the OAuth `code` for a short-lived user access token. */
async function exchangeCodeForToken(code: string, redirectUri: string): Promise<string> {
    const res = await axios.get(`${GRAPH}/oauth/access_token`, {
        params: {
            client_id: process.env.FACEBOOK_APP_ID,
            client_secret: process.env.FACEBOOK_APP_SECRET,
            redirect_uri: redirectUri,
            code,
        },
    });
    return res.data.access_token as string;
}

/** Upgrades a short-lived user token to a long-lived one (~60 days). */
async function getLongLivedUserToken(shortToken: string): Promise<string> {
    const res = await axios.get(`${GRAPH}/oauth/access_token`, {
        params: {
            grant_type: "fb_exchange_token",
            client_id: process.env.FACEBOOK_APP_ID,
            client_secret: process.env.FACEBOOK_APP_SECRET,
            fb_exchange_token: shortToken,
        },
    });
    return res.data.access_token as string;
}

/**
 * Lists every Instagram Business account reachable from the user's Pages.
 * Page tokens derived from a long-lived user token are themselves long-lived
 * (they don't expire while the user token is valid), so we store the Page
 * token as the profile's publishing token.
 */
async function listInstagramAccounts(userToken: string): Promise<DiscoveredAccount[]> {
    interface PageNode {
        name?: string;
        access_token?: string;
        instagram_business_account?: { id?: string; username?: string };
    }
    interface AccountsResponse {
        data?: PageNode[];
        paging?: { next?: string };
    }

    const accounts: DiscoveredAccount[] = [];
    let url: string | null =
        `${GRAPH}/me/accounts?fields=name,access_token,instagram_business_account{id,username}&limit=50&access_token=${userToken}`;

    // Follow pagination in case the user manages many Pages.
    while (url) {
        const res: { data: AccountsResponse } = await axios.get<AccountsResponse>(url);
        for (const page of res.data?.data ?? []) {
            const ig = page.instagram_business_account;
            if (ig?.id && page.access_token) {
                accounts.push({
                    igUserId: ig.id,
                    igUsername: ig.username || "",
                    accessToken: page.access_token,
                    pageName: page.name || "",
                });
            }
        }
        url = res.data?.paging?.next ?? null;
    }
    return accounts;
}

/**
 * Full callback pipeline: code -> long-lived user token -> Instagram accounts.
 */
export async function discoverAccountsFromCode(
    code: string,
    redirectUri: string
): Promise<DiscoveredAccount[]> {
    const shortToken = await exchangeCodeForToken(code, redirectUri);
    const longToken = await getLongLivedUserToken(shortToken);
    return listInstagramAccounts(longToken);
}
