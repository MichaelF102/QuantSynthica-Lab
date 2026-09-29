"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface MarketNodesProps {
  radius?: number;
  rotationSpeed?: number;
}

interface NodeData {
  name: string;
  lat: number;
  lon: number;
  color: string;
  size: number;
  isPrimary?: boolean;
}

const NODES: NodeData[] = [
  { name: "US", lat: 40.71, lon: -74.0, color: "#3B82F6", size: 0.075, isPrimary: true },
  { name: "India", lat: 18.97, lon: 72.82, color: "#10B981", size: 0.085, isPrimary: true },
  { name: "London", lat: 51.5, lon: -0.12, color: "#6366F1", size: 0.05 },
  { name: "Tokyo", lat: 35.67, lon: 139.65, color: "#38BDF8", size: 0.05 },
  { name: "Singapore", lat: 1.35, lon: 103.81, color: "#38BDF8", size: 0.05 },
];

export default function MarketNodes({
  radius = 2.4,
  rotationSpeed = 0.04,
}: MarketNodesProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRingsRef = useRef<(THREE.Mesh | null)[]>([]);

  const latLongToVector3 = (lat: number, lon: number, r: number) => {
    const phi = (lat * Math.PI) / 180;
    const theta = (lon * Math.PI) / 180;
    return new THREE.Vector3(
      r * Math.cos(phi) * Math.sin(theta),
      r * Math.sin(phi),
      r * Math.cos(phi) * Math.cos(theta)
    );
  };

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * rotationSpeed;
    }

    const t = state.clock.getElapsedTime();
    pulseRingsRef.current.forEach((ring, idx) => {
      if (ring) {
        const scale = 1 + Math.sin(t * 3 + idx) * 0.35;
        ring.scale.set(scale, scale, scale);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {NODES.map((node, idx) => {
        const pos = latLongToVector3(node.lat, node.lon, radius * 1.01);
        const normal = pos.clone().normalize();

        return (
          <group key={node.name} position={pos}>
            {/* Center Core Node */}
            <mesh>
              <sphereGeometry args={[node.size, 16, 16]} />
              <meshBasicMaterial color={node.color} />
            </mesh>

            {/* Glowing Pulse Ring for Primary Hubs */}
            {node.isPrimary && (
              <mesh
                ref={(el) => {
                  pulseRingsRef.current[idx] = el;
                }}
              >
                <ringGeometry args={[node.size * 1.2, node.size * 1.9, 24]} />
                <meshBasicMaterial
                  color={node.color}
                  transparent
                  opacity={0.45}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}

            {/* Elevation Spire Marker */}
            <mesh position={[normal.x * 0.1, normal.y * 0.1, normal.z * 0.1]}>
              <sphereGeometry args={[node.size * 0.45, 8, 8]} />
              <meshBasicMaterial color={node.color} transparent opacity={0.6} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
