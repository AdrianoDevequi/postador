import { config } from "dotenv";
config();

import { generateImagePrompt } from "./src/lib/gemini";
import { generateImageUrl } from "./src/lib/image";

async function test() {
    console.log("1. Generating prompt from Gemini...");
    const prompt = await generateImagePrompt("Artificial Intelligence in 2026");
    console.log("PROMPT:", prompt);

    console.log("\n2. Generating Image URL...");
    const url = await generateImageUrl(prompt);
    console.log("URL:", url);
    console.log("Done!");
}

test().catch(e => console.log("Test Error:", e.message));
