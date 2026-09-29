"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RiskState } from "./RiskNavigation";

interface RiskParticlesProps {
  activeRisk: RiskState;
}

export default function RiskParticles({ activeRisk }: RiskParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 450;

  const { positions, colors, originalPositions } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const orig = new Float32Array(particleCount * 3);
    const cols = new Float32Array(particleCount * 3);

    const normalColor = new THREE.Color("#1769FF");
    const cyanColor = new THREE.Color("#06B6D4");
    const stressColor = new THREE.Color("#EF4444");
    const purpleColor = new THREE.Color("#8B5CF6");

    for (let i = 0; i < particleCount; i++) {
      // Distribute in a soft surrounding cloud around the sphere
      const r = 2.4 + Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = (r * Math.sin(phi) * Math.sin(theta)) * 0.7; // slightly flattened
      const z = r * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      orig[i * 3] = x;
      orig[i * 3 + 1] = y;
      orig[i * 3 + 2] = z;

      // Color based on X position: left = normal (blue/cyan), right = stress (purple/red)
      if (x < -0.2) {
        const c = Math.random() > 0.5 ? normalColor : cyanColor;
        cols[i * 3] = c.r;
        cols[i * 3 + 1] = c.g;
        cols[i * 3 + 2] = c.b;
      } else if (x > 0.2) {
        const c = Math.random() > 0.5 ? stressColor : purpleColor;
        cols[i * 3] = c.r;
        cols[i * 3 + 1] = c.g;
        cols[i * 3 + 2] = c.b;
      } else {
        const c = new THREE.Color("#6366F1");
        cols[i * 3] = c.r;
        cols[i * 3 + 1] = c.g;
        cols[i * 3 + 2] = c.b;
      }
    }

    return { positions: pos, originalPositions: orig, colors: cols };
  }, [particleCount]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const geom = pointsRef.current.geometry;
    const posAttr = geom.attributes.position;
    const time = state.clock.getElapsedTime();

    // Rotate the whole cloud slowly
    pointsRef.current.rotation.y = time * 0.05;

    // Adapt dynamics based on activeRisk
    const isTurbulent = activeRisk === "volatility";
    const isDownward = activeRisk === "drawdown";
    const isStress = activeRisk === "stress";
    const isVaR = activeRisk === "var";

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const ox = originalPositions[idx];
      const oy = originalPositions[idx + 1];
      const oz = originalPositions[idx + 2];

      if (isTurbulent) {
        // High frequency turbulence
        posAttr.setXYZ(
          i,
          ox + Math.sin(time * 3 + i) * 0.15,
          oy + Math.cos(time * 3 + i * 2) * 0.15,
          oz + Math.sin(time * 2 + i * 1.5) * 0.15
        );
      } else if (isDownward) {
        // Subtle downward drift
        const drop = Math.sin(time * 1.2 + i * 0.5) * 0.2 - 0.25;
        posAttr.setXYZ(i, ox, oy + drop, oz);
      } else if (isStress) {
        // Outward shock expansion
        const pulse = 1 + Math.sin(time * 2.5 + ox) * 0.2;
        posAttr.setXYZ(i, ox * pulse, oy * pulse, oz * pulse);
      } else if (isVaR) {
        // Compression toward center
        posAttr.setXYZ(i, ox * 0.88, oy * 0.88, oz * 0.88);
      } else {
        // Normal gentle float
        posAttr.setXYZ(
          i,
          ox + Math.sin(time * 0.8 + i) * 0.05,
          oy + Math.cos(time * 0.8 + i) * 0.05,
          oz
        );
      }
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
        size={0.065}
        vertexColors
        transparent
        opacity={0.7}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}
