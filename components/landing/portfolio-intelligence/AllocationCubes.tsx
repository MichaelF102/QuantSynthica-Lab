"use client";

import React, { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import {
  PORTFOLIO_VISUAL_CONFIG,
  AssetClassConfig,
  SectorConfig,
  PortfolioAssetDetail,
} from "@/lib/portfolio/portfolioVisualConfig";

interface AllocationCubesProps {
  drilldownLevel: number; // 0 = Asset Classes, 1 = Sectors, 2 = Individual Assets
  selectedAssetClass: "equity" | "factors" | "options" | "cash" | null;
  selectedSector: string | null;
  selectedAsset: string | null;
  onDrilldown: (level: number, id: string) => void;
  assetClassWeights: {
    equity: number;
    factors: number;
    options: number;
    cash: number;
  };
  allocations: {
    id: string;
    name: string;
    company: string;
    weight: number;
    color: string;
  }[];
}

// Single futuristic glass cube component
function GlassCube({
  position,
  size,
  color,
  glowColor,
  label,
  sublabel,
  badgeText,
  isSelected,
  isDimmed,
  onClick,
  onPointerOver,
  onPointerOut,
  children,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  glowColor: string;
  label: string;
  sublabel?: string;
  badgeText?: string;
  isSelected?: boolean;
  isDimmed?: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
  children?: React.ReactNode;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Smooth lerp on hover / selection
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const targetScale = hovered ? 1.05 : isSelected ? 1.03 : 1.0;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 8);

    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      const targetEmissive = hovered ? 0.9 : isSelected ? 0.7 : 0.35;
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetEmissive, delta * 6);
      mat.opacity = isDimmed ? 0.35 : 0.85;
    }

    if (edgesRef.current) {
      const edgeMat = edgesRef.current.material as THREE.LineBasicMaterial;
      edgeMat.opacity = isDimmed ? 0.2 : hovered ? 0.95 : 0.65;
    }
  });

  const [w, h, d] = size;

  return (
    <group ref={groupRef} position={position}>
      {/* 1. Translucent Cyber Glass Box */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onPointerOver();
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          onPointerOut();
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={color}
          emissive={glowColor}
          emissiveIntensity={0.35}
          roughness={0.15}
          metalness={0.2}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* 2. Glowing Edges */}
      <lineSegments ref={edgesRef}>
        <edgesGeometry args={[new THREE.BoxGeometry(w * 1.002, h * 1.002, d * 1.002)]} />
        <lineBasicMaterial color={glowColor} transparent opacity={0.65} linewidth={2} />
      </lineSegments>

      {/* 3. Subtle Inner Glowing Core */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[w * 0.7, h * 0.7, d * 0.7]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Sub-blocks or visual accents on top (e.g. sector preview steps) */}
      {children}

      {/* 4. Floating 3D Badge Label */}
      <Html
        position={[0, h / 2 + 0.28, 0]}
        center
        distanceFactor={7.5}
        className="pointer-events-none select-none"
      >
        <div
          className={`flex flex-col items-center px-2.5 py-1 rounded-xl backdrop-blur-md border shadow-lg transition-all duration-200 whitespace-nowrap ${
            hovered || isSelected
              ? "bg-[#07111F]/95 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,229,255,0.4)] scale-105"
              : "bg-[#07111F]/80 border-slate-700/80 text-slate-200"
          }`}
        >
          <div className="flex items-center gap-1.5 leading-none">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: glowColor }} />
            <span className="text-[11px] font-black tracking-tight">{label}</span>
          </div>
          {sublabel && (
            <span className="text-[9.5px] font-mono font-bold text-cyan-300 mt-0.5 leading-none">
              {sublabel}
            </span>
          )}
          {badgeText && (
            <span className="text-[8px] font-medium text-slate-400 mt-0.5 leading-none">
              {badgeText}
            </span>
          )}
        </div>
      </Html>
    </group>
  );
}

