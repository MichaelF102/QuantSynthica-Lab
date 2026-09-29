"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface QuantEngineCoreProps {
  activeStage: number; // 1 = BUILD, 2 = TEST, 3 = EVALUATE
}

export default function QuantEngineCore({ activeStage }: QuantEngineCoreProps) {
  const coreGroupRef = useRef<THREE.Group>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const pedestalRef = useRef<THREE.Group>(null);

  // Surface constellation particles on the sphere
  const { spherePoints, sphereColors } = useMemo(() => {
    const count = 420;
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);

    const cyanCol = new THREE.Color("#00E5FF");
    const blueCol = new THREE.Color("#3B82F6");
    const violetCol = new THREE.Color("#A855F7");
    const tealCol = new THREE.Color("#10B981");

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 1.28;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const rand = Math.random();
      const c =
        rand < 0.45 ? cyanCol : rand < 0.7 ? blueCol : rand < 0.88 ? violetCol : tealCol;
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }

    return { spherePoints: pos, sphereColors: cols };
  }, []);

  // Free-floating ambient data particles orbiting around the core
  const { orbitParticlePositions } = useMemo(() => {
    const count = 90;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 1.7 + (Math.random() - 0.5) * 0.7;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.9;
      pos[i * 3 + 2] = Math.sin(angle) * r;
    }
    return { orbitParticlePositions: pos };
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Constant slow computational rotation
    if (coreGroupRef.current) {
      coreGroupRef.current.rotation.y += delta * 0.18;
    }

    // Pulse based on active stage
    if (shellRef.current) {
      const pulseSpeed = activeStage === 2 ? 2.5 : activeStage === 3 ? 1.8 : 1.4;
      const scale = 1 + Math.sin(time * pulseSpeed) * 0.02;
      shellRef.current.scale.set(scale, scale, scale);
    }

    // Differential orbital ring rotations
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 0.12;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= delta * 0.09;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.z += delta * 0.15;
    }
    if (pedestalRef.current) {
      pedestalRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Base Pedestal Platform (Concentric Tiered Technological Rings) */}
      <group position={[0, -1.5, 0]}>
        {/* Tier 1: Outer Wide Base Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.0, 2.35, 64]} />
          <meshBasicMaterial
            color="#00E5FF"
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Tier 2: Solid Metallic Base Tier */}
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[2.1, 2.25, 0.12, 64]} />
          <meshStandardMaterial
            color="#08101E"
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>

        {/* Tier 3: Inner Cyan Neon Ring */}
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 1.72, 64]} />
          <meshBasicMaterial
            color="#38BDF8"
            transparent
            opacity={0.65}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Tier 4: Pedestal Center Disc */}
        <mesh position={[0, -0.01, 0]}>
          <cylinderGeometry args={[1.45, 1.5, 0.08, 48]} />
          <meshStandardMaterial
            color="#0A1628"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>

        {/* Rotating Pipeline Track on the Pedestal */}
        <group ref={pedestalRef} position={[0, 0.04, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.75, 1.82, 48]} />
            <meshBasicMaterial
              color="#00E5FF"
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        {/* Base Glow Light Disc on Floor */}
        <mesh position={[0, -0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.5, 32]} />
          <meshBasicMaterial
            color="#1769FF"
            transparent
            opacity={0.16}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 2. Central Quant Engine Sphere */}
      <group position={[0, 0.1, 0]}>
        <group ref={coreGroupRef}>
          {/* A. Dark Obsidian Core Shell */}
          <mesh ref={shellRef}>
            <sphereGeometry args={[1.25, 64, 64]} />
            <meshPhysicalMaterial
              color="#040914"
              emissive="#0F2042"
              emissiveIntensity={0.6}
              roughness={0.15}
              metalness={0.85}
              transmission={0.35}
              transparent
              opacity={0.92}
              reflectivity={0.95}
              clearcoat={1}
              clearcoatRoughness={0.08}
            />
          </mesh>

          {/* B. Cyan Wireframe Latitude/Longitude Grid */}
          <mesh>
            <sphereGeometry args={[1.258, 28, 20]} />
            <meshBasicMaterial
              color="#00E5FF"
              wireframe
              transparent
              opacity={0.32}
            />
          </mesh>

          {/* C. Internal Glow Pulse Sphere */}
          <mesh>
            <sphereGeometry args={[0.9, 32, 32]} />
            <meshBasicMaterial
              color="#1769FF"
              transparent
              opacity={0.25}
            />
          </mesh>

          {/* D. Surface Constellation Data Points */}
          <points>
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
              opacity={0.92}
              blending={THREE.AdditiveBlending}
            />
          </points>
        </group>

        {/* Outer Halo Disc / Atmosphere */}
        <mesh position={[0, 0, -0.1]}>
          <planeGeometry args={[3.8, 3.8]} />
          <meshBasicMaterial
            color="#00E5FF"
            transparent
            opacity={0.08}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* 3. Three Tilted Orbital Rings Rotating Around Engine */}
        {/* Ring 1: Electric Blue Orbit (Inclined ~35°) */}
        <group rotation={[Math.PI / 4.8, Math.PI / 8, 0]}>
          <mesh ref={ring1Ref}>
            <ringGeometry args={[1.85, 1.88, 96]} />
            <meshBasicMaterial
              color="#38BDF8"
              transparent
              opacity={activeStage === 1 ? 0.75 : 0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        {/* Ring 2: Violet Orbit (Inclined ~-30°) */}
        <group rotation={[-Math.PI / 5, -Math.PI / 6, 0]}>
          <mesh ref={ring2Ref}>
            <ringGeometry args={[2.1, 2.13, 96]} />
            <meshBasicMaterial
              color="#A855F7"
              transparent
              opacity={activeStage === 2 ? 0.8 : 0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        {/* Ring 3: Teal Orbit (Inclined ~65°) */}
        <group rotation={[Math.PI / 2.6, 0, Math.PI / 9]}>
          <mesh ref={ring3Ref}>
            <ringGeometry args={[2.3, 2.33, 96]} />
            <meshBasicMaterial
              color="#10B981"
              transparent
              opacity={activeStage === 3 ? 0.8 : 0.35}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        {/* 4. Ambient Orbiting Particle Cloud */}
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[orbitParticlePositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.05}
            color="#38BDF8"
            transparent
            opacity={0.65}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </group>
    </group>
  );
}
