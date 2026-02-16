"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, Sparkles, Stars, PerspectiveCamera, OrbitControls, Text, Float, CameraShake, Center, Html } from "@react-three/drei";
import { useRef, useEffect, useState, useMemo } from "react";
import * as THREE from "three";
import { useGame } from "@/components/providers/GameProvider";
import { useGraphics } from "@/components/providers/GraphicsProvider";
import SimpleRover from "./SimpleRover";

// --- Types ---
export type Command =
    | { type: "MOVE", value: number }
    | { type: "TURN", value: number } // Degrees
    | { type: "COLLECT" }
    | { type: "SCAN" };

export interface PlaygroundSceneProps {
    commandQueue: Command[];
    isPlaying: boolean;
    onComplete: () => void;
    onCollect: (item: string) => void;
    onCrash: () => void;
    resetTrigger: number;
    // Multiplayer props
    isMultiplayer?: boolean;
    allPlayers?: Array<{
        id: string;
        name: string;
        color: string;
        commands: Command[];
        position?: [number, number, number];
        rotation?: number;
    }>;
    currentPlayerId?: string;
    satellitePosition?: [number, number, number];
    onPlayerReachedSatellite?: () => void;
    onPositionUpdate?: (position: [number, number, number], rotation: number) => void;
}

// --- Constants ---
const MOON_SIZE = 50;
const ROVER_SPEED = 15; // Decreased speed (was 30)
const TURN_SPEED = 5;
const BOUNDARY_SIZE = 100; // Boundary limits: ±100 units from origin

// --- Camera Rig for Following Rover ---
// --- Camera Rig for Following Rover ---
// --- Camera Rig for Following Rover ---
function CameraRig({ targetPos }: { targetPos: [number, number, number] }) {
    const controlsRef = useRef<any>(null);
    const vec = useRef(new THREE.Vector3());

    useFrame((state, delta) => {
        if (controlsRef.current) {
            const controls = controlsRef.current;
            const camera = controls.object;

            // 1. Get the current offset (User's Orbit/Zoom)
            // vector from Target -> Camera
            vec.current.subVectors(camera.position, controls.target);

            // 2. Move the target to the Rover's position
            // We use a small lerp for the target to smooth out jitter, but it's fast
            const newTargetX = THREE.MathUtils.lerp(controls.target.x, targetPos[0], 0.2);
            const newTargetZ = THREE.MathUtils.lerp(controls.target.z, targetPos[2], 0.2);

            controls.target.set(newTargetX, 0, newTargetZ);

            // 3. Apply the offset to the new target position to move the camera
            camera.position.addVectors(controls.target, vec.current);

            controls.update();
        }
    });

    return (
        <OrbitControls
            ref={controlsRef}
            enableZoom={true}
            enablePan={false}
            maxPolarAngle={Math.PI / 2.05} // Prevent going below ground
            minDistance={5}
            maxDistance={80}
        />
    );
}

