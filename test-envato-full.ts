// Test: Full Envato Elements scraper flow
// Searches for a photo and downloads it to tmp/envato-downloads/
import 'dotenv/config';
import { downloadEnvatoPhoto } from './src/lib/envato-scraper';

async function main() {
    const searchTerm = 'technology business modern';
    console.log(`\n📸 Testando download do Envato Elements para: "${searchTerm}"\n`);

    const filePath = await downloadEnvatoPhoto(searchTerm);

    if (filePath) {
        console.log(`\n✅ Sucesso! Arquivo baixado em: ${filePath}`);
    } else {
        console.log(`\n❌ Falha ao baixar imagem. Verifique os logs acima.`);
    }
}

main().catch(console.error);
