"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { BarChart3, Activity, TrendingDown, Zap } from "lucide-react";
import { RiskState } from "./RiskNavigation";

interface RiskOrbitsProps {
  activeRisk: RiskState;
  onSelectRisk: (state: RiskState) => void;
}

export default function RiskOrbits({ activeRisk, onSelectRisk }: RiskOrbitsProps) {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = time * 0.08;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -time * 0.06;
    }
  });

  return (
    <group>
      {/* 1. Large Inclined Orbital Rings (Astrological / Planetary Data Rings) */}
      <group rotation={[Math.PI / 3.4, Math.PI / 6, 0]}>
        {/* Outer Ring */}
        <mesh ref={ring1Ref}>
          <ringGeometry args={[2.5, 2.54, 128]} />
          <meshBasicMaterial
            color="#38BDF8"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Inner Ring */}
        <mesh ref={ring2Ref}>
          <ringGeometry args={[2.1, 2.13, 128]} />
          <meshBasicMaterial
            color="#818CF8"
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 2. Elliptical Equatorial Ambient Halo */}
      <group rotation={[Math.PI / 2.2, 0, 0]}>
        <mesh>
          <ringGeometry args={[1.8, 1.83, 128]} />
          <meshBasicMaterial
            color="#C084FC"
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* ============================================================ */}
      {/* ORBIT NODE 1: VaR (TOP) */}
      {/* ============================================================ */}
      <group position={[0.15, 1.7, 0.2]}>
        <mesh onClick={() => onSelectRisk("var")}>
          <sphereGeometry args={[0.24, 32, 32]} />
          <meshStandardMaterial
            color="#1D4ED8"
            emissive="#2563EB"
            emissiveIntensity={activeRisk === "var" ? 1.4 : 0.8}
            roughness={0.2}
            metalness={0.6}
          />
        </mesh>
        <Html
          position={[0, 0.42, 0]}
          center
          distanceFactor={7.2}
          className="pointer-events-auto select-none"
        >
          <button
            type="button"
            onClick={() => onSelectRisk("var")}
            className={`group text-left px-3.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md shadow-md border transition-all duration-200 cursor-pointer ${
              activeRisk === "var"
                ? "border-blue-500 shadow-blue-500/20 ring-2 ring-blue-500/20"
                : "border-slate-200 hover:border-blue-300"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500">VaR</span>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            </div>
            <div className="text-sm font-black text-[#1769FF] tracking-tight leading-tight">
              -3.2%
            </div>
            <div className="text-[9px] text-slate-400 font-medium">95% 1-day VaR</div>
          </button>
        </Html>
      </group>

      {/* ============================================================ */}
      {/* ORBIT NODE 2: VOLATILITY (LEFT) */}
      {/* ============================================================ */}
      <group position={[-2.2, 0.25, 0.3]}>
        <mesh onClick={() => onSelectRisk("volatility")}>
          <sphereGeometry args={[0.22, 32, 32]} />
          <meshStandardMaterial
            color="#0F766E"
            emissive="#0D9488"
            emissiveIntensity={activeRisk === "volatility" ? 1.4 : 0.8}
            roughness={0.2}
            metalness={0.6}
          />
        </mesh>
        <Html
          position={[-0.75, 0.05, 0]}
          center
          distanceFactor={7.2}
          className="pointer-events-auto select-none"
        >
          <button
            type="button"
            onClick={() => onSelectRisk("volatility")}
            className={`group text-left px-3.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md shadow-md border transition-all duration-200 cursor-pointer ${
              activeRisk === "volatility"
                ? "border-teal-500 shadow-teal-500/20 ring-2 ring-teal-500/20"
                : "border-slate-200 hover:border-teal-300"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500">Volatility</span>
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            </div>
            <div className="text-sm font-black text-[#0D9488] tracking-tight leading-tight">
              24.8%
            </div>
            <div className="text-[9px] text-slate-400 font-medium">Annualized Volatility</div>
          </button>
        </Html>
      </group>

      {/* ============================================================ */}
      {/* ORBIT NODE 3: DRAWDOWN (RIGHT) */}
      {/* ============================================================ */}
      <group position={[2.2, 0.25, 0.2]}>
        <mesh onClick={() => onSelectRisk("drawdown")}>
          <sphereGeometry args={[0.22, 32, 32]} />
          <meshStandardMaterial
            color="#6B21A8"
            emissive="#7C3AED"
            emissiveIntensity={activeRisk === "drawdown" ? 1.4 : 0.8}
            roughness={0.2}
            metalness={0.6}
          />
        </mesh>
        <Html
          position={[0.75, 0.05, 0]}
          center
          distanceFactor={7.2}
          className="pointer-events-auto select-none"
        >
          <button
            type="button"
            onClick={() => onSelectRisk("drawdown")}
            className={`group text-left px-3.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md shadow-md border transition-all duration-200 cursor-pointer ${
              activeRisk === "drawdown"
                ? "border-purple-500 shadow-purple-500/20 ring-2 ring-purple-500/20"
                : "border-slate-200 hover:border-purple-300"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500">Drawdown</span>
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            </div>
            <div className="text-sm font-black text-[#7C3AED] tracking-tight leading-tight">
              -11.4%
            </div>
            <div className="text-[9px] text-slate-400 font-medium">Max Drawdown</div>
          </button>
        </Html>
      </group>

      {/* ============================================================ */}
      {/* ORBIT NODE 4: STRESS TESTING (BOTTOM) */}
      {/* ============================================================ */}
      <group position={[0.0, -1.55, 0.35]}>
        <mesh onClick={() => onSelectRisk("stress")}>
          <sphereGeometry args={[0.24, 32, 32]} />
          <meshStandardMaterial
            color="#DC2626"
            emissive="#EF4444"
            emissiveIntensity={activeRisk === "stress" ? 1.6 : 0.9}
            roughness={0.2}
            metalness={0.6}
          />
        </mesh>
        <Html
          position={[0.8, -0.05, 0]}
          center
          distanceFactor={7.2}
          className="pointer-events-auto select-none"
        >
          <button
            type="button"
            onClick={() => onSelectRisk("stress")}
            className={`group text-left px-3.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md shadow-md border transition-all duration-200 cursor-pointer ${
              activeRisk === "stress"
                ? "border-rose-500 shadow-rose-500/20 ring-2 ring-rose-500/20"
                : "border-slate-200 hover:border-rose-300"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500">Stress Testing</span>
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            </div>
            <div className="text-sm font-black text-[#EF4444] tracking-tight leading-tight">
              -18.7%
            </div>
            <div className="text-[9px] text-slate-400 font-medium">Extreme scenario loss</div>
          </button>
        </Html>
      </group>

      {/* ============================================================ */}
      {/* REGIME LABELS (NORMAL CONDITIONS vs STRESS CONDITIONS) */}
      {/* ============================================================ */}
      <Html position={[-1.5, -0.95, 0.4]} center distanceFactor={7.2} className="pointer-events-none select-none">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/85 backdrop-blur-xs border border-teal-200/80 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
          <span className="text-[8.5px] font-bold tracking-wider uppercase text-teal-700">NORMAL CONDITIONS</span>
        </div>
      </Html>

      <Html position={[1.5, -0.95, 0.4]} center distanceFactor={7.2} className="pointer-events-none select-none">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/85 backdrop-blur-xs border border-rose-200/80 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span className="text-[8.5px] font-bold tracking-wider uppercase text-rose-700">STRESS CONDITIONS</span>
        </div>
      </Html>
    </group>
  );
}
