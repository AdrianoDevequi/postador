import * as ftp from "basic-ftp";
import { Readable } from "stream";
import crypto from "crypto";

const FTP_HOST = process.env.FTP_HOST || "104.156.48.234";
const FTP_USER = process.env.FTP_USER || "adm.jupitersites.com.b_mx7847112";
const FTP_PASSWORD = process.env.FTP_PASSWORD || "cIhoy8&kQ96&Khoj";
const FTP_REMOTE_DIR = "/httpdocs/img-postador";
const FTP_BASE_URL = "http://adm.jupitersites.com/img-postador";

function isFtpUrl(url: string) {
    return url.startsWith(FTP_BASE_URL);
}

export async function uploadImageToFtp(base64DataUrl: string): Promise<string | null> {
    if (!FTP_USER || !FTP_PASSWORD) return null;

    const client = new ftp.Client();
    client.ftp.verbose = false;

    try {
        await client.access({
            host: FTP_HOST,
            user: FTP_USER,
            password: FTP_PASSWORD,
            secure: false,
        });

        const base64 = base64DataUrl.split(",")[1];
        const buffer = Buffer.from(base64, "base64");
        const filename = `${crypto.randomUUID()}.jpg`;

        await client.ensureDir(FTP_REMOTE_DIR);
        await client.uploadFrom(Readable.from(buffer), `${FTP_REMOTE_DIR}/${filename}`);

        const publicUrl = `${FTP_BASE_URL}/${filename}`;
        console.log("[ftp] ✅ Imagem enviada:", publicUrl);
        return publicUrl;
    } catch (e: any) {
        console.error("[ftp] Falha ao enviar:", e.message);
        return null;
    } finally {
        client.close();
    }
}

export async function deleteImageFromFtp(imageUrl: string): Promise<void> {
    if (!isFtpUrl(imageUrl) || !FTP_USER || !FTP_PASSWORD) return;

    const filename = imageUrl.split("/").pop();
    if (!filename) return;

    const client = new ftp.Client();
    client.ftp.verbose = false;

    try {
        await client.access({
            host: FTP_HOST,
            user: FTP_USER,
            password: FTP_PASSWORD,
            secure: false,
        });

        await client.remove(`${FTP_REMOTE_DIR}/${filename}`);
        console.log("[ftp] ✅ Imagem deletada:", filename);
    } catch (e: any) {
        console.error("[ftp] Falha ao deletar:", e.message);
    } finally {
        client.close();
    }
}
