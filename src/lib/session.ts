/**
 * Signed session tokens, edge-safe.
 *
 * Uses Web Crypto only (no node:crypto, no Prisma) so the same verification
 * runs inside middleware and inside server components/actions.
 *
 * Token format: `<userId>.<expiresAtMs>.<hmac-sha256 base64url>`
 */

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret(): string {
    const s = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD;
    if (!s) throw new Error("AUTH_SECRET não configurado");
    return s;
}

function toBase64Url(bytes: ArrayBuffer): string {
    let bin = "";
    for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(payload: string): Promise<string> {
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret()),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    return toBase64Url(sig);
}

/** Constant-time string compare (both inputs are base64url of fixed length). */
function safeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}

export async function createSessionToken(userId: number): Promise<string> {
    const payload = `${userId}.${Date.now() + SESSION_MAX_AGE * 1000}`;
    return `${payload}.${await sign(payload)}`;
}

/** Returns the user id when the token is well-formed, unexpired and authentic. */
export async function verifySessionToken(token: string | undefined): Promise<number | null> {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [idStr, expStr, sig] = parts;
    const userId = Number(idStr);
    const exp = Number(expStr);
    if (!Number.isInteger(userId) || !Number.isFinite(exp) || exp < Date.now()) return null;

    const expected = await sign(`${idStr}.${expStr}`);
    return safeEqual(sig, expected) ? userId : null;
}
