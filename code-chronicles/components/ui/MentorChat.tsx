"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Send, Bot, User, Mic, Settings, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAudio } from "@/components/providers/AudioProvider";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function MentorChat({ context, code }: { context?: string, code?: string }) {
    const { mentorVolume, setMentorVolume, volume: bgmVolume, setVolume: setBgmVolume } = useAudio();
    const [showSettings, setShowSettings] = useState(false);

    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "I am ready to assist, Pilot. Ask me anything about the systems." }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const handleTTS = async (text: string) => {
        if (isMuted) return;

        try {
            const res = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: text.substring(0, 200) }), // Limit length for speed
            });

            if (!res.ok) throw new Error("TTS Failed");

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);

            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }

            const audio = new Audio(url);
            audioRef.current = audio;
            audio.volume = mentorVolume;
            audio.onended = () => setIsPlayingAudio(false);
            audio.play();
            setIsPlayingAudio(true);

        } catch (e) {
            console.error("Audio playback error", e);
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { role: "user", content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
                    context,
                    code // Pass the code context
                })
            });

            if (!res.ok) throw new Error("Failed to reach mentor");

            const data = await res.json();
            setMessages(prev => [...prev, { role: "assistant", content: data.content }]);

            // Speak the response
            handleTTS(data.content);

        } catch (e) {
            setMessages(prev => [...prev, { role: "assistant", content: "Comms link unstable. Try again." }]);
        } finally {
            setLoading(false);
        }
    };

    const [isListening, setIsListening] = useState(false);

    // Speech Recognition
    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Voice input is not supported in this browser.");
            return;
        }

        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };


    return (
        <div className="flex flex-col h-full bg-black/80 backdrop-blur-md border border-cyan-500/20 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.1)] relative">
            {/* Header */}
            <div className="p-3 bg-cyan-950/30 border-b border-cyan-500/20 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isPlayingAudio ? "bg-cyan-400 animate-ping" : "bg-green-500"}`} />
                    <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">AI MENTOR LINK</span>
                </div>

                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-cyan-500 hover:text-cyan-400 p-1 hover:bg-white/5 rounded transition-colors"
                >
                    <Settings size={14} />
                </button>
            </div>

            {/* Settings Overlay */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-[44px] left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-cyan-500/20 p-4 z-20 space-y-4 shadow-2xl"
                    >
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-cyan-400 font-mono">
                                <div className="flex items-center gap-2">
                                    <Bot size={14} />
                                    <span>MENTOR VOICE</span>
                                </div>
                                <span>{Math.round(mentorVolume * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={mentorVolume}
                                onChange={(e) => setMentorVolume(parseFloat(e.target.value))}
                                className="w-full accent-cyan-500 h-1 bg-cyan-900/50 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-cyan-400 font-mono">
                                <div className="flex items-center gap-2">
                                    <Volume2 size={14} />
                                    <span>BGM VOLUME</span>
                                </div>
                                <span>{Math.round(bgmVolume * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={bgmVolume}
                                onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                                className="w-full accent-cyan-500 h-1 bg-cyan-900/50 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
                {messages.map((m, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === "assistant" ? "bg-cyan-900 text-cyan-400" : "bg-white/10 text-white"}`}>
                            {m.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
                        </div>
                        <div className={`p-3 rounded-lg max-w-[80%] ${m.role === "assistant" ? "bg-cyan-950/50 border border-cyan-500/20 text-cyan-100" : "bg-white/10 text-white"}`}>
                            {m.content}
                        </div>
                    </motion.div>
                ))}
                {loading && (
                    <div className="flex gap-2 text-cyan-500 text-xs px-2">
                        <span className="animate-bounce">●</span>
                        <span className="animate-bounce delay-100">●</span>
                        <span className="animate-bounce delay-200">●</span>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10 bg-black/40 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder={isListening ? "Listening..." : "Ask about the code..."}
                    className="flex-1 bg-transparent border-none outline-none text-white text-sm font-mono placeholder-white/20"
                />
                <button
                    onClick={startListening}
                    className={`p-2 transition-colors ${isListening ? "text-red-500 animate-pulse" : "text-cyan-500 hover:text-cyan-400"}`}
                >
                    <Mic size={18} />
                </button>
                <Button onClick={handleSend} size="sm" className="bg-cyan-600 hover:bg-cyan-500 h-8 w-8 p-0">
                    <Send size={14} />
                </Button>
            </div>
        </div>
    );
}
