"use client";

import { useEffect, useState, useTransition } from "react";
import { deleteProfile } from "./actions";

export function DeleteProfileButton({ profileId, profileName }: { profileId: number; profileName: string }) {
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);

    // Close on Escape while the modal is open
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="text-sm font-semibold text-danger hover:text-white border border-danger/30 hover:bg-danger hover:border-danger px-3 py-1.5 rounded-lg transition-colors"
            >
                Excluir perfil
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                    onClick={() => !isPending && setOpen(false)}
                >
                    <div
                        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 text-center"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-danger-light text-danger">
                            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                            </svg>
                        </div>

                        <h3 className="text-lg font-bold text-ink">Excluir perfil?</h3>
                        <p className="mt-2 text-sm text-muted">
                            Isso apaga o perfil <span className="font-semibold text-ink">“{profileName}”</span> e{" "}
                            <span className="font-semibold text-ink">todos os seus posts</span>. Esta ação não pode ser desfeita.
                        </p>

                        <div className="mt-6 flex gap-3 justify-center">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                disabled={isPending}
                                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => startTransition(() => deleteProfile(profileId))}
                                className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-danger hover:brightness-95 transition disabled:opacity-60"
                            >
                                {isPending ? "Excluindo..." : "Sim, excluir"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
