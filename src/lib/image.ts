import axios from "axios";

// Using Pollinations.ai for free reference image generation
// You can switch this to DALL-E or Vertex AI (Imagen) for production quality
export async function generateImageUrl(prompt: string): Promise<string> {
    try {
        // Pollinations doesn't need an API key, it generates via URL
        // We encode the prompt to be URL safe
        const encodedPrompt = encodeURIComponent(prompt);
        // Add a random seed to ensure freshness if prompt is same
        const seed = Math.floor(Math.random() * 10000);
        const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&nologo=true`;

        // Check if the URL is reachable (optional, usually it just works)
        // We can just return this URL as it's a direct image link
        return url;
    } catch (error) {
        console.error("Error creating image URL:", error);
        throw new Error("Failed to generate image URL");
    }
}
