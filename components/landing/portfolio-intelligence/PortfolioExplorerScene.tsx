"use client";

import React, { Suspense, useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { RotateCcw, ChevronRight, Home, Layers, PieChart, Box } from "lucide-react";
import PortfolioPlatform from "./PortfolioPlatform";
import AllocationCubes from "./AllocationCubes";
import { PORTFOLIO_VISUAL_CONFIG } from "@/lib/portfolio/portfolioVisualConfig";

interface PortfolioExplorerSceneProps {
  drilldownLevel: number;
  selectedAssetClass: "equity" | "factors" | "options" | "cash" | null;
  selectedSector: string | null;
  selectedAsset: string | null;
  onDrilldown: (level: number, id: string) => void;
  onReset: () => void;
  onSelectViewMode: (mode: "assetClass" | "sector" | "individual") => void;
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

// Camera transition rig
function DynamicCameraRig({ drilldownLevel }: { drilldownLevel: number }) {
  const targetPos = useRef(new THREE.Vector3(0, 3.2, 6.8));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (drilldownLevel === 0) {
      targetPos.current.set(0, 3.2, 6.8);
      targetLook.current.set(0, 0, 0);
    } else if (drilldownLevel === 1) {
      targetPos.current.set(-0.2, 3.8, 6.0);
      targetLook.current.set(0, 0.2, 0);
    } else {
      targetPos.current.set(0, 3.5, 5.6);
      targetLook.current.set(0, 0.25, 0);
    }
  }, [drilldownLevel]);

  useFrame((state, delta) => {
    state.camera.position.lerp(targetPos.current, delta * 3.5);
    state.camera.lookAt(targetLook.current);
  });

  return null;
}

