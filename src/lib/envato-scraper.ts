import { chromium, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// O contexto persistente salva todos os cookies/sessão entre execuções
const AUTH_STATE_DIR = path.resolve(process.cwd(), 'envato_auth_state');
const DOWNLOAD_DIR = path.resolve(process.cwd(), 'public', 'envato-downloads');
const PROJECT_NAME = 'Instagram Autopost';

/**
 * Garante que o diretório de downloads existe.
 */
function ensureDownloadDir() {
    if (!fs.existsSync(DOWNLOAD_DIR)) {
        fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    }
}

/**
 * Busca uma foto no Envato Elements e faz o download usando o contexto de sessão salvo.
 * @param searchTerm - Termo para buscar (ex: "technology business")
 * @returns Caminho local do arquivo baixado, ou null em caso de falha.
 */
export async function downloadEnvatoPhoto(searchTerm: string): Promise<string | null> {
    ensureDownloadDir();

    console.log(`[Envato Scraper] Iniciando busca por: "${searchTerm}"`);

    if (!fs.existsSync(AUTH_STATE_DIR)) {
        console.error('[Envato Scraper] Diretório de sessão não encontrado. Execute o script de login primeiro.');
        return null;
    }

    // Usa o contexto persistente para aproveitar a sessão de login salva
    const context = await chromium.launchPersistentContext(AUTH_STATE_DIR, {
        headless: true,
        acceptDownloads: true,
        downloadsPath: DOWNLOAD_DIR,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 900 },
    });

    const page = await context.newPage();

    try {
        // 1. Navegar para a busca de fotos
        const encodedTerm = encodeURIComponent(searchTerm);
        const searchUrl = `https://elements.envato.com/photos?q=${encodedTerm}&sort=trending`;
        console.log(`[Envato Scraper] Navegando para: ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
        // Espera extra para JS renderizar os resultados da grade
        await page.waitForTimeout(3000);

        // 2. Verificar se está logado (procura botão de login)
        const isLoggedIn = await checkLogin(page);
        if (!isLoggedIn) {
            console.error('[Envato Scraper] Sessão expirada! Atualize o cookie de sessão.');
            await context.close();
            return null;
        }

        // 3. Pegar o link do primeiro resultado de foto
        const firstItemLink = await getFirstPhotoLink(page);
        if (!firstItemLink) {
            console.error('[Envato Scraper] Nenhuma foto encontrada para o termo:', searchTerm);
            await context.close();
            return null;
        }

        console.log(`[Envato Scraper] Primeiro item encontrado: ${firstItemLink}`);

        // 4. Navegar para a página do item
        await page.goto(firstItemLink, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // 5. Realizar o download
        const filePath = await performDownload(page, searchTerm);

        await context.close();
        return filePath;

    } catch (error) {
        console.error('[Envato Scraper] Erro durante o scraping:', error);
        try { await context.close(); } catch { /* ignore */ }
        return null;
    }
}

/**
 * Verifica se o usuário está logado procurando por elementos da conta ou pelo botão de login.
 */
async function checkLogin(page: Page): Promise<boolean> {
    // Se tiver o botão "Log in" visível, não está logado
    const loginButton = page.locator('a[href*="/sign-in"], a:has-text("Log in"), button:has-text("Log in")').first();
    const isVisible = await loginButton.isVisible({ timeout: 5000 }).catch(() => false);
    return !isVisible;
}

/**
 * Pega o link do primeiro resultado de foto na página de busca.
 * Os links de items individuais têm o padrão: /photos/nome-XXXXXXX (ID alfanumérico no fim)
 */
async function getFirstPhotoLink(page: Page): Promise<string | null> {
    try {
        // Aguarda a grade de resultados aparecer
        await page.waitForSelector('a[href*="/photos/"]', { timeout: 20000 });

        // Pega todos os links de fotos e encontra o primeiro que é um item individual
        const href = await page.evaluate(() => {
            const allLinks = Array.from(
                document.querySelectorAll('a[href*="/photos/"]')
            ) as HTMLAnchorElement[];

            for (const el of allLinks) {
                const rawHref = el.getAttribute('href');
                if (!rawHref) continue;

                // Constrói a URL completa caso seja relativa
                const fullUrl = rawHref.startsWith('http')
                    ? rawHref
                    : `https://elements.envato.com${rawHref}`;

                try {
                    const url = new URL(fullUrl);
                    const segments = url.pathname.split('/').filter(Boolean);

                    // O último segmento deve ser o slug do item: "nome-XXXXXXX"
                    // Onde XXXXXXX é um ID alfanumérico de 5-8 chars maiúsculos
                    const lastSeg = segments[segments.length - 1] ?? '';
                    const isItemSlug = /^.+-[A-Z0-9]{5,8}$/.test(lastSeg);

                    // Não deve ter query params (seria uma listagem filtrada)
                    const hasNoParams = url.search === '';

                    if (isItemSlug && hasNoParams) {
                        return fullUrl;
                    }
                } catch {
                    // URL inválida, ignorar
                }
            }
            return null;
        });

        if (href) return href;

        // Fallback mais permissivo: qualquer link /photos/ que não seja a raiz
        const fallback = await page.evaluate(() => {
            const links = Array.from(
                document.querySelectorAll('a[href*="/photos/"]')
            ) as HTMLAnchorElement[];

            for (const link of links) {
                const h = link.href;
                const clean = h.split('?')[0].split('#')[0];
                // Não deve terminar em /photos ou /photos/
                if (clean && !/\/photos\/?$/.test(clean) && !h.includes('?')) {
                    return h;
                }
            }
            return null;
        });

        return fallback;
    } catch (error) {
        console.error('[Envato Scraper] Erro ao buscar primeiro item:', error);
        return null;
    }
}

