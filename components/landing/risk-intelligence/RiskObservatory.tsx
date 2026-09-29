"use client";

import React, { Suspense, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import RiskCore from "./RiskCore";
import RiskOrbits from "./RiskOrbits";
import RiskParticles from "./RiskParticles";
import RiskShockwave from "./RiskShockwave";
import { RiskState } from "./RiskNavigation";
import { useTheme } from "@/components/providers/ThemeProvider";

interface RiskObservatoryProps {
  activeRisk: RiskState;
  onSelectRisk: (state: RiskState) => void;
}

function CameraRig({ activeRisk }: { activeRisk: RiskState }) {
  useFrame((state) => {
    // Subtle pointer parallax: ±2-3 degrees
    const targetX = state.pointer.x * 0.35;
    const targetY = state.pointer.y * 0.25;

    // Small camera adjustment per risk mode
    let targetZ = 6.6;
    let offsetY = 0;
    if (activeRisk === "var") {
      targetZ = 6.4;
      offsetY = 0.15;
    } else if (activeRisk === "volatility") {
      targetZ = 6.5;
    } else if (activeRisk === "drawdown") {
      targetZ = 6.5;
      offsetY = -0.15;
    } else if (activeRisk === "stress") {
      targetZ = 6.3;
      offsetY = -0.25;
    }

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY + offsetY, 0.05);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.05);
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function RiskObservatory({ activeRisk, onSelectRisk }: RiskObservatoryProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[560px] lg:h-[600px] rounded-3xl bg-slate-50 dark:bg-[#070D18] border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-slate-400 text-sm">
        Initializing Risk Observatory...
      </div>
    );
  }

  // 2D Lightweight Fallback for Mobile
  if (isMobile) {
    return (
      <div className="w-full min-h-[460px] p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 text-white flex flex-col items-center justify-center relative overflow-hidden border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(23,105,255,0.15),transparent_70%)]" />
        
        {/* Core Mobile Sphere */}
        <div className="relative z-10 w-44 h-44 rounded-full border-2 border-blue-400/40 bg-radial from-slate-900 via-slate-950 to-black shadow-xl shadow-blue-500/10 flex flex-col items-center justify-center text-center p-3">
          <div className="text-[9px] uppercase tracking-[0.2em] text-blue-400 font-bold">PORTFOLIO</div>
          <div className="text-xl font-black text-white">RISK</div>
          <div className="text-[8px] text-slate-400 tracking-wider mt-1">MEASURE · STRESS</div>
        </div>

        {/* 4 Mobile Nodes Grid */}
        <div className="grid grid-cols-2 gap-3 w-full mt-6 relative z-10">
          <button
            onClick={() => onSelectRisk("var")}
            className={`p-3 rounded-xl border text-left ${
              activeRisk === "var" ? "border-blue-500 bg-blue-500/10" : "border-slate-800 bg-slate-900/60"
            }`}
          >
            <div className="text-[10px] text-blue-400 font-bold uppercase">VaR (95%)</div>
            <div className="text-lg font-black text-white">-3.2%</div>
            <div className="text-[10px] text-slate-400">1-day critical horizon</div>
          </button>

          <button
            onClick={() => onSelectRisk("volatility")}
            className={`p-3 rounded-xl border text-left ${
              activeRisk === "volatility" ? "border-teal-500 bg-teal-500/10" : "border-slate-800 bg-slate-900/60"
            }`}
          >
            <div className="text-[10px] text-teal-400 font-bold uppercase">Volatility</div>
            <div className="text-lg font-black text-white">24.8%</div>
            <div className="text-[10px] text-slate-400">Annualized standard dev</div>
          </button>

          <button
            onClick={() => onSelectRisk("drawdown")}
            className={`p-3 rounded-xl border text-left ${
              activeRisk === "drawdown" ? "border-purple-500 bg-purple-500/10" : "border-slate-800 bg-slate-900/60"
            }`}
          >
            <div className="text-[10px] text-purple-400 font-bold uppercase">Drawdown</div>
            <div className="text-lg font-black text-white">-11.4%</div>
            <div className="text-[10px] text-slate-400">Peak-to-trough drop</div>
          </button>

          <button
            onClick={() => onSelectRisk("stress")}
            className={`p-3 rounded-xl border text-left ${
              activeRisk === "stress" ? "border-rose-500 bg-rose-500/10" : "border-slate-800 bg-slate-900/60"
            }`}
          >
            <div className="text-[10px] text-rose-400 font-bold uppercase">Stress Testing</div>
            <div className="text-lg font-black text-white">-18.7%</div>
            <div className="text-[10px] text-slate-400">Extreme shock loss</div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[560px] lg:h-[600px] relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9]/60 to-[#F8FAFC] dark:from-[#0B1528] dark:via-[#08101E] dark:to-[#060D17] border border-slate-200/90 dark:border-slate-800 shadow-xs dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-colors duration-300">
      {/* Background Soft Gradients & Grid Lines */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_45%,rgba(23,105,255,0.06),transparent_55%)] dark:bg-[radial-gradient(circle_at_35%_45%,rgba(56,189,248,0.12),transparent_55%)] pointer-events-none transition-colors duration-300" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_55%,rgba(239,68,68,0.05),transparent_55%)] dark:bg-[radial-gradient(circle_at_65%_55%,rgba(244,63,94,0.10),transparent_55%)] pointer-events-none transition-colors duration-300" />
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04] bg-[radial-gradient(#0B1220_1px,transparent_1px)] dark:bg-[radial-gradient(#FFFFFF_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 6.6], fov: 44 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <CameraRig activeRisk={activeRisk} />

          {/* Dynamic Dual-Tone Lighting */}
          <ambientLight intensity={isDark ? 0.65 : 0.85} />
          {/* Cool Normal Light (Left) */}
          <directionalLight position={[-4, 3, 4]} intensity={isDark ? 1.5 : 1.3} color="#38BDF8" />
          {/* Warm Stress Light (Right) */}
          <directionalLight position={[4, -2, 3]} intensity={isDark ? 1.4 : 1.2} color="#FB7185" />
          <pointLight position={[0, 0, 3]} intensity={isDark ? 1.0 : 0.8} color="#818CF8" />

          {/* 3D Scene Components */}
          <RiskParticles activeRisk={activeRisk} />
          <RiskCore activeRisk={activeRisk} />
          <RiskOrbits activeRisk={activeRisk} onSelectRisk={onSelectRisk} isDark={isDark} />
          <RiskShockwave active={activeRisk === "stress"} />
        </Suspense>
      </Canvas>

      {/* Central Sphere Typography Overlay — Always Front, 100% Crisp */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-white/85 dark:bg-[#070E1B]/85 backdrop-blur-xs border border-slate-200/90 dark:border-white/15 shadow-md dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-center min-w-[145px] transition-colors duration-300">
          <div className="text-[10px] tracking-[0.24em] text-[#1769FF] dark:text-[#60A5FA] font-bold uppercase leading-none drop-shadow-xs">
            PORTFOLIO
          </div>
          <div className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-xs mt-1 mb-1.5">
            RISK
          </div>
          <div className="h-0.5 w-12 bg-gradient-to-r from-blue-500 via-indigo-500 to-rose-500 mb-1.5 opacity-90 rounded-full" />
          <div className="text-[8.5px] tracking-[0.18em] text-slate-600 dark:text-slate-200 font-bold uppercase leading-tight">
            MEASURE · ANALYZE
          </div>
          <div className="text-[8.5px] tracking-[0.18em] text-rose-600 dark:text-rose-300 font-bold uppercase leading-tight mt-0.5">
            STRESS · OPTIMIZE
          </div>
        </div>
      </div>
    </div>
  );
}
