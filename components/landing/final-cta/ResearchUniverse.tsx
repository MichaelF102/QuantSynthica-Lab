"use client";

import React, { Suspense, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import UniverseCore from "./UniverseCore";
import UniverseNodes from "./UniverseNodes";
import UniverseParticles from "./UniverseParticles";

function CameraRig() {
  useFrame((state) => {
    // Subtle pointer parallax: ±2-3 degrees
    const targetX = state.pointer.x * 0.4;
    const targetY = state.pointer.y * 0.3;

    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.05);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, 6.7, 0.05);
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}

export default function ResearchUniverse() {
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
      <div className="w-full h-[580px] lg:h-[640px] flex items-center justify-center text-slate-500 text-sm">
        Initializing Quantitative Research Universe...
      </div>
    );
  }

  // Mobile 2D Fallback
  if (isMobile) {
    return (
      <div className="w-full min-h-[440px] p-6 rounded-3xl bg-slate-950/80 border border-slate-800 text-white flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.15),transparent_70%)]" />
        <div className="w-36 h-36 rounded-full border-2 border-cyan-400/50 bg-radial from-slate-900 to-black shadow-xl flex flex-col items-center justify-center text-center p-3 relative z-10">
          <div className="w-9 h-9 rounded-full bg-blue-500 text-white font-black text-xl flex items-center justify-center mb-1">
            Q
          </div>
          <div className="text-xs font-black tracking-wider text-white">QUANTSYNTHICA</div>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full mt-6 relative z-10 text-[11px] text-center">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 font-bold">MARKETS</div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-purple-400 font-bold">RESEARCH</div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-blue-400 font-bold">STRATEGIES</div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400 font-bold">BACKTESTS</div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-rose-400 font-bold">RISK</div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-teal-400 font-bold">PORTFOLIO</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[580px] lg:h-[640px] relative overflow-hidden select-none">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 6.7], fov: 44 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <CameraRig />

          {/* Dual Cosmic Lights */}
          <ambientLight intensity={0.9} />
          <directionalLight position={[-4, 3, 4]} intensity={1.5} color="#00E5FF" />
          <directionalLight position={[4, -2, 3]} intensity={1.4} color="#C084FC" />
          <pointLight position={[0, 0, 3]} intensity={1.0} color="#38BDF8" />

          {/* 3D Core, Nodes & Particle Field */}
          <UniverseCore />
          <UniverseNodes />
          <UniverseParticles />
        </Suspense>
      </Canvas>

      {/* Center Typography Overlay — Blends Seamlessly into Sphere */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <div className="flex flex-col items-center justify-center p-3 text-center">
          {/* Glowing Q Circle */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#0052FF] via-[#1769FF] to-[#38BDF8] text-white font-black text-2xl flex items-center justify-center shadow-[0_0_25px_rgba(56,189,248,0.7)] border border-cyan-300/40 mb-2">
            Q
          </div>
          <div className="text-base font-black tracking-[0.2em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
            QUANTSYNTHICA
          </div>
          <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-cyan-400 to-transparent my-1.5 opacity-90" />
          <div className="text-[8px] tracking-[0.24em] text-cyan-200 font-bold uppercase drop-shadow-md">
            QUANTITATIVE RESEARCH
          </div>
          <div className="text-[7.5px] tracking-[0.18em] text-slate-300 font-medium uppercase mt-0.5 drop-shadow-md">
            FOR MODERN INVESTORS
          </div>
        </div>
      </div>

      {/* Planetary Horizon Curvature Background at bottom */}
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[130%] max-w-[1700px] h-[180px] pointer-events-none rounded-[50%] border-t border-cyan-400/40 shadow-[0_-12px_36px_rgba(56,189,248,0.3)] bg-gradient-to-b from-[#0B2144]/60 via-[#07111F]/80 to-transparent overflow-hidden">
        {/* Atmosphere haze rim */}
        <div className="absolute -top-6 inset-x-0 h-16 rounded-[50%] bg-gradient-to-t from-cyan-400/20 via-blue-500/10 to-transparent blur-xl" />
        {/* Subtle radial light streak */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-12 bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent blur-md" />
      </div>
    </div>
  );
}