export default function PlaygroundScene({
    commandQueue,
    isPlaying,
    onComplete,
    onCollect,
    onCrash,
    resetTrigger,
    isMultiplayer = false,
    allPlayers = [],
    currentPlayerId,
    satellitePosition: multiplayerSatellitePos,
    onPlayerReachedSatellite,
    onPositionUpdate
}: PlaygroundSceneProps) {
    // Calculate parallel starting positions for multiplayer
    const getStartingPosition = (playerIndex: number, totalPlayers: number): [number, number, number] => {
        if (!isMultiplayer || totalPlayers <= 1) return [0, 0, 0];

        // Spread players in a line, 5 units apart
        const spacing = 5;
        const totalWidth = (totalPlayers - 1) * spacing;
        const startX = -totalWidth / 2;
        const x = startX + (playerIndex * spacing);

        return [x, 0, 0];
    };

    const currentPlayerIndex = allPlayers.findIndex(p => p.id === currentPlayerId);
    const initialPosition = getStartingPosition(currentPlayerIndex, allPlayers.length);

    const [roverPos, setRoverPos] = useState<[number, number, number]>(initialPosition);
    const [roverRot, setRoverRot] = useState(Math.PI); // Start facing -Z (Away from camera)
    const [shakeIntensity, setShakeIntensity] = useState(0);

    // --- GAME STATE ---
    const { addCredits, updateStats } = useGame();
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [satellitesFound, setSatellitesFound] = useState(0);

    // Use multiplayer satellite position if available, otherwise generate random
    const [satellitePos, setSatellitePos] = useState<[number, number, number]>(
        multiplayerSatellitePos || [0, 5, -30]
    );

    // Update satellite position when multiplayer position changes
    useEffect(() => {
        if (multiplayerSatellitePos) {
            setSatellitePos(multiplayerSatellitePos);
        }
    }, [multiplayerSatellitePos]);

    // Reset rover position when resetTrigger or player index changes
    useEffect(() => {
        const newPos = getStartingPosition(currentPlayerIndex, allPlayers.length);
        setRoverPos(newPos);
        setRoverRot(Math.PI);
    }, [resetTrigger, currentPlayerIndex, allPlayers.length]);

    const respawnSatellite = () => {
        // Don't respawn in multiplayer mode - server handles it
        if (isMultiplayer) return;

        // Range increases with level
        const range = 50 + (level * 20);
        const angle = Math.random() * Math.PI * 2;
        const dist = 50 + Math.random() * range;
        const x = Math.sin(angle) * dist;
        const z = Math.cos(angle) * dist;
        setSatellitePos([x, 5, z]);
    };


    // Generate random rocks/collectibles
    const rocks = useMemo(() => {
        const items = [
            { id: "rock_loop", type: "For Loop Crystal", color: "#a855f7", x: 10, z: 10 },
            { id: "rock_if", type: "Conditional Shard", color: "#3b82f6", x: -15, z: 5 },
            { id: "rock_func", type: "Function Artifact", color: "#22c55e", x: 5, z: -20 },
            { id: "rock_var", type: "Variable Geode", color: "#eab308", x: -10, z: -10 },
            { id: "rock_arr", type: "Array Monolith", color: "#ef4444", x: 20, z: 0 },
        ];
        return items;
    }, []);

    // Generate hazards (New Feature)
    const hazards = useMemo(() => [
        { id: "trap_1", x: 5, z: 5 },
        { id: "trap_2", x: -10, z: 15 },
        { id: "trap_3", x: 15, z: -10 },
        { id: "trap_4", x: -5, z: -25 },
        { id: "trap_5", x: 25, z: 20 },
    ], []);

    const [collected, setCollected] = useState<string[]>([]);
    const [crashed, setCrashed] = useState(false);

    useEffect(() => {
        // Reset Logic
        setRoverPos([0, 0, 0]);
        setRoverRot(Math.PI);
        setCollected([]);
        setCrashed(false);
        setShakeIntensity(0);

        // Reset Game
        setLevel(1);
        setScore(0);
        setSatellitesFound(0);
        setSatellitePos([0, 5, -30]);
    }, [resetTrigger]);

    // --- Graphics Settings ---
    const { quality, shadows, resolution, particleCount } = useGraphics();

    return (
        <div className="w-full h-full bg-black rounded-lg overflow-hidden border border-white/10 relative">
            <Canvas shadows={shadows} dpr={[1, resolution]}> {/* dpr for sharper rendering */}
                {/* Camera Rig that maps OrbitControls target to Rover */}
                <CameraRig targetPos={roverPos} />
                <PerspectiveCamera makeDefault position={[0, 3, 12]} fov={60} />

                <CameraShake
                    maxYaw={0.05 * shakeIntensity}
                    maxPitch={0.05 * shakeIntensity}
                    maxRoll={0.05 * shakeIntensity}
                    yawFrequency={10 * shakeIntensity}
                    pitchFrequency={10 * shakeIntensity}
                    rollFrequency={10 * shakeIntensity}
                    intensity={1}
                    decay={true}
                    decayRate={0.65}
                />

                {/* Lights */}
                <ambientLight intensity={0.3} />
                <directionalLight
                    position={[50, 50, 25]}
                    intensity={2}
                    castShadow={shadows}
                    shadow-mapSize={[2048, 2048]}
                />
                <pointLight position={[0, 5, 0]} intensity={1} color="#06b6d4" distance={30} />
                {/* Dramatic Rim Light */}
                <spotLight position={[-50, 20, -50]} intensity={5} color="#a855f7" angle={0.5} penumbra={1} />

                {/* Environment - Glowing Stars */}
                <Stars radius={300} depth={100} count={quality === 'low' ? 500 : 2000} factor={6} saturation={0} fade speed={1} />
                <Sparkles size={6} scale={[200, 50, 200]} count={quality === 'low' ? 10 : 50} speed={0.5} opacity={0.6} color="#ffffff" />
                <fog attach="fog" args={['#050505', 10, 120]} />

                {/* --- HUD SCOREBOARD --- */}
                <Html fullscreen>
                    <div className="absolute top-8 left-8 text-cyan-400 font-mono pointer-events-none">
                        <div className="bg-black/80 p-4 rounded-lg border border-cyan-500/30 backdrop-blur-sm">
                            <h2 className="text-xl font-bold mb-3 text-lime-400">SATELLITE INTERCEPT</h2>
                            <div className="space-y-1 text-sm">
                                <p>LEVEL: <span className="text-white font-bold">{level}</span></p>
                                <p>CREDITS EARNED: <span className="text-lime-400 font-bold">+{score}</span></p>
                                <p>SATELLITES FOUND: <span className="text-cyan-300 font-bold">{satellitesFound}</span></p>
                                <p className="mt-3 text-xs text-gray-400">
                                    {satellitesFound === 0 ? "LOCATE THE SATELLITE SIGNAL" : "TARGET ACQUIRED - SEARCHING..."}
                                </p>
                            </div>
                        </div>
                    </div>
                </Html>

                {/* Satellite */}
                <Satellite position={satellitePos} />

                {/* Surface */}
                <MoonSurface />

                {/* Hazards */}
                {hazards.map(trap => (
                    <Hazard key={trap.id} x={trap.x} z={trap.z} />
                ))}

                {/* The Rover Controller */}
                {!crashed && (
                    <RoverController
                        position={roverPos}
                        rotation={roverRot}
                        commandQueue={commandQueue}
                        isPlaying={isPlaying}
                        onUpdate={(pos: [number, number, number], rot: number, isMoving: boolean) => {
                            setRoverPos(pos);
                            setRoverRot(rot);
                            setShakeIntensity(isMoving ? 0.2 : 0);
                            if (onPositionUpdate) onPositionUpdate(pos, rot);
                        }}
                        onComplete={onComplete}
                        onPositionUpdate={onPositionUpdate}
                        onCheckCollisions={(pos: number[]) => {
                            // Check Boundaries (Crash if out of bounds)
                            if (Math.abs(pos[0]) > BOUNDARY_SIZE || Math.abs(pos[2]) > BOUNDARY_SIZE) {
                                setCrashed(true);
                                onCrash();
                                setShakeIntensity(5);
                                return; // Stop checking other collisions
                            }

                            // Check Collectibles
                            rocks.forEach(rock => {
                                if (collected.includes(rock.id)) return;
                                const dx = pos[0] - rock.x;
                                const dz = pos[2] - rock.z;
                                if (Math.abs(dx) < 2.5 && Math.abs(dz) < 2.5) {
                                    onCollect(rock.type);
                                    setCollected(prev => [...prev, rock.id]);
                                    setShakeIntensity(1.5); // Big shake on collect
                                }
                            });

                            // Check Hazards (Collision leads to crash)
                            hazards.forEach(trap => {
                                const dx = pos[0] - trap.x;
                                const dz = pos[2] - trap.z;
                                if (Math.abs(dx) < 2 && Math.abs(dz) < 2) {
                                    setCrashed(true);
                                    onCrash();
                                    setShakeIntensity(5); // Massive shake on crash
                                }
                            });

                            // Check Satellite (Win Condition)
                            const dsx = pos[0] - satellitePos[0];
                            const dsz = pos[2] - satellitePos[2];
                            if (Math.abs(dsx) < 5 && Math.abs(dsz) < 5) {
                                // SATELLITE FOUND!
                                const reward = 100 * level;
                                setScore(s => s + reward);
                                setLevel(l => l + 1);
                                setSatellitesFound(count => count + 1);
                                setShakeIntensity(2);

                                // Update database
                                addCredits(reward);
                                updateStats('logic', 2); // Improve logic skill

                                respawnSatellite();
                            }
                        }}
                    />
                )}

                {/* Other Players' Rovers (Multiplayer) */}
                {isMultiplayer && allPlayers.map(player => {
                    // Don't render the current player's rover here (it's rendered above)
                    if (player.id === currentPlayerId) return null;

                    // Calculate starting position for this player
                    const playerIndex = allPlayers.findIndex(p => p.id === player.id);
                    const startPos = getStartingPosition(playerIndex, allPlayers.length);

                    return (
                        <OtherPlayerRover
                            key={player.id}
                            playerName={player.name}
                            color={player.color}
                            position={player.position || startPos}
                            rotation={player.rotation || Math.PI}
                        />
                    );
                })}

                {/* Rocks/Collectibles */}
                {rocks.map(rock => !collected.includes(rock.id) && (
                    <Collectible key={rock.id} {...rock} />
                ))}

                {/* Boundary Walls */}
                <BoundaryWalls />

            </Canvas>
        </div>
    );
}

