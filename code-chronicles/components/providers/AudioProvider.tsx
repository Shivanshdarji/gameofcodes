"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";

interface AudioContextType {
    volume: number;
    setVolume: (vol: number) => void;
    mentorVolume: number;
    setMentorVolume: (vol: number) => void;
    play: () => Promise<void>;
    pause: () => void;
    isPlaying: boolean;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
    const [volume, setVolumeState] = useState(0.3);
    const [mentorVolume, setMentorVolumeState] = useState(1.0);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize Audio
        audioRef.current = new Audio("/music/space-ambient.mp3");
        audioRef.current.loop = true;
        audioRef.current.volume = volume;

        // cleanup
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const setVolume = (vol: number) => {
        setVolumeState(vol);
        try {
            localStorage.setItem("game_audio_volume", vol.toString());
        } catch (e) { }
    };

    const setMentorVolume = (vol: number) => {
        setMentorVolumeState(vol);
        try {
            localStorage.setItem("game_mentor_volume", vol.toString());
        } catch (e) { }
    };

    const play = async () => {
        if (!audioRef.current) return;
        try {
            await audioRef.current.play();
            setIsPlaying(true);
        } catch (e) {
            console.log("Audio playback failed (interaction needed)", e);
        }
    };

    const pause = () => {
        if (!audioRef.current) return;
        audioRef.current.pause();
        setIsPlaying(false);
    };

    // Try to load volume from local storage
    useEffect(() => {
        try {
            const savedVol = localStorage.getItem("game_audio_volume");
            if (savedVol) setVolumeState(parseFloat(savedVol));

            const savedMentorVol = localStorage.getItem("game_mentor_volume");
            if (savedMentorVol) setMentorVolumeState(parseFloat(savedMentorVol));
        } catch (e) { }

        // Auto-play attempt on mount & User Interaction Fallback
        const attemptPlay = () => {
            play().catch(() => { });
        };

        const timer = setTimeout(attemptPlay, 1000);

        const handleInteraction = () => {
            attemptPlay();
        };

        window.addEventListener("click", handleInteraction);
        window.addEventListener("keydown", handleInteraction);

        return () => {
            clearTimeout(timer);
            window.removeEventListener("click", handleInteraction);
            window.removeEventListener("keydown", handleInteraction);
        };
    }, []);

    return (
        <AudioContext.Provider value={{ volume, setVolume, mentorVolume, setMentorVolume, play, pause, isPlaying }}>
            {children}
        </AudioContext.Provider>
    );
}

export function useAudio() {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error("useAudio must be used within an AudioProvider");
    }
    return context;
}
