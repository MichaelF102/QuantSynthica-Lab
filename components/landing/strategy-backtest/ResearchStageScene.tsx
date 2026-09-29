"use client";

import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";

interface ResearchStageSceneProps {
  activeStage: number; // 1, 2, 3
  onSelectStage?: (stage: number) => void;
}

function FloatingPlatform({
  position,
  color,
  glowColor,
  isActive,
  label,
  sublabel,
  onClick,
}: {
  position: [number, number, number];
  color: string;
  glowColor: string;
  isActive: boolean;
  label: string;
  sublabel: string;
  onClick?: () => void;
}) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      // Gentle floating bob
      meshRef.current.position.y =
        position[1] + Math.sin(t * 1.5 + position[0]) * 0.08 + (isActive ? 0.2 : 0);
    }
  });

  return (
    <group ref={meshRef} position={position} onClick={onClick}>
      {/* Platform Base Box (Rounded slab look) */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.45, 1.8]} />
        <meshStandardMaterial
          color="#07111F"
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Emissive Glowing Rim Border */}
      <mesh position={[0, 0.24, 0]}>
        <boxGeometry args={[2.54, 0.04, 1.84]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={isActive ? 0.9 : 0.45}
        />
      </mesh>

      {/* Top Glass Surface */}
      <mesh position={[0, 0.26, 0]}>
        <boxGeometry args={[2.4, 0.02, 1.7]} />
        <meshStandardMaterial
          color={color}
          roughness={0.1}
          metalness={0.3}
          transparent
          opacity={isActive ? 0.65 : 0.3}
        />
      </mesh>

      {/* Floor Glow / Shadow Disc */}
      <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3, 2.2]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={isActive ? 0.25 : 0.08}
        />
      </mesh>

      {/* Small floating holographic data node above platform */}
      <mesh position={[0, 0.7, 0]}>
        <octahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial
          color={glowColor}
          wireframe
          emissive={glowColor}
          emissiveIntensity={isActive ? 0.8 : 0.3}
        />
      </mesh>
    </group>
  );
}

function DataStreamCurves() {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate particles along flowing spline paths between platforms
  const { particlePositions, curvePoints } = useMemo(() => {
    // 3 curve paths bridging platform 1 -> 2 -> 3
    const curve1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-3.2, 0.5, 0),
      new THREE.Vector3(-1.6, 1.1, 0.4),
      new THREE.Vector3(0, 0.6, 0),
    ]);

    const curve2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.6, 0),
      new THREE.Vector3(1.6, 1.1, -0.4),
      new THREE.Vector3(3.2, 0.5, 0),
    ]);

    const pts1 = curve1.getPoints(50);
    const pts2 = curve2.getPoints(50);
    const allPts = [...pts1, ...pts2];

    const positions = new Float32Array(allPts.length * 3);
    for (let i = 0; i < allPts.length; i++) {
      positions[i * 3] = allPts[i].x;
      positions[i * 3 + 1] = allPts[i].y;
      positions[i * 3 + 2] = allPts[i].z;
    }

    return {
      particlePositions: positions,
      curvePoints: allPts,
    };
  }, []);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group>
      {/* Floating particles flowing across stream */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#38BDF8"
          transparent
          opacity={0.6}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

function ParticleNetworkBackground() {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const count = 90;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8 + 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2;
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.015;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        color="#3B82F6"
        transparent
        opacity={0.25}
        sizeAttenuation
      />
    </points>
  );
}

export default function ResearchStageScene({
  activeStage,
  onSelectStage,
}: ResearchStageSceneProps) {
  return (
    <div className="relative h-[320px] sm:h-[380px] w-full select-none">
      <Canvas
        camera={{ position: [0, 2.2, 5.8], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} />
        <pointLight position={[-4, 3, 2]} color="#1769FF" intensity={1.5} />
        <pointLight position={[0, 3, 2]} color="#7C3AED" intensity={1.5} />
        <pointLight position={[4, 3, 2]} color="#14B8A6" intensity={1.5} />

        {/* 3 Physical Research Platforms */}
        <FloatingPlatform
          position={[-3.2, 0, 0]}
          color="#1769FF"
          glowColor="#38BDF8"
          isActive={activeStage === 1}
          label="01 BUILD"
          sublabel="Define your strategy"
          onClick={() => onSelectStage?.(1)}
        />

        <FloatingPlatform
          position={[0, 0.15, 0]}
          color="#7C3AED"
          glowColor="#A78BFA"
          isActive={activeStage === 2}
          label="02 TEST"
          sublabel="Run on historical data"
          onClick={() => onSelectStage?.(2)}
        />

        <FloatingPlatform
          position={[3.2, 0, 0]}
          color="#0D9488"
          glowColor="#2DD4BF"
          isActive={activeStage === 3}
          label="03 EVALUATE"
          sublabel="Analyze performance"
          onClick={() => onSelectStage?.(3)}
        />

        {/* Dynamic Light Stream Bridges */}
        <DataStreamCurves />

        {/* Delicate Particle Network Atmosphere */}
        <ParticleNetworkBackground />
      </Canvas>
    </div>
  );
}
