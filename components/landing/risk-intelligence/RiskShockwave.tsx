"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface RiskShockwaveProps {
  active: boolean;
  color?: string;
}

export default function RiskShockwave({ active, color = "#EF4444" }: RiskShockwaveProps) {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const speed = active ? 2.0 : 0.8;
    const rings = [ring1Ref.current, ring2Ref.current, ring3Ref.current];

    rings.forEach((ring, idx) => {
      if (!ring) return;
      // Stagger expansion
      const phase = (delta * speed + (idx * 0.33)) % 1;
      const currentScale = 1 + ((ring.scale.x - 1 + delta * speed * 2) % 3.5);
      ring.scale.set(currentScale, currentScale, 1);

      const mat = ring.material as THREE.MeshBasicMaterial;
      if (mat) {
        // Fade out as it expands
        mat.opacity = THREE.MathUtils.clamp((3.5 - currentScale) / 3.5 * (active ? 0.6 : 0.25), 0, 1);
      }
    });
  });

  return (
    <group position={[0, -1.8, 0]} rotation={[-Math.PI / 2.3, 0, 0]}>
      <mesh ref={ring1Ref} scale={[1, 1, 1]}>
        <ringGeometry args={[0.9, 0.95, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring2Ref} scale={[1.8, 1.8, 1]}>
        <ringGeometry args={[1.3, 1.35, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring3Ref} scale={[2.6, 2.6, 1]}>
        <ringGeometry args={[1.7, 1.75, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
