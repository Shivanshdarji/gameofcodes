"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame, UserProfile } from "@/components/providers/GameProvider";
import { motion } from "framer-motion";
import { Terminal, Shield, Cpu, Activity, Zap, Code, ChevronRight, LogOut, FileText, Home } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
    const router = useRouter();
    const { user, logout } = useGame();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!user) {
            router.push("/login"); // Redirect if not logged in
        }
    }, [user, router]);

    if (!mounted || !user) return <div className="min-h-screen bg-[#050510]" />;

    return (
        <div className="min-h-screen bg-[#050510] text-cyan-500 font-mono p-4 md:p-8 relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            {/* Home Button */}
            <Link href="/" className="fixed top-6 left-6 z-[100] group flex items-center gap-2 p-3 text-cyan-400 bg-black/50 hover:bg-cyan-950/80 border border-cyan-800 hover:border-cyan-400 rounded-xl transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md">
                <Home className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold tracking-widest text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">HOME</span>
            </Link>

            <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 md:pt-0">

                {/* LEFT COLUMN: Identity Card */}
                <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="md:col-span-1 bg-[#0a0a1a] border border-cyan-500/20 rounded-xl p-6 h-fit"
                >
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-24 h-24 bg-cyan-500/10 rounded-full flex items-center justify-center border-2 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] mb-4 relative">
                            <Shield className="w-10 h-10 text-cyan-400" />
                            <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-ping opacity-20" />
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-wider">{user.username}</h2>
                        <span className="text-xs text-cyan-400 bg-cyan-900/30 px-2 py-1 rounded mt-2 border border-cyan-500/20">CLASS: CADET</span>
                    </div>

                    <div className="space-y-4 text-sm border-t border-cyan-500/10 pt-6">
                        <div className="flex justify-between">
                            <span className="text-cyan-700">ID_HASH</span>
                            <span className="text-cyan-300">{user.id.substring(0, 8)}...</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-cyan-700">JOINED</span>
                            <span className="text-cyan-300">{new Date(user.data.joinedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-cyan-700">STATUS</span>
                            <span className="text-green-400 flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> ONLINE</span>
                        </div>
                    </div>

                    <button
                        onClick={() => { logout(); router.push("/login"); }}
                        className="w-full mt-8 py-3 flex items-center justify-center gap-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded transition-colors text-xs"
                    >
                        <LogOut className="w-3 h-3" />
                        TERMINATE SESSION
                    </button>
                </motion.div>

                {/* RIGHT COLUMN: Analysis & Stats */}
                <div className="md:col-span-2 space-y-6">

                    {/* SKILL MATRIX */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[#0a0a1a] border border-cyan-500/20 rounded-xl p-6"
                    >
                        <div className="flex items-center gap-2 mb-6 border-b border-cyan-500/10 pb-2">
                            <Activity className="w-5 h-5 text-cyan-400" />
                            <h3 className="text-lg font-bold text-white">SKILL_MATRIX_ANALYSIS</h3>
                        </div>

                        <div className="space-y-6">
                            <SkillBar label="SYNTAX PROFICIENCY" value={user.data.skills.syntax} color="bg-blue-500" icon={<Code className="w-4 h-4" />} />
                            <SkillBar label="LOGIC & ALGORITHMS" value={user.data.skills.logic} color="bg-purple-500" icon={<Cpu className="w-4 h-4" />} />
                            <SkillBar label="CODING SPEED" value={user.data.skills.speed} color="bg-yellow-500" icon={<Zap className="w-4 h-4" />} />
                        </div>

                        <div className="mt-8 bg-cyan-900/10 p-4 rounded border border-cyan-500/10 text-xs leading-relaxed text-cyan-300/80">
                            <strong>AI EVALUATION:</strong> User demonstrates promising adaptability. Syntax handling is within acceptable parameters. Recommended focus: increase logic puzzle complexity to stress-test higher cognitive functions.
                        </div>
                    </motion.div>

                    {/* MISSION RESUME */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-2 gap-4"
                    >
                        <StatCard label="LINES_WRITTEN" value={user.data.stats.totalLinesOfCode} />
                        <StatCard label="MISSIONS_CLEARED" value={user.data.stats.missionsCompleted} />
                    </motion.div>

                    {/* ACTION */}
                    <motion.button
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        onClick={() => router.push("/level/2")}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-6 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.2)] flex items-center justify-center gap-3 text-lg group transition-all"
                    >
                        <span>CONTINUE EXPEDITION</span>
                        <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </motion.button>

                </div>
            </div>
        </div>
    );
}

function SkillBar({ label, value, color, icon }: { label: string, value: number, color: string, icon: any }) {
    return (
        <div>
            <div className="flex justify-between text-xs mb-2 text-white/80">
                <span className="flex items-center gap-2">{icon} {label}</span>
                <span>{value}%</span>
            </div>
            <div className="h-2 w-full bg-[#111] rounded-full overflow-hidden border border-white/5">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${color} shadow-[0_0_10px_currentColor]`}
                />
            </div>
        </div>
    );
}

function StatCard({ label, value }: { label: string, value: number }) {
    return (
        <div className="bg-[#0a0a1a] border border-cyan-500/20 p-6 rounded-xl flex flex-col items-center justify-center">
            <h4 className="text-xs text-cyan-600 mb-2">{label}</h4>
            <div className="text-3xl font-bold text-white">{value}</div>
        </div>
    );
}
