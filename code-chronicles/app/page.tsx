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
import { Play, Settings, CreditCard, Volume2, Globe, Radio } from "lucide-react";
import { useGame } from "@/components/providers/GameProvider";
import { useAudio } from "@/components/providers/AudioProvider";

export default function Home() {
  const router = useRouter();
  const { user } = useGame();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Global Audio Context
  const { volume } = useAudio();

  // Settings & Store State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);

  const handleTransition = () => {
    router.push('/map');
  };

  const playIntro = async () => {
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);

    // Note: We don't have direct access to "mute" the global music from here easily without exposing it in context, 
    // but the user requested loop. We'll let it mix or user can adjust.
    // Ideally we'd set global volume down here, but let's keep it simple for now as per "user stops it" request.

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

      // Use global volume (maybe slightly boosted for voice)
      audio.volume = Math.min(volume * 1.5, 1.0);

      audioRef.current = audio;

      audio.onended = () => {
        setIsPlayingAudio(false);
      };
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

      {/* HUD: Top Left - Connection Status */}
      <div className="absolute top-8 left-8 z-20 pointer-events-none hidden md:block">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-cyan-500/80 font-mono text-xs tracking-widest">
            <Globe className="w-3 h-3 animate-pulse" />
            <span>SERVER: US-EAST-1 // CONNECTED</span>
          </div>
          <div className="flex items-center gap-2 text-white/40 font-mono text-[10px]">
            <span>PING: 24ms</span>
            <span>LOSS: 0%</span>
          </div>
        </div>
      </div>

      {/* HUD: Top Right - User Profile (Minimal) */}
      <div className="absolute top-8 right-8 z-20 pointer-events-auto">
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

      {/* Footer / Version */}
      <div className="absolute bottom-4 right-6 text-white/20 font-mono text-xs pointer-events-none">
        v0.9.2 BETA // BUILD 4022
      </div>

      {/* Decorative Lines */}
      <div className="absolute top-0 left-12 w-px h-32 bg-gradient-to-b from-cyan-500/50 to-transparent z-10 hidden lg:block" />
      <div className="absolute bottom-0 right-12 w-px h-32 bg-gradient-to-t from-cyan-500/50 to-transparent z-10 hidden lg:block" />

    </main>
  );
}
