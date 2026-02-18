"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Measures real network latency via HTTP round-trip to /api/ping.
 * Tracks live connected user count via Supabase Realtime Presence —
 * every browser tab that loads this hook joins the "online-users" channel,
 * so the count reflects ALL visitors, not just multiplayer players.
 */
export function usePing(intervalMs = 3000) {
    const [ping, setPing] = useState<number | null>(null);
    const [connected, setConnected] = useState(true);
    const [onlineCount, setOnlineCount] = useState<number>(1);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // ── Ping measurement ──────────────────────────────────────────────
    useEffect(() => {
        const measure = async () => {
            try {
                const start = performance.now();
                await fetch("/api/ping", { method: "GET", cache: "no-store" });
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
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [intervalMs]);

    // ── Supabase Presence — tracks every open browser tab ─────────────
    useEffect(() => {
        const key = `tab-${Math.random().toString(36).slice(2)}`;

        const channel = supabase.channel("online-users", {
            config: { presence: { key } },
        });

        channelRef.current = channel;

        channel
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState();
                // Each key = one browser tab; count all keys
                setOnlineCount(Object.keys(state).length);
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    await channel.track({ online_at: new Date().toISOString() });
                }
            });

        return () => {
            channel.untrack().then(() => supabase.removeChannel(channel));
        };
    }, []);

    return { ping, connected, onlineCount };
}
