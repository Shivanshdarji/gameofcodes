"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface GameTimerProps {
    timeRemaining: number;
    totalTime: number;
    onTimeUp?: () => void;
}

export default function GameTimer({ timeRemaining, totalTime, onTimeUp }: GameTimerProps) {
    const [playWarning, setPlayWarning] = useState(false);

    useEffect(() => {
        if (timeRemaining === 5 && !playWarning) {
            setPlayWarning(true);
            // Play warning sound
            const audio = new Audio('/music/click.mp3');
            audio.volume = 0.3;
            audio.play().catch(() => { });
        }

        if (timeRemaining === 0 && onTimeUp) {
            onTimeUp();
        }
    }, [timeRemaining, onTimeUp, playWarning]);

    const percentage = (timeRemaining / totalTime) * 100;
    const isWarning = timeRemaining <= 5;
    const isCritical = timeRemaining <= 3;

    return (
        <div className="bg-black/80 border border-cyan-500/30 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
                <Clock className={`w-5 h-5 ${isCritical ? 'text-red-500 animate-pulse' : isWarning ? 'text-yellow-500' : 'text-cyan-400'}`} />
                <div className="flex-1">
                    <p className="text-xs text-white/60 mb-1">CODING TIME</p>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-3xl font-bold font-mono ${isCritical ? 'text-red-500' : isWarning ? 'text-yellow-500' : 'text-cyan-400'
                            }`}>
                            {timeRemaining}
                        </span>
                        <span className="text-white/40 text-sm">seconds</span>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-1000 ease-linear ${isCritical
                            ? 'bg-red-500'
                            : isWarning
                                ? 'bg-yellow-500'
                                : 'bg-cyan-500'
                        }`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {isWarning && (
                <p className="text-center text-yellow-400 text-xs mt-2 animate-pulse">
                    ⚠ Time running out!
                </p>
            )}
        </div>
    );
}
