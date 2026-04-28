import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

const ENVATO_API_TOKEN = process.env.ENVATO_API_TOKEN || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

type BrandContext = Record<string, string>;

async function generateWithOpenAI(prompt: string, brand: BrandContext = {}): Promise<string | null> {
    const styleHint = brand.brand_style ? `, style: ${brand.brand_style}` : "";
    const colorHint = brand.brand_colors ? `, colors: ${brand.brand_colors}` : "";
    const fullPrompt = `${prompt}${styleHint}${colorHint}. Full 1:1 square canvas, no white space, fills entire frame. NO logos, NO brand marks, NO company names anywhere in the image`;

    if (!OPENAI_API_KEY) return null;
    try {
        console.log(`[image] Gerando imagem com gpt-image-2: "${fullPrompt}"`);
        const res = await axios.post(
            "https://api.openai.com/v1/images/generations",
            {
                model: "gpt-image-2",
                prompt: fullPrompt,
                n: 1,
                size: "1024x1024",
                output_format: "jpeg",
                output_compression: 75,
            },
            {
                headers: {
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );
        const b64 = res.data?.data?.[0]?.b64_json;
        if (b64) {
            console.log("[image] ✅ Imagem gerada pela OpenAI (base64)");
            const imageBuffer = Buffer.from(b64, "base64");

            if (brand.brand_logo_url && brand.brand_use_logo === "true") {
                try {
                    const logoRes = await axios.get(brand.brand_logo_url, { responseType: "arraybuffer" });
                    const logoBuffer = Buffer.from(logoRes.data);
                    const logoResized = await sharp(logoBuffer)
                        .resize({ width: 180, height: 80, fit: "inside" })
                        .png()
                        .toBuffer();
                    const composited = await sharp(imageBuffer)
                        .composite([{ input: logoResized, gravity: "southeast", blend: "over" }])
                        .jpeg({ quality: 85 })
                        .toBuffer();
                            return `data:image/jpeg;base64,${composited.toString("base64")}`;
                } catch (e) {
                    console.error("[image] Falha ao sobrepor logo:", e);
                }
            }

            return `data:image/jpeg;base64,${b64}`;
        }
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error("[image] OpenAI erro HTTP:", error.response?.status, JSON.stringify(error.response?.data));
        } else {
            console.error("[image] OpenAI erro:", error);
        }
    }
    return null;
}

/**
 * Busca uma URL de preview (com watermark) no Envato PhotoDune via API.
 * Usado como fallback quando o scraper do Elements não está disponível.
 */
async function searchEnvatoApi(term: string): Promise<string | null> {
    if (!ENVATO_API_TOKEN) return null;
    try {
        console.log(`[image] Buscando no Envato API (PhotoDune): "${term}"`);
        const searchTerm = encodeURIComponent(term);
        const url = `https://api.envato.com/v1/discovery/search/search/item?site=photodune.net&term=${searchTerm}&sort_by=relevance`;

        const res = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${ENVATO_API_TOKEN}` }
        });

        const matches = res.data?.matches;
        if (matches && matches.length > 0) {
            const previewUrl = matches[0].previews?.icon_with_thumbnail_preview?.thumbnail_url;
            if (previewUrl) {
                console.log("[image] Preview URL encontrada:", previewUrl);
                return previewUrl;
            }
        }
    } catch (error) {
        console.error(`[image] Envato API search falhou para "${term}":`, error);
    }
    return null;
}

/**
 * Tenta baixar uma imagem via Playwright scraper do Envato Elements (assinatura).
 * Retorna uma URL de arquivo local (file://) ou null em caso de falha.
 */
async function downloadEnvatoElements(term: string): Promise<string | null> {
    try {
        const { exec } = await import('child_process');
        const scriptPath = path.join(process.cwd(), 'src', 'lib', 'run-scraper.ts');

        return new Promise((resolve) => {
            exec(`npx tsx "${scriptPath}" "${term}"`, (error, stdout, stderr) => {
                if (error) {
                    console.error("[image] Envato Elements scraper execution failed:", error);
                    resolve(null);
                    return;
                }

                const outputLines = stdout.split('\n');
                for (const line of outputLines) {
                    if (line.startsWith('RESULT_PATH:')) {
                        const filePath = line.substring('RESULT_PATH:'.length).trim();
                        if (filePath && fs.existsSync(filePath)) {
                            // Retorna a URL pública do arquivo (servido pela Next.js via pasta public)
                            const fileName = path.basename(filePath);
                            const publicUrl = `/envato-downloads/${fileName}`;
                            console.log(`[image] ✅ Imagem baixada do Elements: ${publicUrl}`);
                            resolve(publicUrl);
                            return;
                        }
                    }
                }

                console.error("[image] Elements scraper did not return a valid RESULT_PATH");
                resolve(null);
            });
        });

    } catch (error) {
        console.error("[image] Envato Elements scraper falhou:", error);
    }
    return null;
}

/**
 * Obtém a imagem para um post do Instagram.
 * Prioridade:
 *   1. Envato Elements (download real via scraper, assinatura paga)
 *   2. Envato API / PhotoDune (preview com watermark)
 *   3. Unsplash (fallback gratuito)
 *
 * @param prompt - Termo de busca gerado pelo Gemini
 * @returns URL (http) ou caminho local do arquivo de imagem
 */
export async function generateImageUrl(prompt: string, brand: BrandContext = {}): Promise<string> {
    const sanitized = prompt.trim();

    // Tentativa 1: OpenAI gpt-image-2 (geração por IA)
    const openAiUrl = await generateWithOpenAI(sanitized, brand);
    if (openAiUrl) return openAiUrl;

    // Tentativa 2: Envato Elements via Playwright (imagem real, sem watermark, HD)
    const elementsPath = await downloadEnvatoElements(sanitized);
    if (elementsPath) return elementsPath;

    // Tentativa 3: Envato API com termo completo
    let apiUrl = await searchEnvatoApi(sanitized);
    if (apiUrl) return apiUrl;

    // Tentativa 4: Envato API com apenas a primeira palavra (busca mais ampla)
    if (sanitized.includes(' ')) {
        const firstWord = sanitized.split(' ')[0];
        apiUrl = await searchEnvatoApi(firstWord);
        if (apiUrl) return apiUrl;
    }

    // Fallback final: Picsum
    console.log("[image] Usando Picsum como fallback.");
    return `https://picsum.photos/1080/1080`;
}
