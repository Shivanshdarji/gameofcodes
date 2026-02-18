"use client";

import { useEffect, useState, useRef } from "react";

/**
 * Measures real network latency via HTTP round-trip to /api/ping.
 * Also returns the live connected user count tracked by the Socket.io server.
 */
export function usePing(intervalMs = 3000) {
    const [ping, setPing] = useState<number | null>(null);
    const [connected, setConnected] = useState(true);
    const [onlineCount, setOnlineCount] = useState<number>(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const measure = async () => {
            try {
                const start = performance.now();
                const res = await fetch("/api/ping", { method: "GET", cache: "no-store" });
                const ms = Math.round(performance.now() - start);
                const data = await res.json();
                setPing(ms);
                setConnected(true);
                if (typeof data.connected === 'number') {
                    setOnlineCount(data.connected);
                }
            } catch {
                setConnected(false);
                setPing(null);
            }
        };

        measure();
        timerRef.current = setInterval(measure, intervalMs);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [intervalMs]);

    return { ping, connected, onlineCount };
}
