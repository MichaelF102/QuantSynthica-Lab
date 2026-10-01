"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface PortfolioPlatformProps {
  drilldownLevel: number;
}

export default function PortfolioPlatform({ drilldownLevel }: PortfolioPlatformProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const gridGlowRef = useRef<THREE.Mesh>(null);

  // Subtle drifting ambient particles
  const particleCount = 120;
  const [positions, scales] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const sc = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = Math.random() * 4 - 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12;
      sc[i] = Math.random() * 0.8 + 0.2;
    }
    return [pos, sc];
  }, [particleCount]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (particlesRef.current) {
      const positionsAttr = particlesRef.current.geometry.attributes.position;
      const arr = positionsAttr.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        arr[i * 3 + 1] += 0.003;
        if (arr[i * 3 + 1] > 3.5) {
          arr[i * 3 + 1] = -0.5;
        }
      }
      positionsAttr.needsUpdate = true;
    }

    if (gridGlowRef.current) {
      const mat = gridGlowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.25 + Math.sin(t * 1.5) * 0.08;
    }
  });

  return (
    <group position={[0, -1.2, 0]}>
      {/* 1. Main Metallic Platform Base */}
      <mesh position={[0, -0.25, 0]} receiveShadow>
        <boxGeometry args={[7.8, 0.45, 6.4]} />
        <meshStandardMaterial
          color="#080E1A"
          roughness={0.4}
          metalness={0.8}
        />
      </mesh>

      {/* 2. Beveled Dark Platform Top */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[7.4, 0.06, 6.0]} />
        <meshStandardMaterial
          color="#060A12"
          roughness={0.25}
          metalness={0.9}
        />
      </mesh>

      {/* 3. Glowing Cyber Edge Hairline */}
      <lineSegments position={[0, 0.04, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(7.42, 0.07, 6.02)]} />
        <lineBasicMaterial color="#00E5FF" transparent opacity={0.65} />
      </lineSegments>

      {/* 4. Fine Grid Plane on Platform */}
      <gridHelper
        args={[6.6, 22, "#00E5FF", "#1E293B"]}
        position={[0, 0.045, 0]}
      />

      {/* 5. Radial Circuit Glow under Cubes */}
      <mesh ref={gridGlowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <planeGeometry args={[6.2, 5.0]} />
        <meshBasicMaterial
          color="#1769FF"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 6. Glowing Circular Accent Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.052, 0]}>
        <ringGeometry args={[1.8, 1.83, 64]} />
        <meshBasicMaterial color="#00E5FF" transparent opacity={0.4} />
      </mesh>

      {/* 7. Secondary Inner Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.052, 0]}>
        <ringGeometry args={[0.9, 0.92, 48]} />
        <meshBasicMaterial color="#8B5CF6" transparent opacity={0.35} />
      </mesh>

      {/* 8. Floating Ambient Micro-Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          color="#38BDF8"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
