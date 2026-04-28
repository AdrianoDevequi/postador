import axios from "axios";
import { isFtpImageUrl, downloadImageFromFtp } from "./ftp";

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || "";

export async function uploadToImgBB(base64DataUrl: string): Promise<string | null> {
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
 * Resolves the public URL for Instagram.
 * - data: URL → upload to ImgBB
 * - FTP URL → download from FTP → upload to ImgBB
 * - Other URLs → return as-is
 */
export async function resolveInstagramImageUrl(imageUrl: string, postId: number, baseUrl: string): Promise<string> {
    let dataUrl: string | null = null;

    if (imageUrl.startsWith("data:")) {
        dataUrl = imageUrl;
    } else if (isFtpImageUrl(imageUrl)) {
        const filename = imageUrl.split("/").pop();
        if (filename) {
            dataUrl = await downloadImageFromFtp(filename);
        }
    } else if (imageUrl.startsWith("/")) {
        return `${baseUrl}${imageUrl}`;
    } else {
        return imageUrl;
    }

    if (dataUrl) {
        const cdnUrl = await uploadToImgBB(dataUrl);
        if (cdnUrl) return cdnUrl;
    }

    // Last resort: serve from our own API route
    return `${baseUrl}/api/image/${postId}`;
}
