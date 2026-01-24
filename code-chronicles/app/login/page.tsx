"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/components/providers/GameProvider";
import { motion } from "framer-motion";
import { Terminal, Shield, Cpu, ChevronRight, Home } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useGame();
    const [codename, setCodename] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!codename.trim()) return;

        setIsLoading(true);
        // Simulate "Network Handshake"
        setTimeout(() => {
            login(codename);
            router.push("/profile");
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-[#050510] text-cyan-500 font-mono flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            {/* Home Button */}
            <Link href="/" className="fixed top-6 left-6 z-[100] group flex items-center gap-2 p-3 text-cyan-400 bg-black/50 hover:bg-cyan-950/80 border border-cyan-800 hover:border-cyan-400 rounded-xl transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md">
                <Home className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold tracking-widest text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">HOME</span>
            </Link>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-[#0a0a1a] border border-cyan-500/30 p-8 rounded-xl relative z-10 shadow-[0_0_50px_rgba(6,182,212,0.15)]"
            >
                {/* Header */}
                <div className="flex items-center gap-3 mb-8 border-b border-cyan-500/20 pb-4">
                    <div className="w-10 h-10 bg-cyan-500/10 rounded flex items-center justify-center border border-cyan-500/50">
                        <Terminal className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-wider text-white">IDENTITY_REGISTRATION</h1>
                        <p className="text-xs text-cyan-400/60">SECURE TERMINAL // V.9.0.1</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs text-cyan-300 uppercase tracking-widest pl-1">Codename</label>
                        <div className="relative group">
                            <input
                                type="text"
                                value={codename}
                                onChange={(e) => setCodename(e.target.value)}
                                placeholder="ENTER_CODENAME..."
                                className="w-full bg-[#111] border border-cyan-900 text-white p-4 pl-12 rounded outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all font-mono"
                                autoFocus
                            />
                            <Shield className="w-5 h-5 text-cyan-700 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-cyan-400 transition-colors" />
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <div className="flex items-center gap-2 text-xs text-cyan-600 mb-4">
                            <Cpu className="w-3 h-3" />
                            <span>ESTABLISHING NEURAL LINK...</span>
                        </div>

                        <button
                            type="submit"
                            disabled={!codename || isLoading}
                            className={`w-full py-4 text-center font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${codename && !isLoading
                                ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(8,145,178,0.5)]"
                                : "bg-cyan-900/20 text-cyan-700 cursor-not-allowed border border-cyan-900/50"
                                } rounded relative overflow-hidden group`}
                        >
                            {isLoading ? (
                                <span className="animate-pulse">AUTHENTICATING...</span>
                            ) : (
                                <>
                                    <span>INITIALIZE</span>
                                    <ChevronRight className={`w-4 h-4 transition-transform ${codename ? "group-hover:translate-x-1" : ""}`} />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Footer Decor */}
                <div className="mt-8 flex justify-between text-[10px] text-cyan-800 font-mono">
                    <span>SYS_ID: 0x8842</span>
                    <span>STATUS: ONLINE</span>
                </div>
            </motion.div>
        </div>
    );
}
