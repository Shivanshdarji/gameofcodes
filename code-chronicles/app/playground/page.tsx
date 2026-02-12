"use client";

import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import PlaygroundScene, { Command } from "@/components/ui/PlaygroundScene";
import { Button } from "@/components/ui/Button";
import { Play, RefreshCw, Terminal, ArrowLeft, Lightbulb, RotateCcw, Users, User } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useMultiplayer } from "@/lib/hooks/useMultiplayer";
import MultiplayerLobby from "@/components/ui/MultiplayerLobby";
import GameTimer from "@/components/ui/GameTimer";
import PlayerLeaderboard from "@/components/ui/PlayerLeaderboard";

const INITIAL_CODE = `// COMMANDER'S LOG: MOON BASE ALPHA
// MISSION: Explore the surface and collect Data Rocks.
//
// AVAILABLE COMMANDS:
//   move_forward(units);  // Move rover forward (e.g., 10)
//   turn_left(degrees);   // Turn left (e.g., 90)
//   turn_right(degrees);  // Turn right
//   collect();            // Collect nearby rock
//   scan();               // Scan area
//
// EXAMPLE:
//   int main() {
//       move_forward(10);
//       collect();
//       return 0;
//   }

int main() {
    
    // Write your logic here...
    move_forward(10);
    
    return 0;
}
`;

