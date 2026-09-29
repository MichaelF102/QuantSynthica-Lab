"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import GlobeParticles from "./GlobeParticles";
import MarketOrbits from "./MarketOrbits";
import MarketNodes from "./MarketNodes";

interface QuantMarketGlobeProps {
  className?: string;
}

export default function QuantMarketGlobe({ className }: QuantMarketGlobeProps) {
  return (
    <div className={`relative h-full w-full select-none ${className || ""}`}>
      <Canvas
        camera={{ position: [0.6, 0.4, 6.2], fov: 44 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <directionalLight position={[-5, -3, -2]} intensity={0.4} color="#3B82F6" />

        <Suspense fallback={null}>
          <group position={[0.4, 0.15, 0]}>
            <GlobeParticles radius={2.45} rotationSpeed={0.035} />
            <MarketOrbits radius={2.45} />
            <MarketNodes radius={2.45} rotationSpeed={0.035} />
          </group>
        </Suspense>
      </Canvas>
    </div>
  );
}
