"use client";

import { useState } from "react";

export function ManualTrigger({ profileId }: { profileId: number }) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");

    const steps = [
        "Conectando ao ChatGPT...",
        "Criando a legenda...",
        "Montando o prompt da imagem...",
        "Gerando a imagem (gpt-image)...",
        "Conectando ao Instagram...",
        "Publicando o post...",
        "Finalizando..."
    ];

    const handleTrigger = async () => {
        setLoading(true);
        setError("");
        setResult(null);
        setStatus("Iniciando...");

        // Fake progress updates to keep user engaged
        let stepIndex = 0;
        const interval = setInterval(() => {
            setStatus(steps[stepIndex % steps.length]);
            stepIndex++;
        }, 2500);

        try {
            const response = await fetch(`/api/cron?force=true&profileId=${profileId}`);
            const data = await response.json();

            clearInterval(interval);

            if (data.success || data.post) {
                // If we got a post back even with an error, show it so user can see what happened
                setResult(data.post);
                setStatus("Concluído!");
                if (!data.success) {
                    setError(data.error || "A geração terminou com erros.");
                }
            } else {
                setError(data.error || "Ocorreu um erro desconhecido");
                setStatus("Falhou");
            }
        } catch (e: any) {
            clearInterval(interval);
            setError(e.message || "Erro de rede");
            setStatus("Erro");
        } finally {
            setLoading(false);
        }
    };

    const handleDone = () => {
        setResult(null);
        setError("");
        window.location.reload(); // Refresh to update the posts list
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-line">
            <h2 className="text-lg font-bold text-ink mb-4">Gerar post manualmente</h2>

            {!loading && !result && !error && (
                <div>
                    <p className="text-muted mb-4">Gere um novo post agora, sem esperar o agendamento.</p>
                    <button
                        onClick={handleTrigger}
                        className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                    >
                        🚀 Gerar novo post
                    </button>
                </div>
            )}

            {loading && (
                <div className="text-center py-8 bg-slate-50 rounded-lg animate-pulse">
                    <div className="w-12 h-12 border-4 border-primary-light border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-lg font-medium text-primary">{status}</p>
                    <p className="text-sm text-muted mt-2">Isso costuma levar de 10 a 15 segundos.</p>
                </div>
            )}

            {error && !result && (
                <div className="bg-danger-light border-l-4 border-danger p-4 rounded-r">
                    <h3 className="text-danger font-bold">Erro</h3>
                    <p className="text-danger/90">{error}</p>
                    <button onClick={handleDone} className="mt-2 text-sm text-danger underline">Tentar novamente</button>
                </div>
            )}

            {result && (
                <div className={`border rounded-lg p-6 text-center ${result.status === 'ERROR' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl ${result.status === 'ERROR' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {result.status === 'ERROR' ? '⚠️' : '✅'}
                    </div>
                    <h3 className={`text-2xl font-bold mb-2 ${result.status === 'ERROR' ? 'text-red-800' : 'text-green-800'}`}>
                        {result.status === 'ERROR' ? 'Rascunho criado com erros' : 'Rascunho criado!'}
                    </h3>
                    {error && <p className="text-red-600 mb-4">{error}</p>}

                    {result.id && !result.imageUrl?.includes('placehold.co') && (
                        <a
                            href={`/api/image/${result.id}`}
                            target="_blank"
                            className="block mb-4 rounded-lg overflow-hidden shadow-md mx-auto max-w-sm hover:opacity-90 transition-opacity"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`/api/image/${result.id}`} alt="Generated Post" className="w-full h-auto" />
                        </a>
                    )}

                    <div className="bg-white p-4 rounded border border-gray-200 text-left max-h-40 overflow-y-auto mb-4">
                        <p className="text-gray-700 whitespace-pre-wrap text-sm">{result.caption}</p>
                    </div>
                    <button
                        onClick={handleDone}
                        className={`${result.status === 'ERROR' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white px-6 py-2 rounded-full transition`}
                    >
                        Concluir
                    </button>
                </div>
            )}
        </div>
    );
}
