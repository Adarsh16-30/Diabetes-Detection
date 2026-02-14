"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Environment } from "@react-three/drei";
import HumanBody from "./HumanBody";
import { Suspense } from "react";

export default function Scene({ vitals, drifts, onOrganClick }) {
  return (
    <div className="w-full h-screen bg-black relative">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 4]} />
        <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2} minDistance={2} maxDistance={6} />
        
        {/* Lighting for the "Holographic" effect */}
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#00ffff" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff00ff" />
        
        <Suspense fallback={null}>
            <HumanBody vitals={vitals} drifts={drifts} onOrganClick={onOrganClick} />
            <Environment preset="city" />
        </Suspense>
      </Canvas>
      
      {/* Overlay Gradient for Cyberpunk feel */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
    </div>
  );
}
