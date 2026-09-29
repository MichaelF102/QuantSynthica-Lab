"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

function ParticleMesh() {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const { particlePositions, linePositions } = useMemo(() => {
    const numPoints = 55;
    const positions = new Float32Array(numPoints * 3);
    const coords: [number, number, number][] = [];

    for (let i = 0; i < numPoints; i++) {
      const x = (Math.random() - 0.5) * 16;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 6;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      coords.push([x, y, z]);
    }

    const linePoints: number[] = [];
    const maxDist = 3.2;

    for (let i = 0; i < numPoints; i++) {
      for (let j = i + 1; j < numPoints; j++) {
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
    };
  }, []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.02;
      pointsRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.03;
    }
    if (linesRef.current) {
      linesRef.current.rotation.y += delta * 0.02;
      linesRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.03;
    }
  });

  return (
    <group position={[3, 0, -2]}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.07}
          color="#3B82F6"
          transparent
          opacity={0.3}
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
          color="#60A5FA"
          transparent
          opacity={0.06}
          linewidth={1}
        />
      </lineSegments>
    </group>
  );
}

export default function LabsAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-70 select-none">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 46 }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        dpr={[1, 1.5]}
      >
        <ParticleMesh />
      </Canvas>
    </div>
  );
}
