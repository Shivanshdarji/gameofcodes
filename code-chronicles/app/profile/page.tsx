"use client";

import { useGame } from "@/components/providers/GameProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Shield, Terminal, Activity, ChevronLeft, LogOut, Edit2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
    const { user: gameUser, credits } = useGame();
    const { signOut, user: authUser } = useAuth();
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");

    useEffect(() => {
        if (!authUser) {
            // router.push('/login'); 
        }
    }, [authUser, router]);

    if (!gameUser) return null;

    const handleSaveProfile = async () => {
        if (!editName.trim()) return;

        // GUEST MODE
        if (!authUser) {
            const updatedUser = { ...gameUser, username: editName };
            localStorage.setItem("game_user", JSON.stringify(updatedUser));
            // Force reload to pick up changes (since GameProvider doesn't expose a setter)
            window.location.reload();
            return;
        }

        // AUTH MODE
        try {
            const { error } = await supabase.from('profiles').update({ username: editName }).eq('id', gameUser.id);
            if (error) {
                if (error.code === 'PGRST205' || error.message.includes('find the table')) {
                    alert("Database tables not found! Please run the setup SQL script.");
                } else {
                    throw error;
                }
            } else {
                setIsEditing(false);
                window.location.reload();
            }
        } catch (e: any) {
            console.error(e);
            alert(`Failed to update profile: ${e.message}`);
        }
    }

    return (
        <div className="min-h-screen bg-[#050511] text-white font-sans selection:bg-cyan-500/30">
            {/* Header */}
            <div className="fixed top-0 left-0 w-full bg-black/50 backdrop-blur-xl border-b border-white/10 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                        <span className="font-mono text-sm">RETURN_TO_BASE</span>
                    </Link>
                    <div className="font-orbitron font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                        CADET DOSSIER
                    </div>
                    <button onClick={() => {
                        if (!authUser) {
                            // Guest Logout: Clear local data and reload
                            localStorage.removeItem('game_user');
                            // Also clear game state if we want a full reset, but clearing user is enough to prompt login
                            window.location.href = '/login';
                        } else {
                            signOut();
                        }
                    }} className="flex items-center gap-2 text-red-400/60 hover:text-red-400 transition-colors">
                        <LogOut className="w-4 h-4" />
                        <span className="font-mono text-sm">TERMINATE_SESSION</span>
                    </button>
                </div>
            </div>

            <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* ID Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="col-span-1 bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden h-fit"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Shield className="w-32 h-32" />
                        </div>

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 p-1 mb-4 shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                                <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                    <User className="w-16 h-16 text-white/50" />
                                </div>
                            </div>

                            {isEditing ? (
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder={gameUser.username}
                                        className="bg-black/50 border border-white/20 rounded px-2 py-1 text-center"
                                    />
                                    <button onClick={handleSaveProfile} className="text-xs bg-cyan-500 px-2 py-1 rounded">SAVE</button>
                                </div>
                            ) : (
                                <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                                    {gameUser.username}
                                    <button onClick={() => { setEditName(gameUser.username); setIsEditing(true); }} className="text-white/20 hover:text-white transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </h2>
                            )}

                            <div className="text-sm font-mono text-cyan-400 mb-6">ID: {gameUser.id}</div>

                            <div className="w-full grid grid-cols-2 gap-4">
                                <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                                    <div className="text-xs text-white/40 mb-1">Joined</div>
                                    <div className="font-mono">{new Date(gameUser.data.joinedAt).toLocaleDateString()}</div>
                                </div>
                                <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                                    <div className="text-xs text-white/40 mb-1">Rank</div>
                                    <div className="font-mono text-cyan-400">Cadet</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats & Skills */}
                    <div className="col-span-1 lg:col-span-2 space-y-8">

                        {/* Core Stats */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-6"
                        >
                            <StatCard title="TOTAL CREDITS" value={credits.toLocaleString()} icon={<Terminal className="w-5 h-5 text-green-400" />} />
                            <StatCard title="MISSIONS CLEARED" value={gameUser.data.stats.missionsCompleted.toString()} icon={<Shield className="w-5 h-5 text-blue-400" />} />
                            <StatCard title="BUGS NEUTRALIZED" value={gameUser.data.stats.bugsFixed.toString()} icon={<Activity className="w-5 h-5 text-red-400" />} />
                        </motion.div>

                        {/* Skill Matrix */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/5 border border-white/10 rounded-2xl p-6"
                        >
                            <h3 className="text-lg font-bold font-orbitron mb-6 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-cyan-400" />
                                SKILL MATRIX
                            </h3>

                            <div className="space-y-6">
                                <SkillBar label="Syntax Mastery" value={gameUser.data.skills.syntax} color="bg-purple-500" />
                                <SkillBar label="Logic Core" value={gameUser.data.skills.logic} color="bg-blue-500" />
                                <SkillBar label="Processing Speed" value={gameUser.data.skills.speed} color="bg-yellow-500" />
                            </div>
                        </motion.div>

                        <div className="flex gap-4">
                            <Link href="/map" className="flex-1 bg-gradient-to-r from-emerald-900/50 to-cyan-900/50 hover:from-emerald-800/50 hover:to-cyan-800/50 border border-emerald-500/30 rounded-xl p-6 text-center group transition-all">
                                <div className="text-xl font-bold text-emerald-400 group-hover:scale-105 transition-transform">DEPLOY TO SECTOR</div>
                                <div className="text-sm text-white/40 mt-2">Resume active mission and select levels</div>
                            </Link>

                            <Link href="/analysis" className="flex-1 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 hover:from-cyan-800/50 hover:to-blue-800/50 border border-cyan-500/30 rounded-xl p-6 text-center group transition-all">
                                <div className="text-xl font-bold text-cyan-400 group-hover:scale-105 transition-transform">Run Deep Analysis</div>
                                <div className="text-sm text-white/40 mt-2">View detailed performance charts and history logs</div>
                            </Link>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: any }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
            <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-mono text-white/40">{title}</div>
                {icon}
            </div>
            <div className="text-2xl font-bold font-orbitron">{value}</div>
        </div>
    )
}

function SkillBar({ label, value, color }: { label: string, value: number, color: string }) {
    return (
        <div>
            <div className="flex justify-between mb-2">
                <span className="text-sm text-white/80">{label}</span>
                <span className="font-mono text-cyan-400">{value}%</span>
            </div>
            <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full ${color} shadow-[0_0_10px_currentColor]`}
                />
            </div>
        </div>
    )
}
