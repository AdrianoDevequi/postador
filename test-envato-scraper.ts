import { chromium } from 'playwright';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
    console.log("Iniciando Playwright...");
    const browser = await chromium.launch({ headless: false }); // Abrir navegador visível para debug

    // Configura um contexto com o cookie de sessão do Envato
    const sessionCookieStr = process.env.ENVATO_SESSION_COOKIE;

    if (!sessionCookieStr) {
        console.error("ERRO: Defina a variável ENVATO_SESSION_COOKIE no seu .env");
        await browser.close();
        return;
    }

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    });

    // Convertendo a string bruta de cookies do header para o formato do Playwright
    const cookiesArray = sessionCookieStr.split(';').map(pair => {
        const index = pair.indexOf('=');
        if (index === -1) return null;
        return {
            name: pair.substring(0, index).trim(),
            value: pair.substring(index + 1).trim(),
            domain: '.envato.com',
            path: '/'
        };
    }).filter(c => c !== null);

    // console.log("Cookies a injetar:", cookiesArray.map(c => c?.name));

    // @ts-ignore
    await context.addCookies(cookiesArray);

    const page = await context.newPage();
    console.log("Acessando Envato Elements...");
    await page.goto("https://elements.envato.com/photos");

    console.log("Página logada? Aguardando 15 segundos para observação...");

    await page.waitForTimeout(15000);

    await browser.close();
    console.log("Finalizado.");
}

run().catch(console.error);
