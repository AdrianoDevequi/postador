import { createProfile, updateProfile } from "./actions";
import type { Profile } from "@prisma/client";
import { Chips, csvToSet, type ChipOption } from "./ui/Chips";
import { ColorPalette } from "./ui/ColorPalette";
import { SchedulePicker } from "./ui/SchedulePicker";
import { parseSchedule } from "@/lib/profile";

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

export function ProfileForm({ profile }: { profile?: Profile }) {
    const isEdit = !!profile;
    const action = isEdit ? updateProfile : createProfile;
    const schedule = parseSchedule(profile ?? { scheduleDays: "", scheduleTimes: "" });
    const palette = (profile?.brandPalette || "").split(",").map((s) => s.trim()).filter(Boolean);

    return (
        // key remounts the whole form when switching profiles, so uncontrolled
        // inputs and client components (palette, schedule) reset to THIS profile's
        // data instead of keeping the previously viewed profile's values.
        <form key={isEdit ? profile.id : "new"} action={action} className="space-y-6">
            {isEdit && <input type="hidden" name="id" value={profile.id} />}

            <div>
                <label className={LABEL}>Nome do perfil (interno)</label>
                <input type="text" name="name" defaultValue={profile?.name || ""} placeholder="Ex: Jupiter Sites" required className={INPUT} />
            </div>

            {/* Instagram */}
            <Section title="Conexão com o Instagram" description="Conecte via Facebook para preencher ID e token automaticamente.">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-primary-light border border-primary/20 rounded-lg p-3">
                    <a
                        href={isEdit ? `/api/auth/instagram?profileId=${profile.id}` : "/api/auth/instagram"}
                        className="inline-flex items-center justify-center gap-2 bg-[#1877F2] text-white px-4 py-2 rounded-lg hover:bg-[#166fe0] text-sm font-semibold transition-colors flex-shrink-0"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
                        </svg>
                        {isEdit ? "Reconectar com Instagram" : "Conectar com Instagram"}
                    </a>
                    <p className="text-xs text-muted">Faça login com o Facebook e o ID e o token abaixo são preenchidos automaticamente. Ou informe manualmente.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={LABEL}>
                            Instagram Business Account ID
                            <HelpTip>
                                O ID numérico (começa com <span className="font-mono">17841...</span>) da sua conta Instagram Business, vinculada a uma Página do Facebook. Pegue no{" "}
                                <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="underline text-primary-light">Graph API Explorer</a>.
                            </HelpTip>
                        </label>
                        <input type="text" name="igUserId" defaultValue={profile?.igUserId || ""} placeholder="17841400000000000" className={`${INPUT} font-mono`} />
                    </div>
                    <div>
                        <label className={LABEL}>@usuário (opcional)</label>
                        <input type="text" name="igUsername" defaultValue={profile?.igUsername || ""} placeholder="minhaempresa" className={INPUT} />
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
                        placeholder={isEdit && profile?.accessToken ? "••••••••••••••••" : "EAAG..."}
                        className={`${INPUT} font-mono`}
                    />
                    <p className="text-xs text-muted mt-1">Deixe ID e token vazios para usar as credenciais padrão do ambiente (INSTAGRAM_*).</p>
                </div>
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
                        <label className={LABEL}>Nome da marca</label>
                        <input type="text" name="brandName" defaultValue={profile?.brandName || ""} placeholder="Ex: Jupiter Sites" className={INPUT} />
                    </div>
                    <div>
                        <label className={LABEL}>Link no final da legenda</label>
                        <input type="url" name="linkUrl" defaultValue={profile?.linkUrl || ""} placeholder="https://minhaempresa.com.br/" className={INPUT} />
                    </div>
                </div>
                <div>
                    <label className={LABEL}>Descrição da marca</label>
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
                    <label className={LABEL}>URL da logo</label>
                    <input type="url" name="brandLogoUrl" defaultValue={profile?.brandLogoUrl || ""} placeholder="https://..." className={INPUT} />
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
