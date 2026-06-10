import { createProfile, updateProfile } from "./actions";
import type { Profile } from "@prisma/client";

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Instagram Business Account ID</label>
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