export default function PortfolioExplorerScene({
  drilldownLevel,
  selectedAssetClass,
  selectedSector,
  selectedAsset,
  onDrilldown,
  onReset,
  onSelectViewMode,
  assetClassWeights,
  allocations,
}: PortfolioExplorerSceneProps) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleResetCamera = () => {
    onReset();
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const currentViewMode: "assetClass" | "sector" | "individual" =
    drilldownLevel === 0 ? "assetClass" : drilldownLevel === 1 ? "sector" : "individual";

  if (!mounted) {
    return (
      <div className="w-full h-[580px] lg:h-[640px] rounded-3xl bg-[#070E1A] border border-slate-800 flex items-center justify-center text-slate-400 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Initializing 3D Portfolio Explorer...</span>
        </div>
      </div>
    );
  }

  // Accessible Fallback for Mobile / WebGL Disabled
  if (isMobile) {
    return (
      <div className="w-full min-h-[500px] p-6 rounded-3xl bg-[#070E1A] border border-slate-800 text-white flex flex-col justify-between relative overflow-hidden">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                PORTFOLIO EXPLORER
              </div>
              <div className="text-[11px] text-slate-400">Hierarchy & Allocation</div>
            </div>
            <button
              onClick={onReset}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-300"
            >
              Reset
            </button>
          </div>

          {/* Asset Class List */}
          <div className="mt-4 space-y-2.5">
            <div
              onClick={() => onDrilldown(1, "equity")}
              className="p-3 rounded-2xl bg-blue-950/40 border border-blue-500/40 flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-white">Equity</div>
                <div className="text-[10px] text-slate-400">6 Assets • Technology, Financials...</div>
              </div>
              <div className="text-sm font-black text-cyan-400">{assetClassWeights.equity.toFixed(1)}%</div>
            </div>

            <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/40 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Factors</div>
                <div className="text-[10px] text-slate-400">Momentum, Quality, Low Volatility</div>
              </div>
              <div className="text-sm font-black text-purple-300">{assetClassWeights.factors.toFixed(1)}%</div>
            </div>

            <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Options</div>
                <div className="text-[10px] text-slate-400">Overlays & Tail Risk Hedges</div>
              </div>
              <div className="text-sm font-black text-amber-400">{assetClassWeights.options.toFixed(1)}%</div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Cash</div>
                <div className="text-[10px] text-slate-400">Overnight Repos & Liquid Yield</div>
              </div>
              <div className="text-sm font-black text-emerald-400">{assetClassWeights.cash.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Total Stat */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center text-xs text-slate-300 font-mono">
          Total Portfolio • 100% • ₹10,00,000
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[580px] lg:h-[640px] relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#080E1B] via-[#050912] to-[#04070E] border border-cyan-500/20 shadow-[0_12px_48px_rgba(0,0,0,0.6)]">
      {/* 1. TOP HEADER & BREADCRUMB CONTROLS (Floating Over Three.js Scene) */}
      <div className="absolute top-4 inset-x-5 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pointer-events-auto select-none">
        <div>
          {/* Eyebrow & Title */}
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-sm font-black tracking-[0.16em] text-white uppercase drop-shadow-md">
              PORTFOLIO EXPLORER
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
            Explore your portfolio from asset class → sector → individual asset.
          </p>

          {/* Interactive Breadcrumbs */}
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono font-bold">
            <button
              onClick={() => onDrilldown(0, "portfolio")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
                drilldownLevel === 0
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Home className="w-3 h-3" />
              <span>PORTFOLIO</span>
            </button>

            {drilldownLevel >= 1 && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-600" />
                <button
                  onClick={() => onDrilldown(1, "equity")}
                  className={`px-2 py-0.5 rounded-md transition-colors uppercase ${
                    drilldownLevel === 1
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {selectedAssetClass || "EQUITY"}
                </button>
              </>
            )}

            {drilldownLevel >= 2 && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-600" />
                <button
                  onClick={() => onDrilldown(2, selectedSector || "technology")}
                  className={`px-2 py-0.5 rounded-md transition-colors uppercase ${
                    drilldownLevel === 2
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {selectedSector || "TECHNOLOGY"}
                </button>
              </>
            )}

            {drilldownLevel >= 3 && selectedAsset && (
              <>
                <ChevronRight className="w-3 h-3 text-slate-600" />
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  {selectedAsset}
                </span>
              </>
            )}
          </div>
        </div>

        {/* View Toggle Segmented Control & Reset Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex p-1 rounded-xl bg-[#091120]/90 border border-slate-700/80 backdrop-blur-md shadow-inner text-[11px] font-bold text-slate-300">
            <button
              onClick={() => onSelectViewMode("assetClass")}
              className={`px-3 py-1 rounded-lg transition-all ${
                currentViewMode === "assetClass"
                  ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/25"
                  : "hover:text-white"
              }`}
            >
              Asset Class
            </button>
            <button
              onClick={() => onSelectViewMode("sector")}
              className={`px-3 py-1 rounded-lg transition-all ${
                currentViewMode === "sector"
                  ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/25"
                  : "hover:text-white"
              }`}
            >
              Sector
            </button>
            <button
              onClick={() => onSelectViewMode("individual")}
              className={`px-3 py-1 rounded-lg transition-all ${
                currentViewMode === "individual"
                  ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/25"
                  : "hover:text-white"
              }`}
            >
              Individual
            </button>
          </div>

          <button
            onClick={handleResetCamera}
            title="Reset View and Camera"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#091120]/90 border border-slate-700/80 hover:border-cyan-400/60 text-slate-300 hover:text-white text-xs font-semibold backdrop-blur-md transition-all shadow-md active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Reset View</span>
          </button>
        </div>
      </div>

      {/* 2. TOTAL PORTFOLIO BADGE (Top-Left Sub-Pill) */}
      <div className="absolute top-24 left-5 z-20 pointer-events-none select-none">
        <div className="px-3.5 py-2 rounded-2xl bg-[#060D1A]/90 border border-cyan-500/30 backdrop-blur-md shadow-lg">
          <div className="text-[9.5px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
            TOTAL PORTFOLIO
          </div>
          <div className="text-xl font-black text-white tracking-tight leading-none mt-0.5">
            100%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {allocations.length} Active Assets • ₹10,00,000
          </div>
        </div>
      </div>

      {/* 3. THREE.JS 3D CANVAS */}
      <Canvas
        camera={{ position: [0, 3.2, 6.8], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <DynamicCameraRig drilldownLevel={drilldownLevel} />

          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.05}
            minDistance={4.2}
            maxDistance={9.5}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.08}
            maxAzimuthAngle={Math.PI / 2.5}
            minAzimuthAngle={-Math.PI / 2.5}
          />

          {/* Lighting */}
          <ambientLight intensity={0.85} />
          <directionalLight position={[-4, 6, 4]} intensity={1.8} color="#00E5FF" />
          <directionalLight position={[4, -2, 3]} intensity={1.5} color="#C084FC" />
          <directionalLight position={[0, 5, -3]} intensity={1.2} color="#FBBF24" />
          <pointLight position={[0, 1.5, 0]} intensity={1.1} color="#38BDF8" />

          {/* Cyber Platform */}
          <PortfolioPlatform drilldownLevel={drilldownLevel} />

          {/* Allocation Cubes */}
          <AllocationCubes
            drilldownLevel={drilldownLevel}
            selectedAssetClass={selectedAssetClass}
            selectedSector={selectedSector}
            selectedAsset={selectedAsset}
            onDrilldown={onDrilldown}
            assetClassWeights={assetClassWeights}
            allocations={allocations}
          />
        </Suspense>
      </Canvas>

      {/* 4. BASE PLATFORM BADGE: "PORTFOLIO" */}
      <div className="absolute bottom-4 inset-x-0 flex items-center justify-center pointer-events-none select-none">
        <div className="flex items-center gap-2 px-5 py-1.5 rounded-full bg-[#060D1A]/90 border border-cyan-500/40 backdrop-blur-md shadow-[0_0_25px_rgba(0,229,255,0.25)]">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-black tracking-[0.25em] text-cyan-300 uppercase">
            PORTFOLIO PLATFORM
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            [Click blocks to drill down]
          </span>
        </div>
      </div>
    </div>
  );
}
