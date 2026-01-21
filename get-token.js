const fs = require('fs');
const path = require('path');
const readline = require('readline');
const https = require('https');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ENV_PATH = path.join(__dirname, '.env');

function ask(question) {
    return new Promise(resolve => rl.question(question, resolve));
}

async function getLongLivedToken(shortToken, appId, appSecret) {
    const url = `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`;

    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const json = JSON.parse(data);
                if (json.error) {
                    reject(json.error);
                } else {
                    resolve(json.access_token);
                }
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log("🔑 Gerador de Token de Longa Duração (60 dias) do Instagram\n");

    const shortToken = await ask("1. Cole o Token de Curta Duração (gerado no Graph API Explorer): ");
    if (!shortToken) { console.log("Token inválido."); process.exit(1); }

    let appId = await ask("2. Digite o App ID (Painel do App > Configurações > Básico): ");
    let appSecret = await ask("3. Digite o App Secret (Painel do App > Configurações > Básico): ");

    console.log("\n⏳ Trocando token...");

    try {
        const longToken = await getLongLivedToken(shortToken.trim(), appId.trim(), appSecret.trim());
        console.log("\n✅ SUCESSO! Novo Token de Longa Duração gerado:");
        console.log("---------------------------------------------------");
        console.log(longToken);
        console.log("---------------------------------------------------");

        const updateEnv = await ask("\nDeseja atualizar o arquivo .env automaticamente? (s/n): ");
        if (updateEnv.toLowerCase() === 's') {
            let envContent = fs.readFileSync(ENV_PATH, 'utf8');

            // Regex to replace existing token
            const tokenRegex = /^INSTAGRAM_ACCESS_TOKEN=.*$/m;

            if (tokenRegex.test(envContent)) {
                envContent = envContent.replace(tokenRegex, `INSTAGRAM_ACCESS_TOKEN="${longToken}"`);
            } else {
                envContent += `\nINSTAGRAM_ACCESS_TOKEN="${longToken}"`;
            }

            fs.writeFileSync(ENV_PATH, envContent);
            console.log("✅ Arquivo .env atualizado!");
            console.log("⚠️  NÃO ESQUEÇA: Você também precisa atualizar as Environment Variables no painel da Vercel!");
        }

    } catch (error) {
        console.error("\n❌ Erro ao trocar token:", error.message || error);
    } finally {
        rl.close();
    }
}

main();
