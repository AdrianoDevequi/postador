import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function generateCaption(topic: string): Promise<string> {
  try {
    const prompt = `Crie uma legenda de Instagram envolvente sobre "${topic}". Escreva em PORTUGUÊS DO BRASIL. Use emojis e hashtags relevantes. Mantenha abaixo de 2200 caracteres mas faça algo interessante.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() + "\n\nhttps://jupitersites.com.br/";
  } catch (error) {
    console.error("Error generating caption:", error);
    throw new Error("Failed to generate caption");
  }
}

export async function generateImagePrompt(topic: string): Promise<string> {
  try {
    const style = "High quality professional photography, clean composition, excellent lighting. Vibrant colors but very realistic, photorealistic texturing, 8k resolution, suitable for a professional and modern Instagram feed.";

    const prompt = `Create a detailed text-to-image prompt for an Instagram post about "${topic}". 
    The image MUST follow this aesthetic style: "${style}".
    
    Output ONLY the final prompt text. Max length: 50 words.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating image prompt:", error);
    throw new Error("Failed to generate image prompt");
  }
}
