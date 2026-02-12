"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Command } from '@/components/ui/PlaygroundScene';

interface Player {
    id: string;
    name: string;
    color: string;
    position: [number, number, number];
    rotation: number;
    isReady: boolean;
    isEliminated: boolean;
    submittedCode: Command[] | null;
    distanceToSatellite: number;
}

interface GameState {
    roomId: string | null;
    players: Player[];
    currentPlayer: Player | null;
    gamePhase: 'lobby' | 'coding' | 'executing' | 'finished';
    currentRound: number;
    codingTimer: number;
    satellitePosition: [number, number, number];
    currentTurnPlayer: string | null;
    isHost: boolean;
    winner: { id: string; name: string; color: string } | null;
    allPlayersCommands?: Array<{ id: string; name: string; color: string; commands: any[] }>;
}

export function useMultiplayer() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [gameState, setGameState] = useState<GameState>({
        roomId: null,
        players: [],
        currentPlayer: null,
        gamePhase: 'lobby',
        currentRound: 0,
        codingTimer: 30,
        satellitePosition: [0, 5, -30],
        currentTurnPlayer: null,
        isHost: false,
        winner: null
    });

    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const newSocket = io('http://localhost:3001');
        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to multiplayer server');
            setConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from multiplayer server');
            setConnected(false);
        });

        // Player events
        newSocket.on('player-joined', ({ players, newPlayer }) => {
            setGameState(prev => ({
                ...prev,
                players: players
            }));
        });

        newSocket.on('player-left', ({ players }) => {
            setGameState(prev => ({
                ...prev,
                players: players
            }));
        });

        newSocket.on('player-ready-changed', ({ players }) => {
            setGameState(prev => ({
                ...prev,
                players: players
            }));
        });

        newSocket.on('new-host', (hostId: string) => {
            setGameState(prev => ({
                ...prev,
                isHost: newSocket.id === hostId
            }));
        });

        // Game events
        newSocket.on('match-started', ({ gamePhase, satellitePosition, currentRound }) => {
            setGameState(prev => ({
                ...prev,
                gamePhase,
                satellitePosition,
                currentRound,
                codingTimer: 30
            }));
        });

        newSocket.on('timer-update', (timer: number) => {
            setGameState(prev => ({
                ...prev,
                codingTimer: timer
            }));
        });

        newSocket.on('code-submitted', ({ playerId, playerName }) => {
            console.log(`${playerName} submitted code`);
        });

        newSocket.on('execution-started', ({ players }) => {
            setGameState(prev => ({
                ...prev,
                gamePhase: 'executing',
                // Store all players' commands for parallel execution
                allPlayersCommands: players
            }));
        });

        newSocket.on('execute-turn', ({ playerId, playerName, commands, turnIndex, totalPlayers }) => {
            setGameState(prev => ({
                ...prev,
                currentTurnPlayer: playerId
            }));
        });

        newSocket.on('position-updated', ({ playerId, position, rotation, distanceToSatellite }) => {
            setGameState(prev => ({
                ...prev,
                players: prev.players.map(p =>
                    p.id === playerId
                        ? { ...p, position, rotation, distanceToSatellite }
                        : p
                )
            }));
        });

        newSocket.on('player-eliminated', ({ playerId, playerName }) => {
            setGameState(prev => ({
                ...prev,
                players: prev.players.map(p =>
                    p.id === playerId ? { ...p, isEliminated: true } : p
                )
            }));
        });

        newSocket.on('round-ended', ({ nextRound }) => {
            setGameState(prev => ({
                ...prev,
                currentRound: nextRound,
                gamePhase: 'coding',
                codingTimer: 30,
                currentTurnPlayer: null
            }));
        });

        newSocket.on('game-over', ({ winner, finalPositions, currentLevel, nextLevel }) => {
            setGameState(prev => ({
                ...prev,
                gamePhase: 'finished',
                winner,
                currentRound: currentLevel
            }));
        });

        newSocket.on('level-started', ({ level, satellitePosition, gamePhase }) => {
            setGameState(prev => ({
                ...prev,
                currentRound: level,
                satellitePosition,
                gamePhase,
                codingTimer: 30,
                winner: null,
                allPlayersCommands: undefined
            }));
        });

        return () => {
            newSocket.close();
        };
    }, []);

    const createRoom = useCallback((playerName: string) => {
        return new Promise<{ success: boolean; roomId?: string; error?: string }>((resolve) => {
            if (!socketRef.current) {
                resolve({ success: false, error: 'Not connected' });
                return;
            }

            socketRef.current.emit('create-room', playerName, (response: any) => {
                if (response.success) {
                    setGameState(prev => ({
                        ...prev,
                        roomId: response.roomId,
                        currentPlayer: response.player,
                        players: [response.player],
                        isHost: true
                    }));
                }
                resolve(response);
            });
        });
    }, []);

    const joinRoom = useCallback((roomId: string, playerName: string) => {
        return new Promise<{ success: boolean; error?: string }>((resolve) => {
            if (!socketRef.current) {
                resolve({ success: false, error: 'Not connected' });
                return;
            }

            socketRef.current.emit('join-room', roomId, playerName, (response: any) => {
                if (response.success) {
                    setGameState(prev => ({
                        ...prev,
                        roomId: response.roomId,
                        currentPlayer: response.player,
                        isHost: false
                    }));
                }
                resolve(response);
            });
        });
    }, []);

    const toggleReady = useCallback(() => {
        if (!socketRef.current || !gameState.roomId) return;
        socketRef.current.emit('toggle-ready', gameState.roomId);
    }, [gameState.roomId]);

    const startMatch = useCallback(() => {
        if (!socketRef.current || !gameState.roomId || !gameState.isHost) return;
        socketRef.current.emit('start-match', gameState.roomId);
    }, [gameState.roomId, gameState.isHost]);

    const submitCode = useCallback((commands: Command[]) => {
        if (!socketRef.current || !gameState.roomId) return;
        socketRef.current.emit('submit-code', gameState.roomId, commands);
    }, [gameState.roomId]);

    const updatePosition = useCallback((position: [number, number, number], rotation: number) => {
        if (!socketRef.current || !gameState.roomId) return;
        socketRef.current.emit('update-position', gameState.roomId, position, rotation);
    }, [gameState.roomId]);

    const playerReachedSatellite = useCallback(() => {
        if (!socketRef.current || !gameState.roomId) return;
        socketRef.current.emit('player-reached-satellite', gameState.roomId);
    }, [gameState.roomId]);

    const playerCrashed = useCallback(() => {
        if (!socketRef.current || !gameState.roomId) return;
        socketRef.current.emit('player-crashed', gameState.roomId);
    }, [gameState.roomId]);

    const startNextLevel = useCallback(() => {
        if (!socketRef.current || !gameState.roomId) return;
        socketRef.current.emit('start-next-level', gameState.roomId);
    }, [gameState.roomId]);

    return {
        connected,
        gameState,
        createRoom,
        joinRoom,
        toggleReady,
        startMatch,
        submitCode,
        updatePosition,
        playerReachedSatellite,
        playerCrashed,
        startNextLevel
    };
}
