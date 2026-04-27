import axios from "axios";
import * as fs from "fs";
import * as path from "path";

const ENVATO_API_TOKEN = process.env.ENVATO_API_TOKEN || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

async function generateWithOpenAI(prompt: string): Promise<string | null> {
    if (!OPENAI_API_KEY) return null;
    try {
        console.log(`[image] Gerando imagem com gpt-image-2: "${prompt}"`);
        const res = await axios.post(
            "https://api.openai.com/v1/images/generations",
            {
                model: "gpt-image-2",
                prompt,
                n: 1,
                size: "1024x1024",
                quality: "low",
                response_format: "b64_json",
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
            return `data:image/png;base64,${b64}`;
        }
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error("[image] OpenAI image generation falhou:", msg);
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
export async function generateImageUrl(prompt: string): Promise<string> {
    const sanitized = prompt.trim();

    // Tentativa 1: OpenAI gpt-image-1 (geração por IA)
    const openAiUrl = await generateWithOpenAI(sanitized);
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

    // Fallback final: Unsplash
    console.log("[image] Usando Unsplash como fallback.");
    return `https://source.unsplash.com/1080x1080/?${encodeURIComponent(sanitized)}`;
}
