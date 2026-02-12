import { motion } from "framer-motion";
import { User, Cpu, Code2, Zap } from "lucide-react";
import Link from "next/link";
import { useGame } from "@/components/providers/GameProvider";

export default function ProfileHUD() {
    const { credits, user } = useGame();

    if (!user) {
        return (
            <Link href="/login">
                <div className="fixed top-4 right-4 z-50 group">
                    <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md border border-cyan-500/30 px-4 py-2 rounded-lg hover:bg-cyan-900/20 transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.1)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                        <span className="text-cyan-400 font-mono text-sm group-hover:text-white transition-colors">INITIALIZE_UPLINK</span>
                        <User className="w-5 h-5 text-cyan-400" />
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <div className="group relative z-50">
            {/* Profile Trigger (Visible) */}
            <Link href="/profile">
                <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-lg hover:border-cyan-500/50 transition-colors cursor-pointer">
                    <div className="text-right hidden sm:block">
                        <div className="text-white text-sm font-bold group-hover:text-cyan-400 transition-colors">{user.username.toUpperCase()}</div>
                        <div className="text-white/40 text-[10px] uppercase tracking-wider">Lvl {user.data.stats.missionsCompleted} • CR {credits.toLocaleString()}</div>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg ring-2 ring-white/10 group-hover:ring-cyan-500 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center overflow-hidden">
                        <User className="w-6 h-6 text-black/50" />
                    </div>
                </div>
            </Link>

            {/* Expanded Details (Dropdown) */}
            <div className="absolute top-full right-0 mt-4 w-80 bg-[#0f111a]/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50 overflow-hidden">

                <div className="p-4 border-b border-white/10 bg-white/5">
                    <h3 className="text-xs font-mono text-cyan-400 tracking-widest uppercase mb-1">C-Log Profile</h3>
                    <div className="text-lg font-bold text-white">{user.username}</div>
                    <div className="text-xs text-white/40">ID: {user.id.slice(0, 8).toUpperCase()}</div>
                </div>

                <div className="p-4 space-y-4">
                    <StatRow icon={<Code2 className="w-4 h-4 text-purple-400" />} label="Syntax Mastery" value={`${user.data.skills.syntax}%`} color="bg-purple-500" />
                    <StatRow icon={<Cpu className="w-4 h-4 text-blue-400" />} label="Logic Core" value={`${user.data.skills.logic}%`} color="bg-blue-500" />
                    <StatRow icon={<Zap className="w-4 h-4 text-yellow-400" />} label="Efficiency" value={`${user.data.skills.speed}%`} color="bg-yellow-500" />

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/10">
                        <div className="bg-black/40 p-2 rounded border border-white/5 text-center">
                            <div className="text-xs text-white/40 mb-1">Completed</div>
                            <div className="text-xl font-bold text-white">{user.data.stats.missionsCompleted}</div>
                        </div>
                        <div className="bg-black/40 p-2 rounded border border-white/5 text-center">
                            <div className="text-xs text-white/40 mb-1">Rank</div>
                            <div className="text-xl font-bold text-cyan-400">#N/A</div>
                        </div>
                    </div>
                </div>

                <div className="p-2 bg-black/60 text-center text-[10px] text-white/20 font-mono">
                    SYNCED: JUST NOW
                </div>

                <div className="w-full">
                    <Link href="/analysis" className="block w-full text-center py-2 bg-cyan-700/20 hover:bg-cyan-600/30 text-cyan-400 text-xs font-mono uppercase transition-colors border-t border-white/5">
                        View Analysis Dashboard
                    </Link>
                </div>

            </div>
        </div>
    );
}

function StatRow({ icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
    const width = value === "--" ? "0%" : value;
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <div className="flex items-center gap-2 text-white/80">
                    {icon}
                    {label}
                </div>
                <div className="text-white font-mono">{value}</div>
            </div>
            <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width }}
                    className={`h-full ${color}`}
                />
            </div>
        </div>
    )
}
