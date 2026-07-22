import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

const ENVATO_API_TOKEN = process.env.ENVATO_API_TOKEN || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

type BrandContext = Record<string, string>;

/**
 * Escolhe a variação de logo com melhor contraste contra o canto onde ela será
 * sobreposta (sudeste). brand_logo_url é a logo CLARA (para fundos escuros),
 * brand_logo_dark_url a ESCURA (para fundos claros) e brand_logo_icon_url o
 * ícone, usado como fallback quando a variação ideal não foi preenchida.
 */
async function pickLogoUrl(imageBuffer: Buffer, brand: BrandContext): Promise<string> {
    const light = brand.brand_logo_url;
    const dark = brand.brand_logo_dark_url;
    const icon = brand.brand_logo_icon_url;

    // Só uma opção preenchida → não há o que escolher.
    const options = [light, dark, icon].filter(Boolean) as string[];
    if (options.length === 1) return options[0];

    try {
        const meta = await sharp(imageBuffer).metadata();
        const width = meta.width ?? 1024;
        const height = meta.height ?? 1280;
        // Região do canto inferior direito onde a logo (≤180x80) é aplicada.
        const w = Math.min(260, width);
        const h = Math.min(140, height);
        const stats = await sharp(imageBuffer)
            .extract({ left: width - w, top: height - h, width: w, height: h })
            .greyscale()
            .stats();
        const brightness = stats.channels[0].mean; // 0 (preto) – 255 (branco)
        const darkBackground = brightness < 128;
        console.log(`[image] Brilho do canto da logo: ${Math.round(brightness)} → fundo ${darkBackground ? "escuro" : "claro"}`);
        const picked = darkBackground ? light || icon || dark : dark || icon || light;
        return picked as string;
    } catch (e) {
        console.error("[image] Falha ao medir brilho do canto, usando a primeira logo disponível:", e);
        return options[0];
    }
}

/**
 * Sobrepõe a logo (variação escolhida por contraste) no canto inferior direito.
 * Devolve o buffer original quando não há logo configurada ou em caso de falha.
 */
async function applyLogo(imageBuffer: Buffer, brand: BrandContext): Promise<Buffer> {
    const hasAnyLogo = brand.brand_logo_url || brand.brand_logo_dark_url || brand.brand_logo_icon_url;
    if (!hasAnyLogo || brand.brand_use_logo !== "true") return imageBuffer;
    try {
        const logoUrl = await pickLogoUrl(imageBuffer, brand);
        const logoRes = await axios.get(logoUrl, { responseType: "arraybuffer" });
        const logoResized = await sharp(Buffer.from(logoRes.data))
            .resize({ width: 180, height: 80, fit: "inside" })
            .png()
            .toBuffer();
        return await sharp(imageBuffer)
            .composite([{ input: logoResized, gravity: "southeast", blend: "over" }])
            .jpeg({ quality: 85 })
            .toBuffer();
    } catch (e) {
        console.error("[image] Falha ao sobrepor logo:", e);
        return imageBuffer;
    }
}

/**
 * Normaliza uma imagem enviada pelo usuário para virar a imagem final do post:
 * corta/redimensiona para 4:5 (1024x1280) e aplica a logo do perfil.
 */
export async function prepareUploadedImage(upload: Buffer, brand: BrandContext = {}): Promise<string> {
    const imageBuffer = await sharp(upload)
        .resize(1024, 1280, { fit: "cover", position: "attention" })
        .jpeg({ quality: 90 })
        .toBuffer();
    const final = await applyLogo(imageBuffer, brand);
    return `data:image/jpeg;base64,${final.toString("base64")}`;
}

async function generateWithOpenAI(prompt: string, brand: BrandContext = {}, reference?: Buffer): Promise<string | null> {
    const styleHint = brand.brand_style ? `, style: ${brand.brand_style}` : "";
    const colorHint = brand.brand_colors ? `, colors: ${brand.brand_colors}` : "";
    const fullPrompt = `${prompt}${styleHint}${colorHint}. Full 1:1 square canvas, no white space, fills entire frame. NO logos, NO brand marks, NO company names anywhere in the image`;

    if (!OPENAI_API_KEY) return null;
    try {
        let res;
        if (reference) {
            // Com imagem de referência → endpoint de edição, que usa a imagem
            // enviada como base/inspiração para a arte gerada.
            console.log(`[image] Gerando imagem com gpt-image-2 (com referência): "${fullPrompt}"`);
            const form = new FormData();
            form.append("model", "gpt-image-2");
            form.append("prompt", `${fullPrompt}. Use the provided image as the visual base and inspiration for the design.`);
            form.append("n", "1");
            form.append("size", "1024x1536");
            form.append("image", new Blob([new Uint8Array(reference)]), "reference.png");
            res = await axios.post("https://api.openai.com/v1/images/edits", form, {
                headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
            });
        } else {
            console.log(`[image] Gerando imagem com gpt-image-2: "${fullPrompt}"`);
            res = await axios.post(
                "https://api.openai.com/v1/images/generations",
                {
                    model: "gpt-image-2",
                    prompt: fullPrompt,
                    n: 1,
                    size: "1024x1536",
                    output_format: "jpeg",
                    output_compression: 85,
                },
                {
                    headers: {
                        Authorization: `Bearer ${OPENAI_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                }
            );
        }
        const b64 = res.data?.data?.[0]?.b64_json;
        if (b64) {
            console.log("[image] ✅ Imagem gerada pela OpenAI (base64)");
            // Crop to 4:5 (1024x1280) centered — ideal for Instagram feed
            const imageBuffer = await sharp(Buffer.from(b64, "base64"))
                .resize(1024, 1536, { fit: "cover" })
                .extract({ left: 0, top: 128, width: 1024, height: 1280 })
                .jpeg({ quality: 90 })
                .toBuffer();

            const final = await applyLogo(imageBuffer, brand);
            return `data:image/jpeg;base64,${final.toString("base64")}`;
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
 * @param prompt - Termo de busca gerado pelo ChatGPT (gpt-4o-mini)
 * @param reference - Imagem opcional enviada pelo usuário como base para a arte
 * @returns URL (http) ou caminho local do arquivo de imagem
 */
export async function generateImageUrl(prompt: string, brand: BrandContext = {}, reference?: Buffer): Promise<string> {
    const sanitized = prompt.trim();

    // Tentativa 1: OpenAI gpt-image-2 (geração por IA)
    const openAiUrl = await generateWithOpenAI(sanitized, brand, reference);
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