function MoonSurface() {
    const { quality } = useGraphics();

    // Load the moon surface model ONLY if not low quality
    // We can't conditionally call useGLTF easily inside a hook if we want to follow rules of hooks perfectly
    // but we can just return early if quality is low, effectively skipping the heavy render, 
    // though the hook might still preload. 
    // actually useGLTF might suspend. 
    // Better: split into two components or just let it load but don't render it? 
    // If we want to save memory we should not load it. 
    // But hooks order... 
    // Let's us a separate component for the HighQualitySurface

    return quality === 'low' ? (
        <group position={[0, -0.5, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -5, 0]}>
                <planeGeometry args={[WIRE_SIZE * 3, WIRE_SIZE * 3, 32, 32]} />
                <meshStandardMaterial color="#222" wireframe={true} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -5.1, 0]}>
                <planeGeometry args={[WIRE_SIZE * 3, WIRE_SIZE * 3]} />
                <meshStandardMaterial color="#000" />
            </mesh>
        </group>
    ) : (
        <HighQualityMoonSurface />
    );
}

const WIRE_SIZE = 1500;

function HighQualityMoonSurface() {
    const { scene } = useGLTF("/moon.glb");

    // Clone logic with material fix and error handling
    const model = useMemo(() => {
        try {
            const c = scene.clone();
            c.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    const m = child as THREE.Mesh;
                    m.receiveShadow = true;
                    if (m.material) {
                        const mats = Array.isArray(m.material) ? m.material : [m.material];
                        mats.forEach((mat) => {
                            if ((mat as THREE.MeshStandardMaterial).map) {
                                const texture = (mat as THREE.MeshStandardMaterial).map!;
                                texture.wrapS = THREE.RepeatWrapping;
                                texture.wrapT = THREE.RepeatWrapping;
                                texture.repeat.set(300, 300); // Higher tiling for larger scale
                                texture.anisotropy = 16;
                                texture.needsUpdate = true;
                            }
                            // Increase roughness for moon dust look
                            (mat as THREE.MeshStandardMaterial).roughness = 0.8;
                        });
                    }

                    // Preserve original material if possible, or force standard if needed
                    // For now, let's keep original if it exists, else fallback
                    if (!m.material) {
                        m.material = new THREE.MeshStandardMaterial({
                            color: "#888888",
                            roughness: 0.9,
                            metalness: 0.1,
                            side: THREE.DoubleSide,
                        });
                    }
                }
            });
            return c;
        } catch (e) {
            console.error("Error cloning moon surface", e);
            return null;
        }
    }, [scene]);

    // Large scale to make surface appear flat (less curvature visible)
    const SCALE = 3000;

    return (
        <group position={[0, -0.5, 0]}> {/* Shift slightly down so wheels touch */}
            <Center top>
                {model && (
                    <primitive
                        object={model}
                        scale={[SCALE, SCALE, SCALE]}
                    />
                )}
            </Center>

            {/* Fallback Grid / Base Layer - Only visible if model fails (pushed down) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -5, 0]}>
                <planeGeometry args={[MOON_SIZE * 3, MOON_SIZE * 3, 64, 64]} />
                <meshStandardMaterial color="#050505" />
            </mesh>
        </group>
    );
}

interface RoverControllerProps {
    position: [number, number, number];
    rotation: number;
    commandQueue: Command[];
    isPlaying: boolean;
    onUpdate: (pos: [number, number, number], rot: number, isMoving: boolean) => void;
    onComplete: () => void;
    onCheckCollisions: (pos: number[]) => void;
    onPositionUpdate?: (position: [number, number, number], rotation: number) => void;
}

// --- Other Player Rover (Simple representation) ---
// --- Other Player Rover (Real 3D Model) ---
function OtherPlayerRover({
    playerName,
    color,
    position,
    rotation
}: {
    playerName: string;
    color: string;
    position: [number, number, number];
    rotation: number;
}) {
    const { scene } = useGLTF("/mars_rover.glb");

    // Clone the model for each player instance
    const clonedScene = useMemo(() => {
        const c = scene.clone();
        c.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const m = child as THREE.Mesh;
                m.castShadow = true;
                m.receiveShadow = true;
            }
        });
        return c;
    }, [scene]);

    return (
        <group position={position} rotation={[0, rotation, 0]}>
            <group position={[0, 0.2, 0]}>
                {/* Rotate model 90 deg (positive) to align X-axis model with Z-axis movement, same as local rover */}
                <primitive object={clonedScene} scale={[0.5, 0.5, 0.5]} rotation={[0, Math.PI / 2, 0]} />

                {/* Player name label */}
                <Html position={[0, 1.8, 0]} center>
                    <div className="bg-black/80 px-2 py-1 rounded text-white text-xs font-bold border border-white/30"
                        style={{ color: color, whiteSpace: 'nowrap' }}>
                        {playerName}
                    </div>
                </Html>

                {/* Colored glow to identify different players */}
                <pointLight position={[0, 0.5, 0]} intensity={3} color={color} distance={6} />
                <Sparkles count={10} scale={[2, 2, 2]} position={[0, 0.5, 0]} size={2} speed={1} opacity={0.5} color={color} />
            </group>
        </group>
    );
}

