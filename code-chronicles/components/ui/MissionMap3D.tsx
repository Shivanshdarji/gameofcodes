"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, Html, Stars, Float, Text, ScrollControls, useScroll, Sparkles, Environment, Instance, Instances, useGLTF } from "@react-three/drei";
import { useState, useRef, useMemo, Suspense, useEffect } from "react";
import * as THREE from "three";
import { useRouter } from "next/navigation";
import { useGame } from "@/components/providers/GameProvider";

// Configuration for the Spiral
const SPIRAL_RADIUS = 30;
const LEVEL_DISTANCE_Z = 30;
const ANGLE_STEP = 0.4;

// --- Helper Geometry for Satellite ---
const SatelliteModel = () => (
    <group scale={0.5}>
        <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[1.2, 0, 0]}>
            <boxGeometry args={[1.5, 0.1, 0.8]} />
            <meshStandardMaterial color="#222" emissive="#0044ff" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[-1.2, 0, 0]}>
            <boxGeometry args={[1.5, 0.1, 0.8]} />
            <meshStandardMaterial color="#222" emissive="#0044ff" emissiveIntensity={0.5} />
        </mesh>
    </group>
);

// --- New Visual Components ---

const SpaceSheep = () => {
    // Using the requested space_shipe.glb asset
    const { scene } = useGLTF("/space_shipe.glb");
    const groupRef = useRef<THREE.Group>(null);
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    useFrame(({ clock }) => {
        if (groupRef.current) {
            const t = clock.getElapsedTime() * 0.3;
            // Fly in a wide orbit
            groupRef.current.position.x = Math.sin(t) * 120;
            groupRef.current.position.y = Math.cos(t * 0.7) * 40;
            groupRef.current.position.z = Math.cos(t) * 120;

            // Rotation with "mode 350 degree" offset (approx 6.1 radians) + time-based rotation
            // 350 degrees = 350 * PI / 180 ~= 6.108
            groupRef.current.rotation.y = -t + 6.108;

            // Banking effect
            groupRef.current.rotation.z = Math.sin(t * 2) * 0.2;
        }
    });

    return (
        <group ref={groupRef} scale={[0.5, 0.5, 0.5]}> {/* Adjusted scale for GLB */}
            <primitive object={clonedScene} />
        </group>
    );
};

const OrbitingRock = () => {
    const meshRef = useRef<THREE.Mesh>(null);
    // Random orbit parameters
    const [orbit] = useState(() => ({
        radius: 40 + Math.random() * 60, // Distance from center
        speed: (Math.random() * 0.2 + 0.05) * (Math.random() < 0.5 ? 1 : -1), // Speed & Direction
        yOffset: (Math.random() - 0.5) * 40, // Height variation
        rotationSpeed: new THREE.Vector3(
            Math.random() * 0.02,
            Math.random() * 0.02,
            Math.random() * 0.02
        ),
        scale: 2 + Math.random() * 3 // Size: 2x to 5x original
    }));

    useFrame(({ clock }) => {
        if (meshRef.current) {
            const t = clock.getElapsedTime() * orbit.speed;
            meshRef.current.position.x = Math.cos(t) * orbit.radius;
            meshRef.current.position.z = Math.sin(t) * orbit.radius;
            meshRef.current.position.y = Math.sin(t * 0.5) * 10 + orbit.yOffset;

            // Self-rotation
            meshRef.current.rotation.x += orbit.rotationSpeed.x;
            meshRef.current.rotation.y += orbit.rotationSpeed.y;
            meshRef.current.rotation.z += orbit.rotationSpeed.z;
        }
    });

    return (
        <mesh ref={meshRef} scale={[orbit.scale, orbit.scale, orbit.scale]}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#555" roughness={0.9} />
        </mesh>
    );
};

const ShiningStar = ({ position, color = "#ffffff", scale = 1 }: { position: [number, number, number], color?: string, scale?: number }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [randomOffset] = useState(() => Math.random() * 100);

    useFrame(({ clock }) => {
        if (meshRef.current) {
            const t = clock.getElapsedTime() + randomOffset;
            const s = scale + Math.sin(t * 3) * (scale * 0.2); // Faster pulse
            meshRef.current.scale.set(s, s, s);
        }
    });

    return (
        <group position={position}>
            <mesh ref={meshRef}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} toneMapped={false} />
            </mesh>
            <pointLight distance={100} intensity={1.5} color={color} decay={2} />
        </group>
    );
};

