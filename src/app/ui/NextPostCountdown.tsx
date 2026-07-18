"use client";

import { useEffect, useState } from "react";

/**
 * Live "time until next scheduled post" card. Counts down to nextRunMs
 * (computed server-side from the profile's schedule) and refreshes each minute.
 */
export function NextPostCountdown({
    nextRunMs,
    scheduleLabel,
    active,
}: {
    nextRunMs: number | null;
    scheduleLabel: string;
    active: boolean;
}) {
    const [now, setNow] = useState<number | null>(null);

    useEffect(() => {
        setNow(Date.now());
        const t = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(t);
    }, []);

    let value = "—";
    let footer = scheduleLabel;

    if (!active) {
        value = "Pausado";
        footer = "Perfil inativo";
    } else if (!nextRunMs) {
        value = "Sem agenda";
        footer = "Defina dias e horários";
    } else if (now !== null) {
        const diff = nextRunMs - now;
        if (diff <= 0) {
            value = "A qualquer momento";
        } else {
            const totalMin = Math.floor(diff / 60000);
            const days = Math.floor(totalMin / 1440);
            const hours = Math.floor((totalMin % 1440) / 60);
            const mins = totalMin % 60;
            value = days > 0 ? `${days}d ${hours}h` : `${hours}h ${mins}m`;
        }
    }

    return (
        <div className="rounded-2xl p-5 text-white shadow-sm bg-gradient-to-br from-[#7579ff] to-[#b224ef]">
            <p className="text-sm font-semibold opacity-90">Próximo post</p>
            <p className="mt-2 text-3xl font-extrabold leading-tight break-words">{value}</p>
            <p className="mt-3 text-xs font-medium opacity-80">{footer}</p>
        </div>
    );
}
