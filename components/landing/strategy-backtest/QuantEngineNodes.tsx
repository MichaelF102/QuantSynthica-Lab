"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Code2, BarChart2, TrendingUp, Check, Coins, Layers, Activity, Database } from "lucide-react";

interface QuantEngineNodesProps {
  activeStage: number; // 1, 2, 3
  onSelectStage: (stage: number) => void;
}

// 8 Floating Market & Asset Data Nodes
const MARKET_NODES = [
  // Left: Markets
  {
    id: "nse",
    title: "NSE 🇮🇳",
    type: "Market Data",
    pos: [-3.05, 1.1, -0.2] as [number, number, number],
    color: "#38BDF8",
  },
  {
    id: "bse",
    title: "BSE 🇮🇳",
    type: "Market Data",
    pos: [-3.3, 0.45, -0.2] as [number, number, number],
    color: "#38BDF8",
  },
  {
    id: "sp500",
    title: "S&P 500 🇺🇸",
    type: "Market Data",
    pos: [-3.25, -0.25, -0.2] as [number, number, number],
    color: "#38BDF8",
  },
  {
    id: "nasdaq",
    title: "NASDAQ 🇺🇸",
    type: "Market Data",
    pos: [-2.95, -0.95, -0.2] as [number, number, number],
    color: "#38BDF8",
  },
  // Right: Asset Classes
  {
    id: "crypto",
    title: "Crypto",
    type: "Digital Assets",
    pos: [3.05, 1.1, -0.2] as [number, number, number],
    color: "#F59E0B",
    icon: Coins,
  },
  {
    id: "commodities",
    title: "Commodities",
    type: "Gold, Crude, Metals",
    pos: [3.3, 0.45, -0.2] as [number, number, number],
    color: "#F59E0B",
    icon: Layers,
  },
  {
    id: "forex",
    title: "Forex",
    type: "G10 & EM Pairs",
    pos: [3.25, -0.25, -0.2] as [number, number, number],
    color: "#38BDF8",
    icon: Activity,
  },
  {
    id: "macro",
    title: "Macro Data",
    type: "Rates, Inflation",
    pos: [2.95, -0.95, -0.2] as [number, number, number],
    color: "#60A5FA",
    icon: Database,
  },
];

