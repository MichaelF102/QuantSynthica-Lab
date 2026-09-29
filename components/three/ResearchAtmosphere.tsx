"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

function DataGlobeAtmosphere() {
  const globeGroupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  // Generate spherical data points and connecting arcs
  const { particlePositions, linePositions } = useMemo(() => {
    const numPoints = 75;
    const radius = 4.2;
    const positions = new Float32Array(numPoints * 3);
    const coords: [number, number, number][] = [];

    for (let i = 0; i < numPoints; i++) {
      // Fibonacci sphere distribution for uniform planetary points
      const phi = Math.acos(1 - (2 * (i + 0.5)) / numPoints);
      const theta = Math.PI * (1 + 5 ** 0.5) * (i + 0.5);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      coords.push([x, y, z]);
    }

    const linePoints: number[] = [];
    const maxDist = 2.4;

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

  useFrame((_, delta) => {
    if (globeGroupRef.current) {
      globeGroupRef.current.rotation.y += delta * 0.04;
      globeGroupRef.current.rotation.x = 0.22;
      globeGroupRef.current.rotation.z = -0.15;
    }
  });

  return (
    <group ref={globeGroupRef} position={[2.5, 0.4, -2]}>
      {/* Network nodes */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.065}
          color="#2563EB"
          transparent
          opacity={0.32}
          sizeAttenuation
        />
      </points>

      {/* Network connection arcs */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#3B82F6"
          transparent
          opacity={0.07}
          linewidth={1}
        />
      </lineSegments>

      {/* Orbital rings */}
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <ringGeometry args={[4.4, 4.415, 64]} />
        <meshBasicMaterial
          color="#60A5FA"
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 4, Math.PI / 6, 0]}>
        <ringGeometry args={[4.6, 4.612, 64]} />
        <meshBasicMaterial
          color="#818CF8"
          transparent
          opacity={0.04}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export default function ResearchAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-80 select-none">
      <Canvas
        camera={{ position: [0, 0, 8.5], fov: 48 }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        dpr={[1, 1.5]}
      >
        <DataGlobeAtmosphere />
      </Canvas>
    </div>
  );
}
