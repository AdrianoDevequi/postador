"use client";

import { useEffect, useState } from "react";

export function NextPostTimer() {
    const [timeLeft, setTimeLeft] = useState("");
    const [nextDate, setNextDate] = useState("");

    useEffect(() => {
        function calculateNextRun() {
            // Schedule: Daily at 19:00 UTC (16:00 Local Test)
            const now = new Date();
            const target = new Date();

            // Set target to today at 19:00 UTC
            target.setUTCHours(19, 0, 0, 0);

            // If that time has passed today, move to tomorrow
            if (now > target) {
                target.setDate(target.getDate() + 1);
            }

            setNextDate(target.toLocaleString(undefined, {
                weekday: 'long',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
            }));

            const diff = target.getTime() - now.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            setTimeLeft(`${hours}h ${minutes}m`);
        }

        calculateNextRun();
        const interval = setInterval(calculateNextRun, 60000); // Update every minute

        return () => clearInterval(interval);
    }, []);

    if (!nextDate) return <div className="animate-pulse h-4 w-32 bg-gray-200 rounded"></div>;

    return (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex items-center justify-between">
            <div>
                <h3 className="text-sm font-semibold text-indigo-900 uppercase tracking-wide">Next Publication</h3>
                <p className="text-indigo-700 font-medium">{nextDate}</p>
            </div>
            <div className="text-right">
                <span className="text-2xl font-bold text-indigo-600 block">{timeLeft}</span>
                <span className="text-xs text-indigo-400">remaining</span>
            </div>
        </div>
    );
}
