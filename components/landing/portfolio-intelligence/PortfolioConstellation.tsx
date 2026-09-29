"use client";

import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

export interface AssetAllocation {
  id: string;
  name: string;
  company: string;
  weight: number; // e.g. 18.4
  color: string;
  riskContrib: number; // e.g. 12.7
  volatility: number; // e.g. 24.1
  correlation: number; // e.g. 0.62
  position: [number, number, number];
}

interface PortfolioConstellationProps {
  allocations: AssetAllocation[];
  selectedAsset: string | null;
  onSelectAsset: (id: string) => void;
}

export default function PortfolioConstellation({
  allocations,
  selectedAsset,
  onSelectAsset,
}: PortfolioConstellationProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.z = time * 0.05;
    }
  });

  // Correlated pairs to connect
  const correlations: [string, string][] = [
    ["RELIANCE", "HDFC"],
    ["TCS", "INFY"],
    ["AAPL", "NVDA"],
    ["SPY", "AAPL"],
    ["SPY", "NVDA"],
    ["HDFC", "SPY"],
  ];

  const getAsset = (id: string) => allocations.find((a) => a.id === id);

  return (
    <group>
      {/* 1. Equatorial Ambient Constellation Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2.3, 0, 0]}>
        <ringGeometry args={[2.2, 2.22, 128]} />
        <meshBasicMaterial
          color="#38BDF8"
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Core-to-Asset Connection Lines */}
      {allocations.map((asset) => {
        const isHovered = hoveredId === asset.id || selectedAsset === asset.id;
        const points = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(...asset.position),
        ];
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);

        return (
          <primitive key={`line-${asset.id}`} object={new THREE.Line(
            lineGeom,
            new THREE.LineBasicMaterial({
              color: isHovered ? asset.color : "#94A3B8",
              transparent: true,
              opacity: isHovered ? 0.65 : 0.18,
              linewidth: isHovered ? 2 : 1,
            })
          )} />
        );
      })}

      {/* 3. Inter-Asset Correlation Lines */}
      {correlations.map(([id1, id2], idx) => {
        const a1 = getAsset(id1);
        const a2 = getAsset(id2);
        if (!a1 || !a2) return null;

        const isRelated =
          hoveredId === id1 ||
          hoveredId === id2 ||
          selectedAsset === id1 ||
          selectedAsset === id2;

        const points = [
          new THREE.Vector3(...a1.position),
          new THREE.Vector3(...a2.position),
        ];
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);

        return (
          <primitive key={`corr-${idx}`} object={new THREE.Line(
            lineGeom,
            new THREE.LineBasicMaterial({
              color: isRelated ? "#38BDF8" : "#CBD5E1",
              transparent: true,
              opacity: isRelated ? 0.5 : 0.12,
            })
          )} />
        );
      })}

      {/* 4. Asset Nodes */}
      {allocations.map((asset) => {
        const isHovered = hoveredId === asset.id;
        const isSelected = selectedAsset === asset.id;
        // Radius scales with weight: e.g. 7.3% -> 0.19, 18.4% -> 0.25
        const radius = 0.15 + (asset.weight / 100) * 0.45;

        return (
          <group key={asset.id} position={asset.position}>
            {/* 3D Sphere Node */}
            <mesh
              onClick={() => onSelectAsset(asset.id)}
              onPointerOver={() => setHoveredId(asset.id)}
              onPointerOut={() => setHoveredId(null)}
            >
              <sphereGeometry args={[radius, 32, 32]} />
              <meshStandardMaterial
                color={asset.color}
                emissive={asset.color}
                emissiveIntensity={isHovered || isSelected ? 1.5 : 0.8}
                roughness={0.2}
                metalness={0.7}
              />
            </mesh>

            {/* Glowing Orbit Ring Around Node */}
            <mesh rotation={[Math.PI / 3, 0, 0]}>
              <ringGeometry args={[radius * 1.3, radius * 1.4, 32]} />
              <meshBasicMaterial
                color={asset.color}
                transparent
                opacity={isHovered || isSelected ? 0.6 : 0.25}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Floating Label & Tooltip via Drei Html */}
            <Html
              position={[0, radius + 0.22, 0]}
              center
              distanceFactor={7.5}
              className="pointer-events-auto select-none"
            >
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => onSelectAsset(asset.id)}
                  onMouseEnter={() => setHoveredId(asset.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`px-2.5 py-1 rounded-lg text-left transition-all duration-200 backdrop-blur-md shadow-sm border ${
                    isSelected
                      ? "bg-slate-950 text-white border-blue-400 ring-2 ring-blue-400/30"
                      : "bg-white/95 text-[#0B1220] border-slate-200/90 hover:border-blue-300 dark:bg-[#0B1528]/95 dark:text-white dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-1.5 leading-tight">
                    <span className="text-[10px] font-bold">{asset.id}</span>
                    <span
                      className={`text-[9.5px] font-black ${
                        isSelected ? "text-blue-300" : "text-[#1769FF]"
                      }`}
                    >
                      {asset.weight.toFixed(1)}%
                    </span>
                  </div>
                </button>

                {/* Hover Deep-Dive Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2.5 rounded-xl bg-slate-950/95 text-white border border-slate-800 shadow-xl backdrop-blur-md z-50 pointer-events-none text-left">
                    <div className="text-[10px] font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between">
                      <span>{asset.company}</span>
                      <span className="text-blue-400 font-mono">{asset.id}</span>
                    </div>
                    <div className="mt-1.5 space-y-1 text-[9px] text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Weight:</span>
                        <span className="font-bold text-white">{asset.weight}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Risk Contrib:</span>
                        <span className="font-bold text-teal-400">{asset.riskContrib}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Volatility:</span>
                        <span className="font-bold text-purple-400">{asset.volatility}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Correlation:</span>
                        <span className="font-bold text-blue-400">{asset.correlation}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
