import axios from "axios";

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || "";

/**
 * Uploads a base64 data URL to ImgBB and returns a public CDN URL.
 * Falls back to null if IMGBB_API_KEY is not set.
 */
export async function uploadToCdn(imageUrl: string): Promise<string | null> {
    if (!imageUrl.startsWith("data:")) return imageUrl;
    if (!IMGBB_API_KEY) return null;

    try {
        const base64 = imageUrl.split(",")[1];
        const form = new URLSearchParams();
        form.append("key", IMGBB_API_KEY);
        form.append("image", base64);

        const res = await axios.post("https://api.imgbb.com/1/upload", form.toString(), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            timeout: 30000,
        });

        const url = res.data?.data?.url;
        if (url) {
            console.log("[cdn] ✅ Imagem enviada para ImgBB:", url);
            return url;
        }
    } catch (e: any) {
        console.error("[cdn] Falha ao enviar para ImgBB:", e.response?.data || e.message);
    }
    return null;
}

/**
 * Resolves the public URL to use when posting to Instagram.
 * Tries CDN upload for data: URLs; falls back to the /api/image route.
 */
export async function resolveInstagramImageUrl(imageUrl: string, postId: number, baseUrl: string): Promise<string> {
    if (!imageUrl.startsWith("data:")) {
        return imageUrl.startsWith("/") ? `${baseUrl}${imageUrl}` : imageUrl;
    }

    const cdnUrl = await uploadToCdn(imageUrl);
    if (cdnUrl) return cdnUrl;

    // Fallback: serve via API route
    return `${baseUrl}/api/image/${postId}`;
}
