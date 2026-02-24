import 'dotenv/config';
import { generateImagePrompt } from './src/lib/gemini';
import { generateImageUrl } from './src/lib/image';

async function testFlow() {
    try {
        const caption = "Descubra como a inteligência artificial pode transformar a produtividade do seu negócio. A IA automatiza tarefas repetitivas e libera sua equipe para focar no que realmente importa: estratégia e inovação.";

        console.log("Caption:", caption);

        console.log("\nGenerating search term...");
        const searchTerm = await generateImagePrompt(caption);
        console.log("Search Term:", searchTerm);

        console.log("\nSearching image on Envato...");
        const imageUrl = await generateImageUrl(searchTerm);
        console.log("\n✅ Final Image URL:", imageUrl);

    } catch (e) {
        console.error(e);
    }
}

testFlow();
