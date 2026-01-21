"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateTopic(formData: FormData) {
    const topic = formData.get("topic") as string;
    if (!topic) return;

    await prisma.config.upsert({
        where: { key: "post_topic" },
        update: { value: topic },
        create: { key: "post_topic", value: topic },
    });

    revalidatePath("/");
}