export default function QuantEngineNodes({
  activeStage,
  onSelectStage,
}: QuantEngineNodesProps) {
  const pulseRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (pulseRef.current) {
      const time = state.clock.getElapsedTime();
      // Gentle floating breathing for nodes
      pulseRef.current.position.y = Math.sin(time * 1.5) * 0.03;
    }
  });

  return (
    <group ref={pulseRef}>
      {/* ============================================================ */}
      {/* 1. CURVED CONNECTOR FIBER LINES (Market/Asset nodes to Engine) */}
      {/* ============================================================ */}
      {MARKET_NODES.map((node) => {
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(...node.pos),
          new THREE.Vector3(node.pos[0] * 0.45, node.pos[1] * 0.25, 0.2),
          new THREE.Vector3(node.pos[0] > 0 ? 0.9 : -0.9, 0, 0)
        );
        const points = curve.getPoints(24);
        const lineGeom = new THREE.BufferGeometry().setFromPoints(points);

        return (
          <primitive
            key={`curve-${node.id}`}
            object={
              new THREE.Line(
                lineGeom,
                new THREE.LineBasicMaterial({
                  color: node.color,
                  transparent: true,
                  opacity: 0.24,
                  linewidth: 1,
                })
              )
            }
          />
        );
      })}

      {/* Primary Node 1 Spoke (Engine to BUILD top) */}
      <primitive
        object={
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(0, 0.9, 0),
              new THREE.Vector3(0, 1.85, 0.2),
            ]),
            new THREE.LineBasicMaterial({
              color: "#00E5FF",
              transparent: true,
              opacity: activeStage === 1 ? 0.75 : 0.25,
            })
          )
        }
      />

      {/* Primary Node 2 Spoke (Engine to TEST left) */}
      <primitive
        object={
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(-0.9, 0, 0),
              new THREE.Vector3(-2.15, -0.2, 0.2),
            ]),
            new THREE.LineBasicMaterial({
              color: "#A855F7",
              transparent: true,
              opacity: activeStage === 2 ? 0.85 : 0.25,
            })
          )
        }
      />

      {/* Primary Node 3 Spoke (Engine to EVALUATE right) */}
      <primitive
        object={
          new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([
              new THREE.Vector3(0.9, 0, 0),
              new THREE.Vector3(2.15, -0.2, 0.2),
            ]),
            new THREE.LineBasicMaterial({
              color: "#10B981",
              transparent: true,
              opacity: activeStage === 3 ? 0.85 : 0.25,
            })
          )
        }
      />

      {/* ============================================================ */}
      {/* 2. SURROUNDING MARKET DATA FLOATING PILLS */}
      {/* ============================================================ */}
      {MARKET_NODES.map((node) => {
        const Icon = node.icon;
        const isRight = node.pos[0] > 0;

        return (
          <group key={node.id} position={node.pos}>
            {/* Small glowing 3D anchor sphere */}
            <mesh>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshBasicMaterial color={node.color} />
            </mesh>

            {/* Floating HTML Badge */}
            <Html
              position={[0, 0, 0]}
              center
              distanceFactor={8.2}
              className="pointer-events-none select-none"
            >
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#07111F]/90 border border-slate-700/80 shadow-md backdrop-blur-md whitespace-nowrap ${
                  isRight ? "translate-x-1" : "-translate-x-1"
                }`}
              >
                {Icon ? (
                  <Icon className="w-3 h-3 text-amber-400" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                )}
                <span className="text-[9.5px] font-bold text-white tracking-wide">
                  {node.title}
                </span>
              </div>
            </Html>
          </group>
        );
      })}

      {/* ============================================================ */}
      {/* 3. PRIMARY WORKFLOW NODE 1: BUILD (Top) */}
      {/* ============================================================ */}
      <group position={[0, 1.85, 0.2]}>
        {/* Interactive 3D Sphere */}
        <mesh onClick={() => onSelectStage(1)}>
          <sphereGeometry args={[activeStage === 1 ? 0.32 : 0.26, 32, 32]} />
          <meshStandardMaterial
            color="#00E5FF"
            emissive="#00E5FF"
            emissiveIntensity={activeStage === 1 ? 1.6 : 0.8}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Orbit ring around Node 1 */}
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <ringGeometry args={[0.38, 0.42, 32]} />
          <meshBasicMaterial
            color="#00E5FF"
            transparent
            opacity={activeStage === 1 ? 0.85 : 0.35}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Node Center Icon Emblem */}
        <Html position={[0, 0, 0]} center distanceFactor={7.5} className="pointer-events-none select-none">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#07111F]/90 text-cyan-400 border border-cyan-400/60 shadow-md">
            <Code2 className="w-3 h-3" />
          </div>
        </Html>

        {/* Floating Checklist Card */}
        <Html
          position={[1.35, 0.1, 0]}
          center
          distanceFactor={7.5}
          className="select-none"
        >
          <button
            onClick={() => onSelectStage(1)}
            className={`w-[145px] text-left p-2.5 rounded-2xl bg-[#07111F]/95 backdrop-blur-md border transition-all duration-200 cursor-pointer shadow-xl ${
              activeStage === 1
                ? "border-cyan-400/80 ring-2 ring-cyan-500/30 scale-102"
                : "border-slate-800 hover:border-cyan-500/50 opacity-85 hover:opacity-100"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-md bg-cyan-500/20 text-cyan-400 text-[9px] font-bold">
                  01
                </span>
                <span className="text-[10px] font-extrabold text-white tracking-wider uppercase">
                  BUILD
                </span>
              </div>
              <div className="text-[8px] text-cyan-300 font-medium">Rules</div>
            </div>

            {/* Checklist */}
            <div className="mt-1.5 space-y-0.5 text-[8.5px] text-slate-300">
              <div className="flex items-center gap-1">
                <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                <span className="truncate">Define strategy logic</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                <span className="truncate">Select indicators</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                <span className="truncate">Set parameters</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                <span className="truncate">Risk management</span>
              </div>
            </div>
          </button>
        </Html>
      </group>

      {/* ============================================================ */}
      {/* 4. PRIMARY WORKFLOW NODE 2: TEST (Left) */}
      {/* ============================================================ */}
      <group position={[-2.15, -0.2, 0.2]}>
        {/* Interactive 3D Sphere */}
        <mesh onClick={() => onSelectStage(2)}>
          <sphereGeometry args={[activeStage === 2 ? 0.32 : 0.26, 32, 32]} />
          <meshStandardMaterial
            color="#A855F7"
            emissive="#A855F7"
            emissiveIntensity={activeStage === 2 ? 1.6 : 0.8}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Orbit ring around Node 2 */}
        <mesh rotation={[Math.PI / 4, Math.PI / 6, 0]}>
          <ringGeometry args={[0.38, 0.42, 32]} />
          <meshBasicMaterial
            color="#A855F7"
            transparent
            opacity={activeStage === 2 ? 0.85 : 0.35}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Node Center Icon Emblem */}
        <Html position={[0, 0, 0]} center distanceFactor={7.5} className="pointer-events-none select-none">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#07111F]/90 text-purple-400 border border-purple-400/60 shadow-md">
            <BarChart2 className="w-3 h-3" />
          </div>
        </Html>

        {/* Floating Checklist Card */}
        <Html
          position={[-0.1, -0.9, 0]}
          center
          distanceFactor={7.5}
          className="select-none"
        >
          <button
            onClick={() => onSelectStage(2)}
            className={`w-[145px] text-left p-2.5 rounded-2xl bg-[#07111F]/95 backdrop-blur-md border transition-all duration-200 cursor-pointer shadow-xl ${
              activeStage === 2
                ? "border-purple-400/80 ring-2 ring-purple-500/30 scale-102"
                : "border-slate-800 hover:border-purple-500/50 opacity-85 hover:opacity-100"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-md bg-purple-500/20 text-purple-400 text-[9px] font-bold">
                  02
                </span>
                <span className="text-[10px] font-extrabold text-white tracking-wider uppercase">
                  TEST
                </span>
              </div>
              <div className="text-[8px] text-purple-300 font-medium">Historical</div>
            </div>

            {/* Checklist */}
            <div className="mt-1.5 space-y-0.5 text-[8.5px] text-slate-300">
              <div className="flex items-center gap-1">
                <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                <span className="truncate">Run backtest</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                <span className="truncate">Execute trades</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                <span className="truncate">Analyse performance</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                <span className="truncate">Validate robustness</span>
              </div>
            </div>
          </button>
        </Html>
      </group>

      {/* ============================================================ */}
      {/* 5. PRIMARY WORKFLOW NODE 3: EVALUATE (Right) */}
      {/* ============================================================ */}
      <group position={[2.15, -0.2, 0.2]}>
        {/* Interactive 3D Sphere */}
        <mesh onClick={() => onSelectStage(3)}>
          <sphereGeometry args={[activeStage === 3 ? 0.32 : 0.26, 32, 32]} />
          <meshStandardMaterial
            color="#10B981"
            emissive="#10B981"
            emissiveIntensity={activeStage === 3 ? 1.6 : 0.8}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Orbit ring around Node 3 */}
        <mesh rotation={[-Math.PI / 4, -Math.PI / 6, 0]}>
          <ringGeometry args={[0.38, 0.42, 32]} />
          <meshBasicMaterial
            color="#10B981"
            transparent
            opacity={activeStage === 3 ? 0.85 : 0.35}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Node Center Icon Emblem */}
        <Html position={[0, 0, 0]} center distanceFactor={7.5} className="pointer-events-none select-none">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#07111F]/90 text-teal-400 border border-teal-400/60 shadow-md">
            <TrendingUp className="w-3 h-3" />
          </div>
        </Html>

        {/* Floating Checklist Card */}
        <Html
          position={[0.1, -0.9, 0]}
          center
          distanceFactor={7.5}
          className="select-none"
        >
          <button
            onClick={() => onSelectStage(3)}
            className={`w-[145px] text-left p-2.5 rounded-2xl bg-[#07111F]/95 backdrop-blur-md border transition-all duration-200 cursor-pointer shadow-xl ${
              activeStage === 3
                ? "border-teal-400/80 ring-2 ring-teal-500/30 scale-102"
                : "border-slate-800 hover:border-teal-500/50 opacity-85 hover:opacity-100"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-md bg-teal-500/20 text-teal-400 text-[9px] font-bold">
                  03
                </span>
                <span className="text-[10px] font-extrabold text-white tracking-wider uppercase">
                  EVALUATE
                </span>
              </div>
              <div className="text-[8px] text-teal-300 font-medium">Risk</div>
            </div>

            {/* Checklist */}
            <div className="mt-1.5 space-y-0.5 text-[8.5px] text-slate-300">
              <div className="flex items-center gap-1">
                <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                <span className="truncate">Key metrics</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                <span className="truncate">Risk analysis</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                <span className="truncate">Statistical validation</span>
              </div>
              <div className="flex items-center gap-1">
                <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                <span className="truncate">Compare & optimise</span>
              </div>
            </div>
          </button>
        </Html>
      </group>
    </group>
  );
}
