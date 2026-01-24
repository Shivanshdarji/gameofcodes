"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, Monitor, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAudio } from "@/components/providers/AudioProvider";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const [activeTab, setActiveTab] = useState("audio");
    const { volume, setVolume } = useAudio();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                    >
                        <div className="w-full max-w-2xl bg-[#0f111a] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden pointer-events-auto flex flex-col max-h-[80vh]">

                            {/* Header */}
                            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-white/5">
                                <h2 className="text-xl font-bold font-mono tracking-widest text-white flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-cyan-400" />
                                    SYSTEM CONFIGURATION
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex flex-1 overflow-hidden">
                                {/* Sidebar */}
                                <div className="w-48 border-r border-white/10 bg-black/20 p-4 space-y-2">
                                    <TabButton id="audio" label="Audio" icon={<Volume2 className="w-4 h-4" />} active={activeTab === "audio"} onClick={setActiveTab} />
                                    <TabButton id="graphics" label="Graphics" icon={<Monitor className="w-4 h-4" />} active={activeTab === "graphics"} onClick={setActiveTab} />
                                    <TabButton id="account" label="Account" icon={<User className="w-4 h-4" />} active={activeTab === "account"} onClick={setActiveTab} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-8 overflow-y-auto">

                                    {activeTab === "audio" && (
                                        <div className="space-y-8">
                                            <div>
                                                <h3 className="text-lg font-bold text-white mb-6 font-mono border-b border-white/10 pb-2">AUDIO SETTINGS</h3>

                                                <div className="space-y-6">
                                                    <div className="bg-white/5 p-6 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                                        <div className="flex justify-between mb-4">
                                                            <span className="text-white/80 font-medium">Master Volume</span>
                                                            <span className="text-cyan-400 font-mono">{Math.round(volume * 100)}%</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="1"
                                                            step="0.01"
                                                            value={volume}
                                                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                                                            className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500"
                                                        />
                                                        <div className="mt-2 text-xs text-white/40">Adjusts the ambient background music level.</div>
                                                    </div>

                                                    <div className="opacity-50 pointer-events-none">
                                                        <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                                                            <div className="flex justify-between mb-4">
                                                                <span className="text-white/80 font-medium">SFX Volume</span>
                                                                <span className="text-cyan-400 font-mono">100%</span>
                                                            </div>
                                                            <div className="w-full h-2 bg-black/50 rounded-lg relative overflow-hidden">
                                                                <div className="absolute inset-y-0 left-0 w-full bg-cyan-500/30"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === "graphics" && (
                                        <div className="flex items-center justify-center h-full text-white/40 font-mono text-sm">
                                            GRAPHICS SETTINGS LOCKED BY ADMINISTRATOR
                                        </div>
                                    )}

                                    {activeTab === "account" && (
                                        <div className="flex items-center justify-center h-full text-white/40 font-mono text-sm">
                                            ACCOUNT MANAGEMENT VIA MAIN CONSOLE ONLY
                                        </div>
                                    )}

                                </div>
                            </div>

                            {/* Footer */}
                            <div className="h-16 border-t border-white/10 bg-black/40 flex items-center justify-end px-6 gap-4">
                                <Button variant="ghost" onClick={onClose} className="text-white/60 hover:text-white hover:bg-white/5">CANCEL</Button>
                                <Button onClick={onClose} className="bg-cyan-600 hover:bg-cyan-500 text-white min-w-[120px]">APPLY</Button>
                            </div>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function TabButton({ id, label, icon, active, onClick }: { id: string, label: string, icon: any, active: boolean, onClick: (id: string) => void }) {
    return (
        <button
            onClick={() => onClick(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${active
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"
                }`}
        >
            {icon}
            {label}
        </button>
    );
}
