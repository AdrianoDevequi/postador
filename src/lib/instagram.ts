import axios from "axios";

const IG_USER_ID = process.env.INSTAGRAM_USER_ID;
const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const BASE_URL = "https://graph.facebook.com/v22.0";

export async function postToInstagram(imageUrl: string, caption: string): Promise<string> {
    if (!IG_USER_ID || !ACCESS_TOKEN) {
        throw new Error("Instagram credentials not configured");
    }

    try {
        // Step 1: Create Media Container
        const containerResponse = await axios.post(`${BASE_URL}/${IG_USER_ID}/media`, null, {
            params: {
                image_url: imageUrl,
                caption: caption,
                access_token: ACCESS_TOKEN,
            },
        });

        const creationId = containerResponse.data.id;

        // Step 2: Publish Media
        const publishResponse = await axios.post(`${BASE_URL}/${IG_USER_ID}/media_publish`, null, {
            params: {
                creation_id: creationId,
                access_token: ACCESS_TOKEN,
            },
        });

        return publishResponse.data.id;
    } catch (error: any) {
        console.error("Instagram Post Error:", error.response?.data || error.message);
        throw error; // Rethrow original error to see details in route
    }
}