// --- Rover Controller (Main Player) ---
function RoverController({ position, rotation, commandQueue, isPlaying, onUpdate, onComplete, onCheckCollisions, onPositionUpdate }: RoverControllerProps) {
    const roverRef = useRef<THREE.Group>(null);
    const cmdIndex = useRef(0);
    const progress = useRef(0); // 0 to 1 for current command
    const startPos = useRef(new THREE.Vector3(0, 0, 0));
    const startRot = useRef(0);
    const targetPos = useRef(new THREE.Vector3(0, 0, 0));
    const targetRot = useRef(0);

    const { quality } = useGraphics();

    // Ref to avoid stale closure in useFrame
    const onCheckCollisionsRef = useRef(onCheckCollisions);
    useEffect(() => { onCheckCollisionsRef.current = onCheckCollisions; }, [onCheckCollisions]);

    // Reset execution state when commandQueue or isPlaying changes
    useEffect(() => {
        if (isPlaying && commandQueue.length > 0) {
            cmdIndex.current = 0;
            progress.current = 0;
        }
    }, [commandQueue, isPlaying]);

    // Rover Model
    const { scene } = useGLTF("/mars_rover.glb"); // Reuse existing model
    const clonedScene = useMemo(() => scene.clone(), [scene]);

    useFrame((state, delta) => {
        if (!isPlaying || !commandQueue.length || cmdIndex.current >= commandQueue.length) {
            // Idle hover/engine rumble effect
            if (roverRef.current) {
                roverRef.current.position.y = 0.2 + Math.sin(state.clock.elapsedTime * 5) * 0.02;
            }
            return;
        }

        const cmd = commandQueue[cmdIndex.current];

        // Initialize Command
        if (progress.current === 0) {
            startPos.current.set(position[0], position[1], position[2]);
            startRot.current = rotation;

            if (cmd.type === "MOVE") {
                // Calculate target based on current rotation
                const dist = cmd.value;
                const dx = Math.sin(rotation) * dist;
                const dz = Math.cos(rotation) * dist;
                targetPos.current.set(position[0] + dx, 0, position[2] + dz);
            } else if (cmd.type === "TURN") {
                const rads = (cmd.value * Math.PI) / 180;
                targetRot.current = rotation + rads; // Counter-clockwise usually, but check coord sys
            } else if (cmd.type === "COLLECT" || cmd.type === "SCAN") {
                // Instant action for now, or short pause
                onCheckCollisionsRef.current([position[0], position[1], position[2]]);
            }
        }


        // Animate
        let finished = false;
        let isMoving = false;

        if (cmd.type === "MOVE") {
            isMoving = true;
            const speed = ROVER_SPEED * delta;
            const dist = startPos.current.distanceTo(targetPos.current);
            // Ensure we don't get Stuck if dist is 0
            if (dist < 0.01) {
                finished = true;
            } else {
                progress.current += (ROVER_SPEED * delta) / Math.max(0.1, Math.abs(cmd.value));
                if (progress.current >= 1) {
                    progress.current = 1;
                    finished = true;
                }
                const currentX = THREE.MathUtils.lerp(startPos.current.x, targetPos.current.x, progress.current);
                const currentZ = THREE.MathUtils.lerp(startPos.current.z, targetPos.current.z, progress.current);

                // BOUNDARY COLLISION DETECTION
                if (Math.abs(currentX) > BOUNDARY_SIZE || Math.abs(currentZ) > BOUNDARY_SIZE) {
                    // Hit boundary - trigger crash
                    onCheckCollisionsRef.current([currentX, 0, currentZ]);
                    finished = true; // Stop execution
                } else {
                    if (roverRef.current) {
                        roverRef.current.position.x = currentX;
                        roverRef.current.position.z = currentZ;
                        // Wiggle while moving (Engine vibration)
                        roverRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 20) * 0.02;
                    }
                    onUpdate([currentX, 0, currentZ], rotation, true);

                    // Check collisions continuously while moving
                    onCheckCollisionsRef.current([currentX, 0, currentZ]);
                }
            }


        } else if (cmd.type === "TURN") {
            const totalRot = targetRot.current - startRot.current;
            const duration = Math.abs(totalRot) / TURN_SPEED;
            progress.current += delta / Math.max(0.01, duration); // Fix divide by zero risk

            if (progress.current >= 1) {
                progress.current = 1;
                finished = true;
            }

            const currentRot = THREE.MathUtils.lerp(startRot.current, targetRot.current, progress.current);
            if (roverRef.current) {
                roverRef.current.rotation.y = currentRot;
                // Bank into turn
                roverRef.current.rotation.z = (totalRot > 0 ? -1 : 1) * 0.1 * Math.sin(progress.current * Math.PI);
            }
            onUpdate(position, currentRot, true);

        } else {
            finished = true;
        }

        if (finished) {
            cmdIndex.current++;
            progress.current = 0;
            // Stop shake
            onUpdate(position, rotation, false);
            if (roverRef.current) roverRef.current.rotation.z = 0;

            if (cmdIndex.current >= commandQueue.length) {
                onComplete();
            }
        }
    });

    // Initial positioning
    useEffect(() => {
        if (roverRef.current && progress.current === 0 && cmdIndex.current === 0) {
            roverRef.current.position.set(position[0], position[1], position[2]);
            roverRef.current.rotation.y = rotation;
        }
    }, [position, rotation]);

    return (
        <group ref={roverRef} position={[0, 0.2, 0]}> {/* Lifted Rover slightly */}
            {quality === 'low' ? (
                <group rotation={[0, Math.PI, 0]}> {/* Rotate 180 to face forward correctly for SimpleRover */}
                    <SimpleRover />
                </group>
            ) : (
                <>
                    {/* Rotate model 90 deg (positive) to align X-axis model with Z-axis movement */}
                    <primitive object={clonedScene} scale={[0.5, 0.5, 0.5]} rotation={[0, Math.PI / 2, 0]} />

                    {/* Headlight */}
                    <spotLight position={[0, 1, 0.5]} target-position={[0, 0, 5]} angle={0.5} penumbra={0.5} intensity={8} distance={25} color="#ccffff" />

                    {/* Engine Glow */}
                    <pointLight position={[0, 0.5, -1]} intensity={2} color="#00ffff" distance={2} />
                    <Sparkles count={20} scale={[1, 1, 1]} position={[0, 0.2, -1.2]} size={2} speed={5} opacity={0.5} color="#00ffff" />
                </>
            )}
        </group>
    )
}

