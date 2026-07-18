import axios from "axios";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

async function chat(prompt: string): Promise<string> {
  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
  return res.data.choices[0].message.content.trim();
}

type BrandContext = Record<string, string>;

/**
 * Resolves a multiselect CSV into a single string.
 * - alternate on  → one option picked at random (varies the feed)
 * - alternate off → all selected options combined (consistent look)
 */
function pickOrJoin(csv: string | undefined, alternate: boolean): string {
  const items = (csv || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!items.length) return "";
  if (alternate) return items[Math.floor(Math.random() * items.length)];
  return items.join(", ");
}

function isAlternate(brand: BrandContext): boolean {
  return brand.brand_alternate !== "false"; // default: alternate
}

function buildBrandBlock(brand: BrandContext): string {
  const lines = [];
  if (brand.brand_name) lines.push(`- Nome da marca: ${brand.brand_name}`);
  if (brand.brand_description) lines.push(`- Descrição: ${brand.brand_description}`);
  const style = pickOrJoin(brand.brand_styles, isAlternate(brand)) || brand.brand_style;
  if (style) lines.push(`- Estilo: ${style}`);
  if (brand.brand_extra) lines.push(`- Contexto extra: ${brand.brand_extra}`);
  return lines.length ? `\n\n    IDENTIDADE DA MARCA:\n    ${lines.join("\n    ")}` : "";
}

export async function generateCaption(topic: string, brand: BrandContext = {}): Promise<string> {
  try {
    const postTypes = [
      "uma dica prática ou tutorial rápido",
      "uma novidade interessante ou tendência",
      "uma reflexão motivacional ou inspiradora",
      "uma oferta sutil ou demonstração de autoridade oferecendo um serviço",
      "uma curiosidade de bastidores ou 'você sabia?'"
    ];

    // Tone/post type: use the profile's multiselect when set, else a random default.
    const randomType =
      pickOrJoin(brand.brand_tones, isAlternate(brand)) ||
      postTypes[Math.floor(Math.random() * postTypes.length)];
    const brandBlock = buildBrandBlock(brand);

    const prompt = `Haja como um Social Media experiente. O tema central do perfil é "${topic}".
    Hoje, eu preciso que você crie um post do tipo: **${randomType}** (mas relacionado ao tema central de alguma forma).
    Escreva uma legenda de Instagram envolvente e persuasiva em PORTUGUÊS DO BRASIL.
    Use poucos emojis (máximo 3-4 no total, apenas onde agregam valor) e hashtags relevantes. Seja criativo, não repita os mesmos padrões de sempre. Mantenha abaixo de 1800 caracteres.${brandBlock}

    REGRAS CRÍTICAS DE FORMATAÇÃO:
    - NUNCA use asteriscos (**texto**) — o Instagram não renderiza markdown, fica feio.
    - Use LETRAS MAIÚSCULAS para dar ênfase quando necessário, não asteriscos.
    - NÃO inclua nenhuma introdução conversacional (ex: "Uau! Adoro um desafio", "Aqui está o post:", "Claro!", etc).
    - NÃO inclua blocos sugerindo ideias de imagens ou carrossel no texto (ex: "[IMAGEM/CARROSSEL SUGERIDO]").
    - O seu retorno DEVE conter APENAS a legenda final do Instagram pronta para ser copiada e colada, nada mais.`;

    const text = await chat(prompt);
    const link = brand.brand_link || "https://jupitersites.com.br/";
    return link ? `${text}\n\n${link}` : text;
  } catch (error) {
    console.error("Error generating caption:", error);
    throw new Error("Failed to generate caption");
  }
}

/**
 * Turns the profile's design controls into an explicit typography/effects
 * instruction that we append verbatim to the image prompt, so gpt-image-2
 * honours the user's font/color/effect choices instead of the LLM dropping
 * them when it compresses the prompt.
 */
function buildDesignBlock(brand: BrandContext): string {
  const alternate = isAlternate(brand);
  let block = "";

  // Multiselect looks — one at random per post (alternate on) or combined (off).
  const artStyle = pickOrJoin(brand.design_image_styles, alternate);
  if (artStyle) block += ` Overall art style: ${artStyle}.`;
  const visualStyle = pickOrJoin(brand.brand_styles, alternate);
  if (visualStyle) block += ` Visual style: ${visualStyle}.`;
  const format = pickOrJoin(brand.brand_formats, alternate);
  if (format) block += ` Composition: ${format}.`;

  // Palette is always applied as a whole (it's a set of colors, not a choice).
  const palette = (brand.brand_palette || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (palette.length) block += ` Color palette: ${palette.join(", ")}.`;

  const parts: string[] = [];
  if (brand.design_font_style) parts.push(`headline font ${brand.design_font_style}`);
  if (brand.design_font_size) parts.push(`headline size ${brand.design_font_size}`);
  if (brand.design_font_color) parts.push(`text color ${brand.design_font_color}`);
  if (brand.design_effects) parts.push(`text effects ${brand.design_effects}`);
  if (parts.length) block += ` Typography: ${parts.join(", ")}.`;
  if (brand.design_notes) block += ` Extra design direction: ${brand.design_notes}.`;
  return block;
}

export async function generateImagePrompt(captionText: string, brand: BrandContext = {}): Promise<string> {
  try {
    const brandName = brand.brand_name || "the brand";
    const palette = (brand.brand_palette || "").split(",").map((s) => s.trim()).filter(Boolean);
    const colors = palette.length ? palette.join(", ") : brand.brand_colors || "deep blue and white";
    const style = pickOrJoin(brand.brand_styles, isAlternate(brand)) || brand.brand_style || "modern and professional";
    const description = brand.brand_description || "";

    const lessText = brand.brand_less_text === "true";
    const textRule = lessText
      ? "- One bold headline in Portuguese (max 5 words) — NO bullet points, NO subtitle, title only"
      : "- One bold headline in Portuguese (max 5 words)\n- Optionally 2-3 short bullet points or a subtitle (max 5 words each)\n- Keep text minimal and balanced — do NOT fill the image with text";

    const prompt = `I have an Instagram post caption in Portuguese: "${captionText.substring(0, 200)}"

Create an English prompt for gpt-image-2 to generate a STYLIZED Instagram post design (like a professional social media graphic), NOT a plain photo.

Brand: ${brandName}. Colors: ${colors}. Style: ${style}.${description ? ` About: ${description}.` : ""}

The prompt must describe:
- A 4:5 portrait format Instagram post graphic (taller than wide, like a phone screen)
- A relevant background photo or scene related to the caption topic
- A semi-transparent colored overlay using the brand colors
${textRule}
- All text and key elements must be inside a safe zone with at least 8% padding from all edges (Instagram crops edges on feed)
- Clean professional social media graphic design layout
- ABSOLUTELY NO logos, NO brand marks, NO company names, NO icons with text, NO badges — the image must have ZERO branding elements
- NO white space, fills entire canvas

Output ONLY the image generation prompt in English, under 400 characters.`;

    const text = await chat(prompt);
    return `${text.trim()}${buildDesignBlock(brand)}`;
  } catch (error) {
    console.error("Error generating image search term:", error);
    throw new Error("Failed to generate image search term");
  }
}
