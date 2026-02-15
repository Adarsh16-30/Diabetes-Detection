"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

function Organ({ position, color, label, driftLevel, onClick }) {
    const meshRef = useRef();

    useFrame((state) => {
        if (!meshRef.current) return;
        // Pulse effect based on drift level
        const time = state.clock.getElapsedTime();
        const scale = 1 + Math.sin(time * 3) * (0.1 * (driftLevel + 0.1));
        meshRef.current.scale.set(scale, scale, scale);
    });

    return (
        <group position={position}>
            {/* The Organ Core */}
            <mesh ref={meshRef} onClick={onClick} castShadow>
                <sphereGeometry args={[0.2, 32, 32]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={driftLevel > 0.5 ? 2 : 0.5}
                    toneMapped={false}
                />
            </mesh>

            {/* Halo Effect if High Drift */}
            {driftLevel > 0.5 && (
                <mesh>
                    <sphereGeometry args={[0.3, 32, 32]} />
                    <meshBasicMaterial color={color} transparent opacity={0.3} />
                </mesh>
            )}

            {/* Label */}
            <Html distanceFactor={10}>
                <div className="bg-black/80 text-xs text-white px-2 py-1 rounded border border-white/20 backdrop-blur-sm whitespace-nowrap">
                    {label} <br /> ⚠️ {(driftLevel * 100).toFixed(0)}% Risk
                </div>
            </Html>
        </group>
    );
}

export default function HumanBody({ vitals, drifts, onOrganClick }) {
    return (
        <group position={[0, -1.5, 0]}>
            {/* --- Geometric Cyborg Body --- */}

            {/* Head */}
            <mesh position={[0, 3.8, 0]} castShadow>
                <boxGeometry args={[0.5, 0.6, 0.5]} />
                <meshStandardMaterial color="#222" roughness={0.3} metalness={0.8} />
            </mesh>

            {/* Neck */}
            <mesh position={[0, 3.4, 0]}>
                <cylinderGeometry args={[0.15, 0.15, 0.4, 16]} />
                <meshStandardMaterial color="#333" metalness={0.8} />
            </mesh>

            {/* Upper Torso (Chest) - Transparent for Heart/Lungs */}
            <mesh position={[0, 2.7, 0]}>
                <boxGeometry args={[1.0, 0.9, 0.6]} />
                <meshPhysicalMaterial
                    color="#e0f7fa"
                    transmission={0.6}
                    opacity={0.3}
                    roughness={0.1}
                    metalness={0.1}
                    thickness={1}
                    transparent
                />
            </mesh>

            {/* Spine/Core Connection */}
            <mesh position={[0, 2.0, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.6, 16]} />
                <meshStandardMaterial color="#333" metalness={0.8} />
            </mesh>

            {/* Lower Torso (Abdomen) - Transparent for Kidneys/Pancreas */}
            <mesh position={[0, 1.4, 0]}>
                <boxGeometry args={[0.8, 0.8, 0.5]} />
                <meshPhysicalMaterial
                    color="#e0f7fa"
                    transmission={0.6}
                    opacity={0.3}
                    roughness={0.1}
                    metalness={0.1}
                    thickness={1}
                    transparent
                />
            </mesh>

            {/* Shoulders */}
            <mesh position={[0, 3.1, 0]}>
                <boxGeometry args={[1.8, 0.3, 0.6]} />
                <meshStandardMaterial color="#111" metalness={0.9} />
            </mesh>

            {/* Arms (upper + lower) */}
            {/* Left Arm */}
            <group position={[-1.1, 2.8, 0]} rotation={[0, 0, 0.2]}>
                <mesh position={[0, -0.6, 0]}>
                    <boxGeometry args={[0.25, 1.2, 0.25]} />
                    <meshStandardMaterial color="#222" metalness={0.6} />
                </mesh>
                <mesh position={[0, -1.8, 0.2]} rotation={[0.2, 0, 0]}>
                    <boxGeometry args={[0.2, 1.2, 0.2]} />
                    <meshStandardMaterial color="#333" metalness={0.7} />
                </mesh>
            </group>

            {/* Right Arm */}
            <group position={[1.1, 2.8, 0]} rotation={[0, 0, -0.2]}>
                <mesh position={[0, -0.6, 0]}>
                    <boxGeometry args={[0.25, 1.2, 0.25]} />
                    <meshStandardMaterial color="#222" metalness={0.6} />
                </mesh>
                <mesh position={[0, -1.8, 0.2]} rotation={[0.2, 0, 0]}>
                    <boxGeometry args={[0.2, 1.2, 0.2]} />
                    <meshStandardMaterial color="#333" metalness={0.7} />
                </mesh>
            </group>

            {/* Hips */}
            <mesh position={[0, 0.8, 0]}>
                <boxGeometry args={[0.9, 0.4, 0.5]} />
                <meshStandardMaterial color="#111" metalness={0.9} />
            </mesh>

            {/* Legs */}
            {/* Left Leg */}
            <group position={[-0.3, 0.5, 0]}>
                <mesh position={[0, -1.0, 0]}>
                    <boxGeometry args={[0.3, 2.0, 0.3]} />
                    <meshStandardMaterial color="#222" metalness={0.6} />
                </mesh>
            </group>
            {/* Right Leg */}
            <group position={[0.3, 0.5, 0]}>
                <mesh position={[0, -1.0, 0]}>
                    <boxGeometry args={[0.3, 2.0, 0.3]} />
                    <meshStandardMaterial color="#222" metalness={0.6} />
                </mesh>
            </group>

            {/* --- Organs (Positioned inside transparent sections) --- */}

            {/* Heart (Upper Torso) */}
            <Organ
                position={[0, 2.7, 0.1]}
                color="#ff3333"
                label="Heart"
                driftLevel={drifts?.heart || 0}
                onClick={() => onOrganClick("heart")}
            />

            {/* Kidneys (Lower Torso, Left/Right) */}
            <Organ
                position={[-0.2, 1.5, 0]}
                color="#33ff33"
                label="Kidney (L)"
                driftLevel={drifts?.kidney || 0}
                onClick={() => onOrganClick("kidney")}
            />
            <Organ
                position={[0.2, 1.5, 0]}
                color="#33ff33"
                label="Kidney (R)"
                driftLevel={drifts?.kidney || 0}
                onClick={() => onOrganClick("kidney")}
            />

            {/* Retina (Head) */}
            <Organ
                position={[0, 3.8, 0.26]}
                color="#3333ff"
                label="Retina"
                driftLevel={drifts?.retina || 0}
                onClick={() => onOrganClick("retina")}
            />

            {/* Pancreas (Lower Torso, Center, slightly forward) */}
            <Organ
                position={[0, 1.3, 0.15]}
                color="#ffff33"
                label="Pancreas"
                driftLevel={drifts?.glucose ? (1 - drifts.glucose / 200) : 0}
                onClick={() => onOrganClick("pancreas")}
            />
        </group>
    );
}