function Collectible({ type, color, x, z }: { type: string, color: string, x: number, z: number }) {
    const { scene } = useGLTF("/apollo_lunar_sample.glb");

    // Clone but KEEP ORIGINAL MATERIALS
    const clonedScene = useMemo(() => {
        const c = scene.clone();
        c.traverse(node => {
            if ((node as THREE.Mesh).isMesh) {
                const mesh = node as THREE.Mesh;
                mesh.castShadow = true;
                // DO NOT OVERRIDE MATERIAL HERE
            }
        });
        return c;
    }, [scene]);

    return (
        <group position={[x, 2, z]}> {/* Height 2.0 */}
            <Float
                speed={4}
                rotationIntensity={2}
                floatIntensity={2}
                floatingRange={[0, 2]}
            >
                <primitive object={clonedScene} scale={[50, 50, 50]} />
            </Float>
            <Sparkles count={30} scale={8} size={15} speed={0.8} opacity={1} color={color} />
            <pointLight distance={10} intensity={2} color={color} />
            <Text
                position={[0, 8, 0]}
                fontSize={0.6}
                color={color}
                anchorX="center"
                anchorY="middle"
                font="https://fonts.gstatic.com/s/orbitron/v25/yMJRMIlzdpvBhQQL_Qq7dys.woff"
                outlineWidth={0.05}
                outlineColor="#000000"
            >
                {type}
            </Text>
            {/* Base Ring */}
            <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1, 1.2, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>
        </group>
    )
}

