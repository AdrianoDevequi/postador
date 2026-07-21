"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { postToInstagram, fetchTokenExpiry } from "@/lib/instagram";
import { getIgCreds, detectAuthProvider } from "@/lib/profile";
import { resolveInstagramImageUrl } from "@/lib/cdn";
import { deleteImageFromFtp } from "@/lib/ftp";
import { persistConnectedAccount, OAUTH_PENDING_COOKIE } from "@/lib/connect";
import { listInstagramAccounts } from "@/lib/facebook-oauth";
import { cookies, headers } from "next/headers";
import { requireUser, requireProfileOwner } from "@/lib/auth";

/** Throws unless the post exists and belongs to the signed-in user's profile. */
async function requirePostOwner(postId: number) {
    const user = await requireUser();
    const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { profile: { select: { userId: true } } },
    });
    if (!post || post.profile.userId !== user.id) throw new Error("Unauthorized");
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
    const multi = (k: string, sep = ", ") =>
        formData
            .getAll(k)
            .filter((v): v is string => typeof v === "string" && v.trim() !== "")
            .map((v) => v.trim())
            .join(sep) || null;

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
        designFontStyle: str("designFontStyle") || null,
        designFontSize: str("designFontSize") || null,
        designFontColor: str("designFontColor") || null,
        designEffects: str("designEffects") || null,
        designNotes: str("designNotes") || null,
        designImageStyles: multi("designImageStyles"),
        brandStyles: multi("brandStyles"),
        postTones: multi("postTones"),
        brandFormats: multi("brandFormats"),
        brandPalette: multi("brandPalette"),
        alternateStyles: formData.get("alternateStyles") === "true",
        scheduleDays: multi("scheduleDays", ","),
        scheduleTimes: multi("scheduleTimes", ","),
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
    const user = await requireUser();

    const data = parseProfileForm(formData);
    const tokenExpiresAt = data.accessToken ? await resolveTokenExpiry(data.accessToken) : null;
    const authProvider = detectAuthProvider(data.accessToken);
    // Initialize the schedule cursor to now so only future slots fire.
    const profile = await prisma.profile.create({
        data: { ...data, authProvider, userId: user.id, tokenExpiresAt, lastScheduledRunAt: new Date() },
    });

    revalidatePath("/");
    redirect(`/?profile=${profile.id}&saved=1`);
}

export async function updateProfile(formData: FormData) {
    const id = Number(formData.get("id"));
    if (!id) throw new Error("Missing profile id");
    await requireProfileOwner(id);

    const data = parseProfileForm(formData);

    // Re-baseline the schedule cursor so edited times don't fire retroactively.
    const lastScheduledRunAt = new Date();

    // Don't blow away a saved token if the field was left blank (it's masked in the UI)
    if (!data.accessToken) {
        const { accessToken, ...rest } = data;
        void accessToken;
        await prisma.profile.update({ where: { id }, data: { ...rest, lastScheduledRunAt } });
    } else {
        // New token provided → refresh its expiry and re-detect which API it uses
        const tokenExpiresAt = await resolveTokenExpiry(data.accessToken);
        const authProvider = detectAuthProvider(data.accessToken);
        await prisma.profile.update({
            where: { id },
            data: { ...data, authProvider, tokenExpiresAt, lastScheduledRunAt },
        });
    }

    revalidatePath("/");
    redirect(`/?profile=${id}&saved=1`);
}

/**
 * Saves the Instagram account the admin picked on the /connect page.
 * Reads the pending accounts from the httpOnly cookie set during the OAuth
 * callback, so tokens never round-trip through the page HTML.
 */
export async function confirmConnectedAccount(formData: FormData) {
    const user = await requireUser();

    const index = Number(formData.get("index"));
    const store = await cookies();
    const raw = store.get(OAUTH_PENDING_COOKIE)?.value;
    if (!raw) throw new Error("Sessão de conexão expirada. Refaça o login com o Instagram.");

    const pending = JSON.parse(raw) as { profileId: number | null; userToken: string };
    const accounts = await listInstagramAccounts(pending.userToken);
    const account = accounts[index];
    if (!account) throw new Error("Conta inválida.");

    if (pending.profileId) await requireProfileOwner(pending.profileId);
    const id = await persistConnectedAccount(pending.profileId ?? null, account, user.id);

    store.delete(OAUTH_PENDING_COOKIE);
    revalidatePath("/");
    redirect(`/?profile=${id}&connected=1`);
}

export async function toggleProfileActive(id: number, active: boolean) {
    await requireProfileOwner(id);
    await prisma.profile.update({ where: { id }, data: { active } });
    revalidatePath("/");
}

export async function deleteProfile(id: number) {
    await requireProfileOwner(id);

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
    await requirePostOwner(id);

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
    await requirePostOwner(id);

    await prisma.post.update({
        where: { id },
        data: { status: "DRAFT", published: false, error: null },
    });

    revalidatePath("/");
}

export async function deletePost(id: number) {
    await requirePostOwner(id);

    const post = await prisma.post.findUnique({ where: { id }, select: { imageUrl: true } });
    if (post?.imageUrl) await deleteImageFromFtp(post.imageUrl);

    await prisma.post.delete({ where: { id } });
    revalidatePath("/");
}

export async function cleanErrorPosts(profileId: number) {
    await requireProfileOwner(profileId);

    const where = { status: "ERROR", profileId };
    const posts = await prisma.post.findMany({ where, select: { id: true, imageUrl: true } });
    await Promise.all(posts.map((p) => deleteImageFromFtp(p.imageUrl)));
    const { count } = await prisma.post.deleteMany({ where });

    revalidatePath("/");
    return { count };
}

export async function cleanOldPosts(profileId: number) {
    await requireProfileOwner(profileId);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 15);

    const where = { createdAt: { lt: cutoff }, profileId };
    const posts = await prisma.post.findMany({ where, select: { id: true, imageUrl: true } });
    await Promise.all(posts.map((p) => deleteImageFromFtp(p.imageUrl)));
    const { count } = await prisma.post.deleteMany({ where });

    revalidatePath("/");
    return { count };
}
