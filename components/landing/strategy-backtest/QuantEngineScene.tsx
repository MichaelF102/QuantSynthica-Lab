"use client";

import React, { Suspense, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import QuantEngineCore from "./QuantEngineCore";
import QuantEngineNodes from "./QuantEngineNodes";

interface QuantEngineSceneProps {
  activeStage: number;
  onSelectStage: (stage: number) => void;
}

function CameraRig() {
  useFrame((state) => {
    // Subtle pointer parallax: ±2-3 degrees
    const targetX = state.pointer.x * 0.35;
    const targetY = state.pointer.y * 0.25;

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.05);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, 7.4, 0.05);
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function QuantEngineScene({
  activeStage,
  onSelectStage,
}: QuantEngineSceneProps) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[520px] lg:h-[580px] flex items-center justify-center text-slate-400 text-sm">
        Initializing 3D Quant Engine...
      </div>
    );
  }

  // 2D Mobile Fallback
  if (isMobile) {
    return (
      <div className="w-full min-h-[420px] p-6 rounded-3xl bg-[#07111F] border border-slate-800 text-white flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.15),transparent_70%)]" />

        {/* Central Engine Badge */}
        <div className="w-40 h-40 rounded-full border-2 border-cyan-400/50 bg-[#090E17] shadow-xl flex flex-col items-center justify-center text-center p-3 relative z-10">
          <div className="text-xl font-black tracking-widest text-white">QUANT</div>
          <div className="text-lg font-black tracking-widest text-cyan-400">ENGINE</div>
          <div className="text-[8px] tracking-wider text-slate-400 uppercase mt-1">
            Research Pipeline
          </div>
        </div>

        {/* 3 Stage Buttons */}
        <div className="grid grid-cols-3 gap-2 w-full mt-6 relative z-10 text-[11px] text-center font-bold">
          <button
            onClick={() => onSelectStage(1)}
            className={`p-2.5 rounded-xl border transition-all ${
              activeStage === 1
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/20"
                : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            01 BUILD
          </button>
          <button
            onClick={() => onSelectStage(2)}
            className={`p-2.5 rounded-xl border transition-all ${
              activeStage === 2
                ? "bg-purple-500/20 border-purple-400 text-purple-300 ring-2 ring-purple-500/20"
                : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            02 TEST
          </button>
          <button
            onClick={() => onSelectStage(3)}
            className={`p-2.5 rounded-xl border transition-all ${
              activeStage === 3
                ? "bg-teal-500/20 border-teal-400 text-teal-300 ring-2 ring-teal-500/20"
                : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            03 EVALUATE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[540px] xl:h-[600px] relative overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [0, 0, 7.4], fov: 43 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <CameraRig />

          {/* Dynamic Stage Lighting */}
          <ambientLight intensity={0.9} />
          <directionalLight position={[-4, 3, 4]} intensity={1.5} color="#00E5FF" />
          <directionalLight position={[4, -2, 3]} intensity={1.4} color="#C084FC" />
          <pointLight position={[0, 0, 3]} intensity={1.2} color="#38BDF8" />

          {/* Core Objects & Interactive Nodes */}
          <QuantEngineCore activeStage={activeStage} />
          <QuantEngineNodes
            activeStage={activeStage}
            onSelectStage={onSelectStage}
          />
        </Suspense>
      </Canvas>

      {/* Central Sphere Typography Overlay — Crisp, Unblurred */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <div className="flex flex-col items-center justify-center text-center p-3">
          <div className="text-xl xl:text-2xl font-black tracking-[0.25em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
            QUANT
          </div>
          <div className="text-xl xl:text-2xl font-black tracking-[0.25em] bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-300 bg-clip-text text-transparent drop-shadow-md">
            ENGINE
          </div>
          <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-cyan-400 to-transparent my-1.5 opacity-90" />
          <div className="text-[7.5px] xl:text-[8px] tracking-[0.22em] text-cyan-200 font-bold uppercase drop-shadow-md">
            Quantitative
          </div>
          <div className="text-[7px] xl:text-[7.5px] tracking-[0.18em] text-slate-300 font-medium uppercase mt-0.5 drop-shadow-md">
            Research Pipeline
          </div>
        </div>
      </div>

      {/* Base Pedestal Tech Pipeline Ribbon Ticker */}
      <div className="absolute bottom-3 inset-x-0 flex items-center justify-center pointer-events-none">
        <div className="px-4 py-1 rounded-full bg-[#07111F]/85 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_20px_rgba(0,229,255,0.2)]">
          <span className="text-[9px] xl:text-[10px] font-mono font-bold tracking-[0.16em] text-cyan-300 uppercase whitespace-nowrap">
            DATA INGESTION &nbsp;&gt;&nbsp; SIGNAL GENERATION &nbsp;&gt;&nbsp; BACKTEST ENGINE &nbsp;&gt;&nbsp; RISK ANALYTICS &nbsp;&gt;&nbsp; PORTFOLIO CONSTRUCTION
          </span>
        </div>
      </div>
    </div>
  );
}
