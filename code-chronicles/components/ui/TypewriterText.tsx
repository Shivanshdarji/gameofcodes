"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface TypewriterTextProps {
    text: string;
    speed?: number; // ms per char
    onComplete?: () => void;
    className?: string;
}

export function TypewriterText({ text, speed = 30, onComplete, className = "" }: TypewriterTextProps) {
    const [displayedText, setDisplayedText] = useState("");

    useEffect(() => {
        setDisplayedText("");
        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                setDisplayedText((prev) => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(interval);
                if (onComplete) onComplete();
            }
        }, speed);

        return () => clearInterval(interval);
    }, [text, speed, onComplete]);

    return (
        <motion.div className={className}>
            {displayedText}
            <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-1" />
        </motion.div>
    );
}
