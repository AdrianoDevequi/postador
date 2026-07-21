import Link from "next/link";

/** Contact shown on the public legal pages. Swap for a business address if preferred. */
export const CONTACT_EMAIL = "adrianodevequi@gmail.com";

/** Last review date of the legal texts, shown to visitors and to Meta's reviewer. */
export const LEGAL_UPDATED_AT = "21 de julho de 2026";

/** Shared shell for the public legal pages (no session required). */
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <article className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-line p-6 sm:p-10">
                <Link href="/" className="text-sm font-semibold text-primary">
                    Postador
                </Link>
                <h1 className="text-2xl font-extrabold text-ink mt-4">{title}</h1>
                <p className="text-xs text-muted mt-1">Última atualização: {LEGAL_UPDATED_AT}</p>
                <div className="mt-6 space-y-5 text-sm leading-relaxed text-slate-700 [&_h2]:font-bold [&_h2]:text-ink [&_h2]:text-base [&_h2]:mt-6 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
                    {children}
                </div>
            </article>
        </div>
    );
}
