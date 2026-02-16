"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, Sparkles, Stars, PerspectiveCamera, OrbitControls, Center } from "@react-three/drei";
import { useRef, useEffect } from "react";
import * as THREE from "three";

import { useGraphics } from "@/components/providers/GraphicsProvider";
import SimpleRover from "./SimpleRover";

// Add direction prop to interface
export default function LevelScene({ isSuccess, speed = 0, scale = 0.5, direction = "forward" }: { isSuccess: boolean; speed?: number; scale?: number; direction?: "forward" | "left" | "right" | "random" }) {
    const { quality, shadows, resolution } = useGraphics();

    return (
        <div className="w-full h-full bg-black/50 rounded-2xl overflow-hidden border border-white/10 relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <Canvas shadows={shadows} dpr={[1, resolution]}>
                <PerspectiveCamera makeDefault position={[6, 2, 6]} fov={50} />
                <OrbitControls enableZoom={true} enablePan={false} maxPolarAngle={Math.PI / 1.5} minPolarAngle={Math.PI / 4} autoRotate={!isSuccess && speed > 0 && direction === "random"} autoRotateSpeed={speed * 2} />

                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.25} penumbra={1} intensity={1} castShadow={shadows} />
                <pointLight position={[-10, 5, -10]} intensity={0.5} color="#ff003c" />

                <Stars radius={100} depth={50} count={quality === 'low' ? 1000 : 5000} factor={4} saturation={0} fade speed={1} />
                <Sparkles count={quality === 'low' ? 100 : 500} scale={10} size={2} speed={0.4} opacity={0.5} color="#00f0ff" />

                <group position={[0, 0.5, 0]}>
                    <Center>
                        {quality === 'low' ? (
                            <SimpleRover />
                        ) : (
                            <RoverModel isSuccess={isSuccess} speed={speed} scale={scale} direction={direction} />
                        )}
                    </Center>
                </group>

                <Environment preset="city" />
            </Canvas>
        </div>
    );
}

function RoverModel({ isSuccess, speed = 0, scale = 0.5, direction = "forward" }: { isSuccess: boolean; speed?: number; scale?: number; direction?: "forward" | "left" | "right" | "random" }) {
    const { scene } = useGLTF("/mars_rover.glb");
    const meshRef = useRef<THREE.Group>(null);
    // ... (scene cloning logic remains same)

    const clonedScene = useRef<THREE.Group>(null);
    useEffect(() => {
        if (scene) {
            clonedScene.current = scene.clone();
            clonedScene.current.traverse((node) => {
                if ((node as THREE.Mesh).isMesh) {
                    const mesh = node as THREE.Mesh;
                    mesh.castShadow = true;
                    mesh.receiveShadow = true;
                    if (mesh.material instanceof THREE.MeshBasicMaterial) {
                        mesh.material = new THREE.MeshStandardMaterial({
                            color: mesh.material.color,
                            map: mesh.material.map
                        });
                    }
                }
            });
        }
    }, [scene]);

    useFrame((state, delta) => {
        if (meshRef.current) {
            if (isSuccess) {
                // Happy celebration
                if (direction === "left") {
                    meshRef.current.rotation.y += delta * 2;
                } else if (direction === "right") {
                    meshRef.current.rotation.y -= delta * 2;
                } else {
                    meshRef.current.rotation.y += delta * 5.0;
                }

                const shakeX = (Math.random() - 0.5) * 0.1;
                const shakeZ = (Math.random() - 0.5) * 0.1;
                meshRef.current.position.set(shakeX, Math.sin(state.clock.elapsedTime * 10) * 0.1, shakeZ);
            } else {
                // Movement Simulation based on speed
                if (speed > 0) {
                    if (direction === "forward") {
                        // Move forward (simulate by rotating wheels or moving terrain - here just simple wobble/bob to imply movement)
                        meshRef.current.position.z = Math.sin(state.clock.elapsedTime * 10) * 0.2;
                    } else if (direction === "left") {
                        meshRef.current.rotation.y += delta * speed;
                    } else if (direction === "right") {
                        meshRef.current.rotation.y -= delta * speed;
                    } else if (direction === "random") {
                        meshRef.current.rotation.y += delta * speed * (Math.random() > 0.5 ? 1 : -1);
                    }
                }
                // Subtle breathing
                meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
            }
        }
    });

    if (!scene) return null;

    return (
        <group ref={meshRef}>
            <primitive object={scene} scale={[scale, scale, scale]} />
        </group>
    );
}