const OrbitingSatellite = ({ radius, speed, offset }: { radius: number, speed: number, offset: number }) => {
    const groupRef = useRef<THREE.Group>(null);

    useFrame(({ clock }) => {
        if (groupRef.current) {
            const t = clock.getElapsedTime() * speed + offset;
            groupRef.current.position.x = Math.cos(t) * radius;
            groupRef.current.position.z = Math.sin(t) * radius;
            groupRef.current.rotation.y = -t; // Face direction of travel
        }
    });

    return (
        <group ref={groupRef}>
            <SatelliteModel />
        </group>
    );
};

// Generate Debris/Asteroids to fill space
const DebrisField = () => {
    const debrisCount = 1500;
    const debris = useMemo(() => {
        const temp = [];
        for (let i = 0; i < debrisCount; i++) {
            const progress = Math.random() * 100;
            const angle = progress * ANGLE_STEP + (Math.random() * Math.PI * 2);

            const radiusOffset = (Math.random() - 0.5) * 120;
            const r = SPIRAL_RADIUS + 20 + radiusOffset;

            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            const z = -(progress * LEVEL_DISTANCE_Z);

            const scale = Math.random() * 1.5 + 0.2;

            temp.push({ position: [x, y, z], scale });
        }
        return temp;
    }, []);

    return (
        <Instances range={debrisCount}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#333" roughness={0.8} />
            {debris.map((data, i) => (
                <Instance key={i} position={data.position as [number, number, number]} scale={data.scale} />
            ))}
        </Instances>
    );
};

// Wrapper to rotate the entire environment/galaxy background
const RotatingGalaxy = () => {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (groupRef.current) {
            // Background rotation
            groupRef.current.rotation.y += delta * 0.02;
            groupRef.current.rotation.z += delta * 0.005;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Deep Space Background Stars - Base layer */}
            <Stars radius={2000} depth={500} count={20000} factor={4} saturation={1} fade speed={1} />

            {/* Diverse Sparkle Layers for "Shining" effect */}

            {/* 1. Small Distant White Stars (High density) */}
            <Sparkles count={5000} scale={3000} size={2} speed={0.2} opacity={0.8} color="#ffffff" noise={50} />

            {/* 2. Medium Cyan Glow (Nebula feel) */}
            <Sparkles count={2000} scale={2500} size={10} speed={0.4} opacity={0.5} color="#00f0ff" noise={100} />

            {/* 3. Large Purple/Pink Ambient Stars */}
            <Sparkles count={1000} scale={2500} size={25} speed={0.3} opacity={0.4} color="#ff00aa" noise={200} />

            {/* 4. Bright Gold/Orange Emphasis Stars */}
            <Sparkles count={500} scale={2000} size={15} speed={0.1} opacity={0.9} color="#ffd700" />

            {/* 5. Extra Large "Near" Stars (Parallax feel) */}
            <Sparkles count={100} scale={1500} size={50} speed={0.5} opacity={1} color="#ffffff" />

            {/* 6. Rare Red/Blue Giants */}
            <Sparkles count={50} scale={2000} size={80} speed={0.2} opacity={0.6} color="#ff4400" />
            <Sparkles count={50} scale={2000} size={80} speed={0.2} opacity={0.6} color="#4400ff" />

            {/* Dynamic Elements - Big Rocks */}
            <OrbitingRock />
            <OrbitingRock />
            <OrbitingRock />
            <OrbitingRock />
            <OrbitingRock />
            <OrbitingRock />
            {/* The Mighty Space Sheep */}
            <SpaceSheep />

            <DebrisField />
        </group>
    );
};

const LEVEL_NAMES: Record<number, string> = {
    1: "Ignition", 2: "Thrusters", 3: "Liftoff", 4: "Atmosphere", 5: "Orbit",
    6: "Stabilize", 7: "Docking", 8: "Airlock", 9: "Zero-G", 10: "Command",
    11: "Memory", 12: "Pointer", 13: "Stack", 14: "Heap", 15: "Buffer",
    16: "Overflow", 17: "Leak", 18: "Garbage", 19: "Reference", 20: "Segfault",
    26: "Loop", 27: "Iterate", 28: "Recurse", 29: "Break", 30: "Continue",
    51: "Struct", 52: "Union", 53: "Enum", 54: "Typedef", 55: "Algorithm"
};

