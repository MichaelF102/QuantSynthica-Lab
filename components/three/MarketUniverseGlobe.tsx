"use client";

import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function GlobeScene() {
  const groupRef = useRef<THREE.Group>(null);
  const orbitRef = useRef<THREE.Group>(null);
  const radius = 2.8;

  // Dotted particle points for sphere
  const { positions, colors } = useMemo(() => {
    const coords: number[] = [];
    const cols: number[] = [];
    const latSteps = 30;
    const lonSteps = 60;

    for (let i = 0; i <= latSteps; i++) {
      const phi = (i / latSteps) * Math.PI - Math.PI / 2;
      const cosPhi = Math.cos(phi);
      const stepCount = Math.max(6, Math.floor(lonSteps * cosPhi));

      for (let j = 0; j < stepCount; j++) {
        const theta = (j / stepCount) * Math.PI * 2 - Math.PI;
        const x = radius * cosPhi * Math.sin(theta);
        const y = radius * Math.sin(phi);
        const z = radius * cosPhi * Math.cos(theta);

        coords.push(x, y, z);
        // Soft blue/indigo gradient
        cols.push(0.09, 0.41, 1.0);
      }
    }

    return {
      positions: new Float32Array(coords),
      colors: new Float32Array(cols),
    };
  }, [radius]);

  // Latitude and Longitude wireframe rings
  const ringGeometries = useMemo(() => {
    const rings: THREE.BufferGeometry[] = [];
    const segments = 64;
    [-40, -15, 15, 45].forEach((lat) => {
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

  // Orbital curves
  const orbitCurveGeometry = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 80;
    const r = radius * 1.35;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(r * Math.cos(theta), 0, r * Math.sin(theta)));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [radius]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.02;
    }
    if (orbitRef.current) {
      orbitRef.current.rotation.y += delta * 0.015;
      orbitRef.current.rotation.z += delta * 0.005;
    }
  });

  return (
    <group>
      {/* Rotating Globe Body */}
      <group ref={groupRef}>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            <bufferAttribute attach="attributes-color" args={[colors, 3]} />
          </bufferGeometry>
          <pointsMaterial
            size={0.035}
            vertexColors
            transparent
            opacity={0.4}
            sizeAttenuation
            depthWrite={false}
          />
        </points>

        {ringGeometries.map((geom, idx) => (
          <lineLoop key={idx} geometry={geom}>
            <lineBasicMaterial color="#3B82F6" transparent opacity={0.15} />
          </lineLoop>
        ))}

        {/* US Node Marker */}
        <mesh position={[-1.6, 1.4, 1.4]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshBasicMaterial color="#1769FF" />
        </mesh>

        {/* India Node Marker */}
        <mesh position={[1.8, 0.9, 1.5]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshBasicMaterial color="#00A878" />
        </mesh>
      </group>

      {/* Tilted Orbital Ring */}
      <group ref={orbitRef} rotation={[-0.3, 0.2, 0.4]}>
        <lineLoop geometry={orbitCurveGeometry}>
          <lineBasicMaterial color="#6366F1" transparent opacity={0.25} />
        </lineLoop>
      </group>
    </group>
  );
}

export default function MarketUniverseGlobe() {
  return (
    <div className="pointer-events-none h-full w-full select-none opacity-30 md:opacity-40" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "low-power",
        }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.8} />
        <GlobeScene />
      </Canvas>
    </div>
  );
}
