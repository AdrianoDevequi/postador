import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function generateCaption(topic: string): Promise<string> {
  try {
    const postTypes = [
      "uma dica prática ou tutorial rápido",
      "uma novidade interessante ou tendência",
      "uma reflexão motivacional ou inspiradora",
      "uma oferta sutil ou demonstração de autoridade oferecendo um serviço",
      "uma curiosidade de bastidores ou 'você sabia?'"
    ];

    // Select a random post type
    const randomType = postTypes[Math.floor(Math.random() * postTypes.length)];

    const prompt = `Haja como um Social Media experiente. O tema central do perfil é "${topic}". 
    Hoje, eu preciso que você crie um post do tipo: **${randomType}** (mas relacionado ao tema central de alguma forma).
    Escreva uma legenda de Instagram envolvente e persuasiva em PORTUGUÊS DO BRASIL. 
    Use emojis e hashtags relevantes. Seja criativo, não repita os mesmos padrões de sempre. Mantenha abaixo de 1800 caracteres.
    
    REGRAS CRÍTICAS DE FORMATAÇÃO:
    - NÃO inclua nenhuma introdução conversacional (ex: "Uau! Adoro um desafio", "Aqui está o post:", "Claro!", etc).
    - NÃO inclua blocos sugerindo ideias de imagens ou carrossel no texto (ex: "[IMAGEM/CARROSSEL SUGERIDO]").
    - O seu retorno DEVE conter APENAS a legenda final do Instagram pronta para ser copiada e colada, nada mais.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() + "\n\nhttps://jupitersites.com.br/";
  } catch (error) {
    console.error("Error generating caption:", error);
    throw new Error("Failed to generate caption");
  }
}

export async function generateImagePrompt(captionText: string): Promise<string> {
  try {
    const prompt = `I have an Instagram post with the following caption in Portuguese:
    "${captionText}"
    
    Create a highly targeted search term (in English) to find a relevant stock photo on Envato/PhotoDune that perfectly illustrates the main subject of this caption.
    
    CRITICAL RULES:
    - Output ONLY 1 to 3 words.
    - DO NOT use generic words like "professional", "high quality", "photo", "image".
    - Focus strictly on the core object or concept (e.g., "artificial intelligence", "business meeting", "coffee cup").
    - Output ONLY the final search term without quotes, punctuation or explanations.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Error generating image search term:", error);
    throw new Error("Failed to generate image search term");
  }
}
