import axios from "axios";

const BASE_URL = "https://graph.facebook.com/v22.0";
const IG_BASE_URL = "https://graph.instagram.com/v23.0";

export interface IgCredentials {
    igUserId: string;
    accessToken: string;
    /** "instagram" tokens (Instagram Login) talk to graph.instagram.com instead. */
    authProvider?: string;
}

/** The Graph host that accepts this profile's token. */
function graphBase(authProvider?: string): string {
    return authProvider === "instagram" ? IG_BASE_URL : BASE_URL;
}

/**
 * Asks the Graph API when this token expires (via debug_token).
 * Returns:
 *   - a Date when the token has a known expiry
 *   - null when it never expires (expires_at = 0) or the lookup fails
 *     (callers fall back to an estimate in that case)
 */
export async function fetchTokenExpiry(token: string): Promise<Date | null> {
    if (!token) return null;
    try {
        const res = await axios.get(`${BASE_URL}/debug_token`, {
            params: { input_token: token, access_token: token },
        });
        const expiresAt = res.data?.data?.expires_at;
        if (typeof expiresAt === "number" && expiresAt > 0) {
            return new Date(expiresAt * 1000);
        }
    } catch (e: any) {
        console.error("[instagram] debug_token falhou:", e.response?.data || e.message);
    }
    return null;
}

export async function postToInstagram(
    imageUrl: string,
    caption: string,
    creds?: IgCredentials
): Promise<string> {
    const igUserId = creds?.igUserId || process.env.INSTAGRAM_USER_ID;
    const accessToken = creds?.accessToken || process.env.INSTAGRAM_ACCESS_TOKEN;
    const base = graphBase(creds?.authProvider);

    if (!igUserId || !accessToken) {
        throw new Error("Instagram credentials not configured");
    }

    try {
        // Step 1: Create Media Container
        const containerResponse = await axios.post(`${base}/${igUserId}/media`, null, {
            params: {
                image_url: imageUrl,
                caption: caption,
                access_token: accessToken,
            },
        });

        const creationId = containerResponse.data.id;

        // Step 2: Publish Media
        const publishResponse = await axios.post(`${base}/${igUserId}/media_publish`, null, {
            params: {
                creation_id: creationId,
                access_token: accessToken,
            },
        });

        return publishResponse.data.id;
    } catch (error: any) {
        console.error("Instagram Post Error:", error.response?.data || error.message);
        throw error; // Rethrow original error to see details in route
    }
}