function Hazard({ x, z }: { x: number, z: number }) {
    return (
        <group position={[x, 0.1, z]}>
            {/* Glitch Trap Visuals */}
            <Float speed={10} rotationIntensity={0} floatIntensity={0} floatingRange={[0, 0.5]}>
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[3, 3]} />
                    <meshBasicMaterial color="#ff0000" wireframe transparent opacity={0.3} />
                </mesh>
            </Float>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.5, 2, 6]} />
                <meshBasicMaterial color="#ff0000" transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>
            <Sparkles count={15} scale={[3, 2, 3]} size={10} speed={4} color="#ff0000" opacity={0.8} />
            <pointLight position={[0, 1, 0]} color="#ff0000" intensity={1} distance={5} />
            <Text position={[0, 3, 0]} fontSize={0.8} color="#ff0000" rotation={[0, Math.PI / 4, 0]}>DANGER</Text>
        </group>
    )
}

function Satellite({ position }: { position: [number, number, number] }) {
    const { scene } = useGLTF("/satelite.glb");

    // Clone and add GLOW effect
    const cloned = useMemo(() => {
        const c = scene.clone();
        c.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
                const m = child as THREE.Mesh;
                m.castShadow = true;
                if (m.material) {
                    (m.material as THREE.MeshStandardMaterial).emissive = new THREE.Color("lime");
                    (m.material as THREE.MeshStandardMaterial).emissiveIntensity = 2;
                }
            }
        });
        return c;
    }, [scene]);

    return (
        <group position={position}>
            <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                <primitive object={cloned} scale={[0.6, 0.6, 0.6]} />
                <pointLight color="red" distance={100} intensity={5} />
                <Sparkles count={20} color="red" scale={5} speed={2} />
            </Float>
            {/* Beacon Beam */}
            <mesh position={[0, 50, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 100, 8]} />
                <meshBasicMaterial color="lime" transparent opacity={0.3} />
            </mesh>
            <Text position={[0, 5, 0]} fontSize={1.5} color="lime">SATELLITE SIGNAL</Text>
        </group>
    );
}

