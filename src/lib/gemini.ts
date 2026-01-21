import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

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
    const style = "A high-quality professional photography in a modern tech environment. Cinematic lighting with a dark moody atmosphere, featuring deep blacks and dark blues. Strong accents of vibrant neon lime green and cyan blue holographic elements. Soft bokeh background of a futuristic office or data center. Overlaid with subtle digital sparkles and faint UI data elements. High contrast, sharp focus on the main subject, 8k resolution, photorealistic, tech-savvy aesthetic.";

    const prompt = `Create a detailed text-to-image prompt for an Instagram post about "${topic}". 
    The image MUST follow this exact aesthetic style: "${style}".
    
    Combine the topic subject seamlessly with this style. Output ONLY the final prompt text.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating image prompt:", error);
    throw new Error("Failed to generate image prompt");
  }
}
