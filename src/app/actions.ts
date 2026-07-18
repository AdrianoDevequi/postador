"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { postToInstagram, fetchTokenExpiry } from "@/lib/instagram";
import { getIgCreds } from "@/lib/profile";
import { resolveInstagramImageUrl } from "@/lib/cdn";
import { deleteImageFromFtp } from "@/lib/ftp";
import { persistConnectedAccount, OAUTH_PENDING_COOKIE } from "@/lib/connect";
import { listInstagramAccounts } from "@/lib/facebook-oauth";
import { cookies, headers } from "next/headers";

async function checkAdminAuth() {
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get("admin_session")?.value === process.env.ADMIN_PASSWORD;
    if (!isAdmin) throw new Error("Unauthorized");
}

// ---------------------------------------------------------------------------
// Profile CRUD
// ---------------------------------------------------------------------------

function parseProfileForm(formData: FormData) {
    const str = (k: string) => {
        const v = formData.get(k);
        return typeof v === "string" ? v.trim() : "";
    };
    const bool = (k: string) => formData.get(k) === "true";

    return {
        name: str("name") || "Novo Perfil",
        igUserId: str("igUserId"),
        igUsername: str("igUsername") || null,
        accessToken: str("accessToken"),
        topics: str("topics") || "Technology",
        brandName: str("brandName") || null,
        brandDescription: str("brandDescription") || null,
        brandColors: str("brandColors") || null,
        brandStyle: str("brandStyle") || null,
        brandLogoUrl: str("brandLogoUrl") || null,
        brandExtra: str("brandExtra") || null,
        linkUrl: str("linkUrl") || null,
        useLogo: bool("useLogo"),
        lessText: bool("lessText"),
        autopost: bool("autopost"),
        active: formData.get("active") === null ? true : bool("active"),
    };
}

/**
 * Token expiry: real value from Graph API when available, otherwise 60 days
 * from now (the default lifetime of a long-lived Instagram token).
 */
async function resolveTokenExpiry(token: string): Promise<Date> {
    const real = await fetchTokenExpiry(token);
    if (real) return real;
    const estimate = new Date();
    estimate.setDate(estimate.getDate() + 60);
    return estimate;
}

export async function createProfile(formData: FormData) {
    await checkAdminAuth();

    const data = parseProfileForm(formData);
    const tokenExpiresAt = data.accessToken ? await resolveTokenExpiry(data.accessToken) : null;
    const profile = await prisma.profile.create({ data: { ...data, tokenExpiresAt } });

    revalidatePath("/");
    redirect(`/?profile=${profile.id}`);
}

export async function updateProfile(formData: FormData) {
    await checkAdminAuth();

    const id = Number(formData.get("id"));
    if (!id) throw new Error("Missing profile id");

    const data = parseProfileForm(formData);

    // Don't blow away a saved token if the field was left blank (it's masked in the UI)
    if (!data.accessToken) {
        const { accessToken, ...rest } = data;
        void accessToken;
        await prisma.profile.update({ where: { id }, data: rest });
    } else {
        // New token provided → refresh its expiry from the Graph API
        const tokenExpiresAt = await resolveTokenExpiry(data.accessToken);
        await prisma.profile.update({ where: { id }, data: { ...data, tokenExpiresAt } });
    }

    revalidatePath("/");
    redirect(`/?profile=${id}`);
}

/**
 * Saves the Instagram account the admin picked on the /connect page.
 * Reads the pending accounts from the httpOnly cookie set during the OAuth
 * callback, so tokens never round-trip through the page HTML.
 */
export async function confirmConnectedAccount(formData: FormData) {
    await checkAdminAuth();

    const index = Number(formData.get("index"));
    const store = await cookies();
    const raw = store.get(OAUTH_PENDING_COOKIE)?.value;
    if (!raw) throw new Error("Sessão de conexão expirada. Refaça o login com o Instagram.");

    const pending = JSON.parse(raw) as { profileId: number | null; userToken: string };
    const accounts = await listInstagramAccounts(pending.userToken);
    const account = accounts[index];
    if (!account) throw new Error("Conta inválida.");

    const id = await persistConnectedAccount(pending.profileId ?? null, account);

    store.delete(OAUTH_PENDING_COOKIE);
    revalidatePath("/");
    redirect(`/?profile=${id}&connected=1`);
}

export async function toggleProfileActive(id: number, active: boolean) {
    await checkAdminAuth();
    await prisma.profile.update({ where: { id }, data: { active } });
    revalidatePath("/");
}

export async function deleteProfile(id: number) {
    await checkAdminAuth();

    // Clean up any FTP-hosted images for this profile's posts
    const posts = await prisma.post.findMany({ where: { profileId: id }, select: { imageUrl: true } });
    await Promise.all(posts.map((p) => deleteImageFromFtp(p.imageUrl)));

    await prisma.profile.delete({ where: { id } });
    revalidatePath("/");
    redirect("/");
}

// ---------------------------------------------------------------------------
// Post actions
// ---------------------------------------------------------------------------

export async function approvePost(id: number) {
    await checkAdminAuth();

    const post = await prisma.post.findUnique({ where: { id }, include: { profile: true } });
    if (!post || post.published) return { error: "Post not found or already published" };

    try {
        const headersList = await headers();
        const host = headersList.get("host") || "localhost:3000";
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
        const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;

        const absoluteImageUrl = await resolveInstagramImageUrl(post.imageUrl, post.id, baseUrl);

        const igMediaId = await postToInstagram(absoluteImageUrl, post.caption, getIgCreds(post.profile));
        await prisma.post.update({
            where: { id },
            data: { published: true, status: "PUBLISHED", igMediaId, error: null },
        });
        revalidatePath("/");
        return { success: true };
    } catch (e: any) {
        const raw = e.response?.data || e.message || "Unknown error";
        const errorMsg = typeof raw === "string" ? raw : JSON.stringify(raw);
        await prisma.post.update({
            where: { id },
            data: { status: "ERROR", error: errorMsg },
        });
        revalidatePath("/");
        return { error: errorMsg };
    }
}

export async function resetPostToDraft(id: number) {
    await checkAdminAuth();

    await prisma.post.update({
        where: { id },
        data: { status: "DRAFT", published: false, error: null },
    });

    revalidatePath("/");
}

export async function deletePost(id: number) {
    await checkAdminAuth();

    const post = await prisma.post.findUnique({ where: { id }, select: { imageUrl: true } });
    if (post?.imageUrl) await deleteImageFromFtp(post.imageUrl);

    await prisma.post.delete({ where: { id } });
    revalidatePath("/");
}

export async function cleanErrorPosts(profileId: number) {
    await checkAdminAuth();

    const where = { status: "ERROR", profileId };
    const posts = await prisma.post.findMany({ where, select: { id: true, imageUrl: true } });
    await Promise.all(posts.map((p) => deleteImageFromFtp(p.imageUrl)));
    const { count } = await prisma.post.deleteMany({ where });

    revalidatePath("/");
    return { count };
}

export async function cleanOldPosts(profileId: number) {
    await checkAdminAuth();

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 15);

    const where = { createdAt: { lt: cutoff }, profileId };
    const posts = await prisma.post.findMany({ where, select: { id: true, imageUrl: true } });
    await Promise.all(posts.map((p) => deleteImageFromFtp(p.imageUrl)));
    const { count } = await prisma.post.deleteMany({ where });

    revalidatePath("/");
    return { count };
}
