import { createProfile, updateProfile } from "./actions";
import type { Profile } from "@prisma/client";

function HelpTip({ children }: { children: React.ReactNode }) {
    return (
        <span className="relative inline-flex group align-middle ml-1.5">
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-gray-300 text-white text-[10px] font-bold cursor-help select-none">
                ?
            </span>
            <span className="pointer-events-none group-hover:pointer-events-auto absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 z-10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg bg-gray-900 text-white text-xs font-normal leading-relaxed p-3 shadow-lg">
                {children}
            </span>
        </span>
    );
}

export function ProfileForm({ profile }: { profile?: Profile }) {
    const isEdit = !!profile;
    const action = isEdit ? updateProfile : createProfile;

    return (
        <form action={action} className="space-y-5">
            {isEdit && <input type="hidden" name="id" value={profile.id} />}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do perfil (interno)</label>
                <input
                    type="text"
                    name="name"
                    defaultValue={profile?.name || ""}
                    placeholder="Ex: Jupiter Sites"
                    required
                    className="w-full rounded-md border p-2 text-sm border-gray-300"
                />
            </div>

            {/* Credenciais Instagram */}
            <fieldset className="border border-gray-200 rounded-lg p-4 space-y-4">
                <legend className="text-sm font-semibold text-gray-700 px-2">Conexão com o Instagram</legend>

                {/* Automatic connect via Facebook Login — fills ID + token below */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                    <a
                        href={isEdit ? `/api/auth/instagram?profileId=${profile.id}` : "/api/auth/instagram"}
                        className="inline-flex items-center justify-center gap-2 bg-[#1877F2] text-white px-4 py-2 rounded-md hover:bg-[#166fe0] text-sm font-medium transition-colors flex-shrink-0"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
                        </svg>
                        {isEdit ? "Reconectar com Instagram" : "Conectar com Instagram"}
                    </a>
                    <p className="text-xs text-gray-500">
                        Faça login com o Facebook e o ID e o token abaixo são preenchidos automaticamente.
                        {" "}Ou informe manualmente.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Instagram Business Account ID
                            <HelpTip>
                                O ID numérico (começa com <span className="font-mono">17841...</span>) da sua conta Instagram Business.
                                <br />
                                Sua conta precisa ser <b>Business/Creator</b> e estar vinculada a uma Página do Facebook.
                                <br />
                                Pegue no{" "}
                                <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="underline text-indigo-300">
                                    Graph API Explorer
                                </a>{" "}
                                chamando <span className="font-mono">me/accounts</span> e depois{" "}
                                <span className="font-mono">{"{page-id}?fields=instagram_business_account"}</span>.
                            </HelpTip>
                        </label>
                        <input
                            type="text"
                            name="igUserId"
                            defaultValue={profile?.igUserId || ""}
                            placeholder="17841400000000000"
                            className="w-full rounded-md border p-2 text-sm border-gray-300 font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">@usuário (opcional)</label>
                        <input
                            type="text"
                            name="igUsername"
                            defaultValue={profile?.igUsername || ""}
                            placeholder="minhaempresa"
                            className="w-full rounded-md border p-2 text-sm border-gray-300"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Access Token (long-lived)
                        <HelpTip>
                            Token de acesso de longa duração (60 dias, começa com <span className="font-mono">EAAG...</span>).
                            <br />
                            No{" "}
                            <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="underline text-indigo-300">
                                Graph API Explorer
                            </a>{" "}
                            gere um token com as permissões <span className="font-mono">instagram_basic</span>,{" "}
                            <span className="font-mono">instagram_content_publish</span>,{" "}
                            <span className="font-mono">pages_show_list</span> e{" "}
                            <span className="font-mono">pages_read_engagement</span>.
                            <br />
                            Depois troque por um de longa duração seguindo o{" "}
                            <a href="https://developers.facebook.com/docs/instagram-api/getting-started" target="_blank" rel="noopener noreferrer" className="underline text-indigo-300">
                                guia oficial
                            </a>
                            .
                        </HelpTip>
                        {isEdit && profile?.accessToken && (
                            <span className="text-green-600 font-normal"> — já salvo (deixe vazio para manter)</span>
                        )}
                    </label>
                    <input
                        type="password"
                        name="accessToken"
                        defaultValue=""
                        placeholder={isEdit && profile?.accessToken ? "••••••••••••••••" : "EAAG..."}
                        className="w-full rounded-md border p-2 text-sm border-gray-300 font-mono"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                        Deixe ID e token vazios para usar as credenciais padrão do ambiente (INSTAGRAM_*).
                    </p>
                </div>
            </fieldset>

            {/* Temas */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temas dos posts</label>
                <p className="text-xs text-gray-500 mb-2">Um tema por linha. O sistema escolhe aleatoriamente a cada post.</p>
                <textarea
                    name="topics"
                    rows={4}
                    defaultValue={profile?.topics || ""}
                    placeholder={"Google Ads\nCriação de sites\nSEO\nMarketing Digital"}
                    className="w-full rounded-md border p-2 text-sm border-gray-300"
                />
            </div>

            {/* Identidade de marca */}
            <fieldset className="border border-gray-200 rounded-lg p-4 space-y-4">
                <legend className="text-sm font-semibold text-gray-700 px-2">Identidade de marca</legend>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da marca</label>
                        <input type="text" name="brandName" defaultValue={profile?.brandName || ""} placeholder="Ex: Jupiter Sites" className="w-full rounded-md border p-2 text-sm border-gray-300" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cores da marca</label>
                        <input type="text" name="brandColors" defaultValue={profile?.brandColors || ""} placeholder="Ex: azul #0066FF, branco #FFFFFF" className="w-full rounded-md border p-2 text-sm border-gray-300" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição da marca</label>
                    <textarea name="brandDescription" defaultValue={profile?.brandDescription || ""} rows={2} placeholder="Ex: Agência especializada em criação de sites para pequenas empresas" className="w-full rounded-md border p-2 text-sm border-gray-300" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estilo visual</label>
                        <input type="text" name="brandStyle" defaultValue={profile?.brandStyle || ""} placeholder="Ex: moderno, minimalista, clean" className="w-full rounded-md border p-2 text-sm border-gray-300" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Link no final da legenda</label>
                        <input type="url" name="linkUrl" defaultValue={profile?.linkUrl || ""} placeholder="https://minhaempresa.com.br/" className="w-full rounded-md border p-2 text-sm border-gray-300" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL da logo</label>
                    <input type="url" name="brandLogoUrl" defaultValue={profile?.brandLogoUrl || ""} placeholder="https://..." className="w-full rounded-md border p-2 text-sm border-gray-300" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contexto extra</label>
                    <textarea name="brandExtra" defaultValue={profile?.brandExtra || ""} rows={2} placeholder="Público-alvo, tom de voz, etc." className="w-full rounded-md border p-2 text-sm border-gray-300" />
                </div>
            </fieldset>

            {/* Design da imagem */}
            <fieldset className="border border-gray-200 rounded-lg p-4 space-y-4">
                <legend className="text-sm font-semibold text-gray-700 px-2">Design da imagem</legend>
                <p className="text-xs text-gray-500 -mt-1">
                    Opcional. Guia a IA na hora de gerar o layout do post. Deixe vazio para a IA decidir.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estilo da fonte</label>
                        <input
                            type="text"
                            name="designFontStyle"
                            list="fontStyleOptions"
                            defaultValue={profile?.designFontStyle || ""}
                            placeholder="Ex: sans-serif bold e condensada"
                            className="w-full rounded-md border p-2 text-sm border-gray-300"
                        />
                        <datalist id="fontStyleOptions">
                            <option value="Sans-serif bold e condensada" />
                            <option value="Sans-serif moderna e clean" />
                            <option value="Serifada elegante" />
                            <option value="Display impactante" />
                            <option value="Manuscrita / script" />
                        </datalist>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho da fonte</label>
                        <select
                            name="designFontSize"
                            defaultValue={profile?.designFontSize || ""}
                            className="w-full rounded-md border p-2 text-sm border-gray-300 bg-white"
                        >
                            <option value="">Padrão (IA decide)</option>
                            <option value="pequena e discreta">Pequena</option>
                            <option value="média e equilibrada">Média</option>
                            <option value="grande e destacada">Grande</option>
                            <option value="muito grande, ocupando bastante espaço">Muito grande</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cor da fonte</label>
                        <input
                            type="text"
                            name="designFontColor"
                            defaultValue={profile?.designFontColor || ""}
                            placeholder="Ex: branco, ou amarelo #FFD400"
                            className="w-full rounded-md border p-2 text-sm border-gray-300"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Efeitos no texto</label>
                        <input
                            type="text"
                            name="designEffects"
                            list="effectsOptions"
                            defaultValue={profile?.designEffects || ""}
                            placeholder="Ex: sombra forte, contorno preto"
                            className="w-full rounded-md border p-2 text-sm border-gray-300"
                        />
                        <datalist id="effectsOptions">
                            <option value="sombra suave (drop shadow)" />
                            <option value="contorno preto (outline)" />
                            <option value="brilho / glow" />
                            <option value="texto com gradiente" />
                            <option value="fundo em faixa atrás do texto" />
                        </datalist>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instruções extras de design</label>
                    <textarea
                        name="designNotes"
                        defaultValue={profile?.designNotes || ""}
                        rows={2}
                        placeholder="Ex: título no topo, ícones minimalistas, muito contraste, estética premium…"
                        className="w-full rounded-md border p-2 text-sm border-gray-300"
                    />
                </div>
            </fieldset>

            {/* Comportamento */}
            <div className="flex flex-col gap-3 pt-1">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="useLogo" value="true" defaultChecked={profile?.useLogo ?? false} className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-700">Adicionar logo na imagem</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="lessText" value="true" defaultChecked={profile?.lessText ?? false} className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-700">Menos texto (só título, sem bullets)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="autopost" value="true" defaultChecked={profile?.autopost ?? false} className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-700">Autopost <span className="text-gray-400 font-normal">(publicar automaticamente no cron)</span></span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="active" value="true" defaultChecked={profile?.active ?? true} className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-700">Perfil ativo <span className="text-gray-400 font-normal">(incluído no cron diário)</span></span>
                </label>
            </div>

            <button type="submit" className="bg-indigo-600 text-white px-5 py-2.5 rounded-md hover:bg-indigo-700 text-sm font-medium transition-colors">
                {isEdit ? "Salvar perfil" : "Criar perfil"}
            </button>
        </form>
    );
}
