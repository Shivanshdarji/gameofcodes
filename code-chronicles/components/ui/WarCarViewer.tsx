"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, ContactShadows, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// ── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
            <p className="font-mono text-[9px] text-cyan-500/40 uppercase tracking-[0.5em]">Loading WarCar...</p>
        </div>
    );
}

// ── The actual 3D model ───────────────────────────────────────────────────────
function WarCarModel() {
    const groupRef = useRef<THREE.Group>(null!);
    const { scene } = useGLTF("/WarCar.glb");

    // Auto-rotate slowly
    useFrame((_, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.3;
        }
    });

    return (
        <group ref={groupRef} dispose={null}>
            <primitive
                object={scene}
                scale={1.4}
                position={[0, -0.4, 0]}
            />
        </group>
    );
}

// Pre-load so it starts fetching immediately
useGLTF.preload("/WarCar.glb");

// ── Main exported component ───────────────────────────────────────────────────
export default function WarCarViewer({ className = "" }: { className?: string }) {
    return (
        <div className={`relative ${className}`}>
            {/* HUD corner accents */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-cyan-500/40 z-10 pointer-events-none" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-cyan-500/40 z-10 pointer-events-none" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b border-l border-cyan-500/20 z-10 pointer-events-none" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-cyan-500/20 z-10 pointer-events-none" />

            {/* Model label */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                <span className="font-mono text-[8px] text-cyan-500/50 uppercase tracking-widest">
                    WARCAR // COMBAT CLASS
                </span>
            </div>

            {/* Interaction hint */}
            <div className="absolute top-5 right-12 z-10 pointer-events-none">
                <span className="font-mono text-[7px] text-white/20 uppercase tracking-widest">drag to rotate</span>
            </div>

            <Suspense fallback={<LoadingSkeleton />}>
                <Canvas
                    camera={{ position: [0, 1, 4], fov: 40 }}
                    gl={{ antialias: true, alpha: true }}
                    style={{ width: "100%", height: "100%" }}
                >
                    {/* Lights */}
                    <ambientLight intensity={0.3} />
                    <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow color="#ffffff" />
                    <pointLight position={[-5, 2, -3]} intensity={0.8} color="#00f0ff" />
                    <pointLight position={[5, -2, 3]} intensity={0.4} color="#7000ff" />
                    <spotLight position={[0, 10, 0]} intensity={0.6} color="#00f0ff" angle={0.3} penumbra={0.5} />

                    {/* Model */}
                    <WarCarModel />

                    {/* Ground shadow */}
                    <ContactShadows
                        position={[0, -0.8, 0]}
                        opacity={0.4}
                        scale={6}
                        blur={2}
                        far={4}
                        color="#00f0ff"
                    />

                    {/* Allow manual orbit on top of auto-rotation */}
                    <OrbitControls
                        enableZoom={true}
                        enablePan={false}
                        minDistance={2}
                        maxDistance={8}
                        minPolarAngle={Math.PI / 6}
                        maxPolarAngle={Math.PI / 2}
                    />

                    <Environment preset="city" environmentIntensity={0.4} />
                </Canvas>
            </Suspense>
        </div>
    );
}
