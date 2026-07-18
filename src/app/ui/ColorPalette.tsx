"use client";

import { useState } from "react";

/**
 * Brand color palette editor. Add colors via the native picker or by pasting a
 * hex/name; each color is emitted as a hidden input so the parent server-action
 * <form> receives them under `name`.
 */
export function ColorPalette({ name, defaultColors }: { name: string; defaultColors: string[] }) {
    const [colors, setColors] = useState<string[]>(defaultColors);
    const [draft, setDraft] = useState("#4361ee");

    const add = () => {
        const v = draft.trim();
        if (v && !colors.includes(v)) setColors([...colors, v]);
    };
    const remove = (c: string) => setColors(colors.filter((x) => x !== c));

    const isHex = (c: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c);

    return (
        <div className="space-y-3">
            {colors.map((c) => (
                <input key={c} type="hidden" name={name} value={c} />
            ))}

            <div className="flex flex-wrap gap-2">
                {colors.length === 0 && (
                    <span className="text-sm text-muted">Nenhuma cor — a IA decide.</span>
                )}
                {colors.map((c) => (
                    <span
                        key={c}
                        className="inline-flex items-center gap-2 rounded-full border border-line bg-white pl-1.5 pr-2 py-1 text-sm"
                    >
                        <span
                            className="w-5 h-5 rounded-full border border-line"
                            style={{ background: isHex(c) ? c : c }}
                        />
                        <span className="font-mono text-xs">{c}</span>
                        <button
                            type="button"
                            onClick={() => remove(c)}
                            className="text-muted hover:text-danger leading-none"
                            aria-label={`Remover ${c}`}
                        >
                            ✕
                        </button>
                    </span>
                ))}
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={isHex(draft) ? draft : "#4361ee"}
                    onChange={(e) => setDraft(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-line cursor-pointer bg-white p-1"
                    aria-label="Escolher cor"
                />
                <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            add();
                        }
                    }}
                    placeholder="#FFD400 ou 'azul corporativo'"
                    className="flex-1 rounded-lg border border-line p-2 text-sm"
                />
                <button
                    type="button"
                    onClick={add}
                    className="rounded-lg bg-primary text-white px-4 py-2 text-sm font-semibold hover:bg-primary-dark transition-colors"
                >
                    Adicionar
                </button>
            </div>
        </div>
    );
}
