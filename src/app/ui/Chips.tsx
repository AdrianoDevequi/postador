export function csvToSet(csv?: string | null): Set<string> {
    return new Set(
        (csv || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
    );
}

export interface ChipOption {
    value: string;
    label: string;
}

/**
 * Multiselect rendered as pill chips backed by hidden checkboxes, so it works
 * inside a plain server-action <form> with no client JS. Checked chips turn
 * indigo via the `has-[:checked]` variant.
 */
export function Chips({
    name,
    options,
    selected,
}: {
    name: string;
    options: ChipOption[];
    selected: Set<string>;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((o) => (
                <label
                    key={o.value}
                    className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm cursor-pointer select-none hover:border-primary/50 transition-colors has-[:checked]:bg-primary has-[:checked]:text-white has-[:checked]:border-primary"
                >
                    <input
                        type="checkbox"
                        name={name}
                        value={o.value}
                        defaultChecked={selected.has(o.value)}
                        className="sr-only"
                    />
                    {o.label}
                </label>
            ))}
        </div>
    );
}
