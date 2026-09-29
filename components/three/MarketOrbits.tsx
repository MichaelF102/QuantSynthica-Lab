"use client";

import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface MarketOrbitsProps {
  radius?: number;
}

export default function MarketOrbits({ radius = 2.4 }: MarketOrbitsProps) {
  const orbitsGroupRef = useRef<THREE.Group>(null);
  const photonRef = useRef<THREE.Mesh>(null);
  const photonProgress = useRef(0);

  // Convert lat/long to 3D Cartesian coordinates on sphere
  const latLongToVector3 = (lat: number, lon: number, r: number) => {
    const phi = (lat * Math.PI) / 180;
    const theta = (lon * Math.PI) / 180;
    return new THREE.Vector3(
      r * Math.cos(phi) * Math.sin(theta),
      r * Math.sin(phi),
      r * Math.cos(phi) * Math.cos(theta)
    );
  };

  // US to India Great-Circle Bezier curve
  const { curve, curvePoints } = useMemo(() => {
    const usPos = latLongToVector3(38, -97, radius);
    const indiaPos = latLongToVector3(22, 78, radius);

    // Calculate midpoint elevated above globe surface
    const mid = new THREE.Vector3()
      .addVectors(usPos, indiaPos)
      .multiplyScalar(0.5);
    
    // Normalize and elevate
    const elevation = radius * 1.45;
    mid.normalize().multiplyScalar(elevation);

    const quadCurve = new THREE.QuadraticBezierCurve3(usPos, mid, indiaPos);
    const pts = quadCurve.getPoints(60);

    return { curve: quadCurve, curvePoints: pts };
  }, [radius]);

  // Curved line geometry for US-India connection
  const bridgeGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(curvePoints);
  }, [curvePoints]);

  // Outer orbital rings
  const outerOrbits = useMemo(() => {
    const rings = [];
    const segments = 100;
    const r1 = radius * 1.35;
    const pts1 = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts1.push(new THREE.Vector3(r1 * Math.cos(theta), 0, r1 * Math.sin(theta)));
    }
    rings.push({
      geometry: new THREE.BufferGeometry().setFromPoints(pts1),
      rotation: [0.35, 0.2, 0.4] as [number, number, number],
      color: "#3B82F6",
      opacity: 0.22,
    });

    const r2 = radius * 1.5;
    const pts2 = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts2.push(new THREE.Vector3(r2 * Math.cos(theta), 0, r2 * Math.sin(theta)));
    }
    rings.push({
      geometry: new THREE.BufferGeometry().setFromPoints(pts2),
      rotation: [-0.45, -0.3, 0.15] as [number, number, number],
      color: "#6366F1",
      opacity: 0.16,
    });

    return rings;
  }, [radius]);

  useFrame((_, delta) => {
    if (orbitsGroupRef.current) {
      orbitsGroupRef.current.rotation.y += delta * 0.02;
    }

    // Animate photon along US-India bridge
    if (photonRef.current && curve) {
      photonProgress.current = (photonProgress.current + delta * 0.3) % 1;
      const point = curve.getPoint(photonProgress.current);
      photonRef.current.position.copy(point);
    }
  });

  // Curved line object for US-India connection
  const bridgeLine = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color: "#38BDF8",
      transparent: true,
      opacity: 0.65,
    });
    return new THREE.Line(bridgeGeometry, mat);
  }, [bridgeGeometry]);

  return (
    <group>
      {/* Dynamic US -> India Capital Flow Bridge */}
      <primitive object={bridgeLine} />

      {/* Travelling Capital Pulse / Photon */}
      <mesh ref={photonRef}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color="#38BDF8" />
      </mesh>

      {/* Orbital Data Rings */}
      <group ref={orbitsGroupRef}>
        {outerOrbits.map((ring, idx) => (
          <group key={idx} rotation={ring.rotation}>
            <lineLoop geometry={ring.geometry}>
              <lineBasicMaterial
                color={ring.color}
                transparent
                opacity={ring.opacity}
              />
            </lineLoop>
          </group>
        ))}
      </group>
    </group>
  );
}
