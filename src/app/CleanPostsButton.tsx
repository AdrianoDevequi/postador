"use client";

import { useState } from "react";

export function CleanPostsButton({ action, label, confirm: confirmMsg }: { action: () => Promise<{ count: number }>, label: string, confirm: string }) {
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        if (!confirm(confirmMsg)) return;
        setLoading(true);
        const result = await action();
        setLoading(false);
        alert(`${result.count} post(s) deletado(s).`);
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className="text-sm text-red-600 hover:text-red-800 border border-red-200 hover:border-red-400 px-3 py-1 rounded transition-colors disabled:opacity-50"
        >
            {loading ? "Limpando..." : label}
        </button>
    );
}
