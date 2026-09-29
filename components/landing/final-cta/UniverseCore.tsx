"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function UniverseCore() {
  const groupRef = useRef<THREE.Group>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);

  // Generate glowing constellation points on sphere surface
  const { spherePoints, sphereColors } = useMemo(() => {
    const count = 650;
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);

    const cyanCol = new THREE.Color("#00E5FF");
    const blueCol = new THREE.Color("#3B82F6");
    const violetCol = new THREE.Color("#A855F7");

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 1.35;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const rand = Math.random();
      const c = rand < 0.4 ? cyanCol : rand < 0.75 ? blueCol : violetCol;
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }

    return { spherePoints: pos, sphereColors: cols };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();

    // Constant slow rotation
    groupRef.current.rotation.y += delta * 0.22;

    // Gentle pulse
    const pulseFactor = 1 + Math.sin(time * 1.5) * 0.02;
    if (shellRef.current) {
      shellRef.current.scale.set(pulseFactor, pulseFactor, pulseFactor);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Rotating Sphere & Lattice */}
      <group ref={groupRef}>
        {/* 1. Core Translucent Dark Body */}
        <mesh ref={shellRef}>
          <sphereGeometry args={[1.35, 64, 64]} />
          <meshPhysicalMaterial
            color="#050B14"
            emissive="#1E1B4B"
            emissiveIntensity={0.5}
            roughness={0.15}
            metalness={0.8}
            transmission={0.4}
            transparent
            opacity={0.92}
            reflectivity={0.95}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </mesh>

        {/* 1b. Outer Glow Halo Mesh */}
        <mesh ref={haloRef}>
          <sphereGeometry args={[1.37, 32, 32]} />
          <meshBasicMaterial
            color="#38BDF8"
            transparent
            opacity={0.15}
            side={THREE.BackSide}
          />
        </mesh>

        {/* 2. Wireframe Latitude & Longitude Overlay */}
        <mesh>
          <sphereGeometry args={[1.365, 30, 22]} />
          <meshBasicMaterial
            color="#38BDF8"
            wireframe
            transparent
            opacity={0.25}
          />
        </mesh>

        {/* 3. Surface Particle Constellation */}
        <points ref={pointsRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[spherePoints, 3]}
            />
            <bufferAttribute
              attach="attributes-color"
              args={[sphereColors, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.052}
            vertexColors
            transparent
            opacity={0.95}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>
    </group>
  );
}
