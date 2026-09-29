"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function PortfolioCore() {
  const groupRef = useRef<THREE.Group>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const wireframeRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);

  // Generate capital constellation points across sphere surface
  const { spherePoints, sphereColors } = useMemo(() => {
    const count = 550;
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);

    const blueCol = new THREE.Color("#1769FF");
    const cyanCol = new THREE.Color("#00E5FF");
    const purpleCol = new THREE.Color("#8B5CF6");
    const emeraldCol = new THREE.Color("#10B981");

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

      // Color distribution: multi-asset spectrum
      const rand = Math.random();
      const c = rand < 0.35 ? blueCol : rand < 0.65 ? cyanCol : rand < 0.85 ? purpleCol : emeraldCol;
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
    groupRef.current.rotation.y += delta * 0.2;

    // Subtle rhythmic expansion
    const pulseFactor = 1 + Math.sin(time * 1.6) * 0.015;
    if (shellRef.current) {
      shellRef.current.scale.set(pulseFactor, pulseFactor, pulseFactor);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Rotating Core Group */}
      <group ref={groupRef}>
        {/* 1. Core Translucent Dark Sphere Body */}
        <mesh ref={shellRef}>
          <sphereGeometry args={[1.35, 64, 64]} />
          <meshPhysicalMaterial
            color="#08111F"
            emissive="#1E1B4B"
            emissiveIntensity={0.35}
            roughness={0.2}
            metalness={0.8}
            transmission={0.35}
            transparent
            opacity={0.92}
            reflectivity={0.95}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </mesh>

        {/* 1b. Left Side Ambient Cyan Glow Shell */}
        <mesh position={[-0.25, 0, 0]}>
          <sphereGeometry args={[1.365, 32, 32]} />
          <meshBasicMaterial
            color="#06B6D4"
            transparent
            opacity={0.12}
            side={THREE.BackSide}
          />
        </mesh>

        {/* 1c. Right Side Ambient Purple Glow Shell */}
        <mesh position={[0.25, 0, 0]}>
          <sphereGeometry args={[1.365, 32, 32]} />
          <meshBasicMaterial
            color="#8B5CF6"
            transparent
            opacity={0.12}
            side={THREE.BackSide}
          />
        </mesh>

        {/* 2. Delicate Wireframe Latitude & Longitude Overlay */}
        <mesh ref={wireframeRef}>
          <sphereGeometry args={[1.36, 28, 20]} />
          <meshBasicMaterial
            color="#38BDF8"
            wireframe
            transparent
            opacity={0.2}
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
            size={0.048}
            vertexColors
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>
    </group>
  );
}
