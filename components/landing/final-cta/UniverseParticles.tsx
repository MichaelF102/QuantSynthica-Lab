"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function UniverseParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 480;

  const { positions, colors, originalPos } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const orig = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);

    const cyanCol = new THREE.Color("#38BDF8");
    const purpleCol = new THREE.Color("#C084FC");
    const blueCol = new THREE.Color("#60A5FA");

    for (let i = 0; i < count; i++) {
      const r = 2.0 + Math.random() * 2.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = (r * Math.sin(phi) * Math.sin(theta)) * 0.65; // flattened disc
      const z = r * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      orig[i * 3] = x;
      orig[i * 3 + 1] = y;
      orig[i * 3 + 2] = z;

      const rand = Math.random();
      const c = rand < 0.45 ? cyanCol : rand < 0.8 ? purpleCol : blueCol;
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }

    return { positions: pos, colors: cols, originalPos: orig };
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    const geom = pointsRef.current.geometry;
    const posAttr = geom.attributes.position;

    // Slow orbital rotation
    pointsRef.current.rotation.y = time * 0.04;

    for (let i = 0; i < count; i++) {
      const ox = originalPos[i * 3];
      const oy = originalPos[i * 3 + 1];
      const oz = originalPos[i * 3 + 2];

      posAttr.setXYZ(
        i,
        ox + Math.sin(time * 0.7 + i) * 0.08,
        oy + Math.cos(time * 0.8 + i) * 0.08,
        oz
      );
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
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
        size={0.05}
        vertexColors
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
