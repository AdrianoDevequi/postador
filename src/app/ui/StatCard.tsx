const GRADIENTS: Record<string, string> = {
    teal: "from-[#1abc9c] to-[#16a085]",
    violet: "from-[#7579ff] to-[#b224ef]",
    blue: "from-[#4361ee] to-[#3a53c5]",
    pink: "from-[#e7508a] to-[#c724b1]",
    amber: "from-[#f0932b] to-[#e2a03f]",
};

/** Gradient KPI card, Vristo-style. */
export function StatCard({
    label,
    value,
    footer,
    color = "blue",
}: {
    label: string;
    value: string;
    footer?: string;
    color?: keyof typeof GRADIENTS;
}) {
    return (
        <div className={`rounded-2xl p-5 text-white shadow-sm bg-gradient-to-br ${GRADIENTS[color]}`}>
            <p className="text-sm font-semibold opacity-90">{label}</p>
            <p className="mt-2 text-3xl font-extrabold leading-tight break-words">{value}</p>
            {footer && <p className="mt-3 text-xs font-medium opacity-80">{footer}</p>}
        </div>
    );
}
