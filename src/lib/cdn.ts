import axios from "axios";

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || "";

async function uploadToImgBB(base64DataUrl: string): Promise<string | null> {
    if (!IMGBB_API_KEY) return null;
    try {
        const base64 = base64DataUrl.split(",")[1];
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
        console.error("[cdn] ImgBB falhou:", e.response?.data || e.message);
    }
    return null;
}

/**
 * Resolves the public URL to use when posting to Instagram.
 * Uploads data: URLs to ImgBB (HTTPS CDN); falls back to /api/image route.
 */
export async function resolveInstagramImageUrl(imageUrl: string, postId: number, baseUrl: string): Promise<string> {
    if (!imageUrl.startsWith("data:")) {
        return imageUrl.startsWith("/") ? `${baseUrl}${imageUrl}` : imageUrl;
    }

    const cdnUrl = await uploadToImgBB(imageUrl);
    if (cdnUrl) return cdnUrl;

    // Last resort: serve from our own API route
    return `${baseUrl}/api/image/${postId}`;
}
