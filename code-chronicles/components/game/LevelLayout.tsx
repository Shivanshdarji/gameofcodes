"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SimulationViewer from "./SimulationViewer";
import CodeEditor from "./CodeEditor";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { motion, AnimatePresence } from "framer-motion";

interface LevelLayoutProps {
    title: string;
    description: string;
    objectives: string[];
    initialCode: string;
}

type GamePhase = "DEMO" | "CODING" | "SUCCESS";

export default function LevelLayout({ title, description, objectives, initialCode }: LevelLayoutProps) {
    const router = useRouter();
    const [phase, setPhase] = useState<GamePhase>("DEMO");
    const [code, setCode] = useState(initialCode);

    const handleStartCoding = () => {
        setPhase("CODING");
    };

    const handleRunCode = () => {
        // In a real app, we'd validate the code here.
        // For now, we assume success after a brief delay.
        setTimeout(() => {
            setPhase("SUCCESS");
        }, 1000);
    };

    return (
        <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
            {/* Header */}
            <header className="h-16 border-b border-surface-border flex items-center px-6 bg-surface/30 backdrop-blur-md z-20">
                <h1 className="text-xl font-orbitron text-primary mr-auto">CODE CHRONICLES // {title.toUpperCase()}</h1>
                <Button variant="outline" size="sm" onClick={() => router.push('/map')}>ABORT MISSION</Button>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Left Panel: Context / Editor */}
                <div className="w-1/3 min-w-[400px] border-r border-surface-border flex flex-col bg-surface/50 backdrop-blur-sm z-10 transition-all duration-500">

                    {/* Phase 1: DEMO / INSTRUCTION */}
                    {phase === "DEMO" && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col p-6 overflow-y-auto"
                        >
                            <h2 className="text-2xl font-orbitron text-primary mb-4">MISSION BRIEFING</h2>
                            <p className="text-foreground/80 mb-6 leading-relaxed text-lg">{description}</p>

                            <div className="bg-black/40 p-4 rounded border border-surface-border mb-6">
                                <h3 className="text-sm font-orbitron text-secondary mb-2">OBJECTIVES</h3>
                                <ul className="list-disc list-inside space-y-2 text-sm text-foreground/70">
                                    {objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                                </ul>
                            </div>

                            <div className="mt-auto">
                                <p className="text-center text-sm text-primary/60 mb-4 animate-pulse">
                                    &gt; ANALYZING SIMULATION PREVIEW...
                                </p>
                                <Button size="lg" className="w-full" onClick={handleStartCoding}>
                                    INITIALIZE CODING INTERFACE
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Phase 2: CODING */}
                    {(phase === "CODING" || phase === "SUCCESS") && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            className="flex-1 flex flex-col"
                        >
                            <div className="h-10 bg-black flex items-center justify-between px-4 border-b border-surface-border">
                                <span className="text-xs font-mono text-primary">COMMAND_MODULE.C</span>
                                {phase === "CODING" && (
                                    <Button size="sm" className="h-7 text-xs" onClick={handleRunCode}>
                                        EXECUTE SEQUENCE
                                    </Button>
                                )}
                            </div>
                            <div className="flex-1">
                                <CodeEditor initialCode={code} onChange={(val) => setCode(val || "")} />
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Right Panel: Simulation */}
                <div className="flex-1 relative bg-black">
                    <SimulationViewer
                        mode={phase === "DEMO" ? "demo" : phase === "CODING" ? "coding" : "success"}
                    />

                    {/* Success Overlay */}
                    <AnimatePresence>
                        {phase === "SUCCESS" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                            >
                                <Card className="max-w-md w-full border-green-500 shadow-[0_0_50px_rgba(0,255,0,0.2)]">
                                    <h2 className="text-3xl font-orbitron text-green-400 mb-2 text-center">SEQUENCE VERIFIED</h2>
                                    <p className="text-center mb-8 text-foreground/80">
                                        Systems nominal. Rover is responding to your commands.
                                    </p>
                                    <div className="flex gap-4 justify-center">
                                        <Button variant="outline" onClick={() => setPhase("CODING")}>
                                            OPTIMIZE CODE
                                        </Button>
                                        <Button className="bg-green-600 hover:bg-green-500 text-white" onClick={() => router.push('/map')}>
                                            RETURN TO MAP
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
