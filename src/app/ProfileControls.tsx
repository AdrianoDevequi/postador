"use client";

import { useTransition } from "react";
import { deleteProfile } from "./actions";

export function DeleteProfileButton({ profileId, profileName }: { profileId: number; profileName: string }) {
    const [isPending, startTransition] = useTransition();

    return (
        <button
            type="button"
            disabled={isPending}
            onClick={() => {
                if (!confirm(`Excluir o perfil "${profileName}" e TODOS os seus posts? Esta ação não pode ser desfeita.`)) return;
                startTransition(() => deleteProfile(profileId));
            }}
            className="text-sm text-red-600 hover:text-red-800 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
        >
            {isPending ? "Excluindo..." : "Excluir perfil"}
        </button>
    );
}
