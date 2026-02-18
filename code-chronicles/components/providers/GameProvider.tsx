"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

import { useAuth } from "@/components/providers/AuthProvider";
import { supabase } from "@/lib/supabase";

export interface GameSector {
    id: string;
    name: string;
    cost: number;
    description: string;
    unlocked: boolean;
    startLevel: number;
    endLevel: number;
}

export interface LevelStats {
    time_taken_seconds?: number;
    code_lines?: number;
}

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    xp: number; // Experience Points
    level: number; // Current Level
    data: {
        skills: {
            syntax: number; // 0-100
            logic: number;
            speed: number;
        };
        stats: {
            totalLinesOfCode: number;
            missionsCompleted: number;
            bugsFixed: number;
        };
        joinedAt: string;
    };
}

const INITIAL_SECTORS: GameSector[] = [
    { id: "sector-01", name: "Training Ground", cost: 0, description: "Basic C Syntax & logic gates.", unlocked: true, startLevel: 1, endLevel: 10 },
    { id: "sector-02", name: "Memory Lane", cost: 500, description: "Pointers and memory allocation.", unlocked: false, startLevel: 11, endLevel: 25 },
    { id: "sector-03", name: "The Loop", cost: 1200, description: "Advanced iteration and recursion.", unlocked: false, startLevel: 26, endLevel: 50 },
    { id: "sector-04", name: "Struct City", cost: 2500, description: "Data structures and algorithms.", unlocked: false, startLevel: 51, endLevel: 100 },
];

interface GameContextType {
    credits: number;
    sectors: GameSector[];
    highestCompletedLevel: number;
    addCredits: (amount: number) => void;
    unlockSector: (sectorId: string) => boolean;
    completeLevel: (levelId: number, stats?: LevelStats) => void;
    user: UserProfile | null;
    login: (username: string) => void;
    logout: () => void;
    updateStats: (type: 'syntax' | 'logic' | 'speed', val: number) => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth(); // Get authenticated user
    const [credits, setCredits] = useState(0);
    const [sectors, setSectors] = useState<GameSector[]>(INITIAL_SECTORS);
    const [highestCompletedLevel, setHighestCompletedLevel] = useState(0);
    const [gameUser, setGameUser] = useState<UserProfile | null>(null); // Renamed to avoid conflict with Auth user

    console.log("GameProvider: Auth User:", user?.email);

    // Initial Load
    useEffect(() => {
        const loadData = async () => {
            if (user) {
                // Load from Supabase
                console.log("Loading from Supabase...");
                const { data: stats } = await supabase
                    .from('game_stats')
                    .select('*')
                    .eq('user_id', user.id)
                    .maybeSingle(); // won't 406 if no row exists

                // Fetch Profile (Username + Email)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('username, email')
                    .eq('id', user.id)
                    .maybeSingle();

                // Upsert email into profiles so existing users get it saved automatically
                const userEmail = user.email || '';
                if (userEmail && (!profile?.email || profile.email !== userEmail)) {
                    await supabase.from('profiles').upsert({
                        id: user.id,
                        email: userEmail,
                        username: profile?.username || user.user_metadata?.username || userEmail.split('@')[0]
                    }, { onConflict: 'id' });
                }

                // Use existing stats or auto-create a default row for new users
                const effectiveStats = stats ?? await (async () => {
                    const defaultStats = {
                        user_id: user.id,
                        credits: 0,
                        highest_level: 0,
                        xp: 0,
                        level: 1,
                        syntax_skill: 0,
                        logic_skill: 0,
                        efficiency_skill: 0,
                        updated_at: new Date().toISOString(),
                    };
                    const { data: created } = await supabase
                        .from('game_stats')
                        .insert(defaultStats)
                        .select()
                        .single();
                    console.log("Created default game_stats for new user");
                    return created ?? defaultStats;
                })();

                setCredits(effectiveStats.credits ?? 0);
                setHighestCompletedLevel(effectiveStats.highest_level ?? 0);
                setGameUser({
                    id: user.id,
                    username: profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || "Cadet",
                    email: user.email || profile?.email || '',
                    xp: effectiveStats.xp || 0,
                    level: effectiveStats.level || 1,
                    data: {
                        skills: {
                            syntax: effectiveStats.syntax_skill || 0,
                            logic: effectiveStats.logic_skill || 0,
                            speed: effectiveStats.efficiency_skill || 0
                        },
                        stats: {
                            totalLinesOfCode: 0,
                            missionsCompleted: effectiveStats.highest_level || 0,
                            bugsFixed: 0
                        },
                        joinedAt: user.created_at || new Date().toISOString()
                    }
                });
            } else {
                // Load from LocalStorage (Guest)
                try {
                    const savedCredits = localStorage.getItem("game_credits_v2");
                    const savedSectors = localStorage.getItem("game_sectors");
                    const savedProgress = localStorage.getItem("game_progress");

                    if (savedCredits) setCredits(parseInt(savedCredits));
                    if (savedSectors) setSectors(JSON.parse(savedSectors));
                    if (savedProgress) setHighestCompletedLevel(parseInt(savedProgress));

                    const savedUser = localStorage.getItem("game_user");
                    if (savedUser) setGameUser(JSON.parse(savedUser));
                } catch (e) {
                    console.error("Failed to load local save", e);
                }
            }
        };

        loadData();
    }, [user]);

