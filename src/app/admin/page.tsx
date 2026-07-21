import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { accessGateEnabled } from "@/lib/access";
import { approveAccessRequest, rejectAccessRequest } from "../access-actions";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
    PENDING: "bg-warning-light text-[#a06a12]",
    APPROVED: "bg-success-light text-[#0a7a3f]",
    REJECTED: "bg-danger-light text-danger",
};

const STATUS_LABEL: Record<string, string> = {
    PENDING: "Pendente",
    APPROVED: "Aprovado",
    REJECTED: "Recusado",
};

export default async function AdminPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    if (!user.isAdmin) redirect("/");

    const requests = await prisma.accessRequest.findMany({
        orderBy: [{ status: "asc" }, { id: "desc" }],
        include: { user: { select: { email: true } } },
        take: 200,
    });

    const pending = requests.filter((r) => r.status === "PENDING");

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-extrabold text-ink">Solicitações de acesso</h1>
                        <p className="text-sm text-muted mt-1">
                            {pending.length} pendente(s). Adicione o @ como Testador do Instagram no painel da Meta
                            antes de aprovar aqui.
                        </p>
                    </div>
                    <Link href="/" className="text-sm font-semibold text-primary">
                        ← Voltar ao painel
                    </Link>
                </div>

                {!accessGateEnabled() && (
                    <div className="rounded-xl p-4 bg-success-light border-l-4 border-success">
                        <p className="font-bold text-[#0a7a3f]">Fila desativada (IG_ACCESS_GATE=off)</p>
                        <p className="text-sm text-[#0a7a3f]/90 mt-0.5">
                            Todos os usuários já veem o botão de conectar. Esta lista fica só como histórico.
                        </p>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-line overflow-hidden">
                    <a
                        href="https://developers.facebook.com/apps/1542945893942187/roles/roles/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-5 py-3 text-xs font-semibold text-primary border-b border-line hover:bg-primary-light transition-colors"
                    >
                        Abrir Funções do app na Meta ↗ (Mais → Testadores do Instagram)
                    </a>

                    {requests.length === 0 ? (
                        <p className="p-5 text-sm text-muted">Nenhuma solicitação ainda.</p>
                    ) : (
                        <ul className="divide-y divide-line">
                            {requests.map((r) => (
                                <li key={r.id} className="flex items-center justify-between gap-4 p-4 flex-wrap">
                                    <div className="min-w-0">
                                        <p className="font-mono font-semibold text-ink">@{r.igHandle}</p>
                                        <p className="text-xs text-muted truncate">
                                            {r.user.email} ·{" "}
                                            {r.createdAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[r.status] || ""}`}
                                        >
                                            {STATUS_LABEL[r.status] || r.status}
                                        </span>
                                        {r.status !== "APPROVED" && (
                                            <form action={approveAccessRequest.bind(null, r.id)}>
                                                <button className="bg-success text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity">
                                                    Aprovar
                                                </button>
                                            </form>
                                        )}
                                        {r.status !== "REJECTED" && (
                                            <form action={rejectAccessRequest.bind(null, r.id)}>
                                                <button className="border border-line text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors">
                                                    Recusar
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
