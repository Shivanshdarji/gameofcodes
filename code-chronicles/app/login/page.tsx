"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, ArrowRight, Github } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSignUp, setIsSignUp] = useState(false);
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    // Store username in metadata for now, ideally strictly validated
                    options: {
                        data: {
                            username: email.split('@')[0]
                        }
                    }
                });
                if (error) throw error;
                // Ideally show "check email" message but for now we might assume auto-login or simple flow
                alert("Check your email for the confirmation link!");
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push("/profile");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050511] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px]" />
                <div className="absolute top-[30%] left-[50%] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md z-10 p-6"
            >
                <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">
                            {isSignUp ? "INITIALIZE LINK" : "SYSTEM ACCESS"}
                        </h1>
                        <p className="text-white/40 text-sm">
                            {isSignUp ? "Begin your journey as a Code Cadet" : "Welcome back, Commander"}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <label className="block text-xs font-mono text-cyan-400/80 mb-1 ml-1">IDENTITY (EMAIL)</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-white/20"
                                placeholder="cadet@chronicles.com"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-mono text-purple-400/80 mb-1 ml-1">ACCESS KEY (PASSWORD)</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-white/20"
                                placeholder="••••••••"
                            />
                            <div className="mt-2 text-right">
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-cyan-400/60 hover:text-cyan-400 transition-colors"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-3 rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] mt-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    {isSignUp ? "INITIATE UPLINK" : "ESTABLISH CONNECTION"}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-white/40">
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="hover:text-cyan-400 transition-colors underline decoration-white/10 underline-offset-4"
                        >
                            {isSignUp ? "Already have a profile? Login" : "New Cadet? Initialize Profile"}
                        </button>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <Link href="/game" className="text-xs font-mono text-white/20 hover:text-white/60 transition-colors">
                        ← RETURN TO TITLE
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
