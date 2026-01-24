"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Float, Center } from "@react-three/drei";
import * as THREE from "three";

interface SpaceSheepProps {
    onComplete?: () => void;
}

export default function SpaceSheep({ onComplete }: SpaceSheepProps) {
    const { scene } = useGLTF("/space_shipe.glb");
    const modelRef = useRef<THREE.Group>(null);
    const completeTriggered = useRef(false);

    useFrame((state) => {
        if (modelRef.current) {
            // Fly-through effect with cinematic slow-down and avoidance
            // Calculate distance to camera (camera is at 5, model starts at -25)
            const distToCamera = 5 - modelRef.current.position.z;

            // Speed is proportional to distance, but clamped
            // Fast when far, slow when near
            let speed = 0.05;

            // Start avoidance maneuver earlier (when within 15 units)
            if (distToCamera < 15) {
                speed = Math.max(0.005, distToCamera * 0.005); // Slow down significantly near camera

                // Avoidance maneuver: Move very slightly to the right
                // User requested "very very little right"
                modelRef.current.position.x += 0.0015;

                // Subtle Banking/Turning
                modelRef.current.rotation.y -= 0.0005;
            }

            modelRef.current.position.z += speed;

            // Trigger completion when model is close enough/covers screen (or passes it)
            // if (modelRef.current.position.z > 5 && !completeTriggered.current) {
            //   completeTriggered.current = true;
            // if (onComplete) onComplete();
            //}
        }
    });

    return (
        <Float speed={0.7} rotationIntensity={0.1} floatIntensity={0.1}>
            <group ref={modelRef} position={[0, 0, -25]}>
                <Center>
                    {/* Massive scale as requested */}
                    {/* Rotated -1.5 rad (approx -86 deg) to face slightly right as requested */}
                    <primitive object={scene} scale={[4, 4, 4]} rotation={[0, -1.5, 0]} />
                </Center>
            </group>
        </Float>
    );
}
