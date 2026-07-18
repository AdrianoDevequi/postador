import Link from "next/link";
import type { Profile } from "@prisma/client";
import { getTokenStatus } from "@/lib/profile";
import { logout } from "../login/actions";

function Logo() {
    return (
        <div className="flex items-center gap-2 px-2">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-violet text-white font-extrabold">
                P
            </span>
            <span className="text-xl font-extrabold tracking-tight text-ink">Postador</span>
        </div>
    );
}

function ProfileNav({
    profiles,
    selectedId,
    isNew,
}: {
    profiles: Profile[];
    selectedId?: number;
    isNew?: boolean;
}) {
    return (
        <nav className="space-y-1">
            <p className="px-3 pt-2 pb-1 text-xs font-bold uppercase tracking-wider text-muted">Perfis</p>
            {profiles.map((p) => {
                const active = p.id === selectedId;
                const ts = getTokenStatus(p);
                const dot =
                    ts.state === "expired"
                        ? "bg-danger"
                        : ts.state === "warning"
                          ? "bg-warning"
                          : ts.state === "env"
                            ? "bg-slate-300"
                            : "bg-success";
                return (
                    <Link
                        key={p.id}
                        href={`/?profile=${p.id}`}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                            active ? "bg-primary-light text-primary" : "text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-white border border-line text-xs font-bold uppercase text-slate-500 shrink-0">
                            {(p.name || "?").charAt(0)}
                        </span>
                        <span className="truncate flex-1">{p.name}</span>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} title={ts.label} />
                    </Link>
                );
            })}
            <Link
                href="/?profile=new"
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold border border-dashed transition-colors ${
                    isNew
                        ? "border-primary text-primary bg-primary-light"
                        : "border-line text-slate-500 hover:border-primary/50 hover:text-primary"
                }`}
            >
                <span className="text-lg leading-none">+</span> Novo perfil
            </Link>
        </nav>
    );
}

export function AppShell({
    profiles,
    selectedId,
    isNew,
    title,
    subtitle,
    actions,
    children,
}: {
    profiles: Profile[];
    selectedId?: number;
    isNew?: boolean;
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen lg:flex">
            {/* Sidebar (desktop) */}
            <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-line fixed inset-y-0 left-0 z-20">
                <div className="h-16 flex items-center border-b border-line px-4">
                    <Logo />
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                    <ProfileNav profiles={profiles} selectedId={selectedId} isNew={isNew} />
                </div>
                <div className="border-t border-line p-3">
                    <form action={logout}>
                        <button className="w-full text-left rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors">
                            Sair
                        </button>
                    </form>
                </div>
            </aside>

            {/* Content */}
            <div className="lg:ml-64 flex-1 min-w-0">
                {/* Mobile brand + profile strip */}
                <div className="lg:hidden bg-white border-b border-line">
                    <div className="h-14 flex items-center justify-between px-4">
                        <Logo />
                        <form action={logout}>
                            <button className="text-sm font-semibold text-slate-500">Sair</button>
                        </form>
                    </div>
                    <div className="flex gap-2 overflow-x-auto px-4 pb-3">
                        {profiles.map((p) => (
                            <Link
                                key={p.id}
                                href={`/?profile=${p.id}`}
                                className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold border ${
                                    p.id === selectedId
                                        ? "bg-primary text-white border-primary"
                                        : "bg-white text-slate-600 border-line"
                                }`}
                            >
                                {p.name}
                            </Link>
                        ))}
                        <Link
                            href="/?profile=new"
                            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold border border-dashed ${
                                isNew ? "border-primary text-primary" : "border-line text-slate-500"
                            }`}
                        >
                            + Novo
                        </Link>
                    </div>
                </div>

                {/* Topbar */}
                <header className="bg-white border-b border-line">
                    <div className="h-auto lg:h-16 flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 py-3 lg:py-0">
                        <div className="min-w-0">
                            <h1 className="text-xl font-extrabold text-ink truncate">{title}</h1>
                            {subtitle && <p className="text-sm text-muted truncate">{subtitle}</p>}
                        </div>
                        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
                    </div>
                </header>

                <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">{children}</main>
            </div>
        </div>
    );
}