    const saveState = async (newCredits: number, newSectors: GameSector[], newProgress: number, newStats?: any) => {
        // Update Local State
        setCredits(newCredits);
        setSectors(newSectors);
        setHighestCompletedLevel(newProgress);
        if (newStats) setGameUser(prev => prev ? ({ ...prev, ...newStats }) : null);

        // Persist
        if (user) {
            // Save to Supabase
            const updates: any = {
                user_id: user.id,
                credits: newCredits,
                highest_level: newProgress,
                updated_at: new Date(),
            };

            if (newStats) {
                if (newStats.xp !== undefined) updates.xp = newStats.xp;
                if (newStats.level !== undefined) updates.level = newStats.level;
                if (newStats.data?.skills) {
                    updates.syntax_skill = newStats.data.skills.syntax;
                    updates.logic_skill = newStats.data.skills.logic;
                    updates.efficiency_skill = newStats.data.skills.speed;
                }
            }

            const { error } = await supabase.from('game_stats').upsert(updates);
            if (error) console.error("Error saving to Supabase:", error);
        } else {
            // Save to LocalStorage
            try {
                localStorage.setItem("game_credits_v2", newCredits.toString());
                localStorage.setItem("game_sectors", JSON.stringify(newSectors));
                localStorage.setItem("game_progress", newProgress.toString());
                if (newStats) localStorage.setItem("game_user", JSON.stringify(newStats));
            } catch (e) {
                console.warn("Failed to save game state");
            }
        }
    };

    const login = (username: string) => {
        // Deprecated: Just redirect to login page
        // But for compatibility with existing calls, we can mock it or warn
        console.warn("Manual login deprecated, use AuthProvider");
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setGameUser(null);
        setCredits(0);
        setHighestCompletedLevel(0);
        setSectors(INITIAL_SECTORS);
        localStorage.clear(); // Option: clear local storage too
    };

    const updateStats = (type: 'syntax' | 'logic' | 'speed', val: number) => {
        if (!gameUser) return;
        const newUser = { ...gameUser };
        // Weighted average update
        newUser.data.skills[type] = Math.min(100, Math.max(0, Math.round((newUser.data.skills[type] * 0.7) + (val * 0.3))));

        saveState(credits, sectors, highestCompletedLevel, newUser);
    };

    const addCredits = (amount: number) => {
        const newTotal = credits + amount;
        saveState(newTotal, sectors, highestCompletedLevel);
    };

    const unlockSector = (sectorId: string): boolean => {
        const index = sectors.findIndex(s => s.id === sectorId);
        if (index === -1) return false;

        const sector = sectors[index];
        if (sector.unlocked) return true;

        if (credits >= sector.cost) {
            const newCredits = credits - sector.cost;
            const newSectors = [...sectors];
            newSectors[index] = { ...sector, unlocked: true };

            saveState(newCredits, newSectors, highestCompletedLevel);
            return true;
        }

        return false;
    };

    const completeLevel = (levelId: number, stats?: LevelStats) => {
        if (levelId > highestCompletedLevel) {
            saveState(credits, sectors, levelId);
        }

        // Always log to history if user is logged in, even if replaying
        if (user) {
            supabase.from('level_history').insert({
                user_id: user.id,
                level_id: levelId,
                success: true,
                time_taken_seconds: stats?.time_taken_seconds || 0,
                code_lines: stats?.code_lines || 0
            }).then(({ error }) => {
                if (error) console.error("Failed to log history", error);
            });
        }
    };

    return (
        <GameContext.Provider value={{ credits, sectors, highestCompletedLevel, addCredits, unlockSector, completeLevel, user: gameUser, login, logout, updateStats }}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error("useGame must be used within a GameProvider");
    }
    return context;
}
