import { createProfile, updateProfile } from "./actions";
import type { Profile } from "@prisma/client";
import { Chips, csvToSet, type ChipOption } from "./ui/Chips";
import { ColorPalette } from "./ui/ColorPalette";
import { SchedulePicker } from "./ui/SchedulePicker";
import { parseSchedule, missingBrandFields } from "@/lib/profile";

const BRAND_STYLES: ChipOption[] = [
    { value: "modern and professional", label: "Moderno" },
    { value: "minimalist and clean", label: "Minimalista" },
    { value: "bold and vibrant", label: "Ousado" },
    { value: "elegant and sophisticated", label: "Elegante" },
    { value: "corporate", label: "Corporativo" },
    { value: "playful and fun", label: "Divertido" },
    { value: "luxury premium", label: "Luxuoso" },
    { value: "futuristic tech", label: "Tech / Futurista" },
    { value: "retro vintage", label: "Retrô" },
];

const POST_TONES: ChipOption[] = [
    { value: "uma dica prática ou tutorial rápido", label: "Dica prática" },
    { value: "uma curiosidade ou 'você sabia?'", label: "Curiosidade" },
    { value: "uma reflexão motivacional ou inspiradora", label: "Motivacional" },
    { value: "uma novidade interessante ou tendência", label: "Novidade / Tendência" },
    { value: "uma oferta sutil ou demonstração de autoridade", label: "Oferta / Autoridade" },
    { value: "uma curiosidade de bastidores", label: "Bastidores" },
    { value: "um passo a passo ou tutorial detalhado", label: "Tutorial" },
];

const BRAND_FORMATS: ChipOption[] = [
    { value: "photo background with a text overlay", label: "Foto de fundo" },
    { value: "bold gradient background", label: "Gradiente" },
    { value: "solid text banner strip", label: "Faixa de texto" },
    { value: "split layout (image + color block)", label: "Split (dividido)" },
    { value: "framed border layout", label: "Moldura" },
    { value: "minimalist with lots of whitespace", label: "Minimalista" },
    { value: "collage of elements", label: "Colagem" },
    { value: "geometric shapes and patterns", label: "Formas geométricas" },
];

const IMAGE_STYLES: ChipOption[] = [
    { value: "photorealistic photography", label: "Fotorrealista" },
    { value: "digital illustration", label: "Ilustração digital" },
    { value: "3D render", label: "3D render" },
    { value: "flat minimalist vector design", label: "Flat / minimalista" },
    { value: "watercolor painting", label: "Aquarela" },
    { value: "retro pixel art, 8-bit", label: "Pixel art / 8-bit" },
    { value: "anime manga style", label: "Anime / mangá" },
    { value: "bold vibrant pop art", label: "Pop art vibrante" },
    { value: "playful cartoon illustration", label: "Cartoon" },
    { value: "magazine editorial collage", label: "Revista / colagem" },
];

const INPUT = "w-full rounded-lg border border-line p-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";
const LABEL = "block text-sm font-medium text-ink mb-1";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
    return (
        <section className="border border-line rounded-xl p-5 space-y-4">
            <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-primary">{title}</h3>
                {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
            </div>
            {children}
        </section>
    );
}

function LogoUpload({
    label,
    name,
    removeName,
    current,
    previewBg,
}: {
    label: string;
    name: string;
    removeName: string;
    current?: string | null;
    previewBg: string;
}) {
    return (
        <div>
            <label className="block text-xs text-muted mb-1">{label}</label>
            {current && (
                <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center justify-center rounded-md border border-line p-1.5 ${previewBg}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={current} alt={label} className="h-8 max-w-[110px] object-contain" />
                    </span>
                    <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer">
                        <input type="checkbox" name={removeName} value="true" className="w-3.5 h-3.5 rounded border-line" />
                        Remover
                    </label>
                </div>
            )}
            <input
                type="file"
                name={name}
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="block w-full text-xs text-muted file:mr-2 file:rounded-md file:border-0 file:bg-primary-light file:px-2.5 file:py-1.5 file:text-xs file:font-semibold file:text-primary file:cursor-pointer cursor-pointer"
            />
        </div>
    );
}

function HelpTip({ children }: { children: React.ReactNode }) {
    return (
        <span className="relative inline-flex group align-middle ml-1.5">
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-slate-300 text-white text-[10px] font-bold cursor-help select-none">
                ?
            </span>
            <span className="pointer-events-none group-hover:pointer-events-auto absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 z-10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg bg-ink text-white text-xs font-normal leading-relaxed p-3 shadow-lg">
                {children}
            </span>
        </span>
    );
}

