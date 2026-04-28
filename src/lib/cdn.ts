import { uploadImageToFtp } from "./ftp";

/**
 * Resolves the public URL to use when posting to Instagram.
 * Uploads data: URLs to FTP; falls back to /api/image route if FTP fails.
 */
export async function resolveInstagramImageUrl(imageUrl: string, postId: number, baseUrl: string): Promise<string> {
    if (!imageUrl.startsWith("data:")) {
        return imageUrl.startsWith("/") ? `${baseUrl}${imageUrl}` : imageUrl;
    }

    const ftpUrl = await uploadImageToFtp(imageUrl);
    if (ftpUrl) return ftpUrl;

    return `${baseUrl}/api/image/${postId}`;
}
