"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface GameSector {
    id: string;
    name: string;
    cost: number;
    description: string;
    unlocked: boolean;
    startLevel: number;
    endLevel: number;
}

export interface UserProfile {
    id: string;
    username: string;
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
    completeLevel: (levelId: number) => void;
    user: UserProfile | null;
    login: (username: string) => void;
    logout: () => void;
    updateStats: (type: 'syntax' | 'logic' | 'speed', val: number) => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
    const [credits, setCredits] = useState(0);
    const [sectors, setSectors] = useState<GameSector[]>(INITIAL_SECTORS);
    const [highestCompletedLevel, setHighestCompletedLevel] = useState(0); // 0 means no levels completed
    const [user, setUser] = useState<UserProfile | null>(null);

    // Persist State
    useEffect(() => {
        try {
            const savedCredits = localStorage.getItem("game_credits_v2");
            const savedSectors = localStorage.getItem("game_sectors");
            const savedProgress = localStorage.getItem("game_progress");

            if (savedCredits) setCredits(parseInt(savedCredits));
            if (savedSectors) setSectors(JSON.parse(savedSectors));
            if (savedProgress) setHighestCompletedLevel(parseInt(savedProgress));

            const savedUser = localStorage.getItem("game_user");
            if (savedUser) setUser(JSON.parse(savedUser));
        } catch (e) {
            console.error("Failed to load game save", e);
        }
    }, []);

    const saveState = (newCredits: number, newSectors: GameSector[], newProgress: number) => {
        try {
            localStorage.setItem("game_credits_v2", newCredits.toString());
            localStorage.setItem("game_sectors", JSON.stringify(newSectors));
            localStorage.setItem("game_progress", newProgress.toString());
        } catch (e) {
            console.warn("Failed to save game state");
        }
    };

    const login = (username: string) => {
        // Create new or retrieve existing (mock logic for now, usually would be API)
        const newUser: UserProfile = {
            id: Date.now().toString(),
            username,
            data: {
                skills: { syntax: 50, logic: 50, speed: 50 },
                stats: { totalLinesOfCode: 0, missionsCompleted: 0, bugsFixed: 0 },
                joinedAt: new Date().toISOString()
            }
        };
        setUser(newUser);
        localStorage.setItem("game_user", JSON.stringify(newUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("game_user");
    };

    const updateStats = (type: 'syntax' | 'logic' | 'speed', val: number) => {
        if (!user) return;
        const newUser = { ...user };
        // Weighted average update
        newUser.data.skills[type] = Math.min(100, Math.max(0, Math.round((newUser.data.skills[type] * 0.7) + (val * 0.3))));
        setUser(newUser);
        localStorage.setItem("game_user", JSON.stringify(newUser));
    };

    const addCredits = (amount: number) => {
        const newTotal = credits + amount;
        setCredits(newTotal);
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

            setCredits(newCredits);
            setSectors(newSectors);
            saveState(newCredits, newSectors, highestCompletedLevel);
            return true;
        }

        return false;
    };

    const completeLevel = (levelId: number) => {
        if (levelId > highestCompletedLevel) {
            setHighestCompletedLevel(levelId);
            saveState(credits, sectors, levelId);
        }
    };

    return (
        <GameContext.Provider value={{ credits, sectors, highestCompletedLevel, addCredits, unlockSector, completeLevel, user, login, logout, updateStats }}>
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
