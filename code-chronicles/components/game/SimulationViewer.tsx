"use client";

import { motion } from "framer-motion";

interface SimulationViewerProps {
    mode: "demo" | "coding" | "success";
    step?: number; // For demo progress
}

export default function SimulationViewer({ mode, step = 0 }: SimulationViewerProps) {
    const getStatusText = () => {
        if (mode === "demo") return "SIMULATION PREVIEW";
        if (mode === "coding") return "AWAITING INPUT...";
        if (mode === "success") return "EXECUTION SUCCESSFUL";
        return "SYSTEM OFFLINE";
    };

    return (
        <div className="w-full h-full bg-black relative overflow-hidden flex items-center justify-center border-l border-surface-border">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />

            {/* Rover Representation */}
            <motion.div
                animate={{
                    scale: mode === "coding" ? 0.8 : 1,
                    opacity: mode === "coding" ? 0.5 : 1,
                    rotate: mode === "success" ? 360 : 0,
                    x: mode === "demo" ? [0, 50, 0] : 0, // Simple demo animation
                }}
                transition={{
                    duration: mode === "demo" ? 2 : 0.5,
                    repeat: mode === "demo" ? Infinity : 0
                }}
                className={`relative z-10 w-32 h-32 border-2 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.3)] transition-colors duration-500 ${mode === "success" ? "bg-green-500/20 border-green-500" : "bg-surface border-primary"
                    }`}
            >
                <div className="text-4xl">🚜</div>
            </motion.div>

            {/* Status Overlay */}
            <div className="absolute top-10 left-10 font-orbitron">
                <h3 className={`text-xl ${mode === "success" ? "text-green-400" : "text-primary"}`}>ROVER STATUS</h3>
                <p className="text-sm opacity-70 text-foreground">{getStatusText()}</p>
            </div>

            {/* Mode Indicator */}
            <div className="absolute bottom-10 right-10 font-mono text-xs bg-black/80 p-4 border border-surface-border rounded text-foreground">
                <p>{`> MODE: ${mode.toUpperCase()}`}</p>
                {mode === "demo" && <p>{`> OBSERVING TARGET BEHAVIOR...`}</p>}
                {mode === "coding" && <p className="animate-pulse">{`> WAITING FOR CODE...`}</p>}
                {mode === "success" && <p className="text-green-400">{`> OBJECTIVE COMPLETE`}</p>}
            </div>
        </div>
    );
}
