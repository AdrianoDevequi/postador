"use client";

import { useRef, useState } from "react";

export function ManualTrigger({ profileId, missingFields = [] }: { profileId: number; missingFields?: string[] }) {
    const locked = missingFields.length > 0;
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [imageMode, setImageMode] = useState<"reference" | "final">("reference");
    // Painel aberto pelo link "Anexar imagem" — mostra as opções de modo ANTES
    // de escolher o arquivo.
    const [attachOpen, setAttachOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (f: File | null) => {
        setFile(f);
        setPreview((old) => {
            if (old) URL.revokeObjectURL(old);
            return f ? URL.createObjectURL(f) : null;
        });
    };

    const clearFile = () => {
        handleFileChange(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const closeAttach = () => {
        clearFile();
        setAttachOpen(false);
    };

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
            let response: Response;
            if (file) {
                // Com imagem anexada → POST multipart (referência ou imagem final)
                const form = new FormData();
                form.append("profileId", String(profileId));
                form.append("image", file);
                form.append("imageMode", imageMode);
                response = await fetch("/api/cron", { method: "POST", body: form });
            } else {
                response = await fetch(`/api/cron?force=true&draftOnly=true&profileId=${profileId}`);
            }
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
                    {locked ? (
                        <div className="bg-warning-light border-l-4 border-warning rounded-r-lg p-4">
                            <p className="font-bold text-[#a06a12]">Complete a identidade de marca para liberar</p>
                            <p className="text-sm text-[#a06a12]/90 mt-0.5">
                                Preencha {missingFields.join(" e ")} na seção{" "}
                                <span className="font-semibold">Identidade de marca</span> (Configurações, abaixo) — a IA
                                usa isso para gerar posts que fazem sentido para o seu negócio.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Imagem opcional: referência para a IA ou imagem final do post */}
                            {!attachOpen ? (
                                <button
                                    type="button"
                                    onClick={() => setAttachOpen(true)}
                                    className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-primary cursor-pointer transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                    </svg>
                                    <span className="underline underline-offset-2">Anexar imagem (opcional)</span>
                                </button>
                            ) : (
                                <div className="bg-slate-50 border border-line rounded-lg p-3 space-y-2.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs font-semibold text-ink">Como usar a imagem?</p>
                                        <button onClick={closeAttach} className="text-xs text-muted hover:text-danger underline underline-offset-2">
                                            Cancelar
                                        </button>
                                    </div>
                                    <div className="space-y-1.5 text-xs">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="imageMode"
                                                checked={imageMode === "reference"}
                                                onChange={() => setImageMode("reference")}
                                            />
                                            <span className="text-ink">
                                                <span className="font-medium">Referência</span>
                                                <span className="text-muted"> — a IA cria a arte usando sua imagem como base</span>
                                            </span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="imageMode"
                                                checked={imageMode === "final"}
                                                onChange={() => setImageMode("final")}
                                            />
                                            <span className="text-ink">
                                                <span className="font-medium">Imagem do post</span>
                                                <span className="text-muted"> — usada como está (4:5 + logo); só a legenda é gerada</span>
                                            </span>
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <label className="inline-flex items-center gap-1.5 text-xs font-medium text-primary border border-primary/30 rounded-md px-2.5 py-1.5 cursor-pointer hover:bg-primary-light transition-colors">
                                            {file ? "Trocar imagem" : "Escolher imagem"}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                className="hidden"
                                                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                                            />
                                        </label>
                                        {preview ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={preview} alt="Prévia da imagem" className="w-10 h-[50px] object-cover rounded-md border border-line" />
                                        ) : (
                                            <span className="text-xs text-muted">JPG, PNG ou WebP — máx. 10MB</span>
                                        )}
                                        {file && <span className="text-xs text-muted truncate max-w-[160px]">{file.name}</span>}
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={handleTrigger}
                                className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                            >
                                🚀 Gerar novo post
                            </button>
                        </div>
                    )}
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
                            {/* Use the image already returned in the response (avoids a slow
                                /api/image round-trip that can time out on cold starts). Falls
                                back to the endpoint for relative/FTP paths. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={result.imageUrl && !result.imageUrl.startsWith("/") ? result.imageUrl : `/api/image/${result.id}`}
                                alt="Post gerado"
                                className="w-full h-auto"
                            />
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
