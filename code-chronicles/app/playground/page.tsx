"use client";

import { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import PlaygroundScene, { Command } from "@/components/ui/PlaygroundScene";
import { Button } from "@/components/ui/Button";
import { Play, RefreshCw, Terminal, ArrowLeft, Lightbulb, RotateCcw, Users, User, Globe } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useMultiplayer } from "@/lib/hooks/useMultiplayer";
import { useAuth } from "@/components/providers/AuthProvider";
import { usePing } from "@/lib/hooks/usePing";

import MultiplayerLobby from "@/components/ui/MultiplayerLobby";
import GameTimer from "@/components/ui/GameTimer";
import PlayerLeaderboard from "@/components/ui/PlayerLeaderboard";
import NetworkStatus from "@/components/ui/NetworkStatus";

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

    // Auth hook
    const { user } = useAuth();
    const { ping, connected, onlineCount } = usePing();

    const getPingColor = (ms: number | null) => {
        if (!connected || ms === null) return "text-red-400";
        if (ms < 60) return "text-green-400";
        if (ms < 120) return "text-cyan-400";
        if (ms < 200) return "text-yellow-400";
        return "text-red-400";
    };

    // Use user's name if logged in
    useEffect(() => {
        if (user?.user_metadata?.username) {
            setPlayerName(user.user_metadata.username);
        } else if (user?.email) {
            setPlayerName(user.email.split('@')[0]);
        }
    }, [user]);

    // Multiplayer hook
    const multiplayer = useMultiplayer();

    // ... existing state ...
    const [code, setCode] = useState(INITIAL_CODE);
    const [logs, setLogs] = useState<string[]>(["> System Online.", "> Rover connected..."]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [commandQueue, setCommandQueue] = useState<Command[]>([]);
    const [resetTrigger, setResetTrigger] = useState(0);
    const [collectedItems, setCollectedItems] = useState<string[]>([]);
    const [showPopup, setShowPopup] = useState<{ title: string, desc: string } | null>(null);
    const [attempts, setAttempts] = useState(0);

    // ... existing effects ...
    // Reset attempts on level change
    useEffect(() => {
        setAttempts(0);
    }, [resetTrigger]);

    // Parse Code Logic (Simple Interpreter)
    const parseCode = (sourceCode: string): Command[] => {
        const commands: Command[] = [];
        const lines = sourceCode.split('\n');

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
        return commands;
    };

    const handleRun = () => {
        setIsPlaying(false);
        setCommandQueue([]);
        setLogs(prev => [...prev, "> Compiling..."]);

        try {
            const commands = parseCode(code);

            if (commands.length === 0) {
                setLogs(prev => [...prev, "> Warning: No valid commands found in main()."]);
                if (gameMode === 'multi') {
                    multiplayer.reportExecutionFinished();
                }
            } else {
                setAttempts(prev => prev + 1);
                setLogs(prev => [...prev, `> Uploading ${commands.length} commands to Rover... (Attempt #${attempts + 1})`]);
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
            if (gameMode === 'multi') {
                multiplayer.reportExecutionFinished();
            }
        }
    };

    // Multiplayer Execution Trigger
    useEffect(() => {
        if (gameMode === 'multi' && multiplayer.gameState.gamePhase === 'executing' && !isPlaying) {
            console.log("Multiplayer Execution Started!");
            // Use our own code for local simulation
            handleRun();
        }
    }, [multiplayer.gameState.gamePhase, gameMode]);

    // Position Update Throttling
    const lastUpdateRef = useRef(0);
    const handlePositionUpdate = (pos: [number, number, number], rot: number) => {
        const now = Date.now();
        if (now - lastUpdateRef.current > 100) { // Limit to 10 updates/sec
            multiplayer.updatePosition(pos, rot);
            lastUpdateRef.current = now;
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
        if (gameMode === 'multi') {
            multiplayer.playerCrashed();
            // Also execution finished logic is handled by server knowing we crashed?
            // Yes, server sets isEliminated=true and checks round completion.
        }
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
        setLogs(prev => [...prev, `> Initializing secure connection...`]);
        const result = await multiplayer.createRoom(playerName, user?.id);
        if (result.success) {
            setLogs(prev => [...prev, `> Room created: ${result.roomId}`]);
        } else {
            setLogs(prev => [...prev, `> Error: ${result.error || 'Connection timed out'}`]);
        }
    };

    const handleJoinRoom = async () => {
        if (!playerName.trim() || !roomIdInput.trim()) return;
        setLogs(prev => [...prev, `> Searching for signal: ${roomIdInput}...`]);
        const result = await multiplayer.joinRoom(roomIdInput.toUpperCase(), playerName, user?.id);
        if (result.success) {
            setLogs(prev => [...prev, `> Joined room: ${roomIdInput}`]);
        } else {
            setLogs(prev => [...prev, `> Error: ${result.error || 'Connection failed'}`]);
        }
    };

    const handleSubmitCode = () => {
        const commands = parseCode(code);
        multiplayer.submitCode(commands);
        setLogs(prev => [...prev, `> Code submitted (${commands.length} commands)`]);
    };

    // Mode selection screen
    if (!gameMode) {
        return (
            <div className="w-full h-screen bg-[#050505] text-white flex items-center justify-center">
                {/* Network HUD - always visible */}
                <div className="fixed top-4 right-4 z-50">
                    <NetworkStatus
                        playerCount={1}
                        socket={multiplayer.socket}
                        connected={multiplayer.connected}
                    />
                </div>
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
                {/* Network HUD - always visible */}
                <div className="fixed top-4 right-4 z-50">
                    <NetworkStatus
                        playerCount={multiplayer.gameState.players.length || 1}
                        socket={multiplayer.socket}
                        connected={multiplayer.connected}
                    />
                </div>
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

            {/* Top-Left Network HUD — matches home page style, always visible */}
            <div className="absolute top-16 left-4 z-30 pointer-events-none hidden md:block">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-cyan-500/80 font-mono text-xs tracking-widest">
                        <Globe className={`w-3 h-3 ${connected ? 'animate-pulse' : ''}`} />
                        <span>
                            {connected ? `${Math.max(onlineCount, 1)} CONNECTED` : 'OFFLINE'}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[10px]">
                        <span className={getPingColor(ping)}>PING: {ping !== null ? `${ping}ms` : '…'}</span>
                        {gameMode === 'multi' && (
                            <>
                                <span className="text-white/30">|</span>
                                <span className="text-cyan-400 flex items-center gap-1">
                                    <Users className="w-2.5 h-2.5" />
                                    {multiplayer.gameState.players.length} IN ROOM
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>

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
                    <span className="text-xs text-blue-400 font-mono">ATTEMPT #{attempts}</span>
                    {/* Network Status HUD */}
                    <NetworkStatus
                        playerCount={gameMode === 'multi' ? multiplayer.gameState.players.length : 1}
                        socket={multiplayer.socket}
                        connected={multiplayer.connected}
                        gamePhase={multiplayer.gameState.gamePhase}
                    />
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
                            onClick={gameMode === 'multi' ? handleSubmitCode : handleRun}
                            disabled={
                                isPlaying ||
                                gameOver ||
                                (gameMode === 'multi' && !!multiplayer.gameState.players.find(p => p.id === multiplayer.gameState.currentPlayer?.id)?.hasSubmitted)
                            }
                            className={`h-7 text-xs font-mono tracking-widest ${isPlaying || (gameMode === 'multi' && multiplayer.gameState.players.find(p => p.id === multiplayer.gameState.currentPlayer?.id)?.hasSubmitted)
                                ? 'bg-gray-700 text-gray-500'
                                : gameMode === 'multi'
                                    ? 'bg-purple-600 hover:bg-purple-500 text-white'
                                    : 'bg-green-600 hover:bg-green-500 text-white'
                                }`}
                        >
                            <Play className="w-3 h-3 mr-2" />
                            {gameMode === 'multi'
                                ? (multiplayer.gameState.players.find(p => p.id === multiplayer.gameState.currentPlayer?.id)?.hasSubmitted ? "READY - WAITING" : "SUBMIT CODE")
                                : (isPlaying ? "EXECUTING..." : "RUN PROTOCOL")}
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
                        onComplete={() => {
                            setIsPlaying(false);
                            if (gameMode === 'multi') {
                                multiplayer.reportExecutionFinished();
                            }
                        }}
                        onCollect={(item) => {
                            setCollectedItems(prev => [...prev, item]);
                            setLogs(prev => [...prev, `> ANALYZED: ${item}`]);

                            // Visual Feedback for Ability Unlock
                            setShowPopup({
                                title: "ABILITY PARAMETER UNLOCKED",
                                desc: `Captured ${item}. Optimization algorithms enhanced for next level.`
                            });
                            setTimeout(() => setShowPopup(null), 3000);
                        }}
                        onCrash={handleCrash}
                        resetTrigger={resetTrigger}
                        // Multiplayer props
                        isMultiplayer={gameMode === 'multi'}
                        allPlayers={gameMode === 'multi' ? multiplayer.gameState.players.map(p => ({
                            id: p.id,
                            name: p.name,
                            color: p.color,
                            commands: p.submittedCode || [], // Use submittedCode from player object
                            position: p.position,
                            rotation: p.rotation
                        })) : []}
                        currentPlayerId={multiplayer.gameState.currentPlayer?.id}
                        satellitePosition={multiplayer.gameState.satellitePosition}
                        onPlayerReachedSatellite={multiplayer.playerReachedSatellite}
                        onPositionUpdate={gameMode === 'multi' ? handlePositionUpdate : undefined}
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
                        key={multiplayer.gameState.currentRound}
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

            {/* Game Over Screen (Multiplayer) - GAMIFIED REDESIGN */}
            <AnimatePresence mode="wait">
                {gameMode === 'multi' && multiplayer.gameState.winner && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", duration: 0.8 }}
                            className="relative w-full max-w-4xl h-[600px] flex bg-[#050510] border border-cyan-500/20 rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(6,182,212,0.15)]"
                        >
                            {/* Background Grid & Effects */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-transparent to-purple-900/10" />

                            {/* LEFT SIDE: HERO & RANK */}
                            <div className="w-1/3 border-r border-cyan-500/10 bg-black/40 relative flex flex-col items-center justify-center p-8 overflow-hidden backdrop-blur-sm">
                                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

                                {/* Rank Badge */}
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                                    className="relative mb-6 group"
                                >
                                    <div className="absolute inset-0 bg-yellow-500/20 blur-2xl rounded-full animate-pulse" />
                                    <div className="w-40 h-40 relative flex items-center justify-center">
                                        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]">
                                            <path d="M50 0 L93.3 25 V75 L50 100 L6.7 75 V25 Z" fill="url(#rankGradient)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                                            <defs>
                                                <linearGradient id="rankGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#facc15" />
                                                    <stop offset="100%" stopColor="#d97706" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-7xl font-black italic font-orbitron text-black drop-shadow-md">S</span>
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black font-bold font-mono text-[10px] py-1 px-3 rounded-sm uppercase tracking-wider whitespace-nowrap shadow-lg">
                                        {multiplayer.gameState.winner.level ? `Level ${multiplayer.gameState.winner.level}` : 'Mission Perfect'}
                                    </div>
                                </motion.div>

                                <h2 className="text-2xl font-bold text-white font-orbitron mb-1 text-center truncate w-full px-2">{multiplayer.gameState.winner.name}</h2>
                                <p className="text-cyan-400 font-mono text-[10px] tracking-[0.2em] mb-8 uppercase">
                                    {(multiplayer.gameState.winner.level || 1) < 5 ? "Cadet" : (multiplayer.gameState.winner.level || 1) < 10 ? "Officer" : "Commander"}
                                </p>

                                <div className="w-full space-y-4">
                                    <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                        <div className="flex justify-between text-xs text-white/60 mb-1 font-mono">
                                            <span>XP PROGRESS</span>
                                            <span className="text-cyan-400 font-bold">{multiplayer.gameState.winner.xp || 0} XP</span>
                                        </div>
                                        <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${((multiplayer.gameState.winner.xp || 0) % 2000) / 20}%` }}
                                                transition={{ delay: 0.5, duration: 1 }}
                                                className="h-full bg-cyan-500 shadow-[0_0_10px_cyan]"
                                            />
                                        </div>
                                        <div className="text-[10px] text-right text-white/20 mt-1 font-mono">
                                            NEXT LEVEL: {((multiplayer.gameState.winner.level || 1) * 2000)} XP
                                        </div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                                        <div className="flex justify-between text-xs text-white/60 mb-1 font-mono">
                                            <span>MISSION REWARD</span>
                                            <span className="text-yellow-400 font-bold">+1000 XP</span>
                                        </div>
                                        {/* Credits can be linked to XP or separate. For now, simulate credits based on XP gain/5 or something? or just static reward */}
                                        <div className="text-[10px] text-right text-yellow-500/50 mt-1 font-mono">
                                            CREDITS: +500
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT SIDE: STATS & ACTIONS */}
                            <div className="flex-1 p-10 flex flex-col relative z-10">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h1 className="text-5xl font-black font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 tracking-tighter">
                                            VICTORY
                                        </h1>
                                        <p className="text-white/40 text-sm font-mono mt-1">
                                            SECTOR {multiplayer.gameState.currentRound} SECURED • DATA SYNC COMPLETE
                                        </p>
                                    </div>
                                    <RefreshCw className="w-6 h-6 text-white/20 animate-spin-slow" />
                                </div>

                                {/* Leaderboard */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-8 mt-8">
                                    <h3 className="text-[10px] font-bold text-cyan-500/50 mb-4 tracking-[0.2em] font-mono border-b border-white/5 pb-2 uppercase">
                                        Squadron Performance Logistics
                                    </h3>
                                    <div className="space-y-2">
                                        {multiplayer.gameState.players
                                            .filter(p => !p.isEliminated)
                                            .sort((a, b) => a.distanceToSatellite - b.distanceToSatellite)
                                            .map((player, index) => (
                                                <motion.div
                                                    initial={{ x: 20, opacity: 0 }}
                                                    animate={{ x: 0, opacity: 1 }}
                                                    transition={{ delay: 0.3 + (index * 0.1) }}
                                                    key={player.id}
                                                    className={`flex items-center justify-between p-3 rounded-lg border transition-all hover:bg-white/5 ${index === 0
                                                        ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/20 shadow-[inset_0_0_20px_rgba(234,179,8,0.05)]'
                                                        : 'bg-transparent border-white/5'}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <span className={`font-mono text-xl font-bold w-6 text-center ${index === 0 ? 'text-yellow-400' : 'text-white/20'}`}>
                                                            {index + 1}
                                                        </span>
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`font-bold text-sm ${index === 0 ? 'text-white' : 'text-white/70'}`}>
                                                                    {player.name}
                                                                </span>
                                                                {index === 0 && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 rounded uppercase font-bold">MVP</span>}
                                                            </div>
                                                            <span className="text-[10px] text-white/30 font-mono tracking-wide">
                                                                ROVER MK.IV // {index === 0 ? 'OPERATIONAL' : 'STANDBY'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`font-mono font-bold text-sm ${index === 0 ? 'text-yellow-400' : 'text-white/40'}`}>
                                                            {(player.distanceToSatellite || 0).toFixed(1)}m
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-4 mt-auto pt-6 border-t border-white/5">
                                    {multiplayer.gameState.isHost && multiplayer.gameState.players.length >= 2 ? (
                                        <Button
                                            onClick={() => multiplayer.startNextLevel()}
                                            className="h-14 px-8 bg-white text-black hover:bg-cyan-400 hover:text-black font-bold font-orbitron text-sm tracking-wider rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex-1 shadow-[0_0_40px_rgba(255,255,255,0.15)] overflow-hidden relative group"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                            INITIALIZE NEXT SECTOR
                                        </Button>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center text-white/30 font-mono text-xs gap-2 bg-white/5 h-14 rounded-xl border border-white/5 border-dashed">
                                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                            WAITING FOR REINFORCEMENTS
                                        </div>
                                    )}

                                    <Button
                                        onClick={() => {
                                            setGameMode(null);
                                            window.location.reload();
                                        }}
                                        className="h-14 w-14 bg-[#1a1a1e] border border-white/10 rounded-xl hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 transition-all flex items-center justify-center group"
                                        title="Exit Mission"
                                    >
                                        <RotateCcw className="w-5 h-5 group-hover:-rotate-90 transition-transform" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
