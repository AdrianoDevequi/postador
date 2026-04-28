import axios from "axios";
import crypto from "crypto";
import { isFtpImageUrl, downloadImageFromFtp } from "./ftp";

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "";
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || "";

async function uploadToCloudinary(base64DataUrl: string): Promise<string | null> {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return null;

    try {
        const timestamp = Math.round(Date.now() / 1000).toString();
        const signature = crypto
            .createHash("sha1")
            .update(`timestamp=${timestamp}${CLOUDINARY_API_SECRET}`)
            .digest("hex");

        const form = new FormData();
        form.append("file", base64DataUrl);
        form.append("timestamp", timestamp);
        form.append("api_key", CLOUDINARY_API_KEY);
        form.append("signature", signature);

        const res = await axios.post(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            form,
            { timeout: 60000 }
        );

        const url = res.data?.secure_url;
        if (url) {
            console.log("[cdn] ✅ Imagem enviada para Cloudinary:", url);
            return url;
        }
    } catch (e: any) {
        console.error("[cdn] Cloudinary falhou:", e.response?.data || e.message);
    }
    return null;
}

/**
 * Resolves the public URL for Instagram.
 * - data: URL → upload to Cloudinary
 * - FTP URL → download from FTP → upload to Cloudinary
 * - Other URLs → return as-is
 */
export async function resolveInstagramImageUrl(imageUrl: string, postId: number, baseUrl: string): Promise<string> {
    let dataUrl: string | null = null;

    if (imageUrl.startsWith("data:")) {
        dataUrl = imageUrl;
    } else if (isFtpImageUrl(imageUrl)) {
        const filename = imageUrl.split("/").pop();
        if (filename) dataUrl = await downloadImageFromFtp(filename);
    } else if (imageUrl.startsWith("/")) {
        return `${baseUrl}${imageUrl}`;
    } else {
        return imageUrl;
    }

    if (dataUrl) {
        const cdnUrl = await uploadToCloudinary(dataUrl);
        if (cdnUrl) return cdnUrl;
    }

    return `${baseUrl}/api/image/${postId}`;
}
