"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, Stars } from "@react-three/drei";
import { Suspense } from "react";
import SpaceSheep from "./SpaceSheep";

interface Scene3DProps {
    onComplete?: () => void;
}

export default function Scene3D({ onComplete }: Scene3DProps) {
    return (
        <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                <Suspense fallback={null}>
                    <ambientLight intensity={0.2} />
                    <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00f0ff" />

                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                    <SpaceSheep onComplete={onComplete} />

                    {/* Environment with lower background intensity to prevent washout */}
                    <Environment preset="city" environmentIntensity={0.5} />
                </Suspense>
            </Canvas>
        </div>
    );
}
