import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { generateCaption, generateImagePrompt } from "@/lib/gemini";
import { generateImageUrl } from "@/lib/image";
import { postToInstagram } from "@/lib/instagram";
import { resolveInstagramImageUrl } from "@/lib/cdn";

export const maxDuration = 120; // Allow 2 minutes for Envato scraping

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

        // Brand context
        const brandConfigs = await prisma.config.findMany({
            where: { key: { in: ["brand_name", "brand_description", "brand_colors", "brand_style", "brand_logo_url", "brand_extra", "brand_use_logo", "brand_less_text", "autopost"] } },
        });
        const brand = Object.fromEntries(brandConfigs.map((c: any) => [c.key, c.value]));
        const autopost = brand.autopost === "true";

        // 2. Generate Content
        let caption = "";
        let imagePrompt = "";
        let imageUrl = "";
        let generationError = null;

        try {
            console.log(`Generating text for topic: ${topic}`);
            caption = await generateCaption(topic, brand);

            console.log(`Generating image prompt based on the generated caption`);
            imagePrompt = await generateImagePrompt(caption, brand);

            // 3. Generate Image
            imageUrl = await generateImageUrl(imagePrompt, brand);
        } catch (e: any) {
            console.error("Content generation failed:", e);
            generationError = e.message || "Failed to generate content";
        }

        // 4. Save to DB as DRAFT or ERROR
        const post = await prisma.post.create({
            data: {
                caption: caption || `Falha na geração para o tema: ${topic}`,
                imageUrl: imageUrl || "https://placehold.co/1080x1080/eeeeee/999999?text=Erro+de+Geracao",
                published: false,
                status: generationError ? "ERROR" : "DRAFT",
                error: generationError,
            },
        });

        if (generationError) {
            return NextResponse.json({ success: false, post, error: generationError }, { status: 500 });
        }

        // 5. Auto-publish if autopost is enabled
        if (autopost) {
            try {
                const { headers } = await import("next/headers");
                const headersList = await headers();
                const host = headersList.get("host") || "localhost:3000";
                const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
                const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;

                const absoluteImageUrl = await resolveInstagramImageUrl(post.imageUrl, post.id, baseUrl);

                const igMediaId = await postToInstagram(absoluteImageUrl, post.caption);
                await prisma.post.update({
                    where: { id: post.id },
                    data: { published: true, status: "PUBLISHED", igMediaId, error: null },
                });
                return NextResponse.json({ success: true, autoposted: true, postId: post.id });
            } catch (e: any) {
                const raw = e.response?.data || e.message || "Unknown error";
                const errorMsg = typeof raw === "string" ? raw : JSON.stringify(raw);
                await prisma.post.update({
                    where: { id: post.id },
                    data: { status: "ERROR", error: errorMsg },
                });
                return NextResponse.json({ success: false, autopost_error: errorMsg, postId: post.id }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true, post, debug: { force, env: process.env.NODE_ENV } });

    } catch (error: any) {
        console.error("Cron job critically failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
