"use client";

import React, { Suspense, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import PortfolioCore from "./PortfolioCore";
import PortfolioConstellation, { AssetAllocation } from "./PortfolioConstellation";

interface Portfolio3DSceneProps {
  allocations: AssetAllocation[];
  selectedAsset: string | null;
  onSelectAsset: (id: string) => void;
  assetClassWeights: {
    equity: number;
    factors: number;
    options: number;
    cash: number;
  };
}

function CameraRig({ selectedAsset }: { selectedAsset: string | null }) {
  useFrame((state) => {
    // Gentle pointer parallax
    const targetX = state.pointer.x * 0.35;
    const targetY = state.pointer.y * 0.25;

    let targetZ = 6.6;
    if (selectedAsset) {
      targetZ = 6.2;
    }

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.05);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.05);
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function Portfolio3DScene({
  allocations,
  selectedAsset,
  onSelectAsset,
  assetClassWeights,
}: Portfolio3DSceneProps) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[560px] lg:h-[620px] rounded-3xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 text-sm">
        Initializing Portfolio Constellation...
      </div>
    );
  }

  // 2D Mobile Fallback
  if (isMobile) {
    return (
      <div className="w-full min-h-[460px] p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 text-white flex flex-col items-center justify-center relative overflow-hidden border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(23,105,255,0.15),transparent_70%)]" />
        <div className="relative z-10 w-44 h-44 rounded-full border-2 border-blue-400/40 bg-radial from-slate-900 via-slate-950 to-black shadow-xl flex flex-col items-center justify-center text-center p-3">
          <div className="text-[9px] uppercase tracking-[0.2em] text-blue-400 font-bold">PORTFOLIO</div>
          <div className="text-2xl font-black text-white">CORE</div>
          <div className="text-[8px] text-slate-400 tracking-wider mt-1">DIVERSIFY · OPTIMIZE</div>
        </div>

        {/* Mobile Asset Grid */}
        <div className="grid grid-cols-2 gap-2.5 w-full mt-6 relative z-10">
          {allocations.slice(0, 6).map((a) => (
            <button
              key={a.id}
              onClick={() => onSelectAsset(a.id)}
              className={`p-2.5 rounded-xl border text-left flex items-center justify-between ${
                selectedAsset === a.id ? "border-blue-500 bg-blue-500/15" : "border-slate-800 bg-slate-900/60"
              }`}
            >
              <div>
                <div className="text-xs font-bold text-white">{a.id}</div>
                <div className="text-[10px] text-slate-400">{a.company}</div>
              </div>
              <div className="text-xs font-black text-blue-400">{a.weight.toFixed(1)}%</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[560px] lg:h-[620px] relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9]/60 to-[#F8FAFC] border border-slate-200/90 shadow-xs">
      {/* Background Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_45%,rgba(23,105,255,0.06),transparent_55%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_55%,rgba(139,92,246,0.05),transparent_55%)] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#0B1220_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 6.7], fov: 44 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <CameraRig selectedAsset={selectedAsset} />

          {/* Dynamic Dual-Tone Lighting */}
          <ambientLight intensity={0.9} />
          <directionalLight position={[-4, 3, 4]} intensity={1.4} color="#38BDF8" />
          <directionalLight position={[4, -2, 3]} intensity={1.3} color="#C084FC" />
          <pointLight position={[0, 0, 3]} intensity={0.8} color="#818CF8" />

          {/* 3D Objects */}
          <PortfolioCore />
          <PortfolioConstellation
            allocations={allocations}
            selectedAsset={selectedAsset}
            onSelectAsset={onSelectAsset}
          />
        </Suspense>
      </Canvas>

      {/* Center Typography Overlay — 100% Crisp */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <div className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-[#08111F]/85 backdrop-blur-xs border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-center min-w-[145px]">
          <div className="text-[10px] tracking-[0.24em] text-[#60A5FA] font-bold uppercase leading-none drop-shadow-md">
            PORTFOLIO
          </div>
          <div className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] mt-1 mb-1.5">
            CORE
          </div>
          <div className="h-0.5 w-12 bg-gradient-to-r from-blue-400 via-indigo-400 to-teal-400 mb-1.5 opacity-90 rounded-full" />
          <div className="text-[8.5px] tracking-[0.18em] text-slate-200 font-bold uppercase leading-tight drop-shadow-md">
            DIVERSIFY · OPTIMIZE
          </div>
          <div className="text-[8.5px] tracking-[0.18em] text-teal-300 font-bold uppercase leading-tight drop-shadow-md mt-0.5">
            MANAGE RISK · GROW
          </div>
        </div>
      </div>

      {/* Bottom Fan Pedestals / Allocation Tabs matching the reference image */}
      <div className="absolute bottom-4 inset-x-4 flex items-center justify-center gap-2 pointer-events-none select-none">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-blue-200/90 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#1769FF]" />
          <span className="text-[10px] font-bold text-slate-700 uppercase">EQUITIES</span>
          <span className="text-[11px] font-black text-[#1769FF]">{assetClassWeights.equity.toFixed(1)}%</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-purple-200/90 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
          <span className="text-[10px] font-bold text-slate-700 uppercase">OPTIONS</span>
          <span className="text-[11px] font-black text-[#8B5CF6]">{assetClassWeights.options.toFixed(1)}%</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-teal-200/90 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
          <span className="text-[10px] font-bold text-slate-700 uppercase">FACTORS</span>
          <span className="text-[11px] font-black text-[#0D9488]">{assetClassWeights.factors.toFixed(1)}%</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          <span className="text-[10px] font-bold text-slate-700 uppercase">CASH</span>
          <span className="text-[11px] font-black text-slate-600">{assetClassWeights.cash.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}
