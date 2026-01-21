import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { generateCaption, generateImagePrompt } from "@/lib/gemini";
import { generateImageUrl } from "@/lib/image";
import { postToInstagram } from "@/lib/instagram";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const force = searchParams.get("force") === "true";

        // Check for authorization (simple check)
        // Check for authorization (simple check)
        const authHeader = request.headers.get("authorization");
        const isVercelCron = request.headers.get("x-vercel-cron") === "1";

        // Check for Admin Cookie (for Manual Trigger from Dashboard)
        const cookieStore = await cookies();
        const isAdmin = cookieStore.get("admin_session")?.value === process.env.ADMIN_PASSWORD;

        if (!isAdmin && authHeader !== `Bearer ${process.env.CRON_SECRET}` && !force && !isVercelCron) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // 1. Get Topic/Subject
        let config = await prisma.config.findUnique({
            where: { key: "post_topic" },
        });

        if (!config) {
            // Default config
            config = await prisma.config.create({
                data: { key: "post_topic", value: "Technology and AI Innovation" }
            });
        }

        const topic = config.value;

        // 2. Generate Content
        const caption = await generateCaption(topic);
        const imagePrompt = await generateImagePrompt(topic);

        // 3. Generate Image
        const imageUrl = await generateImageUrl(imagePrompt);

        // 4. Post to Instagram
        // We wrap this in a try/catch to ensure we can log the attempt even if it fails
        let igMediaId = null;
        let published = false;
        let igError = null;

        try {
            if (process.env.NODE_ENV === "production" || force) {
                igMediaId = await postToInstagram(imageUrl, caption);
                published = true;
            } else {
                console.log("Skipping actual Instagram post in Dev. force=true to override.");
            }
        } catch (e: any) {
            igError = e.response?.data || e.message;
            console.error("Instagram posting failed DETAILED:", igError);
        }

        // 5. Save to DB
        const post = await prisma.post.create({
            data: {
                caption,
                imageUrl,
                igMediaId,
                published,
                error: igError,
            },
        });

        return NextResponse.json({ success: true, post, igError, debug: { force, env: process.env.NODE_ENV } });

    } catch (error: any) {
        console.error("Cron job failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
