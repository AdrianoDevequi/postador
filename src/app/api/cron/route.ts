import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { generateCaption, generateImagePrompt } from "@/lib/openai";
import { generateImageUrl } from "@/lib/image";
import { postToInstagram } from "@/lib/instagram";
import { resolveInstagramImageUrl } from "@/lib/cdn";
import { profileToBrand, getIgCreds, isScheduledDue } from "@/lib/profile";
import type { Profile } from "@prisma/client";

export const maxDuration = 300; // Allow time for several profiles / Envato scraping

interface ProfileResult {
    profileId: number;
    profileName: string;
    postId?: number;
    status: "DRAFT" | "PUBLISHED" | "ERROR";
    autoposted?: boolean;
    error?: string;
}

async function processProfile(profile: Profile, baseUrl: string, draftOnly = false): Promise<ProfileResult> {
    const brand = profileToBrand(profile);

    // Pick a random topic for this profile
    const topics = profile.topics.split("\n").map((t) => t.trim()).filter(Boolean);
    const topic = topics.length ? topics[Math.floor(Math.random() * topics.length)] : "Technology";

    // Generate content
    let caption = "";
    let imageUrl = "";
    let generationError: string | null = null;

    try {
        console.log(`[${profile.name}] Generating text for topic: ${topic}`);
        caption = await generateCaption(topic, brand);

        console.log(`[${profile.name}] Generating image prompt`);
        const imagePrompt = await generateImagePrompt(caption, brand);

        imageUrl = await generateImageUrl(imagePrompt, brand);
    } catch (e: any) {
        console.error(`[${profile.name}] Content generation failed:`, e);
        generationError = e.message || "Failed to generate content";
    }

    // Save as DRAFT or ERROR
    const post = await prisma.post.create({
        data: {
            profileId: profile.id,
            caption: caption || `Falha na geração para o tema: ${topic}`,
            imageUrl: imageUrl || "https://placehold.co/1080x1080/eeeeee/999999?text=Erro+de+Geracao",
            published: false,
            status: generationError ? "ERROR" : "DRAFT",
            error: generationError,
        },
    });

    if (generationError) {
        return { profileId: profile.id, profileName: profile.name, postId: post.id, status: "ERROR", error: generationError };
    }

    // Auto-publish if enabled for this profile (never on manual "draft only" runs)
    if (profile.autopost && !draftOnly) {
        try {
            const absoluteImageUrl = await resolveInstagramImageUrl(post.imageUrl, post.id, baseUrl);
            const igMediaId = await postToInstagram(absoluteImageUrl, post.caption, getIgCreds(profile));
            await prisma.post.update({
                where: { id: post.id },
                data: { published: true, status: "PUBLISHED", igMediaId, error: null },
            });
            return { profileId: profile.id, profileName: profile.name, postId: post.id, status: "PUBLISHED", autoposted: true };
        } catch (e: any) {
            const raw = e.response?.data || e.message || "Unknown error";
            const errorMsg = typeof raw === "string" ? raw : JSON.stringify(raw);
            await prisma.post.update({
                where: { id: post.id },
                data: { status: "ERROR", error: errorMsg },
            });
            return { profileId: profile.id, profileName: profile.name, postId: post.id, status: "ERROR", error: errorMsg };
        }
    }

    return { profileId: profile.id, profileName: profile.name, postId: post.id, status: "DRAFT" };
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const force = searchParams.get("force") === "true";
        const profileIdParam = searchParams.get("profileId");
        const draftOnly = searchParams.get("draftOnly") === "true";

        // Authorization
        const authHeader = request.headers.get("authorization");
        const isVercelCron = request.headers.get("x-vercel-cron") === "1";
        const cookieStore = await cookies();
        const isAdmin = cookieStore.get("admin_session")?.value === process.env.ADMIN_PASSWORD;

        if (!isAdmin && authHeader !== `Bearer ${process.env.CRON_SECRET}` && !force && !isVercelCron) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Resolve base URL for image hosting
        const headersList = await headers();
        const host = headersList.get("host") || "localhost:3000";
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
        const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;

        // Which profiles to process?
        // - profileId given (manual trigger)  → that one profile, right now
        // - force=true (manual "run now all")  → every active profile, ignoring schedule
        // - otherwise (scheduled poll)         → active profiles whose slot is due now
        const now = new Date();
        let profiles: Profile[];
        if (profileIdParam) {
            profiles = await prisma.profile.findMany({ where: { id: Number(profileIdParam) } });
        } else {
            const active = await prisma.profile.findMany({ where: { active: true } });
            profiles = force ? active : active.filter((p) => isScheduledDue(p, now));
        }

        if (profiles.length === 0) {
            // A poll with nothing due is a normal no-op, not an error.
            const msg = profileIdParam ? "Perfil não encontrado" : "Nenhum post agendado para agora";
            return NextResponse.json({ success: true, skipped: true, message: msg, results: [] });
        }

        const results: ProfileResult[] = [];
        for (const profile of profiles) {
            results.push(await processProfile(profile, baseUrl, draftOnly));
            // Mark scheduled slot as handled so the next poll won't repost it.
            if (!profileIdParam) {
                await prisma.profile.update({
                    where: { id: profile.id },
                    data: { lastScheduledRunAt: now },
                });
            }
        }

        // For single-profile manual triggers, return the post directly (the dashboard expects this shape)
        if (profileIdParam && results.length === 1) {
            const r = results[0];
            const post = r.postId ? await prisma.post.findUnique({ where: { id: r.postId } }) : null;
            const ok = r.status !== "ERROR";
            return NextResponse.json(
                { success: ok, post, error: r.error, autoposted: r.autoposted },
                { status: ok ? 200 : 500 }
            );
        }

        const anyError = results.some((r) => r.status === "ERROR");
        return NextResponse.json({ success: !anyError, results });
    } catch (error: any) {
        console.error("Cron job critically failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
