import type { TokenStatus } from "@/lib/profile";

const STYLES: Record<TokenStatus["state"], { bg: string; icon: string }> = {
    env: { bg: "bg-gray-100 text-gray-600 border-gray-200", icon: "🔧" },
    unknown: { bg: "bg-gray-100 text-gray-600 border-gray-200", icon: "❔" },
    ok: { bg: "bg-green-100 text-green-800 border-green-200", icon: "✅" },
    warning: { bg: "bg-amber-100 text-amber-800 border-amber-300", icon: "⚠️" },
    expired: { bg: "bg-red-100 text-red-800 border-red-300", icon: "⛔" },
};

export function TokenStatusBadge({ status, expiresAt }: { status: TokenStatus; expiresAt?: Date | null }) {
    const s = STYLES[status.state];
    return (
        <span
            title={expiresAt ? `Expira em ${expiresAt.toLocaleDateString()}` : undefined}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${s.bg}`}
        >
            <span>{s.icon}</span>
            {status.label}
        </span>
    );
}
