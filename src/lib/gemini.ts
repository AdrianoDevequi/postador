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

function buildBrandBlock(brand: BrandContext): string {
  const lines = [];
  if (brand.brand_name) lines.push(`- Nome da marca: ${brand.brand_name}`);
  if (brand.brand_description) lines.push(`- Descrição: ${brand.brand_description}`);
  if (brand.brand_style) lines.push(`- Estilo: ${brand.brand_style}`);
  if (brand.brand_colors) lines.push(`- Cores: ${brand.brand_colors}`);
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

    const randomType = postTypes[Math.floor(Math.random() * postTypes.length)];
    const brandBlock = buildBrandBlock(brand);

    const prompt = `Haja como um Social Media experiente. O tema central do perfil é "${topic}".
    Hoje, eu preciso que você crie um post do tipo: **${randomType}** (mas relacionado ao tema central de alguma forma).
    Escreva uma legenda de Instagram envolvente e persuasiva em PORTUGUÊS DO BRASIL.
    Use emojis e hashtags relevantes. Seja criativo, não repita os mesmos padrões de sempre. Mantenha abaixo de 1800 caracteres.${brandBlock}

    REGRAS CRÍTICAS DE FORMATAÇÃO:
    - NÃO inclua nenhuma introdução conversacional (ex: "Uau! Adoro um desafio", "Aqui está o post:", "Claro!", etc).
    - NÃO inclua blocos sugerindo ideias de imagens ou carrossel no texto (ex: "[IMAGEM/CARROSSEL SUGERIDO]").
    - O seu retorno DEVE conter APENAS a legenda final do Instagram pronta para ser copiada e colada, nada mais.`;

    const text = await chat(prompt);
    return text + "\n\nhttps://jupitersites.com.br/";
  } catch (error) {
    console.error("Error generating caption:", error);
    throw new Error("Failed to generate caption");
  }
}

export async function generateImagePrompt(captionText: string, brand: BrandContext = {}): Promise<string> {
  try {
    const styleHint = brand.brand_style ? ` Visual style: ${brand.brand_style}.` : "";
    const colorHint = brand.brand_colors ? ` Color palette: ${brand.brand_colors}.` : "";

    const prompt = `I have an Instagram post with the following caption in Portuguese:
    "${captionText}"

    Create a detailed image generation prompt (in English) for an AI image generator that perfectly illustrates this caption as a full-bleed Instagram square photo.${styleHint}${colorHint}

    CRITICAL RULES:
    - Output ONLY the final image prompt, nothing else.
    - Must be a PHOTOGRAPHIC or REALISTIC image that fills the entire frame — NO slides, NO banners, NO presentations, NO white backgrounds, NO text overlays.
    - Describe a real-world scene or concept with rich visual detail: subject, environment, lighting, mood, depth.
    - Keep it under 200 characters.`;

    const text = await chat(prompt);
    return text.trim();
  } catch (error) {
    console.error("Error generating image search term:", error);
    throw new Error("Failed to generate image search term");
  }
}