/**
 * Realiza o download do item na página atual.
 * Trata o modal de "Project Name" se ele aparecer.
 */
async function performDownload(page: Page, searchTerm: string): Promise<string | null> {
    try {
        console.log('[Envato Scraper] Na página do item, procurando botão de download...');

        // Aguarda o botão principal de Download
        const downloadBtn = page.locator(
            'button:has-text("Download"), button[class*="download"], a:has-text("Download")'
        ).first();

        await downloadBtn.waitFor({ state: 'visible', timeout: 15000 });
        await downloadBtn.click();
        console.log('[Envato Scraper] Botão de download clicado.');

        // Aguarda para ver se aparece o modal de Project Name
        await page.waitForTimeout(2000);

        // Verifica se apareceu o modal de Project Name
        const projectInput = page.locator(
            'input[placeholder*="project" i], input[name*="project" i], [class*="ProjectName"] input, [class*="project-name"] input'
        ).first();
        const modalVisible = await projectInput.isVisible({ timeout: 3000 }).catch(() => false);

        if (modalVisible) {
            console.log('[Envato Scraper] Modal de Project Name detectado. Preenchendo...');
            await projectInput.fill(PROJECT_NAME);

            // Clicar no botão de confirmar
            const confirmBtn = page.locator(
                'button:has-text("Download"), [role="dialog"] button[type="submit"]'
            ).last();

            const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
            await confirmBtn.click();
            const download = await downloadPromise;
            return await saveDownload(download, searchTerm);
        } else {
            // Download direto sem modal — aguarda o evento de download
            const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
            const download = await downloadPromise.catch(async () => {
                // Segunda tentativa de clique
                await downloadBtn.click();
                return page.waitForEvent('download', { timeout: 30000 });
            });
            return await saveDownload(download, searchTerm);
        }

    } catch (error) {
        console.error('[Envato Scraper] Erro ao fazer download:', error);
        return null;
    }
}

/**
 * Salva o arquivo baixado em disco e retorna o caminho.
 */
async function saveDownload(download: import('playwright').Download, searchTerm: string): Promise<string | null> {
    try {
        const suggestedName = download.suggestedFilename();
        const ext = path.extname(suggestedName) || '.jpg';
        const safeTerm = searchTerm.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 30);
        const timestamp = Date.now();
        const fileName = `envato_${safeTerm}_${timestamp}${ext}`;
        const savePath = path.join(DOWNLOAD_DIR, fileName);

        await download.saveAs(savePath);
        console.log(`[Envato Scraper] ✅ Arquivo salvo em: ${savePath}`);
        return savePath;
    } catch (error) {
        console.error('[Envato Scraper] Erro ao salvar arquivo:', error);
        return null;
    }
}
