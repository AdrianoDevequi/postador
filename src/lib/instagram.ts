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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** "Media ID is not available" — the container exists but isn't processed yet. */
function isNotReadyError(e: any): boolean {
    const err = e?.response?.data?.error;
    return err?.code === 9007 || err?.error_subcode === 2207027;
}

/**
 * Instagram processes the media container asynchronously — it has to fetch and
 * validate the image first. Publishing before that finishes fails with
 * "Media ID is not available" (code 9007 / subcode 2207027).
 *
 * We poll status_code until FINISHED. If the status lookup itself fails we do
 * NOT abort: it's only an optimisation, and the publish below retries on the
 * same "not ready" error anyway. Better to fall through than to turn an
 * intermittent failure into a permanent one on a host that answers differently.
 */
async function waitForContainer(base: string, containerId: string, accessToken: string): Promise<void> {
    for (let attempt = 0; attempt < 12; attempt++) {
        try {
            const res = await axios.get(`${base}/${containerId}`, {
                params: { fields: "status_code", access_token: accessToken },
            });
            const status = res.data?.status_code;

            if (status === "FINISHED") return;
            if (status === "ERROR" || status === "EXPIRED") {
                throw new Error(`Instagram rejeitou a mídia (${status}).`);
            }
        } catch (e: any) {
            if (e instanceof Error && e.message.startsWith("Instagram rejeitou")) throw e;
            console.warn("[instagram] status do container indisponível:", e.response?.data || e.message);
            return; // let the publish retry decide
        }
        await sleep(1500 + attempt * 250);
    }
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

        // Step 2: Wait until the container is actually ready
        await waitForContainer(base, creationId, accessToken);

        // Step 3: Publish, retrying while the container is still not ready.
        // This is the real safety net — it works regardless of whether the
        // status endpoint above answered.
        for (let attempt = 0; ; attempt++) {
            try {
                const publishResponse = await axios.post(`${base}/${igUserId}/media_publish`, null, {
                    params: {
                        creation_id: creationId,
                        access_token: accessToken,
                    },
                });
                return publishResponse.data.id;
            } catch (e: any) {
                if (!isNotReadyError(e) || attempt >= 8) throw e;
                await sleep(2000 + attempt * 1000);
            }
        }
    } catch (error: any) {
        console.error("Instagram Post Error:", error.response?.data || error.message);
        throw error; // Rethrow original error to see details in route
    }
}