export default function AllocationCubes({
  drilldownLevel,
  selectedAssetClass,
  selectedSector,
  selectedAsset,
  onDrilldown,
  assetClassWeights,
  allocations,
}: AllocationCubesProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Compute total portfolio value and amounts
  const totalValue = PORTFOLIO_VISUAL_CONFIG.totalPortfolioValue;

  // Level 0: The 4 Primary Asset Class Cubes
  // Proportional sizing based on weights
  const assetClassCubes = useMemo(() => {
    const eqWeight = assetClassWeights.equity;
    const facWeight = assetClassWeights.factors;
    const optWeight = assetClassWeights.options;
    const cashWeight = assetClassWeights.cash;

    return [
      {
        id: "equity",
        label: "Equity",
        weight: eqWeight,
        sublabel: `${eqWeight.toFixed(1)}%`,
        badgeText: "6 Assets • Click to Drill",
        color: "#1769FF",
        glowColor: "#00E5FF",
        // Position: front left
        position: [-1.4, 0.45, 0.4] as [number, number, number],
        size: [2.3, 1.5, 2.1] as [number, number, number],
      },
      {
        id: "factors",
        label: "Factors",
        weight: facWeight,
        sublabel: `${facWeight.toFixed(1)}%`,
        badgeText: "3 Tilt Signals",
        color: "#8B5CF6",
        glowColor: "#C084FC",
        // Position: back right
        position: [1.35, 0.4, -0.9] as [number, number, number],
        size: [1.85, 1.35, 1.7] as [number, number, number],
      },
      {
        id: "options",
        label: "Options",
        weight: optWeight,
        sublabel: `${optWeight.toFixed(1)}%`,
        badgeText: "Overlays & Hedging",
        color: "#F59E0B",
        glowColor: "#FBBF24",
        // Position: front center-right
        position: [0.65, 0.15, 1.25] as [number, number, number],
        size: [1.5, 1.1, 1.45] as [number, number, number],
      },
      {
        id: "cash",
        label: "Cash",
        weight: cashWeight,
        sublabel: `${cashWeight.toFixed(1)}%`,
        badgeText: "Liquid Reserves",
        color: "#10B981",
        glowColor: "#34D399",
        // Position: front far-right
        position: [1.9, -0.05, 1.35] as [number, number, number],
        size: [1.25, 0.9, 1.25] as [number, number, number],
      },
    ];
  }, [assetClassWeights]);

  // Level 1: Sector Cubes (When Equity is chosen)
  const sectorCubes = useMemo(() => {
    const sectors = PORTFOLIO_VISUAL_CONFIG.sectors;
    // Layout 7 sectors across the platform
    const positions: [number, number, number][] = [
      [-1.4, 0.65, -0.2], // Tech (dominant, center left)
      [0.9, 0.45, -0.8],  // Financials
      [-1.7, 0.25, 1.3],  // Consumer
      [1.6, 0.15, 0.8],   // Healthcare
      [0.0, 0.05, 1.5],   // Industrials
      [-0.1, 0.05, -1.3], // Energy
      [1.85, -0.05, -0.6],// Other
    ];

    return sectors.map((sec, idx) => {
      // Scale size proportional to weight (e.g. 31% is size 1.6, 5% is size 0.75)
      const baseScale = 0.65 + (sec.weight / 31) * 0.95;
      return {
        id: sec.id,
        name: sec.name,
        weight: sec.weight,
        sublabel: `${sec.weight.toFixed(1)}%`,
        badgeText: `${sec.holdings.length ? `${sec.holdings.join(", ")}` : "Sector Tilt"}`,
        color: sec.color,
        glowColor: sec.glowColor,
        position: positions[idx % positions.length],
        size: [baseScale * 1.15, baseScale * 1.05, baseScale * 1.15] as [number, number, number],
      };
    });
  }, []);

  // Level 2: Individual Asset Cubes
  const assetCubes = useMemo(() => {
    // Current allocations from left panel or default config
    const positions: [number, number, number][] = [
      [-1.6, 0.55, 0.2],  // RELIANCE
      [-0.3, 0.75, -0.8], // NVDA
      [1.2, 0.45, -0.4],  // HDFC
      [1.6, 0.25, 1.1],   // SPY
      [-1.5, 0.15, 1.4],  // AAPL
      [-0.1, 0.35, 1.2],  // TCS
      [0.9, 0.15, 1.5],   // INFY
    ];

    return allocations.map((asset, idx) => {
      const amount = (asset.weight / 100) * totalValue;
      const formattedAmount = `₹${(amount).toLocaleString("en-IN")}`;
      const scale = 0.7 + (asset.weight / 20) * 0.7;

      return {
        id: asset.id,
        name: asset.id,
        company: asset.company,
        weight: asset.weight,
        sublabel: `${asset.weight.toFixed(1)}%`,
        badgeText: formattedAmount,
        color: asset.color,
        glowColor: asset.color,
        position: positions[idx % positions.length] || [0, 0, 0],
        size: [scale * 1.1, scale * 1.0, scale * 1.1] as [number, number, number],
      };
    });
  }, [allocations, totalValue]);

  // RENDER LEVEL 0: Asset Class Cubes
  if (drilldownLevel === 0) {
    return (
      <group>
        {assetClassCubes.map((cube) => (
          <GlassCube
            key={cube.id}
            position={cube.position}
            size={cube.size}
            color={cube.color}
            glowColor={cube.glowColor}
            label={cube.label}
            sublabel={cube.sublabel}
            badgeText={cube.badgeText}
            isSelected={selectedAssetClass === cube.id}
            isDimmed={hoveredId !== null && hoveredId !== cube.id}
            onClick={() => onDrilldown(1, cube.id)}
            onPointerOver={() => setHoveredId(cube.id)}
            onPointerOut={() => setHoveredId(null)}
          >
            {/* If Equity, render mini embossed preview step blocks on top representing sectors */}
            {cube.id === "equity" && (
              <group position={[0, cube.size[1] / 2 + 0.08, 0]}>
                {/* Tech step */}
                <mesh position={[-0.45, 0.06, -0.4]}>
                  <boxGeometry args={[0.7, 0.12, 0.7]} />
                  <meshStandardMaterial color="#00E5FF" emissive="#00E5FF" emissiveIntensity={0.6} />
                </mesh>
                {/* Financials step */}
                <mesh position={[0.45, 0.05, -0.4]}>
                  <boxGeometry args={[0.65, 0.1, 0.65]} />
                  <meshStandardMaterial color="#3B82F6" emissive="#3B82F6" emissiveIntensity={0.5} />
                </mesh>
                {/* Consumer step */}
                <mesh position={[-0.45, 0.04, 0.4]}>
                  <boxGeometry args={[0.6, 0.08, 0.6]} />
                  <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={0.5} />
                </mesh>
                {/* Healthcare step */}
                <mesh position={[0.45, 0.03, 0.4]}>
                  <boxGeometry args={[0.55, 0.06, 0.55]} />
                  <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={0.5} />
                </mesh>
              </group>
            )}
          </GlassCube>
        ))}
      </group>
    );
  }

  // RENDER LEVEL 1: Sector Cubes
  if (drilldownLevel === 1) {
    return (
      <group>
        {sectorCubes.map((sec) => (
          <GlassCube
            key={sec.id}
            position={sec.position}
            size={sec.size}
            color={sec.color}
            glowColor={sec.glowColor}
            label={sec.name}
            sublabel={sec.sublabel}
            badgeText={sec.badgeText}
            isSelected={selectedSector === sec.id}
            isDimmed={hoveredId !== null && hoveredId !== sec.id}
            onClick={() => onDrilldown(2, sec.id)}
            onPointerOver={() => setHoveredId(sec.id)}
            onPointerOut={() => setHoveredId(null)}
          />
        ))}
      </group>
    );
  }

  // RENDER LEVEL 2: Individual Asset Cubes
  return (
    <group>
      {assetCubes.map((asset) => (
        <GlassCube
          key={asset.id}
          position={asset.position}
          size={asset.size}
          color={asset.color}
          glowColor={asset.glowColor}
          label={asset.name}
          sublabel={asset.sublabel}
          badgeText={asset.badgeText}
          isSelected={selectedAsset === asset.id}
          isDimmed={hoveredId !== null && hoveredId !== asset.id}
          onClick={() => onDrilldown(3, asset.id)}
          onPointerOver={() => setHoveredId(asset.id)}
          onPointerOut={() => setHoveredId(null)}
        />
      ))}
    </group>
  );
}
