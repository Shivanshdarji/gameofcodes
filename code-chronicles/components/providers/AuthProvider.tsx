"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    requestPasswordReset: (email: string) => Promise<void>;
    updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const setData = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    // Stale / expired refresh token — silently clear it so the
                    // browser stops spamming "Invalid Refresh Token" errors.
                    const isRefreshError =
                        error.message?.toLowerCase().includes("refresh token") ||
                        error.message?.toLowerCase().includes("invalid_grant") ||
                        (error as any)?.status === 400;

                    if (isRefreshError) {
                        // Wipe the expired tokens from storage quietly
                        await supabase.auth.signOut({ scope: "local" });
                        setSession(null);
                        setUser(null);
                    } else {
                        console.error("Supabase Session Error:", error.message);
                    }
                } else {
                    setSession(session);
                    setUser(session?.user ?? null);
                }
            } catch (e) {
                // Suppress token errors at the caught level too
                const msg = (e as any)?.message ?? "";
                if (!msg.toLowerCase().includes("refresh token")) {
                    console.error("Unexpected Auth Error:", e);
                }
            }
            setLoading(false);
        };

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            // Only redirect if not on a public auth page
            const isAuthPage = ['/login', '/signup', '/forgot-password', '/reset-password'].some(path => window.location.pathname.startsWith(path));
            if (_event === 'SIGNED_OUT' && !isAuthPage) {
                // Only redirect if we were previously logged in (avoid redirect loop)
                if (session === null) return;
                router.push('/');
            }
        });

        setData();

        return () => {
            listener.subscription.unsubscribe();
        };
    }, [router]);

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            }
        });
        if (error) console.error("Error signing in:", error);
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error("Error signing out:", error);
    };

    const requestPasswordReset = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
    };

    const updatePassword = async (newPassword: string) => {
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });
        if (error) throw error;
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signOut, requestPasswordReset, updatePassword }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