function BoundaryWalls() {
    const wallHeight = 10;
    const wallThickness = 0.5;
    const glowColor = "#ff6b00";

    return (
        <group>
            {/* North Wall */}
            <group position={[0, wallHeight / 2, -BOUNDARY_SIZE]}>
                <mesh>
                    <boxGeometry args={[BOUNDARY_SIZE * 2, wallHeight, wallThickness]} />
                    <meshStandardMaterial
                        color={glowColor}
                        emissive={glowColor}
                        emissiveIntensity={0.5}
                        transparent
                        opacity={0.3}
                    />
                </mesh>
                <pointLight color={glowColor} intensity={2} distance={20} />
            </group>

            {/* South Wall */}
            <group position={[0, wallHeight / 2, BOUNDARY_SIZE]}>
                <mesh>
                    <boxGeometry args={[BOUNDARY_SIZE * 2, wallHeight, wallThickness]} />
                    <meshStandardMaterial
                        color={glowColor}
                        emissive={glowColor}
                        emissiveIntensity={0.5}
                        transparent
                        opacity={0.3}
                    />
                </mesh>
                <pointLight color={glowColor} intensity={2} distance={20} />
            </group>

            {/* East Wall */}
            <group position={[BOUNDARY_SIZE, wallHeight / 2, 0]}>
                <mesh>
                    <boxGeometry args={[wallThickness, wallHeight, BOUNDARY_SIZE * 2]} />
                    <meshStandardMaterial
                        color={glowColor}
                        emissive={glowColor}
                        emissiveIntensity={0.5}
                        transparent
                        opacity={0.3}
                    />
                </mesh>
                <pointLight color={glowColor} intensity={2} distance={20} />
            </group>

            {/* West Wall */}
            <group position={[-BOUNDARY_SIZE, wallHeight / 2, 0]}>
                <mesh>
                    <boxGeometry args={[wallThickness, wallHeight, BOUNDARY_SIZE * 2]} />
                    <meshStandardMaterial
                        color={glowColor}
                        emissive={glowColor}
                        emissiveIntensity={0.5}
                        transparent
                        opacity={0.3}
                    />
                </mesh>
                <pointLight color={glowColor} intensity={2} distance={20} />
            </group>

            {/* Corner Markers */}
            {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
                <group key={i} position={[x * BOUNDARY_SIZE, 0, z * BOUNDARY_SIZE]}>
                    <mesh position={[0, wallHeight / 2, 0]}>
                        <cylinderGeometry args={[1, 1, wallHeight, 8]} />
                        <meshStandardMaterial
                            color={glowColor}
                            emissive={glowColor}
                            emissiveIntensity={1}
                        />
                    </mesh>
                    <pointLight color={glowColor} intensity={5} distance={30} />
                    <Sparkles count={10} scale={3} size={5} speed={2} color={glowColor} />
                </group>
            ))}
        </group>
    );
}
