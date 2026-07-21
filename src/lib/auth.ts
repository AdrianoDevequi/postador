import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { cookies } from "next/headers";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
    SESSION_COOKIE,
    SESSION_MAX_AGE,
    createSessionToken,
    verifySessionToken,
} from "@/lib/session";

const scrypt = promisify(scryptCb) as (
    password: string,
    salt: Buffer,
    keylen: number
) => Promise<Buffer>;

const KEY_LEN = 64;

/** `scrypt$<saltHex>$<hashHex>` */
export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16);
    const hash = await scrypt(password, salt, KEY_LEN);
    return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
    const [scheme, saltHex, hashHex] = stored.split("$");
    if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
    const expected = Buffer.from(hashHex, "hex");
    if (expected.length !== KEY_LEN) return false;
    const actual = await scrypt(password, Buffer.from(saltHex, "hex"), KEY_LEN);
    return timingSafeEqual(actual, expected);
}

export async function startSession(userId: number): Promise<void> {
    const store = await cookies();
    store.set(SESSION_COOKIE, await createSessionToken(userId), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_MAX_AGE,
        path: "/",
    });
}

export async function endSession(): Promise<void> {
    const store = await cookies();
    store.delete(SESSION_COOKIE);
    // Legacy single-password session from before accounts existed.
    store.delete("admin_session");
}

/** The signed-in user, or null. */
export async function getCurrentUser(): Promise<User | null> {
    const store = await cookies();
    const userId = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
    if (!userId) return null;
    return prisma.user.findUnique({ where: { id: userId } });
}

/** The signed-in user, or throws — use in server actions and API routes. */
export async function requireUser(): Promise<User> {
    const user = await getCurrentUser();
    if (!user) throw new Error("Unauthorized");
    return user;
}

/**
 * Ensures the given profile belongs to the signed-in user.
 * Returns the user so callers can chain off it.
 */
export async function requireProfileOwner(profileId: number): Promise<User> {
    const user = await requireUser();
    const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        select: { userId: true },
    });
    if (!profile || profile.userId !== user.id) throw new Error("Unauthorized");
    return user;
}
