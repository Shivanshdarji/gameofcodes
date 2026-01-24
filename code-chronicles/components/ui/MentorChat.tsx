"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Send, Bot, User, Mic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function MentorChat({ context, code }: { context?: string, code?: string }) {
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
        } catch (e) {
            setMessages(prev => [...prev, { role: "assistant", content: "Comms link unstable. Try again." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black/80 backdrop-blur-md border border-cyan-500/20 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.1)]">
            {/* Header */}
            <div className="p-3 bg-cyan-950/30 border-b border-cyan-500/20 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">AI MENTOR LINK</span>
            </div>

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
                    placeholder="Ask about the code..."
                    className="flex-1 bg-transparent border-none outline-none text-white text-sm font-mono placeholder-white/20"
                />
                <button className="text-cyan-500 hover:text-cyan-400 p-2">
                    <Mic size={18} />
                </button>
                <Button onClick={handleSend} size="sm" className="bg-cyan-600 hover:bg-cyan-500 h-8 w-8 p-0">
                    <Send size={14} />
                </Button>
            </div>
        </div>
    );
}
