import { useEffect, useRef } from "react";
import { useGraphics } from "@/components/providers/GraphicsProvider";

export default function Starfield() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { particleCount, resolution } = useGraphics();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let stars: { x: number; y: number; z: number }[] = [];
        // Adjust star count based on setting (base 800 is now dynamic)
        // particleCount is 500, 1500, 3000. Let's scale it reasonable for 2D canvas
        // 500 is fine for low. 1500 for medium.
        const numStars = Math.min(particleCount, 1500); // Cap at 1500 for 2D canvas performance? Or let it fly.
        // Actually particleCount was designed for 3D mostly, but let's use it here too.

        const speed = 0.5;

        const resize = () => {
            // Handle DPI
            const dpr = window.devicePixelRatio || 1;
            // We can use resolution setting to cap dpr if we wanted, but for 2D canvas standard resize is usually fine.
            // Let's stick to standard full size match
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            initStars();
        };

        const initStars = () => {
            stars = [];
            for (let i = 0; i < numStars; i++) {
                stars.push({
                    x: Math.random() * canvas.width - canvas.width / 2,
                    y: Math.random() * canvas.height - canvas.height / 2,
                    z: Math.random() * canvas.width,
                });
            }
        };

        const update = () => {
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            for (let star of stars) {
                star.z -= speed;
                if (star.z <= 0) {
                    star.x = Math.random() * canvas.width - canvas.width / 2;
                    star.y = Math.random() * canvas.height - canvas.height / 2;
                    star.z = canvas.width;
                }

                const x = (star.x / star.z) * canvas.width + canvas.width / 2;
                const y = (star.y / star.z) * canvas.height + canvas.height / 2;
                const size = (1 - star.z / canvas.width) * 3;

                if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
                    const brightness = 1 - star.z / canvas.width;
                    ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            animationFrameId = requestAnimationFrame(update);
        };

        window.addEventListener("resize", resize);
        resize();
        update();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [particleCount]); // Re-run when particleCount changes

    return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
}