// Generate 100 Levels in a Helix/Spiral
const generateLevels = () => {
    const levels = [];

    for (let i = 1; i <= 100; i++) {
        const angle = i * ANGLE_STEP;
        const x = Math.cos(angle) * SPIRAL_RADIUS;
        const y = Math.sin(angle) * SPIRAL_RADIUS;
        const z = -(i * LEVEL_DISTANCE_Z);

        const type = i % 5 === 0 ? "planet" : "station";
        const name = LEVEL_NAMES[i] || `Sector ${Math.ceil(i / 10)} Node ${i % 10 || 10}`;

        const colors = ["#00f0ff", "#7000ff", "#ff003c", "#ffd700", "#00ff88"];
        const color = colors[i % colors.length];

        levels.push({
            id: i,
            position: [x, y, z] as [number, number, number],
            title: `${i}. ${name}`,
            type,
            scale: type === "planet" ? 6.0 : 3.0,
            color,
        });
    }
    return levels;
};

const LEVELS = generateLevels();



// Solar System Model Component
const SolarSystem = () => {
    const { scene } = useGLTF("/sol.glb");
    const meshRef = useRef<THREE.Group>(null);
    const { camera } = useThree();

    // Clone scene to avoid mutation issues if reused
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    useFrame((state, delta) => {
        if (meshRef.current) {
            // Position relative to camera (Top-Left)
            // Brought closer to center and camera to ensure visibility
            const offset = new THREE.Vector3(-40, 25, -100);

            offset.applyQuaternion(camera.quaternion);
            const targetPos = camera.position.clone().add(offset);

            meshRef.current.position.copy(targetPos);

            // Rotate the solar system slowly
            meshRef.current.rotation.y += delta * 0.1; // Increased speed for visibility
        }
    });

    return (
        <group ref={meshRef} scale={[25, 25, 25]}> {/* Slightly larger */}
            <primitive object={clonedScene} />
            {/* Add a light source from the sun model's position */}
            <pointLight intensity={3} distance={2000} decay={1} color="#ffaa00" position={[0, 0, 0]} />
        </group>
    );
};

function LevelNode({ level, onClick }: { level: any; onClick: (id: number) => void }) {
    const { sectors, highestCompletedLevel } = useGame();
    const [hovered, setHovered] = useState(false);
    const meshRef = useRef<THREE.Mesh>(null);

    // 1. Sector Check
    const currentSector = sectors.find(s => level.id >= s.startLevel && level.id <= s.endLevel);
    const isSectorUnlocked = currentSector ? currentSector.unlocked : false;

    // 2. Sequential Check: Must have completed previous level (or be Level 1)
    const isSequentialUnlocked = level.id === 1 || level.id <= highestCompletedLevel + 1;

    // Final Unlock Status
    const isUnlocked = isSectorUnlocked && isSequentialUnlocked;

    // Status Text logic
    let statusText = "Locked";
    let statusColor = "text-red-500";

    if (!isSectorUnlocked) {
        statusText = "Sector Locked";
    } else if (!isSequentialUnlocked) {
        statusText = "Complete Previous";
    } else {
        statusText = "Mission Ready";
        statusColor = "text-cyan-400";
    }

    useEffect(() => {
        if (hovered && isUnlocked) {
            document.body.style.cursor = "pointer";
        } else {
            document.body.style.cursor = "auto";
        }
        return () => {
            document.body.style.cursor = "auto";
        };
    }, [hovered, isUnlocked]);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.002;
            meshRef.current.rotation.z += 0.001;

            const targetScale = hovered ? level.scale * 1.1 : level.scale;
            meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        }
    });

    const handleClick = () => {
        if (isUnlocked) {
            onClick(level.id);
        } else if (!isSectorUnlocked) {
            alert(`Sector Locked! Purchase ${currentSector?.name} access in the Store.`);
        } else if (!isSequentialUnlocked) {
            alert(`Level Locked! Complete Level ${level.id - 1} first.`);
        }
    };

    return (
        <group position={level.position}>
            <Float speed={1} rotationIntensity={0.2} floatIntensity={0.2}>
                <mesh
                    ref={meshRef}
                    onClick={handleClick}
                    onPointerOver={() => setHovered(true)}
                    onPointerOut={() => setHovered(false)}
                >
                    {level.type === "planet" ? (
                        <sphereGeometry args={[1, 64, 64]} />
                    ) : (
                        <octahedronGeometry args={[1, 0]} />
                    )}
                    <meshStandardMaterial
                        color={isUnlocked ? level.color : "#1a1a1a"}
                        emissive={isUnlocked ? level.color : "#000000"}
                        emissiveIntensity={hovered && isUnlocked ? 0.8 : 0.1}
                        roughness={0.4}
                        metalness={0.7}
                        wireframe={true} // WIREFRAME MODE ENABLED FOR ALL
                    />
                </mesh>
            </Float>

            <Html distanceFactor={40}>
                <div
                    className={`pointer-events-none transition-all duration-300 ${hovered ? "opacity-100 scale-100" : "opacity-0 scale-90"
                        }`}
                >
                    {/* Tooltip Clamped Closer: -translate-y-[60%] */}
                    <div className="bg-black/80 backdrop-blur-md border border-white/10 p-3 rounded-lg min-w-[180px] text-center transform -translate-x-1/2 -translate-y-[20%]">
                        <h3 className={`font-bold text-lg mb-1 ${isUnlocked ? 'text-white' : 'text-white/40'}`}>
                            {level.title}
                        </h3>
                        {currentSector && (
                            <div className="text-[10px] text-white/40 mb-1 uppercase tracking-wide">{currentSector.name}</div>
                        )}
                        <div className={`text-[10px] uppercase tracking-widest ${statusColor}`}>
                            {statusText}
                        </div>
                    </div>
                </div>
            </Html>

            <Text
                position={[0, -level.scale * 0.8, 0]}
                fontSize={3}
                color={isUnlocked ? "white" : "gray"}
                anchorX="center"
                anchorY="top"
                fillOpacity={isUnlocked ? 0.3 : 0.05}
            >
                {`${level.id}`}
            </Text>
        </group>
    );
}

