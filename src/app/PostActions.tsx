"use client";

import { useTransition } from "react";
import { approvePost, deletePost, resetPostToDraft } from "./actions";

export function PostActions({ postId, isError }: { postId: number; isError?: boolean }) {
    const [isPending, startTransition] = useTransition();

    if (isError) {
        return (
            <div className="flex gap-2 mt-3">
                <button
                    type="button"
                    disabled={isPending}
                    onClick={() => startTransition(() => resetPostToDraft(postId))}
                    className="bg-yellow-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                >
                    {isPending ? "Aguarde..." : "Tentar Novamente"}
                </button>
                <button
                    type="button"
                    disabled={isPending}
                    onClick={() => startTransition(() => deletePost(postId))}
                    className="bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                    Excluir
                </button>
            </div>
        );
    }

    return (
        <div className="flex gap-2 mt-3">
            <button
                type="button"
                disabled={isPending}
                onClick={() => startTransition(async () => {
                    const res = await approvePost(postId);
                    if (res?.error) alert("Error: " + res.error);
                })}
                className="bg-green-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
                {isPending ? "Publicando no Instagram..." : "Aprovar e Postar"}
            </button>
            <button
                type="button"
                disabled={isPending}
                onClick={() => startTransition(() => deletePost(postId))}
                className="bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
                Excluir Rascunho
            </button>
        </div>
    );
}
