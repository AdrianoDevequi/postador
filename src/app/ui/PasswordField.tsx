"use client";

import { useState } from "react";
import { passwordFieldClass } from "./formStyles";

function EyeIcon({ off }: { off: boolean }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-[18px] h-[18px]"
            aria-hidden="true"
        >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
            {off && <path d="m3 3 18 18" />}
        </svg>
    );
}

/** Password input with a show/hide toggle. */
export function PasswordField({
    label,
    ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    const [visible, setVisible] = useState(false);

    return (
        <div className="space-y-1.5">
            <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">{label}</span>
                <span className="relative block">
                    <input {...props} type={visible ? "text" : "password"} className={passwordFieldClass} />
                    <button
                        type="button"
                        onClick={() => setVisible((v) => !v)}
                        title={visible ? "Ocultar senha" : "Mostrar senha"}
                        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
                        aria-pressed={visible}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted hover:text-primary transition-colors"
                    >
                        <EyeIcon off={visible} />
                    </button>
                </span>
            </label>
        </div>
    );
}
