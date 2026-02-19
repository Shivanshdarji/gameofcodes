"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import Scene3D from "@/components/ui/Scene3D";
import Starfield from "@/components/ui/Starfield";
import SettingsModal from "@/components/ui/SettingsModal";
import CreditsStoreModal from "@/components/ui/CreditsStoreModal";
import ProfileHUD from "@/components/ui/ProfileHUD";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Settings, CreditCard, Volume2, Globe, Radio, Ship, Users, Star, Info } from "lucide-react";
import { useGame } from "@/components/providers/GameProvider";
import { useAudio } from "@/components/providers/AudioProvider";
import { usePing } from "@/lib/hooks/usePing";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatCount(n: number): string {
  if (n < 10) return `${n}+`;
  const magnitude = Math.pow(10, Math.floor(Math.log10(n)));
  const rounded = Math.floor(n / magnitude) * magnitude;
  return `${rounded}+`;
}

export default function GameHomeScreen() {
  const router = useRouter();
  const { user } = useGame();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stats State
  const [totalPlays, setTotalPlays] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);

  // Global Audio/Network Context
  const { volume } = useAudio();
  const { ping, connected, onlineCount } = usePing();

  useEffect(() => {
    // Set visited flag
    localStorage.setItem("cc_visited", "true");

    // Fetch Global Stats
    fetch("/api/play").then(r => r.json()).then(d => setTotalPlays(d.total_plays ?? 0)).catch(() => { });
    fetch("/api/users").then(r => r.json()).then(d => setTotalUsers(d.total_users ?? 0)).catch(() => { });
  }, []);

  const getPingColor = (ms: number | null) => {
    if (!connected || ms === null) return "text-red-400";
    if (ms < 60) return "text-green-400";
    if (ms < 120) return "text-cyan-400";
    if (ms < 200) return "text-yellow-400";
    return "text-red-400";
  };

  // Settings & Store State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);

  const handleTransition = () => {
    router.push('/map');
  };

  const playIntro = async () => {
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Commander, system critical. The Code Chronicles need you. Initializing C-Protocol... Good luck."
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch audio");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.volume = Math.min(volume * 1.5, 1.0);
      audioRef.current = audio;
      audio.onended = () => setIsPlayingAudio(false);
      audio.play();
    } catch (error) {
      console.error("Audio playback failed", error);
      setIsPlayingAudio(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans overflow-hidden relative selection:bg-cyan-500/30">

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <CreditsStoreModal
        isOpen={isStoreOpen}
        onClose={() => setIsStoreOpen(false)}
      />

      {/* Fullscreen 3D Background */}
      <div className="absolute inset-0 z-0">
        <Starfield />
        <Scene3D onComplete={handleTransition} />
      </div>

      {/* Cinematic Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-black/40" />

      {/* HUD: Top Left - Connection Status & Stats */}
      <div className="absolute top-8 left-8 z-20 pointer-events-none hidden md:block">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-cyan-500/80 font-mono text-xs tracking-widest bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5">
            <Globe className={`w-3 h-3 ${connected ? 'animate-pulse' : ''}`} />
            <span>
              {connected ? `${Math.max(onlineCount, 1)} CONNECTED` : 'OFFLINE'}
            </span>
          </div>

          <div className="flex flex-col gap-1 pl-1">
            <div className="flex items-center gap-2 text-white/30 font-mono text-[9px] tracking-[0.2em] uppercase">
              <Users className="w-2.5 h-2.5" />
              <span>{totalUsers !== null ? formatCount(totalUsers) : "..."} Enrolled</span>
            </div>
            <div className="flex items-center gap-2 text-white/30 font-mono text-[9px] tracking-[0.2em] uppercase">
              <Star className="w-2.5 h-2.5" />
              <span>{totalPlays !== null ? formatCount(totalPlays) : "..."} Launched</span>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-[10px] opacity-40 pl-1">
            <span className={getPingColor(ping)}>
              PING: {ping !== null ? `${ping}ms` : '…'}
            </span>
            <span className="text-white">LOSS: 0%</span>
          </div>
        </div>
      </div>

      {/* HUD: Top Right - User Profile */}
      <div className="absolute top-8 right-8 z-20 pointer-events-auto flex items-center gap-4">
        {/* About Us / Landing Page Link */}
        <Link href="/?landing=true">
          <Button variant="ghost" className="text-cyan-400/50 hover:text-cyan-300 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest border border-cyan-500/15 hover:border-cyan-500/40 backdrop-blur-sm rounded-full px-4 hover:bg-cyan-500/5 transition-all">
            <Info className="w-3 h-3" />
            About Us
          </Button>
        </Link>
        <ProfileHUD />
      </div>

      {/* Main Content / Menu */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="text-center mb-16 relative"
        >
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-900 drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            CODE
            <br />
            <span className="text-stroke-cyan">CHRONICLES</span>
          </h1>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-cyan-500/60 font-mono text-xs uppercase tracking-[0.5em] w-full">
            The C Expedition
          </div>
        </motion.div>

        {/* Menu Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex flex-col gap-4 pointer-events-auto min-w-[300px]"
        >
          <Link href={user ? "/map" : "/login"} className="w-full">
            <Button
              size="lg"
              className="w-full relative overflow-hidden group bg-cyan-600/20 hover:bg-cyan-500 text-cyan-100 border border-cyan-500/30 hover:border-cyan-400 backdrop-blur-sm h-16 text-xl tracking-widest uppercase font-bold transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] clip-path-polygon"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                <Play className="w-5 h-5 fill-current" />
                {user ? "Continue Mission" : "Initialize Identity"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            </Button>
          </Link>

          <Button
            onClick={playIntro}
            variant="outline"
            className={`w-full h-12 border-white/10 hover:border-white/30 hover:bg-white/5 backdrop-blur-sm transition-all uppercase tracking-wider font-mono text-sm group ${isPlayingAudio ? 'border-cyan-500/50 text-cyan-400' : 'text-white/60'}`}
          >
            <span className="flex items-center justify-center gap-2">
              {isPlayingAudio ? <Radio className="w-4 h-4 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
              {isPlayingAudio ? "Incoming Transmission..." : "Play Briefing"}
            </span>
          </Button>

          <div className="flex gap-4 mt-2">
            <Button
              variant="ghost"
              onClick={() => setIsSettingsOpen(true)}
              className="flex-1 h-10 text-white/40 hover:text-white border border-transparent hover:border-white/10 hover:bg-white/5 uppercase tracking-wider text-xs font-mono"
            >
              <Settings className="w-4 h-4 mr-2" /> Settings
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsStoreOpen(true)}
              className="flex-1 h-10 text-white/40 hover:text-white border border-transparent hover:border-white/10 hover:bg-white/5 uppercase tracking-wider text-xs font-mono"
            >
              <CreditCard className="w-4 h-4 mr-2" /> Credits
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Footer / Build */}
      <div className="absolute bottom-6 left-8 font-mono text-[9px] text-white/20 tracking-[0.4em] pointer-events-none uppercase">
        Ver 0.9.2 // Stable Transmission
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 left-12 w-px h-32 bg-gradient-to-b from-cyan-500/50 to-transparent z-10 hidden lg:block" />
      <div className="absolute bottom-0 right-12 w-px h-32 bg-gradient-to-t from-cyan-500/50 to-transparent z-10 hidden lg:block" />

    </main>
  );
}
