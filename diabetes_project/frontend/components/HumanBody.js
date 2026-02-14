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
    // Drifts: { kidney: 0.8, heart: 0.2 ... } form
    return (
        <group>
            {/* Translucent Body Shell (Abstract) */}
            <mesh position={[0, 0, 0]}>
                <capsuleGeometry args={[1, 3, 4, 16]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.9}
                    opacity={0.5}
                    roughness={0.1}
                    thickness={1}
                    transparent
                />
            </mesh>

            {/* Organs */}
            <Organ
                position={[0, 0.5, 0.5]}
                color="#ff0000"
                label="Heart"
                driftLevel={drifts?.heart || 0}
                onClick={() => onOrganClick("heart")}
            />
            <Organ
                position={[-0.3, -0.2, 0.4]}
                color="#00ff00"
                label="Kidney (L)"
                driftLevel={drifts?.kidney || 0}
                onClick={() => onOrganClick("kidney")}
            />
            <Organ
                position={[0.3, -0.2, 0.4]}
                color="#00ff00"
                label="Kidney (R)"
                driftLevel={drifts?.kidney || 0}
                onClick={() => onOrganClick("kidney")}
            />
            <Organ
                position={[0, 1.2, 0.6]}
                color="#0000ff"
                label="Retina"
                driftLevel={drifts?.retina || 0}
                onClick={() => onOrganClick("retina")}
            />
        </group>
    );
}
