"use client";

import { useEffect, useState, useRef } from "react";
import { Users, Wifi, WifiOff } from "lucide-react";
import { Socket } from "socket.io-client";

interface NetworkStatusProps {
    playerCount: number;
    socket: Socket | null;
    connected: boolean;
    gamePhase?: string;
}

export default function NetworkStatus({ playerCount, socket, connected }: NetworkStatusProps) {
    const [ping, setPing] = useState<number | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const measureRef = useRef(false);

    useEffect(() => {
        if (!socket || !connected) {
            setPing(null);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        const measure = () => {
            if (measureRef.current) return; // prevent overlap
            measureRef.current = true;
            const start = Date.now();
            socket.emit("ping_check", () => {
                setPing(Date.now() - start);
                measureRef.current = false;
            });
            // Fallback: if no ack in 2s, just show a rough estimate
            setTimeout(() => { measureRef.current = false; }, 2000);
        };

        measure();
        intervalRef.current = setInterval(measure, 3000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [socket, connected]);

    const getQuality = (ms: number | null) => {
        if (!connected || ms === null) return { color: "text-red-500", bars: 0, barColor: "bg-red-500" };
        if (ms < 60) return { color: "text-green-400", bars: 4, barColor: "bg-green-400" };
        if (ms < 120) return { color: "text-cyan-400", bars: 3, barColor: "bg-cyan-400" };
        if (ms < 200) return { color: "text-yellow-400", bars: 2, barColor: "bg-yellow-400" };
        return { color: "text-red-400", bars: 1, barColor: "bg-red-400" };
    };

    const q = getQuality(ping);

    return (
        <div className="flex items-center gap-3 px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg">
            {/* Player count */}
            <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <Users className="w-3.5 h-3.5 text-white/50" />
                <span className="text-sm font-bold font-mono text-cyan-400">{playerCount}</span>
                <span className="text-[10px] text-white/30 font-mono hidden sm:block">ONLINE</span>
            </div>

            {/* Divider */}
            <div className="w-px h-4 bg-white/10" />

            {/* Signal bars */}
            <div className="flex items-end gap-[2px] h-4">
                {[1, 2, 3, 4].map((bar) => (
                    <div
                        key={bar}
                        className={`w-[3px] rounded-sm transition-all duration-500 ${bar <= q.bars ? q.barColor : "bg-white/10"}`}
                        style={{ height: `${bar * 25}%` }}
                    />
                ))}
            </div>

            {/* Ping */}
            {connected ? (
                <div className="flex items-center gap-1">
                    <Wifi className={`w-3 h-3 ${q.color}`} />
                    <span className={`text-[11px] font-mono font-bold ${q.color}`}>
                        {ping !== null ? `${ping}ms` : "…"}
                    </span>
                </div>
            ) : (
                <div className="flex items-center gap-1">
                    <WifiOff className="w-3 h-3 text-red-500" />
                    <span className="text-[11px] font-mono text-red-500">OFFLINE</span>
                </div>
            )}
        </div>
    );
}
