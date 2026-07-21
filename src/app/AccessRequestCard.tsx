import type { AccessRequest } from "@prisma/client";
import { requestInstagramAccess } from "./access-actions";

/**
 * Shown while the Meta app is unpublished and this user's Instagram handle
 * hasn't been added as a tester yet. Lives outside <ProfileForm> because HTML
 * forbids nesting one form inside another.
 */
export function AccessRequestCard({ request }: { request: AccessRequest | null }) {
    const status = request?.status;

    if (status === "PENDING") {
        return (
            <div className="rounded-xl p-4 bg-warning-light border-l-4 border-warning">
                <p className="font-bold text-[#a06a12]">Solicitação enviada — aguardando liberação</p>
                <p className="text-sm text-[#a06a12]/90 mt-0.5">
                    Pedimos acesso para <span className="font-mono font-semibold">@{request?.igHandle}</span>. Assim que
                    liberarmos, você recebe um convite dentro do Instagram (Configurações → Apps e sites → Convites de
                    testador) e o botão de conectar aparece aqui.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-xl p-5 bg-white border border-line shadow-sm">
            <h2 className="font-bold text-ink">Solicite acesso ao Instagram</h2>
            <p className="text-sm text-muted mt-1">
                {status === "REJECTED"
                    ? "A solicitação anterior não foi aprovada. Confira o @ e envie novamente."
                    : "Estamos em fase de liberação gradual. Informe o @ da conta que você quer conectar e liberamos o acesso — a conta precisa ser Comercial ou Criador de conteúdo."}
            </p>

            <form action={requestInstagramAccess} className="flex flex-col sm:flex-row gap-2 mt-3">
                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted select-none">@</span>
                    <input
                        type="text"
                        name="igHandle"
                        required
                        autoComplete="off"
                        placeholder="minhaempresa"
                        defaultValue={request?.igHandle || ""}
                        className="w-full rounded-lg border border-line p-2.5 pl-7 text-sm font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                <button
                    type="submit"
                    className="bg-primary text-white px-4 py-2.5 rounded-lg hover:opacity-90 text-sm font-semibold transition-opacity flex-shrink-0"
                >
                    Solicitar acesso
                </button>
            </form>
        </div>
    );
}
