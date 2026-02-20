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
    Use emojis e hashtags relevantes. Seja criativo, não repita os mesmos padrões de sempre. Mantenha abaixo de 1800 caracteres.`;

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
    const style = "High quality professional photography, clean composition, excellent lighting. Vibrant colors but very realistic, photorealistic texturing, 8k resolution, suitable for a professional and modern Instagram feed.";

    const prompt = `I have an Instagram post with the following caption in Portuguese:
    "${captionText}"
    
    Create a highly detailed text-to-image prompt (in English) that perfectly illustrates the main subject or feeling of this caption. 
    The image MUST follow this aesthetic style: "${style}".
    
    Output ONLY the final prompt text without quotes or explanations. Max length: 60 words.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating image prompt:", error);
    throw new Error("Failed to generate image prompt");
  }
}
