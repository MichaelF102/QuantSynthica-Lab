"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { RiskState } from "./RiskNavigation";

interface RiskCoreProps {
  activeRisk: RiskState;
}

export default function RiskCore({ activeRisk }: RiskCoreProps) {
  const groupRef = useRef<THREE.Group>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const wireframeRef = useRef<THREE.Mesh>(null);
  const pointsRef = useRef<THREE.Points>(null);

  // Generate surface point cloud on sphere
  const { spherePoints, sphereColors } = useMemo(() => {
    const count = 600;
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);

    const normalCol = new THREE.Color("#00D2FF");
    const blueCol = new THREE.Color("#1769FF");
    const stressCol = new THREE.Color("#FF3366");
    const purpleCol = new THREE.Color("#9333EA");

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 1.38;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      if (x < -0.1) {
        const c = Math.random() > 0.4 ? normalCol : blueCol;
        cols[i * 3] = c.r;
        cols[i * 3 + 1] = c.g;
        cols[i * 3 + 2] = c.b;
      } else {
        const c = Math.random() > 0.4 ? stressCol : purpleCol;
        cols[i * 3] = c.r;
        cols[i * 3 + 1] = c.g;
        cols[i * 3 + 2] = c.b;
      }
    }

    return { spherePoints: pos, sphereColors: cols };
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();

    // Constant slow rotation
    groupRef.current.rotation.y += delta * 0.25;

    // Subtle breathing pulse
    const pulseFactor = 1 + Math.sin(time * 1.5) * 0.02;
    if (shellRef.current) {
      shellRef.current.scale.set(pulseFactor, pulseFactor, pulseFactor);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Rotating Sphere & Particle Body */}
      <group ref={groupRef}>
        {/* 1. Core Translucent Dark Sphere Body with Dual Personality Glow */}
        <mesh ref={shellRef}>
          <sphereGeometry args={[1.35, 64, 64]} />
          <meshPhysicalMaterial
            color="#0B1220"
            emissive="#1E293B"
            emissiveIntensity={0.3}
            roughness={0.25}
            metalness={0.8}
            transmission={0.3}
            transparent
            opacity={0.92}
            reflectivity={0.95}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </mesh>

        {/* 1b. Left Side Ambient Cyan Glow Shell */}
        <mesh position={[-0.3, 0, 0]}>
          <sphereGeometry args={[1.37, 32, 32]} />
          <meshBasicMaterial
            color="#06B6D4"
            transparent
            opacity={0.12}
            side={THREE.BackSide}
          />
        </mesh>

        {/* 1c. Right Side Ambient Crimson Glow Shell */}
        <mesh position={[0.3, 0, 0]}>
          <sphereGeometry args={[1.37, 32, 32]} />
          <meshBasicMaterial
            color="#F43F5E"
            transparent
            opacity={0.12}
            side={THREE.BackSide}
          />
        </mesh>

        {/* 2. Delicate Wireframe Latitude & Longitude Overlay */}
        <mesh ref={wireframeRef}>
          <sphereGeometry args={[1.365, 28, 20]} />
          <meshBasicMaterial
            color="#38BDF8"
            wireframe
            transparent
            opacity={0.22}
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
            size={0.05}
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
