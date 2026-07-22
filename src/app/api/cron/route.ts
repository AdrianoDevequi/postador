import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { generateCaption, generateImagePrompt } from "@/lib/openai";
import { generateImageUrl, prepareUploadedImage } from "@/lib/image";
import { postToInstagram } from "@/lib/instagram";
import { resolveInstagramImageUrl } from "@/lib/cdn";
import { profileToBrand, getIgCreds, isScheduledDue, missingBrandFields } from "@/lib/profile";
import { refreshIgToken } from "@/lib/instagram-oauth";
import type { Profile } from "@prisma/client";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export const maxDuration = 300; // Allow time for several profiles / Envato scraping

interface ProfileResult {
    profileId: number;
    profileName: string;
    postId?: number;
    status: "DRAFT" | "PUBLISHED" | "ERROR";
    autoposted?: boolean;
    error?: string;
}

/** Imagem opcional enviada pelo usuário na geração manual. */
interface UploadedImage {
    buffer: Buffer;
    // "reference" → a IA gera a arte usando a imagem como base;
    // "final"     → a imagem enviada É a imagem do post (só ajusta 4:5 + logo).
    mode: "reference" | "final";
}

async function processProfile(
    profile: Profile,
    baseUrl: string,
    draftOnly = false,
    uploaded?: UploadedImage
): Promise<ProfileResult> {
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

        if (uploaded?.mode === "final") {
            console.log(`[${profile.name}] Usando imagem enviada pelo usuário como imagem do post`);
            imageUrl = await prepareUploadedImage(uploaded.buffer, brand);
        } else {
            console.log(`[${profile.name}] Generating image prompt`);
            const imagePrompt = await generateImagePrompt(caption, brand);

            imageUrl = await generateImageUrl(imagePrompt, brand, uploaded?.buffer);
        }
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

/**
 * Instagram Login tokens live 60 days and can be extended indefinitely, but only
 * while still valid — so we top them up well before expiry on every cron poll.
 * Failures are logged and ignored; the profile's token stays usable until it
 * actually expires, and the panel already warns the user in that case.
 */
async function refreshExpiringIgTokens(now: Date) {
    const soon = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const stale = await prisma.profile.findMany({
        where: { authProvider: "instagram", tokenExpiresAt: { lt: soon } },
        select: { id: true, name: true, accessToken: true },
    });

    for (const p of stale) {
        if (!p.accessToken) continue;
        try {
            const { token, expiresAt } = await refreshIgToken(p.accessToken);
            await prisma.profile.update({
                where: { id: p.id },
                data: { accessToken: token, tokenExpiresAt: expiresAt },
            });
            console.log(`[${p.name}] Token do Instagram renovado`);
        } catch (e: any) {
            console.error(`[${p.name}] Falha ao renovar token:`, e.response?.data || e.message);
        }
    }
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
        const userId = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);

        const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}` || isVercelCron;
        if (!userId && !isCron) {
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

        // Only on scheduled polls — manual triggers shouldn't pay for this.
        if (isCron && !profileIdParam) await refreshExpiringIgTokens(now);

        let profiles: Profile[];
        if (profileIdParam) {
            // A logged-in user may only trigger their own profiles.
            profiles = await prisma.profile.findMany({
                where: { id: Number(profileIdParam), ...(userId ? { userId } : {}) },
            });
        } else {
            const active = await prisma.profile.findMany({
                where: { active: true, ...(userId && !isCron ? { userId } : {}) },
            });
            profiles = force ? active : active.filter((p) => isScheduledDue(p, now));
        }

        if (profiles.length === 0) {
            // A poll with nothing due is a normal no-op, not an error.
            const msg = profileIdParam ? "Perfil não encontrado" : "Nenhum post agendado para agora";
            return NextResponse.json({ success: true, skipped: true, message: msg, results: [] });
        }

        // Brand identity gate: without name + description the AI doesn't know
        // what the business is, so generation stays locked until they're filled.
        if (profileIdParam) {
            const missing = missingBrandFields(profiles[0]);
            if (missing.length) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Preencha antes de gerar posts: ${missing.join(" e ")} (seção Identidade de marca, nas configurações do perfil).`,
                    },
                    { status: 400 }
                );
            }
        } else {
            const skipped = profiles.filter((p) => missingBrandFields(p).length > 0);
            for (const p of skipped) {
                console.log(`[${p.name}] Pulado: identidade de marca incompleta (${missingBrandFields(p).join(", ")})`);
            }
            profiles = profiles.filter((p) => missingBrandFields(p).length === 0);
            if (profiles.length === 0) {
                return NextResponse.json({
                    success: true,
                    skipped: true,
                    message: "Perfis agendados estão com a identidade de marca incompleta",
                    results: [],
                });
            }
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

/**
 * Geração manual com imagem opcional (multipart). Usado pelo painel quando o
 * usuário anexa uma imagem — como referência para a IA ou como imagem final.
 * Sempre gera rascunho (draftOnly) e exige sessão de usuário.
 */
export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const userId = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        const form = await request.formData();
        const profileId = Number(form.get("profileId"));
        if (!profileId) {
            return NextResponse.json({ success: false, error: "profileId ausente" }, { status: 400 });
        }

        const profile = await prisma.profile.findFirst({ where: { id: profileId, userId } });
        if (!profile) {
            return NextResponse.json({ success: false, error: "Perfil não encontrado" }, { status: 404 });
        }

        const missing = missingBrandFields(profile);
        if (missing.length) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Preencha antes de gerar posts: ${missing.join(" e ")} (seção Identidade de marca, nas configurações do perfil).`,
                },
                { status: 400 }
            );
        }

        // Imagem opcional
        let uploaded: UploadedImage | undefined;
        const file = form.get("image");
        if (file instanceof File && file.size > 0) {
            if (file.size > 10 * 1024 * 1024) {
                return NextResponse.json({ success: false, error: "Imagem muito grande (máximo 10MB)" }, { status: 400 });
            }
            uploaded = {
                buffer: Buffer.from(await file.arrayBuffer()),
                mode: form.get("imageMode") === "final" ? "final" : "reference",
            };
        }

        const headersList = await headers();
        const host = headersList.get("host") || "localhost:3000";
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
        const baseUrl = process.env.BASE_URL || `${protocol}://${host}`;

        const r = await processProfile(profile, baseUrl, true, uploaded);
        const post = r.postId ? await prisma.post.findUnique({ where: { id: r.postId } }) : null;
        const ok = r.status !== "ERROR";
        return NextResponse.json({ success: ok, post, error: r.error }, { status: ok ? 200 : 500 });
    } catch (error: any) {
        console.error("Manual generation failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
