"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type GraphicsQuality = "low" | "medium" | "high";

export interface GraphicsSettings {
    quality: GraphicsQuality;
    shadows: boolean;
    particleCount: number; // For Starfield, Debris, etc.
    resolution: number; // pixel ratio (dpr)
    effects: boolean; // Bloom, Godrays, etc.
}

interface GraphicsContextType extends GraphicsSettings {
    setQuality: (quality: GraphicsQuality) => void;
    isLoaded: boolean;
}

const PRESETS: Record<GraphicsQuality, Omit<GraphicsSettings, "quality">> = {
    low: {
        shadows: false,
        particleCount: 500,
        resolution: 1, // 100% resolution but no higher (dpr 1)
        effects: false,
    },
    medium: {
        shadows: true,
        particleCount: 1500,
        resolution: 1.5, // Cap at 1.5 dpr
        effects: true,
    },
    high: {
        shadows: true,
        particleCount: 3000,
        resolution: 2, // Cap at 2 dpr (Retina)
        effects: true,
    },
};

const GraphicsContext = createContext<GraphicsContextType | undefined>(undefined);

export function GraphicsProvider({ children }: { children: React.ReactNode }) {
    const [quality, setQualityState] = useState<GraphicsQuality>("medium");
    const [settings, setSettings] = useState<Omit<GraphicsSettings, "quality">>(PRESETS.medium);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Load from local storage
        const savedQuality = localStorage.getItem("graphicsQuality") as GraphicsQuality;
        if (savedQuality && PRESETS[savedQuality]) {
            setQualityState(savedQuality);
            setSettings(PRESETS[savedQuality]);
        }
        setIsLoaded(true);
    }, []);

    const setQuality = (newQuality: GraphicsQuality) => {
        setQualityState(newQuality);
        setSettings(PRESETS[newQuality]);
        localStorage.setItem("graphicsQuality", newQuality);
    };

    // Prevent hydration mismatch by only rendering after mount if we cared about strict matching, 
    // but here we just want to ensure context availability.
    // If we want to avoid flash of wrong settings, we can delay children, but that blocks UI.
    // Better to provide default (Medium) and update.

    return (
        <GraphicsContext.Provider value={{ quality, ...settings, setQuality, isLoaded }}>
            {children}
        </GraphicsContext.Provider>
    );
}

export function useGraphics() {
    const context = useContext(GraphicsContext);
    if (!context) {
        throw new Error("useGraphics must be used within a GraphicsProvider");
    }
    return context;
}
