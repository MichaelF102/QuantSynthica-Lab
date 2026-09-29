"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

function NetworkParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const { particlePositions, linePositions, count } = useMemo(() => {
    const numParticles = 60;
    const positions = new Float32Array(numParticles * 3);
    const coords: [number, number, number][] = [];

    for (let i = 0; i < numParticles; i++) {
      const x = (Math.random() - 0.5) * 16;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 6;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      coords.push([x, y, z]);
    }

    const linePoints: number[] = [];
    const maxDist = 3.8;

    for (let i = 0; i < numParticles; i++) {
      for (let j = i + 1; j < numParticles; j++) {
        const dx = coords[i][0] - coords[j][0];
        const dy = coords[i][1] - coords[j][1];
        const dz = coords[i][2] - coords[j][2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < maxDist) {
          linePoints.push(
            coords[i][0], coords[i][1], coords[i][2],
            coords[j][0], coords[j][1], coords[j][2]
          );
        }
      }
    }

    return {
      particlePositions: positions,
      linePositions: new Float32Array(linePoints),
      count: numParticles,
    };
  }, []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.025;
      pointsRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.05;
    }
    if (linesRef.current) {
      linesRef.current.rotation.y += delta * 0.025;
      linesRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.05;
    }
  });

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          color="#1769FF"
          transparent
          opacity={0.35}
          sizeAttenuation
        />
      </points>

      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#2563EB"
          transparent
          opacity={0.08}
          linewidth={1}
        />
      </lineSegments>
    </group>
  );
}

export default function WorkflowNetwork() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-60">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        dpr={[1, 1.5]}
      >
        <NetworkParticles />
      </Canvas>
    </div>
  );
}
