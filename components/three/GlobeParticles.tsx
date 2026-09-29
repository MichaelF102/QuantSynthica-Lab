"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface GlobeParticlesProps {
  radius?: number;
  rotationSpeed?: number;
}

export default function GlobeParticles({
  radius = 2.4,
  rotationSpeed = 0.04,
}: GlobeParticlesProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Generate particle positions and colors
  const { positions, colors, count } = useMemo(() => {
    const coords: number[] = [];
    const colList: number[] = [];

    const isContinent = (lat: number, lon: number): boolean => {
      // North America
      if (lat >= 20 && lat <= 60 && lon >= -135 && lon <= -60) return true;
      // South America
      if (lat >= -40 && lat <= 12 && lon >= -80 && lon <= -35) return true;
      // Europe
      if (lat >= 35 && lat <= 65 && lon >= -10 && lon <= 45) return true;
      // India & South Asia (enhanced density)
      if (lat >= 8 && lat <= 35 && lon >= 68 && lon <= 92) return true;
      // East Asia
      if (lat >= 15 && lat <= 50 && lon >= 95 && lon <= 145) return true;
      // Australia
      if (lat >= -40 && lat <= -12 && lon >= 115 && lon <= 155) return true;
      // Africa
      if (lat >= -32 && lat <= 36 && lon >= -15 && lon <= 50) return true;
      return false;
    };

    // 1. Grid of base globe points
    const latSteps = 42;
    const lonSteps = 84;

    for (let i = 0; i <= latSteps; i++) {
      const phi = (i / latSteps) * Math.PI - Math.PI / 2; // -PI/2 to PI/2
      const latDeg = (phi * 180) / Math.PI;

      // Adjust lon steps near poles to maintain uniform density
      const cosPhi = Math.cos(phi);
      const stepCount = Math.max(8, Math.floor(lonSteps * cosPhi));

      for (let j = 0; j < stepCount; j++) {
        const theta = (j / stepCount) * Math.PI * 2 - Math.PI; // -PI to PI
        const lonDeg = (theta * 180) / Math.PI;

        const onLand = isContinent(latDeg, lonDeg);
        const isIndia = latDeg >= 8 && latDeg <= 32 && lonDeg >= 70 && lonDeg <= 90;
        const isUS = latDeg >= 26 && latDeg <= 50 && lonDeg >= -125 && lonDeg <= -68;

        // Skip some water points for dotted continent contrast
        if (!onLand && Math.random() > 0.35) continue;

        // Spherical to Cartesian
        const r = radius;
        const x = r * Math.cos(phi) * Math.sin(theta);
        const y = r * Math.sin(phi);
        const z = r * Math.cos(phi) * Math.cos(theta);

        coords.push(x, y, z);

        // Color coding
        if (isIndia) {
          // Vibrantly glowing cyan/gold
          colList.push(0.15, 0.75, 1.0); // Bright cyan
        } else if (isUS) {
          // Vibrant royal blue
          colList.push(0.2, 0.55, 1.0);
        } else if (onLand) {
          // Soft institutional blue
          colList.push(0.25, 0.45, 0.85);
        } else {
          // Faint oceanic marker
          colList.push(0.55, 0.7, 0.95);
        }
      }
    }

    return {
      positions: new Float32Array(coords),
      colors: new Float32Array(colList),
      count: coords.length / 3,
    };
  }, [radius]);

  // Subtle longitude & latitude rings
  const ringGeometries = useMemo(() => {
    const rings: THREE.BufferGeometry[] = [];
    const segments = 90;

    // Latitudes: Equator + Tropic rings
    const lats = [-30, 0, 30, 60];
    lats.forEach((lat) => {
      const phi = (lat * Math.PI) / 180;
      const r = radius * Math.cos(phi);
      const y = radius * Math.sin(phi);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        pts.push(new THREE.Vector3(r * Math.sin(theta), y, r * Math.cos(theta)));
      }
      rings.push(new THREE.BufferGeometry().setFromPoints(pts));
    });

    return rings;
  }, [radius]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * rotationSpeed;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Globe Points */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.04}
          vertexColors
          transparent
          opacity={0.85}
          sizeAttenuation
          blending={THREE.NormalBlending}
          depthWrite={false}
        />
      </points>

      {/* Latitudinal Wireframe Guides */}
      {ringGeometries.map((geom, idx) => (
        <lineLoop key={idx} geometry={geom}>
          <lineBasicMaterial color="#3B82F6" transparent opacity={0.12} />
        </lineLoop>
      ))}

      {/* Inner Globe Soft Atmospheric Mesh */}
      <mesh>
        <sphereGeometry args={[radius * 0.985, 32, 32]} />
        <meshBasicMaterial
          color="#1E3A8A"
          transparent
          opacity={0.03}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
