"use client";

import { useState } from "react";

export function ManualTrigger() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");

    const steps = [
        "Contacting Gemini AI...",
        "Brainstorming Caption...",
        "Designing Image Prompt...",
        "Generating Image (Pollinations)...",
        "Connecting to Instagram...",
        "Publishing Post...",
        "Finalizing..."
    ];

    const handleTrigger = async () => {
        setLoading(true);
        setError("");
        setResult(null);
        setStatus("Initializing...");

        // Fake progress updates to keep user engaged
        let stepIndex = 0;
        const interval = setInterval(() => {
            setStatus(steps[stepIndex % steps.length]);
            stepIndex++;
        }, 2500);

        try {
            const response = await fetch("/api/cron?force=true");
            const data = await response.json();

            clearInterval(interval);

            if (data.success || data.post) {
                // If we got a post back even with an error, show it so user can see what happened
                setResult(data.post);
                setStatus("Complete!");
                if (!data.success) {
                    setError(data.error || "Generation finished with errors.");
                }
            } else {
                setError(data.error || "Unknown error occurred");
                setStatus("Failed");
            }
        } catch (e: any) {
            clearInterval(interval);
            setError(e.message || "Network error");
            setStatus("Error");
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4">Manual Control</h2>

            {!loading && !result && !error && (
                <div>
                    <p className="text-gray-600 mb-4">Trigger a new post generation immediately.</p>
                    <button
                        onClick={handleTrigger}
                        className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                    >
                        🚀 Generate New Draft
                    </button>
                </div>
            )}

            {loading && (
                <div className="text-center py-8 bg-gray-50 rounded-lg animate-pulse">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-lg font-medium text-indigo-800">{status}</p>
                    <p className="text-sm text-gray-500 mt-2">This usually takes about 10-15 seconds.</p>
                </div>
            )}

            {error && !result && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
                    <h3 className="text-red-800 font-bold">Error</h3>
                    <p className="text-red-700">{error}</p>
                    <button onClick={handleDone} className="mt-2 text-sm text-red-600 underline">Try Again</button>
                </div>
            )}

            {result && (
                <div className={`border rounded-lg p-6 text-center ${result.status === 'ERROR' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl ${result.status === 'ERROR' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {result.status === 'ERROR' ? '⚠️' : '✅'}
                    </div>
                    <h3 className={`text-2xl font-bold mb-2 ${result.status === 'ERROR' ? 'text-red-800' : 'text-green-800'}`}>
                        {result.status === 'ERROR' ? 'Draft Created with Errors' : 'Draft Created!'}
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
                        Done
                    </button>
                </div>
            )}
        </div>
    );
}