function PathConnection() {
    const points = useMemo(() => LEVELS.map((l) => new THREE.Vector3(...l.position)), []);

    return (
        <Line
            points={points}
            color="#ffffff"
            opacity={0.05}
            transparent
            lineWidth={2}
        />
    );
}

function MapController() {
    const scroll = useScroll();
    const { camera } = useThree();

    // Spacebar Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === "Space") {
                const totalLevels = LEVELS.length;
                const currentLevel = Math.round(scroll.offset * totalLevels);
                const nextLevel = Math.min(currentLevel + 1, totalLevels - 1);
                const nextScroll = nextLevel / totalLevels;

                const el = scroll.el;
                const targetScrollTop = nextScroll * (el.scrollHeight - el.clientHeight);

                el.scrollTo({
                    top: targetScrollTop,
                    behavior: 'smooth'
                });
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [scroll]);

    useFrame(() => {
        const totalLevels = LEVELS.length;
        const currentLevelIndex = scroll.offset * totalLevels;

        const angle = currentLevelIndex * ANGLE_STEP;
        const z = -(currentLevelIndex * LEVEL_DISTANCE_Z);

        // Camera follow logic
        const cameraAngle = angle - 0.4;
        const cameraZ = z + 40; // Further back to see big planets

        const camX = Math.cos(cameraAngle) * (SPIRAL_RADIUS + 15);
        const camY = Math.sin(cameraAngle) * (SPIRAL_RADIUS + 15);

        camera.position.lerp(new THREE.Vector3(camX, camY, cameraZ), 0.1);

        const lookAtAngle = angle + 0.8;
        const lookAtZ = z - 50;
        const lookAtX = Math.cos(lookAtAngle) * SPIRAL_RADIUS;
        const lookAtY = Math.sin(lookAtAngle) * SPIRAL_RADIUS;

        camera.lookAt(lookAtX, lookAtY, lookAtZ);
        camera.rotation.z += 0.0005;
    });

    return null;
}

export default function MissionMap3D() {
    const router = useRouter();

    const handleLevelSelect = (id: number) => {
        router.push(`/level/${id}`);
    };

    return (
        <div className="w-full h-screen bg-black relative">
            <Canvas camera={{ position: [0, 0, 40], fov: 50, far: 4000 }}>
                <Suspense fallback={null}>
                    <ambientLight intensity={0.2} />
                    <pointLight position={[10, 10, 10]} intensity={1.5} />

                    {/* Rotating Galactic Background with Visuals */}
                    <RotatingGalaxy />

                    {/* Fixed Logic Elements */}
                    <SolarSystem />

                    <ScrollControls pages={30} damping={0.3}>
                        <MapController />
                        <PathConnection />
                        {LEVELS.map((level) => (
                            <LevelNode key={level.id} level={level} onClick={handleLevelSelect} />
                        ))}
                    </ScrollControls>

                    <Environment preset="city" />
                </Suspense>
            </Canvas>

            <div className="absolute top-8 left-0 right-0 text-center pointer-events-none z-10">
                <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 drop-shadow-lg tracking-widest">
                    MISSION MAP
                </h1>
                <p className="text-cyan-400/60 font-mono text-sm mt-2">PRESS SPACE TO JUMP TO NEXT SECTOR</p>
            </div>

            <div className="absolute bottom-8 right-8 pointer-events-none animate-bounce">
                <div className="text-white/40 text-xs font-mono">SCROLL ▼</div>
            </div>
        </div>
    );
}
