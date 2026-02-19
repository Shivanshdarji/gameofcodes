"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Users, Zap, Code2, Rocket, Trophy, Github,
  Mail, Terminal, Cpu, Star, ChevronRight, Menu, X, ArrowRight,
  ShieldCheck, Box, Linkedin, Gamepad2, ChevronDown, Sparkles,
  Globe, BookOpen, Award, Target, Brain, Layers
} from "lucide-react";
import { useGame } from "@/components/providers/GameProvider";
import Scene3D from "@/components/ui/Scene3D";

// Dynamically imported so Three.js canvas doesn't run on SSR
const WarCarViewer = dynamic(() => import("@/components/ui/WarCarViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
    </div>
  ),
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatCount(n: number): string {
  if (n < 10) return `${n}+`;
  const magnitude = Math.pow(10, Math.floor(n === 0 ? 0 : Math.log10(n)));
  const rounded = Math.floor(n / magnitude) * magnitude;
  return `${rounded}+`;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const TEAM = [
  {
    name: "Shivansh Darji",
    role: "Founder & Lead Architect",
    initials: "SD",
    color: "from-cyan-500 to-blue-600",
    linkedin: "https://www.linkedin.com/in/shivansh-darji",
    photo: "/team/Shivansh_photo.png",
    expertise: "Full-Stack / DevOps",
  },
  {
    name: "Naiteek Chokshi",
    role: "Founder & Systems Engineer",
    initials: "NC",
    color: "from-purple-500 to-pink-600",
    linkedin: "https://www.linkedin.com/in/naiteek-choksi-7205b2227",
    photo: "/team/naiteek_photo.png",
    expertise: "Backend / AI",
  },
  {
    name: "Jaydev Prajapati",
    role: "Founder & 3D Engineer",
    initials: "JP",
    color: "from-green-500 to-teal-600",
    linkedin: "https://www.linkedin.com/in/jaydev11",
    photo: "/team/Jaydev_photo.png",
    expertise: "ThreeJS / Graphics",
  },
  {
    name: "Kalpya Shah",
    role: "Founder & UX Director",
    initials: "KS",
    color: "from-orange-500 to-red-600",
    linkedin: "https://www.linkedin.com/in/kalpya-shah-72175931b",
    photo: "/team/Kalpya_photo.png",
    expertise: "Design / Frontend",
  },
];

const FEATURES = [
  { icon: Terminal, title: "Real C Logic", desc: "No blocks. Write raw, high-performance C code that executes in real-time physics simulations.", color: "cyan" },
  { icon: Box, title: "3D Sandboxes", desc: "Navigate complex physics-based terrain in stunning zero-latency 3D environments.", color: "blue" },
  { icon: Users, title: "Fleet Races", desc: "Sync maneuvers with other cadets in real-time grid battles. Compete globally.", color: "purple" },
  { icon: ShieldCheck, title: "XP Hierarchy", desc: "Rise through the ranks — from Cadet to Lead Tech-Officer with earned XP rewards.", color: "green" },
  { icon: Brain, title: "Neural Link AI", desc: "Direct AI-assisted code parsing, architectural feedback, and intelligent mentoring.", color: "pink" },
  { icon: Zap, title: "Instability Loops", desc: "Hardware errors are fatal. Logic is your only lifeline in a hostile environment.", color: "yellow" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Choose Your Mission", desc: "Select from curated C programming challenges across increasing difficulty tiers.", icon: Target },
  { step: "02", title: "Write Your Code", desc: "Use the built-in editor to write raw C instructions that control your rover.", icon: Code2 },
  { step: "03", title: "Execute & Explore", desc: "Watch your code come alive in a real-time 3D environment and navigate obstacles.", icon: Rocket },
  { step: "04", title: "Rank Up & Compete", desc: "Earn XP, unlock achievements, and compete in multiplayer fleet races.", icon: Trophy },
];

const STATS = [
  { value: "6", label: "Mission Tiers", icon: Layers },
  { value: "3D", label: "Physics Engine", icon: Globe },
  { value: "AI", label: "Powered Mentor", icon: Brain },
  { value: "Live", label: "Multiplayer", icon: Users },
];

// ── Welcome Modal ─────────────────────────────────────────────────────────────
function WelcomeModal({ onEnter }: { onEnter: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl px-4"
      >
        {/* Radial glow behind modal */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 180, delay: 0.1 }}
          className="relative max-w-2xl w-full bg-[#040a14] border border-cyan-500/20 rounded-3xl p-10 shadow-[0_0_80px_rgba(6,182,212,0.15)] overflow-hidden"
        >
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-500/40 rounded-tl-3xl" />
          <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-500/40 rounded-tr-3xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyan-500/20 rounded-bl-3xl" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-500/20 rounded-br-3xl" />

          {/* Animated scan line */}
          <motion.div
            animate={{ y: ["0%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent pointer-events-none"
          />

          <div className="text-center space-y-8">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                <Rocket className="w-10 h-10 text-cyan-400" />
              </div>
            </div>

            {/* Title */}
            <div>
              <p className="font-mono text-cyan-500/60 text-[10px] tracking-[0.6em] uppercase mb-3">// INCOMING TRANSMISSION</p>
              <h2 className="text-4xl md:text-5xl font-black font-orbitron italic tracking-tight text-white">
                WELCOME TO<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  CODE CHRONICLES
                </span>
              </h2>
            </div>

            {/* Description */}
            <p className="text-white/50 font-mono text-sm leading-relaxed max-w-md mx-auto">
              The universe's most advanced C programming arena. Control rovers, solve algorithmic challenges, and compete with elite cadets across the galaxy.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-2">
              {["3D Physics", "AI Mentor", "Multiplayer", "XP System"].map(tag => (
                <span key={tag} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 font-mono text-[10px] uppercase tracking-wider">
                  {tag}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className="pt-2 flex flex-col gap-3">
              <button
                onClick={onEnter}
                className="w-full h-16 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-lg uppercase tracking-widest rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(6,182,212,0.5)] flex items-center justify-center gap-3 group"
              >
                ENTER MISSION CONTROL
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-white/20 font-mono text-[9px] text-center tracking-widest uppercase">
                You will be redirected directly on your next visit
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const { user } = useGame();
  const [totalPlays, setTotalPlays] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const hasVisited = localStorage.getItem("cc_visited");
    const isBypass = typeof window !== "undefined" && window.location.search.includes("landing=true");

    // If returning user (visited before) AND logged in → go straight to game
    if (!isBypass && hasVisited === "true" && user) {
      router.replace("/game");
      return;
    }

    setIsRedirecting(false);

    // Show welcome modal only for first-time visitors
    if (!hasVisited) {
      setShowWelcomeModal(true);
    }

    fetch("/api/play").then(r => r.json()).then(d => setTotalPlays(d.total_plays ?? 0)).catch(() => { });
    fetch("/api/users").then(r => r.json()).then(d => setTotalUsers(d.total_users ?? 0)).catch(() => { });
  }, [user, router]);

  // Track scroll for active nav section
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "about", "features", "how-it-works", "team", "contact"];
      for (const id of sections.reverse()) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 120) {
          setActiveSection(id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleWelcomeEnter = () => {
    localStorage.setItem("cc_visited", "true");
    setShowWelcomeModal(false);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-2 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_20px_rgba(6,182,212,0.2)]" />
          <p className="font-mono text-white/20 text-[10px] uppercase tracking-[0.5em]">Loading Sequence...</p>
        </div>
      </div>
    );
  }

  const NAV_LINKS = [
    { label: "About", id: "about" },
    { label: "Features", id: "features" },
    { label: "How It Works", id: "how-it-works" },
    { label: "Team", id: "team" },
    { label: "Contact", id: "contact" },
  ];

  return (
    <>
      {/* ── WELCOME MODAL (First Visit Only) ── */}
      {showWelcomeModal && <WelcomeModal onEnter={handleWelcomeEnter} />}

      <main className="min-h-screen bg-[#010208] text-white font-sans overflow-x-hidden selection:bg-cyan-500/30 selection:text-white">

        {/* ── CINEMATIC 3D BACKGROUND ── */}
        <div className="fixed inset-0 z-0">
          <Scene3D />
          <div className="absolute inset-0 bg-gradient-to-b from-[#010208]/30 via-transparent to-[#010208]" />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)", backgroundSize: "80px 80px" }}
          />
        </div>

        {/* ── VIGNETTE OVERLAY ── */}
        <div className="fixed inset-0 pointer-events-none z-[5]" style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(1,2,8,0.8) 100%)" }} />

        {/* ── STICKY NAVBAR ── */}
        <nav className="fixed top-0 inset-x-0 z-[110] bg-black/40 backdrop-blur-3xl border-b border-white/8">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <button onClick={() => scrollToSection("home")} className="flex items-center gap-3 group">
              <div className="w-9 h-9 border border-cyan-500/30 rounded-xl flex items-center justify-center bg-cyan-500/5 group-hover:bg-cyan-500/15 group-hover:border-cyan-500/60 transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                <Rocket className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-xl font-black font-orbitron tracking-tighter italic">
                CODE <span className="text-cyan-400">CHRONICLES</span>
              </div>
            </button>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map(item => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-[9px] font-mono uppercase tracking-[0.4em] font-bold transition-all hover:text-white ${activeSection === item.id ? "text-cyan-400" : "text-white/40"}`}
                >
                  {item.label}
                </button>
              ))}
              <Link href="/game">
                <Button className="h-9 px-7 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase text-[9px] tracking-widest transition-all hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2">
                  <Play className="w-3 h-3" />
                  PLAY GAME
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center text-white/50 hover:text-white border border-white/10 rounded-lg transition-all"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden bg-black/90 backdrop-blur-3xl border-t border-white/5 overflow-hidden"
              >
                <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4">
                  {NAV_LINKS.map(item => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className="text-left text-sm font-mono text-white/40 hover:text-white uppercase tracking-widest transition-all py-2 border-b border-white/5"
                    >
                      {item.label}
                    </button>
                  ))}
                  <Link href="/game" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase text-sm tracking-widest mt-2 flex items-center justify-center gap-2">
                      <Play className="w-4 h-4" />
                      PLAY GAME
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* ── HERO SECTION ── */}
        <section id="home" className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-16">
          <div className="relative z-10 text-center max-w-5xl mx-auto flex flex-col items-center">

            {/* Live badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 backdrop-blur"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-mono text-[9px] text-cyan-400/80 uppercase tracking-[0.4em]">Mission Control Online</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-6xl md:text-[7.5rem] font-black italic tracking-tighter leading-[0.85] font-orbitron mb-8 text-glow"
            >
              CODE
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-500 drop-shadow-[0_0_40px_rgba(6,182,212,0.4)]">
                CHRONICLES
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="max-w-2xl text-white/40 text-sm md:text-lg font-mono leading-relaxed tracking-wider mb-10"
            >
              Master high‑performance C programming through cinematic 3D missions.<br />
              Control rovers. Solve puzzles. Dominate the leaderboard.
            </motion.p>

            {/* STATS HUD */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-10 flex items-center gap-8 bg-black/60 backdrop-blur-3xl px-8 py-4 rounded-2xl border border-white/8 shadow-2xl"
            >
              {STATS.map((stat, i) => (
                <div key={i} className="text-center flex flex-col items-center gap-1">
                  <stat.icon className="w-4 h-4 text-cyan-500/60 mb-1" />
                  <div className="text-xl md:text-2xl font-black font-orbitron text-white">{stat.value}</div>
                  <div className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em]">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 w-full justify-center"
            >
              <Link href="/game">
                <Button
                  size="lg"
                  className="w-full sm:w-[280px] h-16 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xl uppercase tracking-widest rounded-2xl shadow-[0_10px_40px_rgba(6,182,212,0.3)] transition-all hover:scale-105 hover:shadow-[0_10px_60px_rgba(6,182,212,0.5)] group border-b-4 border-cyan-700/50 flex items-center justify-center gap-3"
                >
                  <Play className="w-6 h-6" />
                  PLAY GAME
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <button
                onClick={() => scrollToSection("about")}
                className="w-full sm:w-[200px] h-16 border border-white/10 hover:border-cyan-500/40 text-white/60 hover:text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all hover:bg-white/5 flex items-center justify-center gap-2 font-mono"
              >
                <BookOpen className="w-4 h-4" />
                ABOUT US
              </button>
            </motion.div>
          </div>

          {/* Scroll hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-10 flex flex-col items-center gap-2 cursor-pointer"
            onClick={() => scrollToSection("about")}
          >
            <span className="font-mono text-[8px] text-white/20 uppercase tracking-[0.5em]">Scroll</span>
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <ChevronDown className="w-4 h-4 text-white/20" />
            </motion.div>
          </motion.div>
        </section>

        {/* ── CONTENT FLOW ── */}
        <div className="relative z-10">

          {/* ── ABOUT SECTION ── */}
          <section id="about" className="px-6 py-32">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                {/* Text */}
                <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                  <p className="font-mono text-cyan-500 text-[10px] tracking-[0.6em] mb-5 uppercase">// MISSION BRIEFING</p>
                  <h2 className="text-5xl font-black font-orbitron italic tracking-tight mb-8 leading-tight">
                    WHERE CODE
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">MEETS COSMOS</span>
                  </h2>
                  <div className="space-y-5 text-white/50 font-mono text-sm leading-relaxed">
                    <p>
                      Code Chronicles is an immersive, game-based learning platform where you write real C code to control a 3D rover navigating alien terrain. Unlike traditional coding platforms, every command you write has direct physical consequences.
                    </p>
                    <p>
                      Built by a team of passionate engineers, our mission is to make low-level programming visceral, engaging, and addictive — by placing cadets in the heart of a cinematic universe where logic is the ultimate weapon.
                    </p>
                  </div>
                  <div className="mt-10 flex flex-wrap gap-3">
                    {["Real-time Execution", "Physics Simulation", "3D Graphics", "AI Mentorship"].map(tag => (
                      <span key={tag} className="px-4 py-2 border border-cyan-500/20 rounded-xl text-cyan-400 font-mono text-[10px] uppercase tracking-wider bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors">
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>

                {/* Visual — WarCar 3D viewer */}
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <div className="absolute -inset-10 bg-cyan-500/5 blur-[80px] rounded-full" />
                  <div className="relative aspect-video border border-white/8 rounded-3xl bg-black/50 backdrop-blur-3xl overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.08)]">
                    <WarCarViewer className="w-full h-full" />
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* ── FEATURES SECTION ── */}
          <section id="features" className="px-6 py-24">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-20">
                <p className="font-mono text-cyan-500 text-[10px] tracking-[0.8em] mb-5 uppercase">// SYSTEM CAPABILITIES</p>
                <h2 className="text-5xl font-black font-orbitron tracking-tighter italic">ARSENAL OF TOOLS</h2>
                <p className="mt-6 text-white/30 font-mono text-sm max-w-xl mx-auto">Everything you need to train, compete, and master the art of C programming in a hostile alien environment.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {FEATURES.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="group p-8 rounded-3xl border border-white/5 bg-black/40 backdrop-blur-sm hover:border-cyan-500/30 hover:bg-black/60 transition-all duration-500 hover:shadow-[0_0_40px_rgba(6,182,212,0.06)] cursor-default"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-cyan-500 text-white/60 group-hover:text-black transition-all duration-300 shadow-lg">
                      <f.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-black font-orbitron mb-3 uppercase tracking-tight group-hover:text-cyan-400 transition-colors">{f.title}</h3>
                    <p className="text-white/30 font-mono text-[11px] leading-relaxed tracking-wide">{f.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ── HOW IT WORKS ── */}
          <section id="how-it-works" className="px-6 py-24">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-20">
                <p className="font-mono text-cyan-500 text-[10px] tracking-[0.8em] mb-5 uppercase">// LAUNCH SEQUENCE</p>
                <h2 className="text-5xl font-black font-orbitron tracking-tighter italic">HOW IT WORKS</h2>
                <p className="mt-6 text-white/30 font-mono text-sm max-w-xl mx-auto">Four simple steps from cadet recruit to interstellar commander.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {HOW_IT_WORKS.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="relative group p-8 rounded-3xl border border-white/5 bg-black/40 hover:border-cyan-500/20 transition-all duration-500"
                  >
                    {/* Step connector */}
                    {i < HOW_IT_WORKS.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-3 z-10 w-6 flex items-center">
                        <ChevronRight className="w-4 h-4 text-white/15" />
                      </div>
                    )}
                    <div className="text-5xl font-black font-orbitron text-white/5 group-hover:text-cyan-500/10 transition-colors mb-4">{item.step}</div>
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-5 group-hover:bg-cyan-500/10 transition-all">
                      <item.icon className="w-5 h-5 text-cyan-400/60 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <h3 className="text-base font-black font-orbitron mb-3 uppercase group-hover:text-cyan-400 transition-colors">{item.title}</h3>
                    <p className="text-white/30 font-mono text-[11px] leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>

              {/* CTA Banner */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-16 text-center p-12 rounded-3xl border border-cyan-500/15 bg-cyan-500/5 backdrop-blur-sm"
              >
                <h3 className="text-3xl font-black font-orbitron italic mb-4">READY TO LAUNCH?</h3>
                <p className="text-white/40 font-mono text-sm mb-8">Join the ranks. Your mission awaits.</p>
                <Link href="/game">
                  <Button className="h-14 px-12 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm uppercase tracking-widest rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all hover:scale-105 flex items-center gap-3 mx-auto">
                    <Play className="w-5 h-5" />
                    INITIATE MISSION
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </motion.div>
            </div>
          </section>

          {/* ── GLOBAL STATS BANNER ── */}
          <section className="px-6 py-16">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Registered Cadets", value: totalUsers !== null ? formatCount(totalUsers) : "...", icon: Users },
                  { label: "Expeditions Launched", value: totalPlays !== null ? formatCount(totalPlays) : "...", icon: Rocket },
                  { label: "Mission Tiers", value: "6+", icon: Target },
                  { label: "Lines of C Written", value: "∞", icon: Terminal },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 rounded-2xl border border-white/5 bg-black/40 text-center hover:border-cyan-500/20 transition-all"
                  >
                    <stat.icon className="w-5 h-5 text-cyan-500/50 mx-auto mb-3" />
                    <div className="text-3xl font-black font-orbitron text-white mb-1">{stat.value}</div>
                    <div className="text-[9px] font-mono text-white/20 uppercase tracking-widest">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ── TEAM SECTION ── */}
          <style jsx global>{`
            .sci-fi-frame {
              clip-path: polygon(0 15px, 15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%);
            }
          `}</style>

          <section id="team" className="px-6 py-24">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-20">
                <p className="font-mono text-cyan-500 text-[10px] tracking-[0.8em] mb-5 uppercase">// THE ARCHITECTS</p>
                <h2 className="text-5xl font-black font-orbitron tracking-tighter italic">COMMAND DECK</h2>
                <p className="mt-6 text-white/30 font-mono text-sm max-w-xl mx-auto">The founding crew behind Code Chronicles — engineers, designers, and visionaries.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {TEAM.map((member, i) => (
                  <motion.div
                    key={member.name}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="relative group p-8 bg-black/40 border border-white/5 sci-fi-frame hover:bg-black/60 hover:border-cyan-500/40 transition-all duration-500 hover:shadow-[0_0_40px_rgba(6,182,212,0.06)]"
                  >
                    {/* Photo */}
                    <div className="relative w-32 h-32 mx-auto mb-6 overflow-hidden rounded-full ring-2 ring-white/8 group-hover:ring-cyan-500/40 transition-all duration-500">
                      <img
                        src={member.photo}
                        alt={member.name}
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                        onError={(e) => {
                          const el = e.currentTarget;
                          el.style.display = "none";
                          const parent = el.parentElement!;
                          parent.className += ` bg-gradient-to-br ${member.color} flex items-center justify-center`;
                          parent.innerHTML = `<span class="text-3xl font-black text-white">${member.initials}</span>`;
                        }}
                      />
                    </div>

                    <h3 className="text-base font-black font-orbitron text-white mb-1 group-hover:text-cyan-400 transition-colors uppercase text-center">{member.name}</h3>
                    <p className="text-[8px] font-mono text-white/25 uppercase tracking-[0.3em] mb-1 text-center">{member.role}</p>
                    <p className="text-[8px] font-mono text-cyan-500/50 uppercase tracking-widest mb-6 text-center">{member.expertise}</p>

                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 h-9 w-full border border-white/10 rounded-xl font-mono text-[9px] uppercase tracking-widest hover:bg-cyan-500 hover:text-black hover:border-transparent transition-all duration-300"
                    >
                      <Linkedin className="w-3 h-3" />
                      CONNECT
                    </a>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ── CONTACT / FOOTER ── */}
          <section id="contact" className="px-6 py-24 border-t border-white/5">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-20">
                {/* Left: Brand */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 border border-cyan-500/30 rounded-xl flex items-center justify-center bg-cyan-500/5">
                      <Rocket className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="text-2xl font-black font-orbitron italic">
                      CODE <span className="text-cyan-400">CHRONICLES</span>
                    </div>
                  </div>
                  <p className="text-white/30 font-mono text-sm leading-relaxed max-w-sm">
                    The most immersive C programming game in the universe. Train hard. Code harder. Conquer the cosmos.
                  </p>
                  <div className="flex gap-3">
                    <a
                      href="https://github.com/Shivanshdarji/Code-Chronicles"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white hover:text-black text-white/40 transition-all"
                    >
                      <Github className="w-4 h-4" />
                    </a>
                    <a
                      href="mailto:shivanshdarji1@gmail.com"
                      className="w-10 h-10 border border-white/10 rounded-xl flex items-center justify-center hover:bg-cyan-500 hover:text-black text-white/40 transition-all"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Right: Links */}
                <div className="grid grid-cols-2 gap-10">
                  <div>
                    <h4 className="font-mono text-[9px] text-white/20 uppercase tracking-[0.5em] mb-5">Navigation</h4>
                    <div className="space-y-3">
                      {NAV_LINKS.map(link => (
                        <button
                          key={link.id}
                          onClick={() => scrollToSection(link.id)}
                          className="block text-sm font-mono text-white/40 hover:text-cyan-400 transition-colors uppercase tracking-widest"
                        >
                          {link.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-mono text-[9px] text-white/20 uppercase tracking-[0.5em] mb-5">Platform</h4>
                    <div className="space-y-3">
                      <Link href="/game" className="block text-sm font-mono text-white/40 hover:text-cyan-400 transition-colors uppercase tracking-widest">Play Game</Link>
                      <Link href="/map" className="block text-sm font-mono text-white/40 hover:text-cyan-400 transition-colors uppercase tracking-widest">Mission Map</Link>
                      <Link href="/analysis" className="block text-sm font-mono text-white/40 hover:text-cyan-400 transition-colors uppercase tracking-widest">Analysis</Link>
                      <Link href="/profile" className="block text-sm font-mono text-white/40 hover:text-cyan-400 transition-colors uppercase tracking-widest">Profile</Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-[9px] font-mono text-white/15 tracking-[0.6em] uppercase">
                  © 2026 Code Chronicles — All Rights Reserved
                </p>
                <div className="flex gap-6">
                  <a href="mailto:shivanshdarji1@gmail.com" className="text-[9px] font-mono text-white/15 hover:text-white/40 uppercase tracking-widest transition-colors">Support</a>
                  <a href="https://github.com/Shivanshdarji/Code-Chronicles" target="_blank" rel="noopener noreferrer" className="text-[9px] font-mono text-white/15 hover:text-white/40 uppercase tracking-widest transition-colors">GitHub</a>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
    </>
  );
}