export default function PlaygroundPage() {
    // Mode selection
    const [gameMode, setGameMode] = useState<'single' | 'multi' | null>(null);
    const [playerName, setPlayerName] = useState("");
    const [roomIdInput, setRoomIdInput] = useState("");

    // Multiplayer hook
    const multiplayer = useMultiplayer();

    const [code, setCode] = useState(INITIAL_CODE);
    const [logs, setLogs] = useState<string[]>(["> System Online.", "> Rover connected..."]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [commandQueue, setCommandQueue] = useState<Command[]>([]);
    const [resetTrigger, setResetTrigger] = useState(0);
    const [collectedItems, setCollectedItems] = useState<string[]>([]);
    const [showPopup, setShowPopup] = useState<{ title: string, desc: string } | null>(null);

    // Parse Code Logic (Simple Interpreter)
    const handleRun = () => {
        setIsPlaying(false);
        setCommandQueue([]);
        setLogs(prev => [...prev, "> Compiling..."]);

        // Very basic parsing regex
        const commands: Command[] = [];
        const lines = code.split('\n');

        let error = null;

        try {
            lines.forEach((line, idx) => {
                const trimmed = line.trim();
                // Skip full line comments or empty lines
                if (trimmed.startsWith("//") || trimmed === "") return;

                // Remove trailing comments from the line (e.g. "move_forward(10); // comment")
                const cleanLine = trimmed.split("//")[0].trim();

                // Regex matches: commandName ( spaces value spaces ) ;
                const moveMatch = cleanLine.match(/move_forward\(\s*(\d+)\s*\);?/);
                const turnLeftMatch = cleanLine.match(/turn_left\(\s*(\d+)\s*\);?/);
                const turnRightMatch = cleanLine.match(/turn_right\(\s*(\d+)\s*\);?/);
                const collectMatch = cleanLine.match(/collect\(\s*\);?/);
                const scanMatch = cleanLine.match(/scan\(\s*\);?/);

                if (moveMatch) {
                    const val = parseInt(moveMatch[1]);
                    commands.push({ type: "MOVE", value: val });
                } else if (turnLeftMatch) {
                    const val = parseInt(turnLeftMatch[1]);
                    commands.push({ type: "TURN", value: val }); // Left is positive rotation
                } else if (turnRightMatch) {
                    const val = parseInt(turnRightMatch[1]);
                    commands.push({ type: "TURN", value: -val }); // Right is negative
                } else if (collectMatch) {
                    commands.push({ type: "COLLECT" });
                } else if (scanMatch) {
                    commands.push({ type: "SCAN" });
                }
            });

            if (commands.length === 0) {
                setLogs(prev => [...prev, "> Warning: No valid commands found in main()."]);
            } else {
                setLogs(prev => [...prev, `> Uploading ${commands.length} commands to Rover...`]);
                setCommandQueue(commands);
                setIsPlaying(true);

                // Unlock Audio Context (Browser Policy Fix)
                [sfxMoveRef, sfxCollectRef, sfxCrashRef].forEach(ref => {
                    if (ref.current) {
                        ref.current.play().then(() => {
                            ref.current!.pause();
                            ref.current!.currentTime = 0;
                        }).catch(() => { });
                    }
                });
            }
        } catch (e: any) {
            setLogs(prev => [...prev, `> Syntax Error: ${e.message}`]);
        }
    };

    // Audio Refs
    const bgmRef = useRef<HTMLAudioElement | null>(null);
    const sfxMoveRef = useRef<HTMLAudioElement | null>(null);
    const sfxCollectRef = useRef<HTMLAudioElement | null>(null);
    const sfxCrashRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize Audio
        sfxMoveRef.current = new Audio("/music/click.mp3"); // Placeholder
        sfxCollectRef.current = new Audio("/music/start.mp3"); // Placeholder
        sfxCrashRef.current = new Audio("/music/fail.mp3");

        // Volume adjustments
        if (sfxMoveRef.current) sfxMoveRef.current.volume = 0.2;
        if (sfxCrashRef.current) sfxCrashRef.current.volume = 0.6;
    }, []);

    const [gameOver, setGameOver] = useState(false);

    // ... existing Run/Reset logic ...

    const handleCrash = () => {
        setIsPlaying(false);
        setGameOver(true);
        setLogs(prev => [...prev, "> CRITICAL FAILURE: SYSTEM CRASH DETECTED."]);
        sfxCrashRef.current?.play().catch(() => { });
    };

    const handleReset = () => {
        setIsPlaying(false);
        setGameOver(false);
        setCommandQueue([]);
        setResetTrigger(prev => prev + 1);
        setCollectedItems([]);
        setLogs(prev => [...prev, "> SYSTEM REBOOTING...", "> READY."]);
    };

    const handleCreateRoom = async () => {
        if (!playerName.trim()) return;
        const result = await multiplayer.createRoom(playerName);
        if (result.success) {
            setLogs(prev => [...prev, `> Room created: ${result.roomId}`]);
        }
    };

    const handleJoinRoom = async () => {
        if (!playerName.trim() || !roomIdInput.trim()) return;
        const result = await multiplayer.joinRoom(roomIdInput.toUpperCase(), playerName);
        if (result.success) {
            setLogs(prev => [...prev, `> Joined room: ${roomIdInput}`]);
        } else {
            setLogs(prev => [...prev, `> Error: ${result.error}`]);
        }
    };

    const handleSubmitCode = () => {
        // Parse code and submit to multiplayer
        const commands: Command[] = [];
        const lines = code.split('\n');

        lines.forEach((line) => {
            const trimmed = line.trim();
            if (trimmed.startsWith("//") || trimmed === "") return;
            const cleanLine = trimmed.split("//")[0].trim();

            const moveMatch = cleanLine.match(/move_forward\(\s*(\d+)\s*\);?/);
            const turnLeftMatch = cleanLine.match(/turn_left\(\s*(\d+)\s*\);?/);
            const turnRightMatch = cleanLine.match(/turn_right\(\s*(\d+)\s*\);?/);
            const collectMatch = cleanLine.match(/collect\(\s*\);?/);
            const scanMatch = cleanLine.match(/scan\(\s*\);?/);

            if (moveMatch) commands.push({ type: "MOVE", value: parseInt(moveMatch[1]) });
            else if (turnLeftMatch) commands.push({ type: "TURN", value: parseInt(turnLeftMatch[1]) });
            else if (turnRightMatch) commands.push({ type: "TURN", value: -parseInt(turnRightMatch[1]) });
            else if (collectMatch) commands.push({ type: "COLLECT" });
            else if (scanMatch) commands.push({ type: "SCAN" });
        });

        multiplayer.submitCode(commands);
        setLogs(prev => [...prev, `> Code submitted (${commands.length} commands)`]);
    };

    // Mode selection screen
    if (!gameMode) {
        return (
            <div className="w-full h-screen bg-[#050505] text-white flex items-center justify-center">
                <div className="max-w-2xl w-full mx-4">
                    <h1 className="text-4xl font-bold text-center mb-2 text-cyan-400 font-mono">LUNAR PLAYGROUND</h1>
                    <p className="text-center text-white/60 mb-8">Choose your game mode</p>

                    <div className="grid grid-cols-2 gap-6">
                        <button
                            onClick={() => setGameMode('single')}
                            className="bg-[#0a0a0a] border-2 border-cyan-500/30 hover:border-cyan-500 rounded-xl p-8 transition-all hover:scale-105"
                        >
                            <User className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold mb-2">Single Player</h2>
                            <p className="text-white/60 text-sm">Practice and explore at your own pace</p>
                        </button>

                        <button
                            onClick={() => setGameMode('multi')}
                            className="bg-[#0a0a0a] border-2 border-purple-500/30 hover:border-purple-500 rounded-xl p-8 transition-all hover:scale-105"
                        >
                            <Users className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold mb-2">Multiplayer</h2>
                            <p className="text-white/60 text-sm">Compete with up to 10 players!</p>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Multiplayer lobby/join screen
    if (gameMode === 'multi' && !multiplayer.gameState.roomId) {
        return (
            <div className="w-full h-screen bg-[#050505] text-white flex items-center justify-center">
                <div className="max-w-md w-full mx-4">
                    <button
                        onClick={() => setGameMode(null)}
                        className="mb-6 text-white/60 hover:text-white flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to mode selection
                    </button>

                    <div className="bg-[#0a0a0a] border border-cyan-500/30 rounded-xl p-8">
                        <h2 className="text-2xl font-bold mb-6 text-center text-cyan-400">Join Multiplayer</h2>

                        <input
                            type="text"
                            placeholder="Your Name"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 mb-4 text-white"
                        />

                        <Button
                            onClick={handleCreateRoom}
                            className="w-full bg-cyan-600 hover:bg-cyan-500 mb-4"
                            disabled={!playerName.trim()}
                        >
                            Create New Room
                        </Button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-[#0a0a0a] text-white/40">OR</span>
                            </div>
                        </div>

                        <input
                            type="text"
                            placeholder="Room Code"
                            value={roomIdInput}
                            onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                            className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 mb-4 text-white uppercase"
                            maxLength={6}
                        />

                        <Button
                            onClick={handleJoinRoom}
                            className="w-full bg-purple-600 hover:bg-purple-500"
                            disabled={!playerName.trim() || !roomIdInput.trim()}
                        >
                            Join Existing Room
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-screen bg-[#050505] text-white flex flex-col font-sans overflow-hidden">

            {/* Header */}
            <div className="h-14 border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between px-6 shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <Link href="/map" className="p-2 text-white/60 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="font-bold font-mono tracking-wider text-cyan-400">LUNAR PLAYGROUND // EXPERIMENTAL</h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-white/40 font-mono">ROCKS FOUND: {collectedItems.length}/5</span>
                    <Button variant="outline" size="sm" onClick={handleReset} className="h-8 border-red-500/30 text-red-400 hover:bg-red-900/20">
                        <RotateCcw className="w-3 h-3 mr-2" /> RESET ROVER
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* LEFT: Editor */}
                <div className="w-1/2 flex flex-col bg-[#0f1014] border-r border-white/10 relative">
                    <div className="h-10 bg-[#151515] border-b border-white/10 flex items-center justify-between px-4">
                        <span className="text-xs text-white/50 font-mono">rover_control.c</span>
                        <Button
                            onClick={handleRun}
                            disabled={isPlaying || gameOver}
                            className={`h-7 text-xs font-mono tracking-widest ${isPlaying ? 'bg-gray-700 text-gray-500' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                        >
                            <Play className="w-3 h-3 mr-2" />
                            {isPlaying ? "EXECUTING..." : "RUN PROTOCOL"}
                        </Button>
                    </div>
                    <div className="flex-1 relative">
                        <Editor
                            height="100%"
                            defaultLanguage="c"
                            theme="vs-dark"
                            value={code}
                            onChange={(val) => setCode(val || "")}
                            options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false }}
                        />
                        {/* GAME OVER OVERLAY ON EDITOR */}
                        {gameOver && (
                            <div className="absolute inset-0 bg-red-900/20 backdrop-blur-[2px] z-50 flex items-center justify-center">
                                <div className="text-center">
                                    <h2 className="text-4xl font-bold text-red-500 mb-2 font-mono glitch-text">SYSTEM FAILURE</h2>
                                    <p className="text-red-300 mb-6">Execution terminated unexpectedly.</p>
                                    <Button onClick={handleReset} className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 text-lg font-bold shadow-[0_0_20px_rgba(220,38,38,0.5)]">
                                        <RotateCcw className="w-5 h-5 mr-2" /> REBOOT SYSTEM
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Console/Logs */}
                    <div className="h-48 bg-black border-t border-white/10 p-4 font-mono text-xs overflow-y-auto custom-scrollbar">
                        {logs.map((log, i) => (
                            <div key={i} className={`mb-1 ${log.includes("Error") || log.includes("FAILURE") ? "text-red-400" : log.includes("Success") || log.includes("Complete") ? "text-green-400" : "text-white/60"}`}>
                                {log}
                            </div>
                        ))}
                        <div className="animate-pulse text-cyan-500">_</div>
                    </div>
                </div>

                {/* RIGHT: Simulation */}
                <div className="w-1/2 bg-black relative">
                    {/* 3D Playground */}
                    <PlaygroundScene
                        commandQueue={commandQueue}
                        isPlaying={isPlaying}
                        onComplete={() => setIsPlaying(false)}
                        onCollect={(item) => {
                            setCollectedItems(prev => [...prev, item]);
                            setLogs(prev => [...prev, `> ANALYZED: ${item}`]);
                        }}
                        onCrash={handleCrash}
                        resetTrigger={resetTrigger}
                        // Multiplayer props
                        isMultiplayer={gameMode === 'multi'}
                        allPlayers={multiplayer.gameState.allPlayersCommands || multiplayer.gameState.players.map(p => ({
                            id: p.id,
                            name: p.name,
                            color: p.color,
                            commands: [],
                            position: p.position,
                            rotation: p.rotation
                        }))}
                        currentPlayerId={multiplayer.gameState.currentPlayer?.id}
                        satellitePosition={multiplayer.gameState.satellitePosition}
                        onPlayerReachedSatellite={multiplayer.playerReachedSatellite}
                    />

                    {/* Instructions Overlay */}
                    {!isPlaying && commandQueue.length === 0 && !gameOver && (
                        <div className="absolute top-4 right-4 max-w-xs bg-black/60 backdrop-blur border border-white/10 p-4 rounded-lg pointer-events-none">
                            <h3 className="text-sm font-bold text-cyan-400 mb-2 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4" /> TIPS
                            </h3>
                            <p className="text-xs text-white/70">
                                Beware of Red Glitch Traps! They will crash your rover.
                                <br /><br />
                                Collect all 5 Data Rocks to complete the mission.
                            </p>
                        </div>
                    )}

                    {/* Popup Notification */}
                    <AnimatePresence>
                        {showPopup && (
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 50, opacity: 0 }}
                                className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-cyan-900/90 border border-cyan-400 text-white p-6 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.4)] max-w-md text-center"
                            >
                                <h2 className="text-xl font-bold font-orbitron text-cyan-300 mb-2">{showPopup.title}</h2>
                                <p className="text-sm text-white/80">{showPopup.desc}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Multiplayer Lobby Overlay */}
            {gameMode === 'multi' && multiplayer.gameState.gamePhase === 'lobby' && multiplayer.gameState.currentPlayer && (
                <MultiplayerLobby
                    roomId={multiplayer.gameState.roomId!}
                    players={multiplayer.gameState.players}
                    currentPlayerId={multiplayer.gameState.currentPlayer.id}
                    isHost={multiplayer.gameState.isHost}
                    onToggleReady={multiplayer.toggleReady}
                    onStartMatch={multiplayer.startMatch}
                />
            )}

            {/* Multiplayer Timer (during coding phase) */}
            {gameMode === 'multi' && multiplayer.gameState.gamePhase === 'coding' && (
                <div className="absolute top-20 right-4 z-30">
                    <GameTimer
                        timeRemaining={multiplayer.gameState.codingTimer}
                        totalTime={30}
                        onTimeUp={handleSubmitCode}
                    />
                </div>
            )}

            {/* Multiplayer Leaderboard (during execution) */}
            {gameMode === 'multi' && multiplayer.gameState.gamePhase === 'executing' && multiplayer.gameState.currentPlayer && (
                <div className="absolute top-20 right-4 z-30">
                    <PlayerLeaderboard
                        players={multiplayer.gameState.players}
                        currentPlayerId={multiplayer.gameState.currentPlayer.id}
                    />
                    {multiplayer.gameState.currentTurnPlayer && (
                        <div className="mt-4 bg-black/80 border border-yellow-500/50 rounded-lg p-3 text-center">
                            <p className="text-xs text-white/60 mb-1">EXECUTING</p>
                            <p className="text-yellow-400 font-bold">
                                {multiplayer.gameState.players.find(p => p.id === multiplayer.gameState.currentTurnPlayer)?.name}'s Turn
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Game Over Screen (Multiplayer) */}
            {gameMode === 'multi' && multiplayer.gameState.winner && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-[#0a0a0a] border-2 border-yellow-500 rounded-xl p-8 max-w-lg w-full mx-4 text-center">
                        <h2 className="text-4xl font-bold text-yellow-500 mb-2">🏆 LEVEL {multiplayer.gameState.currentRound} COMPLETE! 🏆</h2>
                        <p className="text-white/60 mb-6">Winner</p>
                        <div
                            className="w-20 h-20 rounded-full mx-auto mb-3"
                            style={{ backgroundColor: multiplayer.gameState.winner.color }}
                        />
                        <p className="text-3xl font-bold text-white mb-2">{multiplayer.gameState.winner.name}</p>
                        <p className="text-white/60 mb-6">reached the satellite first!</p>

                        {/* Scoreboard */}
                        <div className="bg-black/50 rounded-lg p-4 mb-6 max-h-48 overflow-y-auto">
                            <h3 className="text-lg font-bold text-cyan-400 mb-3">SCOREBOARD</h3>
                            {multiplayer.gameState.players
                                .filter(p => !p.isEliminated)
                                .sort((a, b) => a.distanceToSatellite - b.distanceToSatellite)
                                .map((player, index) => (
                                    <div
                                        key={player.id}
                                        className="flex items-center justify-between py-2 border-b border-white/10 last:border-0"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-white/60 w-6">{index + 1}.</span>
                                            <div
                                                className="w-4 h-4 rounded-full"
                                                style={{ backgroundColor: player.color }}
                                            />
                                            <span className="text-white">{player.name}</span>
                                        </div>
                                        <span className="text-white/60 text-sm">
                                            {player.distanceToSatellite.toFixed(1)}m
                                        </span>
                                    </div>
                                ))}
                        </div>

                        <div className="flex gap-3">
                            {multiplayer.gameState.isHost && (
                                <Button
                                    onClick={() => multiplayer.startNextLevel()}
                                    className="flex-1 bg-green-600 hover:bg-green-500"
                                >
                                    Next Level →
                                </Button>
                            )}
                            <Button
                                onClick={() => {
                                    setGameMode(null);
                                    window.location.reload();
                                }}
                                className={`${multiplayer.gameState.isHost ? 'flex-1' : 'w-full'} bg-red-600 hover:bg-red-500`}
                            >
                                Exit to Menu
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

