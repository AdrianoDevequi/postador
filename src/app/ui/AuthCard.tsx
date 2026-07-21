import Link from "next/link";
import { fieldClass } from "./formStyles";

export { fieldClass };

export function AuthCard({
    title,
    subtitle,
    error,
    children,
    footer,
}: {
    title: string;
    subtitle: string;
    error?: string;
    children: React.ReactNode;
    footer: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
            <div className="w-full max-w-md space-y-6">
                <div className="flex items-center justify-center gap-2">
                    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-violet text-white font-extrabold">
                        P
                    </span>
                    <span className="text-2xl font-extrabold tracking-tight text-ink">Postador</span>
                </div>

                <div className="bg-white p-7 rounded-2xl shadow-sm border border-line space-y-5">
                    <div className="text-center">
                        <h1 className="text-xl font-extrabold text-ink">{title}</h1>
                        <p className="mt-1 text-sm text-muted">{subtitle}</p>
                    </div>

                    {error && (
                        <div className="rounded-xl bg-danger-light border-l-4 border-danger px-3.5 py-2.5">
                            <p className="text-sm font-semibold text-danger">{error}</p>
                        </div>
                    )}

                    {children}
                </div>

                <p className="text-center text-sm text-muted">{footer}</p>
            </div>
        </div>
    );
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link href={href} className="font-semibold text-primary hover:underline">
            {children}
        </Link>
    );
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
    return (
        <button
            type="submit"
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
        >
            {children}
        </button>
    );
}

export function Field({
    label,
    ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <label className="block space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">{label}</span>
            <input className={fieldClass} {...props} />
        </label>
    );
}
