"use client";

import { Button } from "@/components/ui/Button";
import { Users, Copy, Check } from "lucide-react";
import { useState } from "react";

interface Player {
    id: string;
    name: string;
    color: string;
    isReady: boolean;
    isEliminated: boolean;
}

interface MultiplayerLobbyProps {
    roomId: string;
    players: Player[];
    currentPlayerId: string;
    isHost: boolean;
    onToggleReady: () => void;
    onStartMatch: () => void;
}

export default function MultiplayerLobby({
    roomId,
    players,
    currentPlayerId,
    isHost,
    onToggleReady,
    onStartMatch
}: MultiplayerLobbyProps) {
    const [copied, setCopied] = useState(false);

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const currentPlayer = players.find(p => p.id === currentPlayerId);
    const readyCount = players.filter(p => p.isReady).length;
    const canStart = isHost && readyCount >= 2;

    return (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-[#0a0a0a] border border-cyan-500/30 rounded-xl p-8 max-w-2xl w-full mx-4">
                {/* Header */}
                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-cyan-400 mb-2 font-mono">MULTIPLAYER LOBBY</h2>
                    <p className="text-white/60 text-sm">Satellite Race - First to reach wins!</p>
                </div>

                {/* Room Code */}
                <div className="bg-black/50 border border-white/10 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-white/40 mb-1">ROOM CODE</p>
                            <p className="text-2xl font-bold text-white font-mono tracking-wider">{roomId}</p>
                        </div>
                        <Button
                            onClick={copyRoomCode}
                            variant="outline"
                            size="sm"
                            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/20"
                        >
                            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                            {copied ? "Copied!" : "Copy"}
                        </Button>
                    </div>
                </div>

                {/* Player List */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Users className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-lg font-bold text-white">Players ({players.length}/10)</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto custom-scrollbar">
                        {players.map((player) => (
                            <div
                                key={player.id}
                                className={`bg-black/30 border rounded-lg p-3 flex items-center gap-3 ${player.id === currentPlayerId ? 'border-cyan-500' : 'border-white/10'
                                    }`}
                            >
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: player.color }}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate">
                                        {player.name}
                                        {player.id === currentPlayerId && " (You)"}
                                    </p>
                                    <p className="text-xs text-white/40">
                                        {player.isReady ? "✓ Ready" : "Not Ready"}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {/* Empty slots */}
                        {Array.from({ length: 10 - players.length }).map((_, i) => (
                            <div
                                key={`empty-${i}`}
                                className="bg-black/10 border border-white/5 rounded-lg p-3 flex items-center gap-3"
                            >
                                <div className="w-3 h-3 rounded-full bg-white/10" />
                                <p className="text-white/20 text-sm">Waiting for player...</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ready Status */}
                <div className="bg-black/30 border border-white/10 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-white/60">Ready Players</p>
                            <p className="text-xl font-bold text-cyan-400">{readyCount}/{players.length}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-white/40 mb-1">Minimum: 2 players</p>
                            <p className="text-xs text-white/40">Maximum: 10 players</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        onClick={onToggleReady}
                        className={`flex-1 ${currentPlayer?.isReady
                                ? 'bg-red-600 hover:bg-red-500'
                                : 'bg-green-600 hover:bg-green-500'
                            } text-white font-bold`}
                    >
                        {currentPlayer?.isReady ? "NOT READY" : "READY UP"}
                    </Button>
                    {isHost && (
                        <Button
                            onClick={onStartMatch}
                            disabled={!canStart}
                            className={`flex-1 ${canStart
                                    ? 'bg-cyan-600 hover:bg-cyan-500'
                                    : 'bg-gray-700 cursor-not-allowed'
                                } text-white font-bold`}
                        >
                            START MATCH
                        </Button>
                    )}
                </div>

                {isHost && !canStart && (
                    <p className="text-center text-yellow-400 text-sm mt-3">
                        ⚠ Need at least 2 ready players to start
                    </p>
                )}
            </div>
        </div>
    );
}
