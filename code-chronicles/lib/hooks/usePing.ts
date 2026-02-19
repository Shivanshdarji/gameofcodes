"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Measures real network latency via HTTP round-trip to /api/ping.
 * Uses Supabase Realtime Channels to track live connected user count.
 */
export function usePing(intervalMs = 3000) {
    const [ping, setPing] = useState<number | null>(null);
    const [connected, setConnected] = useState(true);
    const [onlineCount, setOnlineCount] = useState<number>(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // 1. Latency tracking
        const measure = async () => {
            try {
                const start = performance.now();
                await fetch("/api/ping", { method: "GET", cache: "no-store", mode: 'no-cors' });
                const ms = Math.round(performance.now() - start);
                setPing(ms);
                setConnected(true);
            } catch {
                setConnected(false);
                setPing(null);
            }
        };

        measure();
        timerRef.current = setInterval(measure, intervalMs);

        // 2. Real-time Presence tracking (Supabase)
        const channel = supabase.channel('online-users', {
            config: {
                presence: {
                    key: 'user',
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                // Count unique keys in presence state
                setOnlineCount(Object.keys(state).length);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ online_at: new Date().toISOString() });
                }
            });

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            channel.unsubscribe();
        };
    }, [intervalMs]);

    return { ping, connected, onlineCount };
}
