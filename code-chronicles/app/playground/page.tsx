"use client";

import { Button } from "@/components/ui/Button";
import { ArrowLeft, Construction, Lock } from "lucide-react";
import Link from "next/link";

export default function PlaygroundPage() {
    return (
        <div className="w-full h-screen bg-[#050505] text-white overflow-hidden flex flex-col font-sans p-8 items-center justify-center relative">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

            <div className="z-10 text-center max-w-lg bg-[#111] border border-white/10 p-12 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500 shadow-[0_0_20px_#eab308]" />

                <div className="mb-6 flex justify-center">
                    <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center border border-yellow-500/30 animate-pulse">
                        <Construction className="w-10 h-10 text-yellow-500" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold font-mono tracking-tight mb-4 text-white">AREA RESTRICTED</h1>
                <p className="text-white/50 mb-8 leading-relaxed">
                    The Playground module is currently under active development by the Sector 7 Engineering Team. Access is limited to authorized personnel only.
                </p>

                <div className="flex flex-col gap-3">
                    <Button className="bg-white/5 hover:bg-white/10 text-white/50 cursor-not-allowed border border-white/5" disabled>
                        <Lock className="w-4 h-4 mr-2" /> REQUEST ACCESS
                    </Button>
                    <Link href="/map">
                        <Button className="w-full bg-cyan-600 hover:bg-cyan-500">
                            RETURN TO MAP
                        </Button>
                    </Link>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 text-[10px] text-white/20 font-mono">
                    ESTIMATED COMPLETION: T-MINUS [REDACTED]
                </div>
            </div>

            <div className="absolute bottom-8 text-white/10 font-mono text-sm">
                CODE CHRONICLES // PRE-ALPHA BUILD
            </div>
        </div>
    );
}
