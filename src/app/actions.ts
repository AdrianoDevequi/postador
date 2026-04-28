"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { postToInstagram } from "@/lib/instagram";
import { resolveInstagramImageUrl } from "@/lib/cdn";
import { cookies, headers } from "next/headers";

function checkAdminAuth(cookieStore: any) {
    const isAdmin = cookieStore.get("admin_session")?.value === process.env.ADMIN_PASSWORD;
    if (!isAdmin) throw new Error("Unauthorized");
}

export async function updateTopic(formData: FormData) {
    const topic = formData.get("topic") as string;
    if (!topic) return;

    const cookieStore = await cookies();
    checkAdminAuth(cookieStore);

    await prisma.config.upsert({
        where: { key: "post_topic" },
        update: { value: topic },
        create: { key: "post_topic", value: topic },
    });

    revalidatePath("/");
}

export async function updateBrandConfig(formData: FormData) {
    const cookieStore = await cookies();
    checkAdminAuth(cookieStore);

    const textFields = ["brand_name", "brand_description", "brand_colors", "brand_style", "brand_logo_url", "brand_extra"];
    const checkboxFields = ["brand_use_logo", "brand_less_text", "autopost"];

    for (const key of textFields) {
        const value = formData.get(key) as string;
        if (value !== null) {
            await prisma.config.upsert({
                where: { key },
                update: { value },
                create: { key, value },
            });
        }
    }

    for (const key of checkboxFields) {
        const value = formData.get(key) === "true" ? "true" : "false";
        await prisma.config.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
    }

    revalidatePath("/");
}

export async function approvePost(id: number) {
    const cookieStore = await cookies();
    checkAdminAuth(cookieStore);

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post || post.published) return { error: "Post not found or already published" };

    try {
        const headersList = await headers();
        const host = headersList.get("host") || "localhost:3000";
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
        const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;

        const absoluteImageUrl = await resolveInstagramImageUrl(post.imageUrl, post.id, baseUrl);

        const igMediaId = await postToInstagram(absoluteImageUrl, post.caption);
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

export async function deletePost(id: number) {
    const cookieStore = await cookies();
    checkAdminAuth(cookieStore);

    await prisma.post.delete({ where: { id } });
    revalidatePath("/");
}

export async function cleanErrorPosts() {
    const cookieStore = await cookies();
    checkAdminAuth(cookieStore);

    const { count } = await prisma.post.deleteMany({
        where: { status: "ERROR" },
    });

    revalidatePath("/");
    return { count };
}

export async function cleanOldPosts() {
    const cookieStore = await cookies();
    checkAdminAuth(cookieStore);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 15);

    const { count } = await prisma.post.deleteMany({
        where: { createdAt: { lt: cutoff } },
    });

    revalidatePath("/");
    return { count };
}
