"use client";

import { useState } from "react";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/**
 * Per-profile schedule editor: pick weekdays + one or more times of day.
 * Emits hidden `scheduleDays` (0-6) and real `scheduleTimes` (HH:MM) fields
 * for the parent server-action <form>. Times are America/São_Paulo wall-clock.
 */
export function SchedulePicker({
    defaultDays,
    defaultTimes,
}: {
    defaultDays: number[];
    defaultTimes: string[];
}) {
    const [days, setDays] = useState<Set<number>>(new Set(defaultDays));
    const [times, setTimes] = useState<string[]>(defaultTimes.length ? defaultTimes : ["09:00"]);

    const toggleDay = (d: number) => {
        const next = new Set(days);
        if (next.has(d)) next.delete(d);
        else next.add(d);
        setDays(next);
    };

    const setTime = (i: number, v: string) => setTimes(times.map((t, idx) => (idx === i ? v : t)));
    const addTime = () => setTimes([...times, "18:00"]);
    const removeTime = (i: number) => setTimes(times.filter((_, idx) => idx !== i));

    return (
        <div className="space-y-4">
            {Array.from(days).map((d) => (
                <input key={d} type="hidden" name="scheduleDays" value={d} />
            ))}

            <div>
                <p className="text-sm font-medium text-ink mb-2">Dias da semana</p>
                <div className="flex flex-wrap gap-2">
                    {DAYS.map((label, d) => {
                        const on = days.has(d);
                        return (
                            <button
                                key={d}
                                type="button"
                                onClick={() => toggleDay(d)}
                                className={`w-12 h-10 rounded-lg text-sm font-semibold border transition-colors ${
                                    on
                                        ? "bg-primary text-white border-primary"
                                        : "bg-white text-muted border-line hover:border-primary/50"
                                }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div>
                <p className="text-sm font-medium text-ink mb-2">Horários (fuso de Brasília)</p>
                <div className="space-y-2">
                    {times.map((t, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <input
                                type="time"
                                name="scheduleTimes"
                                value={t}
                                onChange={(e) => setTime(i, e.target.value)}
                                className="rounded-lg border border-line p-2 text-sm"
                            />
                            {times.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeTime(i)}
                                    className="text-muted hover:text-danger text-sm"
                                    aria-label="Remover horário"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={addTime}
                    className="mt-2 text-sm font-semibold text-primary hover:text-primary-dark"
                >
                    + Adicionar horário
                </button>
            </div>

            <p className="text-xs text-muted">
                Deixe os dias vazios para pausar o agendamento automático deste perfil.
            </p>
        </div>
    );
}
