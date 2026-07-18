"use client";

import { useEffect, useState } from "react";

/**
 * Floating "saved" confirmation. Shows when the URL carries ?saved=1 (set by the
 * profile save action), then auto-hides and strips the param so it doesn't
 * re-appear on reload.
 */
export function SaveToast() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const url = new URL(window.location.href);
        if (url.searchParams.get("saved") !== "1") return;

        setShow(true);
        url.searchParams.delete("saved");
        window.history.replaceState({}, "", url.toString());
        const t = setTimeout(() => setShow(false), 3500);
        return () => clearTimeout(t);
    }, []);

    if (!show) return null;

    return (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-success text-white px-4 py-3 shadow-lg">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/25 text-sm">✓</span>
            <span className="text-sm font-semibold">Perfil salvo com sucesso</span>
        </div>
    );
}
