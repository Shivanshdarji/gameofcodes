"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Unlock, ShoppingCart, CreditCard, Coins, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useGame } from "@/components/providers/GameProvider";
import { useState } from "react";

interface CreditsStoreModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreditsStoreModal({ isOpen, onClose }: CreditsStoreModalProps) {
    const { credits, sectors, addCredits, unlockSector } = useGame();
    const [activeTab, setActiveTab] = useState<"store" | "levels">("store");

    const [isProcessing, setIsProcessing] = useState(false);

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePurchase = async (amount: number, price: number) => {
        setIsProcessing(true);
        const res = await loadRazorpay();

        if (!res) {
            alert("Razorpay SDK failed to load. Are you online?");
            setIsProcessing(false);
            return;
        }

        const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!key) {
            alert("Razorpay Key ID missing! Set NEXT_PUBLIC_RAZORPAY_KEY_ID in .env.local");
            setIsProcessing(false);
            return;
        }

        // @ts-ignore
        const rzp1 = new window.Razorpay({
            key: key,
            amount: price * 100, // Amount in paise
            currency: "INR",
            name: "Code Chronicles",
            description: `Purchase ${amount} Credits`,
            image: "https://code-chronicles.com/logo.png", // Placeholder
            handler: function (response: any) {
                // In a real app, verify signature on backend
                addCredits(amount);
            },
            prefill: {
                name: "Pilot",
                email: "pilot@codechronicles.com",
                contact: "9999999999"
            },
            theme: {
                color: "#06b6d4"
            }
        });

        rzp1.on('payment.failed', function (response: any) {
            alert(response.error.description);
        });

        rzp1.open();
        setIsProcessing(false);
    };

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
                        <div className="w-full max-w-4xl bg-[#0f111a] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden pointer-events-auto flex flex-col h-[600px] relative">

                            {/* Header */}
                            <div className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-black/40">
                                <div>
                                    <h2 className="text-2xl font-bold font-mono tracking-widest text-white flex items-center gap-3">
                                        <ShoppingCart className="w-6 h-6 text-cyan-400" />
                                        SUPPLY DEPOT
                                    </h2>
                                    <div className="text-xs text-white/40 font-mono">AUTHORIZED PERSONNEL ONLY</div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg flex items-center gap-3">
                                        <div className="text-xs text-white/40 uppercase tracking-wider">Balance</div>
                                        <div className="text-xl font-bold text-yellow-400 font-mono flex items-center gap-2">
                                            <Coins className="w-4 h-4" />
                                            {credits.toLocaleString()}
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-1 overflow-hidden">
                                {/* Sidebar */}
                                <div className="w-64 border-r border-white/10 bg-black/20 p-6 space-y-2">
                                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4 px-2">Marketplace</h3>
                                    <TabButton id="store" label="Credit Packs" icon={<CreditCard className="w-4 h-4" />} active={activeTab === "store"} onClick={setActiveTab} />
                                    <TabButton id="levels" label="Level Access" icon={<Lock className="w-4 h-4" />} active={activeTab === "levels"} onClick={setActiveTab} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-[#0f111a] to-black">

                                    {activeTab === "store" && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <CreditPack
                                                amount={500}
                                                cost="₹499"
                                                name="Handful of Bits"
                                                onBuy={() => handlePurchase(500, 499)}
                                            />
                                            <CreditPack
                                                amount={1200}
                                                cost="₹999"
                                                name="Heap of Bytes"
                                                featured
                                                onBuy={() => handlePurchase(1200, 999)}
                                            />
                                            <CreditPack
                                                amount={2500}
                                                cost="₹1999"
                                                name="Stack of Gold"
                                                onBuy={() => handlePurchase(2500, 1999)}
                                            />
                                        </div>
                                    )}

                                    {activeTab === "levels" && (
                                        <div className="space-y-4">
                                            {sectors.map((sector) => (
                                                <div key={sector.id} className={`p-6 rounded-xl border flex items-center justify-between transition-all ${sector.unlocked ? 'bg-cyan-900/10 border-cyan-500/30' : 'bg-white/5 border-white/5 opacity-80 hover:opacity-100 hover:border-white/20'}`}>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-3 rounded-lg ${sector.unlocked ? 'bg-cyan-500/20 text-cyan-400' : 'bg-black/40 text-white/20'}`}>
                                                            {sector.unlocked ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-3">
                                                                <h3 className={`font-bold text-lg ${sector.unlocked ? 'text-white' : 'text-white/60'}`}>{sector.name}</h3>
                                                                {sector.unlocked && <span className="text-[10px] bg-cyan-500 text-black font-bold px-2 py-0.5 rounded">OWNED</span>}
                                                            </div>
                                                            <p className="text-sm text-white/40 max-w-sm">{sector.description} (Levels {sector.startLevel}-{sector.endLevel})</p>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        {sector.unlocked ? (
                                                            <Button disabled className="bg-white/5 text-white/40 border-transparent">INSTALLED</Button>
                                                        ) : (
                                                            <Button
                                                                onClick={() => unlockSector(sector.id)}
                                                                disabled={credits < sector.cost}
                                                                className={`min-w-[120px] ${credits >= sector.cost ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-red-900/20 border-red-500/20 text-red-400 hover:bg-red-900/30'}`}
                                                            >
                                                                {sector.cost === 0 ? "FREE" : (
                                                                    <span className="flex items-center gap-2">
                                                                        <Coins className="w-4 h-4" /> {sector.cost}
                                                                    </span>
                                                                )}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function TabButton({ id, label, icon, active, onClick }: { id: any, label: string, icon: any, active: boolean, onClick: (id: any) => void }) {
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

function CreditPack({ amount, cost, name, featured, onBuy }: { amount: number, cost: string, name: string, featured?: boolean, onBuy: () => void }) {
    return (
        <div className={`relative p-6 rounded-2xl border flex flex-col items-center text-center group transition-all duration-300 hover:-translate-y-1 ${featured ? 'bg-gradient-to-b from-cyan-900/20 to-black border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.1)]' : 'bg-white/5 border-white/10 hover:border-cyan-500/30'}`}>
            {featured && (
                <div className="absolute -top-3 bg-cyan-500 text-black text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase">
                    Best Value
                </div>
            )}

            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${featured ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white/40 group-hover:bg-cyan-500/10 group-hover:text-cyan-400'}`}>
                <Zap className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">{name}</h3>
            <div className="text-2xl font-mono font-bold text-yellow-400 mb-6 flex items-center justify-center gap-2">
                <Coins className="w-5 h-5" />
                {amount}
            </div>

            <Button
                onClick={onBuy}
                className={`w-full ${featured ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-white/10 hover:bg-white/20'}`}
            >
                {cost}
            </Button>
        </div>
    )
}
