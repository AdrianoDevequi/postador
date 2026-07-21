import { cookies } from "next/headers";
import Link from "next/link";
import { confirmConnectedAccount } from "../actions";
import { OAUTH_PENDING_COOKIE } from "@/lib/connect";
import { listInstagramAccounts } from "@/lib/facebook-oauth";
import type { DiscoveredAccount } from "@/lib/connected-account";

export const dynamic = "force-dynamic";

export default async function ConnectPage() {
    const store = await cookies();
    const raw = store.get(OAUTH_PENDING_COOKIE)?.value;

    let pending: { profileId: number | null; accounts: DiscoveredAccount[] } | null = null;
    try {
        if (raw) {
            const { profileId, userToken } = JSON.parse(raw) as {
                profileId: number | null;
                userToken: string;
            };
            const accounts = await listInstagramAccounts(userToken);
            pending = { profileId, accounts };
        }
    } catch {
        pending = null;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-lg mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Escolha a conta</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {pending?.profileId
                            ? "Selecione qual conta do Instagram vincular a este perfil."
                            : "Selecione qual conta do Instagram usar para o novo perfil."}
                    </p>
                </div>

                {!pending || pending.accounts.length === 0 ? (
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-gray-600">
                            Nenhuma conta pendente. A sessão pode ter expirado.
                        </p>
                        <Link href="/" className="text-indigo-600 text-sm font-medium mt-3 inline-block">
                            ← Voltar
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pending.accounts.map((acc, i) => (
                            <form
                                key={acc.igUserId}
                                action={confirmConnectedAccount}
                                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between gap-4"
                            >
                                <input type="hidden" name="index" value={i} />
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 truncate">
                                        @{acc.igUsername || acc.igUserId}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        Página: {acc.pageName || "—"}
                                    </p>
                                </div>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium transition-colors flex-shrink-0"
                                >
                                    Usar esta conta
                                </button>
                            </form>
                        ))}
                        <Link href="/" className="text-gray-500 text-sm font-medium inline-block pt-2">
                            ← Cancelar
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
