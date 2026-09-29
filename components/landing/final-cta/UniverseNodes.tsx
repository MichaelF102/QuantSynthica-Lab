"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { BarChart3, FlaskConical, FileText, LineChart, Shield, Layers } from "lucide-react";

interface UniverseNodeData {
  id: string;
  title: string;
  subtitle: string;
  details: string;
  position: [number, number, number];
  badgeOffset: [number, number, number];
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NODES: UniverseNodeData[] = [
  {
    id: "markets",
    title: "MARKETS",
    subtitle: "Global Assets",
    details: "US · India · ETFs · Futures",
    position: [-1.85, 1.25, 0.2],
    badgeOffset: [0, 0.42, 0],
    color: "#00E5FF",
    icon: BarChart3,
  },
  {
    id: "research",
    title: "RESEARCH",
    subtitle: "Data · Indicators",
    details: "Quant Labs · Insights",
    position: [1.85, 1.25, 0.2],
    badgeOffset: [0, 0.42, 0],
    color: "#A855F7",
    icon: FlaskConical,
  },
  {
    id: "strategies",
    title: "STRATEGIES",
    subtitle: "Ideas · Rules · Signals",
    details: "Multi-Asset Strategies",
    position: [2.55, 0.1, 0.2],
    badgeOffset: [0.3, 0.38, 0],
    color: "#3B82F6",
    icon: FileText,
  },
  {
    id: "backtests",
    title: "BACKTESTS",
    subtitle: "Historical Data",
    details: "Performance · Robustness",
    position: [1.65, -1.25, 0.2],
    badgeOffset: [0, -0.44, 0],
    color: "#6366F1",
    icon: LineChart,
  },
  {
    id: "risk",
    title: "RISK",
    subtitle: "VaR · Drawdown",
    details: "Stress Testing",
    position: [-1.65, -1.25, 0.2],
    badgeOffset: [0, -0.44, 0],
    color: "#EF4444",
    icon: Shield,
  },
  {
    id: "portfolio",
    title: "PORTFOLIO",
    subtitle: "Allocation · Optimization",
    details: "Diversification",
    position: [-2.55, 0.1, 0.2],
    badgeOffset: [-0.3, 0.38, 0],
    color: "#10B981",
    icon: Layers,
  },
];

export default function UniverseNodes() {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = time * 0.05;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -time * 0.04;
    }
  });

  return (
    <group>
      {/* 1. Large Planetary Orbital Rings */}
      <group rotation={[Math.PI / 2.7, Math.PI / 8, 0]}>
        <mesh ref={ring1Ref}>
          <ringGeometry args={[2.7, 2.73, 128]} />
          <meshBasicMaterial
            color="#38BDF8"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh ref={ring2Ref}>
          <ringGeometry args={[2.3, 2.32, 128]} />
          <meshBasicMaterial
            color="#818CF8"
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 2. Central Spoke Lines */}
      {NODES.map((node) => {
        const points = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(...node.position),
        ];
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);

        return (
          <primitive
            key={`spoke-${node.id}`}
            object={
              new THREE.Line(
                lineGeom,
                new THREE.LineBasicMaterial({
                  color: node.color,
                  transparent: true,
                  opacity: 0.22,
                  linewidth: 1,
                })
              )
            }
          />
        );
      })}

      {/* 3. Outer Ring Connection between sequential nodes */}
      {NODES.map((node, i) => {
        const nextNode = NODES[(i + 1) % NODES.length];
        const points = [
          new THREE.Vector3(...node.position),
          new THREE.Vector3(...nextNode.position),
        ];
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);

        return (
          <primitive
            key={`ring-seg-${i}`}
            object={
              new THREE.Line(
                lineGeom,
                new THREE.LineBasicMaterial({
                  color: "#94A3B8",
                  transparent: true,
                  opacity: 0.15,
                  linewidth: 1,
                })
              )
            }
          />
        );
      })}

      {/* 4. Six Orbiting Nodes & Badges */}
      {NODES.map((node) => {
        const Icon = node.icon;
        return (
          <group key={node.id} position={node.position}>
            {/* 3D Sphere Node */}
            <mesh>
              <sphereGeometry args={[0.22, 32, 32]} />
              <meshStandardMaterial
                color={node.color}
                emissive={node.color}
                emissiveIntensity={1.4}
                roughness={0.2}
                metalness={0.7}
              />
            </mesh>

            {/* Glowing Ring around node */}
            <mesh rotation={[Math.PI / 3, 0, 0]}>
              <ringGeometry args={[0.3, 0.33, 32]} />
              <meshBasicMaterial
                color={node.color}
                transparent
                opacity={0.4}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* HTML Metadata Badge */}
            <Html
              position={node.badgeOffset}
              center
              distanceFactor={7.5}
              className="pointer-events-none select-none"
            >
              <div className="flex flex-col items-center text-center whitespace-nowrap">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700/80 shadow-lg">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: node.color }}
                  >
                    <Icon className="w-2.5 h-2.5" />
                  </div>
                  <span className="text-[10px] font-black text-white tracking-wider">
                    {node.title}
                  </span>
                </div>
                <div className="mt-1 px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-800 text-[8.5px] text-slate-300 backdrop-blur-xs">
                  <span className="font-semibold text-slate-200">{node.subtitle}</span>
                  <span className="text-slate-400 mx-1">·</span>
                  <span className="text-slate-400">{node.details}</span>
                </div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
