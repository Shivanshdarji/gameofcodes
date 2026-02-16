"use client";

import { useMemo } from "react";
import * as THREE from "three";

export default function SimpleRover() {
    // A simple group of primitives to represent the rover
    // Body: Box
    // Wheels: Cylinders
    // Camera Mast: Cylinder + Box

    const bodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#e5e5e5", roughness: 0.5 }), []);
    const wheelMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#333333", roughness: 0.9 }), []);
    const mastMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#aaaaaa", roughness: 0.5 }), []);
    const cameraMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#222222" }), []);
    const lensMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#00ffff", emissive: "#00ffff", emissiveIntensity: 0.5 }), []);

    return (
        <group>
            {/* Main Body */}
            <mesh position={[0, 0.5, 0]} castShadow receiveShadow material={bodyMaterial}>
                <boxGeometry args={[1.5, 0.5, 2]} />
            </mesh>

            {/* Wheels */}
            {/* Front Left */}
            <mesh position={[-0.9, 0.4, 0.8]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow material={wheelMaterial}>
                <cylinderGeometry args={[0.4, 0.4, 0.4, 16]} />
            </mesh>
            {/* Front Right */}
            <mesh position={[0.9, 0.4, 0.8]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow material={wheelMaterial}>
                <cylinderGeometry args={[0.4, 0.4, 0.4, 16]} />
            </mesh>
            {/* Back Left */}
            <mesh position={[-0.9, 0.4, -0.8]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow material={wheelMaterial}>
                <cylinderGeometry args={[0.4, 0.4, 0.4, 16]} />
            </mesh>
            {/* Back Right */}
            <mesh position={[0.9, 0.4, -0.8]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow material={wheelMaterial}>
                <cylinderGeometry args={[0.4, 0.4, 0.4, 16]} />
            </mesh>
            {/* Middle Left */}
            <mesh position={[-0.9, 0.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow material={wheelMaterial}>
                <cylinderGeometry args={[0.4, 0.4, 0.4, 16]} />
            </mesh>
            {/* Middle Right */}
            <mesh position={[0.9, 0.4, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow material={wheelMaterial}>
                <cylinderGeometry args={[0.4, 0.4, 0.4, 16]} />
            </mesh>

            {/* Mast */}
            <mesh position={[0, 1.0, 0.8]} material={mastMaterial} castShadow>
                <cylinderGeometry args={[0.1, 0.1, 1, 8]} />
            </mesh>

            {/* Camera Head */}
            <group position={[0, 1.5, 0.8]}>
                <mesh material={cameraMaterial} castShadow>
                    <boxGeometry args={[0.6, 0.3, 0.4]} />
                </mesh>
                {/* Eyes/Lenses */}
                <mesh position={[-0.15, 0, 0.21]} material={lensMaterial}>
                    <planeGeometry args={[0.1, 0.1]} />
                </mesh>
                <mesh position={[0.15, 0, 0.21]} material={lensMaterial}>
                    <planeGeometry args={[0.1, 0.1]} />
                </mesh>
            </group>

            {/* Solar Panel / Deck details */}
            <mesh position={[0, 0.76, -0.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[1.2, 0.8]} />
                <meshStandardMaterial color="#112233" roughness={0.2} metalness={0.8} />
            </mesh>
        </group>
    );
}
