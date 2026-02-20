"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { postToInstagram } from "@/lib/instagram";
import { cookies } from "next/headers";

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

export async function approvePost(id: number) {
    const cookieStore = await cookies();
    checkAdminAuth(cookieStore);

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post || post.published) return { error: "Post not found or already published" };

    try {
        const igMediaId = await postToInstagram(post.imageUrl, post.caption);
        await prisma.post.update({
            where: { id },
            data: { published: true, status: "PUBLISHED", igMediaId, error: null },
        });
        revalidatePath("/");
        return { success: true };
    } catch (e: any) {
        const errorMsg = e.response?.data || e.message || "Unknown error";
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
