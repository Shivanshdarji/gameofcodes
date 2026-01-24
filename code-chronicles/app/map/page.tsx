"use client";

import MissionMap3D from "@/components/ui/MissionMap3D";
import { Home } from "lucide-react";
import Link from "next/link";

export default function MapPage() {
    return (
        <main className="w-full h-screen overflow-hidden relative">
            {/* Home Button */}
            <Link href="/" className="fixed top-6 left-6 z-[100] group flex items-center gap-2 p-3 text-cyan-400 bg-black/50 hover:bg-cyan-950/80 border border-cyan-800 hover:border-cyan-400 rounded-xl transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-md">
                <Home className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold tracking-widest text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">HOME</span>
            </Link>
            <MissionMap3D />
        </main>
    );
}