export function ProfileForm({ profile, canConnect = true }: { profile?: Profile; canConnect?: boolean }) {
    const isEdit = !!profile;
    const action = isEdit ? updateProfile : createProfile;
    const schedule = parseSchedule(profile ?? { scheduleDays: "", scheduleTimes: "" });
    // Generation (manual and scheduled) is locked until these are filled — the
    // cron skips incomplete profiles, so warn right where the schedule is set.
    const missingBrand = missingBrandFields(profile ?? { brandName: null, brandDescription: null });
    const palette = (profile?.brandPalette || "").split(",").map((s) => s.trim()).filter(Boolean);

    return (
        // key remounts the whole form when switching profiles, so uncontrolled
        // inputs and client components (palette, schedule) reset to THIS profile's
        // data instead of keeping the previously viewed profile's values.
        // autoComplete="off": the browser reads this as a login form (a text field
        // followed by a password one) and fills the profile name with the user's
        // email and the token with a saved password.
        <form key={isEdit ? profile.id : "new"} action={action} autoComplete="off" className="space-y-6">
            {isEdit && <input type="hidden" name="id" value={profile.id} />}

            <div>
                <label className={LABEL}>Nome do perfil (interno)</label>
                <input type="text" name="name" defaultValue={profile?.name || ""} placeholder="Ex: Jupiter Sites" required autoComplete="off" className={INPUT} />
            </div>

            {/* Instagram */}
            <Section title="Conexão com o Instagram" description="Entre com sua conta e o ID e o token são preenchidos automaticamente.">
                {/* Hidden rather than disabled while access is pending: clicking it
                    would just bounce off Instagram with "Função de desenvolvedor é
                    insuficiente", which reads like a bug in our app. */}
                {!canConnect ? (
                    <p className="text-sm text-muted bg-slate-50 border border-line rounded-lg p-3">
                        A conexão com o Instagram é liberada assim que sua solicitação for aprovada — veja o aviso no
                        topo da página.
                    </p>
                ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-primary-light border border-primary/20 rounded-lg p-3">
                    <a
                        href={isEdit ? `/api/auth/instagram-login?profileId=${profile.id}` : "/api/auth/instagram-login"}
                        className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white px-4 py-2 rounded-lg hover:opacity-90 text-sm font-semibold transition-opacity flex-shrink-0"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07zm0 6.16a3.68 3.68 0 100 7.36 3.68 3.68 0 000-7.36zm0 6.07a2.39 2.39 0 110-4.78 2.39 2.39 0 010 4.78zm4.69-6.22a.86.86 0 11-1.72 0 .86.86 0 011.72 0z" />
                        </svg>
                        {isEdit ? "Reconectar com Instagram" : "Conectar com Instagram"}
                    </a>
                    <p className="text-xs text-muted">
                        Login direto no Instagram — não precisa de conta ou Página do Facebook. A conta precisa ser
                        Comercial ou Criador de conteúdo.
                    </p>
                </div>
                )}

                {isEdit && profile?.igUserId && (
                    <p className="text-sm text-success font-medium">
                        ✓ Conectado como @{profile.igUsername || profile.igUserId}
                    </p>
                )}

                {/* Same dev-mode restriction applies to the Facebook path, so it's
                    gated too — offering it while blocked only leads to a second
                    dead end. */}
                {canConnect && (
                    <p className="text-xs text-muted -mt-1">
                        Sua conta é vinculada a uma Página do Facebook?{" "}
                        <a
                            href={isEdit ? `/api/auth/instagram?profileId=${profile.id}` : "/api/auth/instagram"}
                            className="text-primary underline"
                        >
                            Conectar via Facebook
                        </a>{" "}
                        (fluxo antigo).
                    </p>
                )}

                {/* Escape hatch for when OAuth fails or a token has to be pasted by
                    hand. Collapsed by default — connecting via the button above
                    fills all of it in, so most users never need to open this. */}
                <details className="group border border-line rounded-lg">
                    <summary className="cursor-pointer select-none px-3 py-2 text-xs font-medium text-muted hover:text-ink">
                        Configuração manual (avançado)
                    </summary>
                    <div className="px-3 pb-3 pt-1 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL}>
                                    Instagram Business Account ID
                                    <HelpTip>
                                        O ID numérico (começa com <span className="font-mono">17841...</span>) da sua conta Instagram Business. Preenchido automaticamente ao conectar.
                                    </HelpTip>
                                </label>
                                <input type="text" name="igUserId" defaultValue={profile?.igUserId || ""} placeholder="17841400000000000" autoComplete="off" className={`${INPUT} font-mono`} />
                            </div>
                            <div>
                                <label className={LABEL}>@usuário (opcional)</label>
                                <input type="text" name="igUsername" defaultValue={profile?.igUsername || ""} placeholder="minhaempresa" autoComplete="off" className={INPUT} />
                            </div>
                        </div>

                        <div>
                            <label className={LABEL}>
                                Access Token (long-lived)
                                {isEdit && profile?.accessToken && <span className="text-success font-normal"> — já salvo (deixe vazio para manter)</span>}
                            </label>
                            <input
                                type="password"
                                name="accessToken"
                                defaultValue=""
                                // "new-password" is the one value Chrome honours here;
                                // plain "off" still triggers the password manager.
                                autoComplete="new-password"
                                placeholder={isEdit && profile?.accessToken ? "••••••••••••••••" : "IGAA... ou EAAG..."}
                                className={`${INPUT} font-mono`}
                            />
                            <p className="text-xs text-muted mt-1">Deixe ID e token vazios para usar as credenciais padrão do ambiente (INSTAGRAM_*).</p>
                        </div>
                    </div>
                </details>
            </Section>

            {/* Conteúdo */}
            <Section title="Conteúdo" description="Sobre o que os posts falam e em que tom.">
                <div>
                    <label className={LABEL}>Temas dos posts</label>
                    <p className="text-xs text-muted mb-2">Um tema por linha. O sistema escolhe aleatoriamente a cada post.</p>
                    <textarea name="topics" rows={4} defaultValue={profile?.topics || ""} placeholder={"Google Ads\nCriação de sites\nSEO\nMarketing Digital"} className={INPUT} />
                </div>
                <div>
                    <label className={LABEL}>Tom de voz / tipo de post</label>
                    <Chips name="postTones" options={POST_TONES} selected={csvToSet(profile?.postTones)} />
                </div>
            </Section>

            {/* Variação */}
            <Section title="Variação entre opções" description="Como o sistema usa os itens que você marca nos multiselects.">
                <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" name="alternateStyles" value="true" defaultChecked={profile?.alternateStyles ?? true} className="w-4 h-4 mt-0.5 rounded border-line text-primary" />
                    <span className="text-sm text-ink">
                        <span className="font-semibold">Alternar automaticamente</span> — a cada post, sorteia UMA das opções marcadas (tom, estilo, formato, estilo da imagem).
                        <span className="block text-xs text-muted mt-0.5">Desligado: usa todas as opções marcadas juntas, sempre igual.</span>
                    </span>
                </label>
            </Section>

            {/* Identidade de marca */}
            <Section title="Identidade de marca">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={LABEL}>
                            Nome da marca <span className="text-danger">*</span>
                        </label>
                        <input type="text" name="brandName" defaultValue={profile?.brandName || ""} placeholder="Ex: Jupiter Sites" className={INPUT} />
                    </div>
                    <div>
                        <label className={LABEL}>Link no final da legenda</label>
                        <input type="url" name="linkUrl" defaultValue={profile?.linkUrl || ""} placeholder="https://minhaempresa.com.br/" className={INPUT} />
                    </div>
                </div>
                <div>
                    <label className={LABEL}>
                        Descrição da marca <span className="text-danger">*</span>
                        <HelpTip>
                            Descreva o que a empresa faz, o que vende e para quem. A IA usa isso para gerar textos e
                            imagens que fazem sentido para o seu negócio. Obrigatório para gerar ou agendar posts.
                        </HelpTip>
                    </label>
                    <textarea name="brandDescription" defaultValue={profile?.brandDescription || ""} rows={2} placeholder="Ex: Agência especializada em criação de sites para pequenas empresas" className={INPUT} />
                </div>
                <div>
                    <label className={LABEL}>Estilo visual</label>
                    <Chips name="brandStyles" options={BRAND_STYLES} selected={csvToSet(profile?.brandStyles)} />
                </div>
                <div>
                    <label className={LABEL}>Paleta de cores</label>
                    <ColorPalette name="brandPalette" defaultColors={palette} />
                </div>
                <div>
                    <label className={LABEL}>
                        Logos
                        <HelpTip>
                            O sistema mede o brilho do canto da imagem gerada e escolhe automaticamente a versão com
                            mais contraste: a clara em fundos escuros, a escura em fundos claros. O ícone é usado
                            quando a versão ideal não está preenchida. Pode preencher só uma — ela será usada sempre.
                        </HelpTip>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <LogoUpload
                            label="Logo clara (fundos escuros)"
                            name="logoLightFile"
                            removeName="removeLogoLight"
                            current={profile?.brandLogoUrl}
                            previewBg="bg-slate-800"
                        />
                        <LogoUpload
                            label="Logo escura (fundos claros)"
                            name="logoDarkFile"
                            removeName="removeLogoDark"
                            current={profile?.brandLogoDarkUrl}
                            previewBg="bg-white"
                        />
                        <LogoUpload
                            label="Ícone da logo"
                            name="logoIconFile"
                            removeName="removeLogoIcon"
                            current={profile?.brandLogoIconUrl}
                            previewBg="bg-slate-100"
                        />
                    </div>
                    <p className="text-xs text-muted mt-2">PNG com fundo transparente fica melhor. Máx. 5MB por arquivo.</p>
                    <label className="flex items-center gap-3 cursor-pointer mt-3">
                        <input type="checkbox" name="useLogo" value="true" defaultChecked={profile?.useLogo ?? false} className="w-4 h-4 rounded border-line text-primary" />
                        <span className="text-sm font-medium text-ink">Adicionar logo na imagem</span>
                    </label>
                </div>
                <div>
                    <label className={LABEL}>Contexto extra</label>
                    <textarea name="brandExtra" defaultValue={profile?.brandExtra || ""} rows={2} placeholder="Público-alvo, tom de voz, etc." className={INPUT} />
                </div>
            </Section>

            {/* Design da imagem */}
            <Section title="Design da imagem" description="Guia a IA na geração do layout. Deixe vazio para a IA decidir.">
                <div>
                    <label className={LABEL}>Estilo da imagem</label>
                    <Chips name="designImageStyles" options={IMAGE_STYLES} selected={csvToSet(profile?.designImageStyles)} />
                </div>
                <div>
                    <label className={LABEL}>Formato / composição</label>
                    <Chips name="brandFormats" options={BRAND_FORMATS} selected={csvToSet(profile?.brandFormats)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={LABEL}>Estilo da fonte</label>
                        <input type="text" name="designFontStyle" defaultValue={profile?.designFontStyle || ""} placeholder="Ex: sans-serif bold e condensada" className={INPUT} />
                    </div>
                    <div>
                        <label className={LABEL}>Tamanho da fonte</label>
                        <select name="designFontSize" defaultValue={profile?.designFontSize || ""} className={`${INPUT} bg-white`}>
                            <option value="">Padrão (IA decide)</option>
                            <option value="pequena e discreta">Pequena</option>
                            <option value="média e equilibrada">Média</option>
                            <option value="grande e destacada">Grande</option>
                            <option value="muito grande, ocupando bastante espaço">Muito grande</option>
                        </select>
                    </div>
                    <div>
                        <label className={LABEL}>Cor da fonte</label>
                        <input type="text" name="designFontColor" defaultValue={profile?.designFontColor || ""} placeholder="Ex: branco, ou amarelo #FFD400" className={INPUT} />
                    </div>
                    <div>
                        <label className={LABEL}>Efeitos no texto</label>
                        <input type="text" name="designEffects" defaultValue={profile?.designEffects || ""} placeholder="Ex: sombra forte, contorno preto" className={INPUT} />
                    </div>
                </div>
                <div>
                    <label className={LABEL}>Instruções extras de design</label>
                    <textarea name="designNotes" defaultValue={profile?.designNotes || ""} rows={2} placeholder="Ex: título no topo, ícones minimalistas, muito contraste, estética premium…" className={INPUT} />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="lessText" value="true" defaultChecked={profile?.lessText ?? false} className="w-4 h-4 rounded border-line text-primary" />
                    <span className="text-sm font-medium text-ink">Menos texto (só título, sem bullets)</span>
                </label>
            </Section>

            {/* Agendamento */}
            <Section title="Agendamento" description="Quais dias e horários publicar automaticamente (fuso de Brasília).">
                {missingBrand.length > 0 && (
                    <div className="bg-warning-light border-l-4 border-warning rounded-r-lg p-3">
                        <p className="text-sm font-semibold text-[#a06a12]">
                            O agendamento só roda depois de preencher: {missingBrand.join(" e ")}
                        </p>
                        <p className="text-xs text-[#a06a12]/90 mt-0.5">
                            Estão na seção Identidade de marca, acima. Sem isso a IA não sabe do que se trata o negócio.
                        </p>
                    </div>
                )}
                <SchedulePicker defaultDays={schedule.days} defaultTimes={schedule.times} />
                <div className="flex flex-col gap-3 pt-1 border-t border-line">
                    <label className="flex items-center gap-3 cursor-pointer pt-3">
                        <input type="checkbox" name="autopost" value="true" defaultChecked={profile?.autopost ?? false} className="w-4 h-4 rounded border-line text-primary" />
                        <span className="text-sm font-medium text-ink">
                            Publicar automaticamente <span className="text-muted font-normal">(sem essa opção, gera só rascunho para você aprovar)</span>
                        </span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" name="active" value="true" defaultChecked={profile?.active ?? true} className="w-4 h-4 rounded border-line text-primary" />
                        <span className="text-sm font-medium text-ink">
                            Perfil ativo <span className="text-muted font-normal">(incluído no agendamento)</span>
                        </span>
                    </label>
                </div>
            </Section>

            <button type="submit" className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-dark text-sm font-bold transition-colors">
                {isEdit ? "Salvar perfil" : "Criar perfil"}
            </button>
        </form>
    );
}
