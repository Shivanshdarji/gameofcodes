"use client";

import { Trophy, Target } from "lucide-react";

interface Player {
    id: string;
    name: string;
    color: string;
    distanceToSatellite: number;
    isEliminated: boolean;
}

interface PlayerLeaderboardProps {
    players: Player[];
    currentPlayerId: string;
}

export default function PlayerLeaderboard({ players, currentPlayerId }: PlayerLeaderboardProps) {
    // Sort by distance (closest first), eliminated players at bottom
    const sortedPlayers = [...players].sort((a, b) => {
        if (a.isEliminated && !b.isEliminated) return 1;
        if (!a.isEliminated && b.isEliminated) return -1;
        return a.distanceToSatellite - b.distanceToSatellite;
    });

    return (
        <div className="bg-black/80 border border-cyan-500/30 rounded-lg p-4 backdrop-blur-sm max-w-sm">
            <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-bold text-white font-mono">LEADERBOARD</h3>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {sortedPlayers.map((player, index) => {
                    const isCurrentPlayer = player.id === currentPlayerId;
                    const rank = player.isEliminated ? '✗' : index + 1;

                    return (
                        <div
                            key={player.id}
                            className={`flex items-center gap-3 p-2 rounded-lg ${isCurrentPlayer
                                    ? 'bg-cyan-900/30 border border-cyan-500/50'
                                    : 'bg-black/30 border border-white/10'
                                } ${player.isEliminated ? 'opacity-50' : ''}`}
                        >
                            {/* Rank */}
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 font-bold text-sm">
                                {rank === 1 && !player.isEliminated ? (
                                    <span className="text-yellow-500">🥇</span>
                                ) : rank === 2 && !player.isEliminated ? (
                                    <span className="text-gray-400">🥈</span>
                                ) : rank === 3 && !player.isEliminated ? (
                                    <span className="text-orange-600">🥉</span>
                                ) : (
                                    <span className={player.isEliminated ? 'text-red-500' : 'text-white/60'}>
                                        {rank}
                                    </span>
                                )}
                            </div>

                            {/* Player Color */}
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: player.color }}
                            />

                            {/* Player Info */}
                            <div className="flex-1 min-w-0">
                                <p className={`font-medium truncate ${isCurrentPlayer ? 'text-cyan-400' : 'text-white'
                                    }`}>
                                    {player.name}
                                    {isCurrentPlayer && " (You)"}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-white/60">
                                    <Target className="w-3 h-3" />
                                    <span>
                                        {player.isEliminated
                                            ? 'Eliminated'
                                            : `${player.distanceToSatellite.toFixed(1)}m away`
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
