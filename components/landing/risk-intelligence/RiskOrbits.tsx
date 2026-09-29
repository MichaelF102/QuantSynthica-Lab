"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { RiskState } from "./RiskNavigation";

interface RiskOrbitsProps {
  activeRisk: RiskState;
  onSelectRisk: (state: RiskState) => void;
  isDark?: boolean;
}

export default function RiskOrbits({ activeRisk, onSelectRisk, isDark = true }: RiskOrbitsProps) {
  // References for main orbital ring meshes & groups
  const primaryRingGroupRef = useRef<THREE.Group>(null);
  const ring1MeshRef = useRef<THREE.Mesh>(null);
  const ring2MeshRef = useRef<THREE.Mesh>(null);
  const haloGroupRef = useRef<THREE.Group>(null);
  const haloMeshRef = useRef<THREE.Mesh>(null);

  // Traveling photon particle reference
  const photonsRef = useRef<THREE.Points>(null);

  // Planet sphere mesh references for click pop animation
  const varSphereRef = useRef<THREE.Mesh>(null);
  const volSphereRef = useRef<THREE.Mesh>(null);
  const ddSphereRef = useRef<THREE.Mesh>(null);
  const stressSphereRef = useRef<THREE.Mesh>(null);

  // Planet click ripple meshes
  const rippleVarRef = useRef<THREE.Mesh>(null);
  const rippleVolRef = useRef<THREE.Mesh>(null);
  const rippleDdRef = useRef<THREE.Mesh>(null);
  const rippleStressRef = useRef<THREE.Mesh>(null);

  // Energy & Animation state
  // boost surges to 1.0 on click, then decays to 0
  const boostRef = useRef(0);
  const prevActiveRiskRef = useRef(activeRisk);
  const currentRotation1 = useRef(0);
  const currentRotation2 = useRef(0);
  const currentHaloRotation = useRef(0);

  // Planet click trigger: whenever activeRisk changes or planet is clicked, surge the boost
  if (prevActiveRiskRef.current !== activeRisk) {
    prevActiveRiskRef.current = activeRisk;
    boostRef.current = 1.0;
  }

  const handlePlanetClick = (risk: RiskState) => {
    boostRef.current = 1.0;
    onSelectRisk(risk);
  };

  // Color pallete per active state
  const ringColors = useMemo(() => {
    switch (activeRisk) {
      case "var":
        return {
          primary: new THREE.Color("#38BDF8"),
          secondary: new THREE.Color("#2563EB"),
          halo: new THREE.Color("#60A5FA"),
        };
      case "volatility":
        return {
          primary: new THREE.Color("#2DD4BF"),
          secondary: new THREE.Color("#0D9488"),
          halo: new THREE.Color("#14B8A6"),
        };
      case "drawdown":
        return {
          primary: new THREE.Color("#C084FC"),
          secondary: new THREE.Color("#7C3AED"),
          halo: new THREE.Color("#A855F7"),
        };
      case "stress":
        return {
          primary: new THREE.Color("#FB7185"),
          secondary: new THREE.Color("#EF4444"),
          halo: new THREE.Color("#F43F5E"),
        };
      default:
        return {
          primary: new THREE.Color("#38BDF8"),
          secondary: new THREE.Color("#818CF8"),
          halo: new THREE.Color("#C084FC"),
        };
    }
  }, [activeRisk]);

  // Target orientation tilt per active state
  const targetTilt = useMemo(() => {
    switch (activeRisk) {
      case "var":
        // Tilts slightly up toward top planet
        return new THREE.Euler(Math.PI / 4.4, Math.PI / 6, 0.1);
      case "volatility":
        // Tilts toward left planet
        return new THREE.Euler(Math.PI / 3.2, Math.PI / 4.2, -0.15);
      case "drawdown":
        // Tilts toward right planet
        return new THREE.Euler(Math.PI / 3.2, Math.PI / 10, 0.18);
      case "stress":
        // Tilts downward toward bottom planet
        return new THREE.Euler(Math.PI / 2.6, Math.PI / 6, -0.12);
      default:
        return new THREE.Euler(Math.PI / 3.4, Math.PI / 6, 0);
    }
  }, [activeRisk]);

  // Generate orbital photon beads that streak along ring 1
  const photonCount = 48;
  const photonAngles = useMemo(() => {
    const arr = new Float32Array(photonCount);
    for (let i = 0; i < photonCount; i++) {
      arr[i] = (i / photonCount) * Math.PI * 2;
    }
    return arr;
  }, [photonCount]);

  const photonPositions = useMemo(() => {
    return new Float32Array(photonCount * 3);
  }, [photonCount]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // 1. Decay the click boost smoothly
    boostRef.current = THREE.MathUtils.lerp(boostRef.current, 0, delta * 2.2);
    const boost = boostRef.current;

    // 2. Dynamic Angular Velocity (Rings speed up during click boost!)
    const speedMultiplier = 1.0 + boost * 7.5; // up to 8.5x rotation speed surge!
    currentRotation1.current += delta * 0.12 * speedMultiplier;
    currentRotation2.current -= delta * 0.09 * speedMultiplier;
    currentHaloRotation.current += delta * 0.07 * speedMultiplier;

    if (ring1MeshRef.current) {
      ring1MeshRef.current.rotation.z = currentRotation1.current;
      // Scale pulse on click
      const scale1 = 1.0 + Math.sin(boost * Math.PI) * 0.12;
      ring1MeshRef.current.scale.set(scale1, scale1, 1);

      // Color and opacity surge
      const mat = ring1MeshRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.color.lerp(ringColors.primary, delta * 5);
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, (isDark ? 0.35 : 0.45) + boost * 0.4, delta * 6);
      }
    }

    if (ring2MeshRef.current) {
      ring2MeshRef.current.rotation.z = currentRotation2.current;
      const scale2 = 1.0 + Math.sin(boost * Math.PI) * 0.09;
      ring2MeshRef.current.scale.set(scale2, scale2, 1);

      const mat = ring2MeshRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.color.lerp(ringColors.secondary, delta * 5);
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, (isDark ? 0.3 : 0.4) + boost * 0.35, delta * 6);
      }
    }

    if (haloMeshRef.current) {
      haloMeshRef.current.rotation.z = currentHaloRotation.current;
      const scaleH = 1.0 + Math.sin(boost * Math.PI) * 0.07;
      haloMeshRef.current.scale.set(scaleH, scaleH, 1);

      const mat = haloMeshRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.color.lerp(ringColors.halo, delta * 5);
        mat.opacity = THREE.MathUtils.lerp(mat.opacity, (isDark ? 0.25 : 0.35) + boost * 0.3, delta * 6);
      }
    }

    // 3. Smooth Precession Tilt towards clicked planet
    if (primaryRingGroupRef.current) {
      primaryRingGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        primaryRingGroupRef.current.rotation.x,
        targetTilt.x,
        delta * 3.5
      );
      primaryRingGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        primaryRingGroupRef.current.rotation.y,
        targetTilt.y,
        delta * 3.5
      );
      primaryRingGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        primaryRingGroupRef.current.rotation.z,
        targetTilt.z,
        delta * 3.5
      );
    }

    // 4. Animate Traveling Photons along outer orbit ring
    if (photonsRef.current) {
      const geo = photonsRef.current.geometry;
      const posAttr = geo.attributes.position;
      const radius = 2.52;
      for (let i = 0; i < photonCount; i++) {
        const angle = photonAngles[i] + currentRotation1.current * 1.5;
        posAttr.setXYZ(i, Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      }
      posAttr.needsUpdate = true;
    }

    // 5. Planet Sphere Scale & Breathing Animations
    const updatePlanet = (
      mesh: THREE.Mesh | null,
      isActive: boolean,
      rippleMesh: THREE.Mesh | null,
      baseScale = 0.23
    ) => {
      if (!mesh) return;
      // Target scale swells on active
      const breath = isActive ? Math.sin(time * 3.5) * 0.025 : 0;
      const targetScale = (isActive ? 1.25 : 1.0) + (isActive ? boost * 0.35 : 0) + breath;
      mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 8);

      // Ripple effect when active
      if (rippleMesh) {
        if (isActive) {
          const rScale = 1.0 + ((time * 2.2 + boost * 3) % 2.5);
          rippleMesh.scale.set(rScale, rScale, 1);
          const rMat = rippleMesh.material as THREE.MeshBasicMaterial;
          if (rMat) {
            rMat.opacity = Math.max(0, (2.5 - rScale) / 2.5 * (0.6 + boost * 0.4));
          }
        } else {
          rippleMesh.scale.set(0.001, 0.001, 1);
        }
      }
    };

    updatePlanet(varSphereRef.current, activeRisk === "var", rippleVarRef.current);
    updatePlanet(volSphereRef.current, activeRisk === "volatility", rippleVolRef.current);
    updatePlanet(ddSphereRef.current, activeRisk === "drawdown", rippleDdRef.current);
    updatePlanet(stressSphereRef.current, activeRisk === "stress", rippleStressRef.current);
  });

  return (
    <group>
      {/* 1. Large Inclined Orbital Rings with Dynamic Precession */}
      <group ref={primaryRingGroupRef} rotation={[Math.PI / 3.4, Math.PI / 6, 0]}>
        {/* Outer Ring */}
        <mesh ref={ring1MeshRef}>
          <ringGeometry args={[2.48, 2.54, 128]} />
          <meshBasicMaterial
            color="#38BDF8"
            transparent
            opacity={isDark ? 0.35 : 0.45}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Outer Ring Traveling Energy Photons */}
        <points ref={photonsRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[photonPositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.065}
            color={isDark ? "#E0F2FE" : "#0284C7"}
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
          />
        </points>

        {/* Inner Counter-Rotating Ring */}
        <mesh ref={ring2MeshRef}>
          <ringGeometry args={[2.08, 2.13, 128]} />
          <meshBasicMaterial
            color="#818CF8"
            transparent
            opacity={isDark ? 0.3 : 0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 2. Elliptical Equatorial Ambient Halo */}
      <group ref={haloGroupRef} rotation={[Math.PI / 2.2, 0, 0]}>
        <mesh ref={haloMeshRef}>
          <ringGeometry args={[1.78, 1.83, 128]} />
          <meshBasicMaterial
            color="#C084FC"
            transparent
            opacity={isDark ? 0.25 : 0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* ============================================================ */}
      {/* ORBIT NODE 1: VaR (TOP) */}
      {/* ============================================================ */}
      <group position={[0.15, 1.7, 0.2]}>
        {/* Click ripple wave */}
        <mesh ref={rippleVarRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.26, 0.32, 48]} />
          <meshBasicMaterial color="#38BDF8" transparent opacity={0} side={THREE.DoubleSide} />
        </mesh>

        {/* Planet Sphere */}
        <mesh ref={varSphereRef} onClick={() => handlePlanetClick("var")}>
          <sphereGeometry args={[0.24, 32, 32]} />
          <meshStandardMaterial
            color="#1D4ED8"
            emissive="#2563EB"
            emissiveIntensity={activeRisk === "var" ? 2.0 : 0.8}
            roughness={0.2}
            metalness={0.6}
          />
        </mesh>

        <Html position={[0, 0.45, 0]} center distanceFactor={7.2} className="pointer-events-auto select-none">
          <button
            type="button"
            onClick={() => handlePlanetClick("var")}
            className={`group text-left px-3.5 py-1.5 rounded-xl bg-white/95 dark:bg-[#0B1728]/95 backdrop-blur-md shadow-md border transition-all duration-200 cursor-pointer ${
              activeRisk === "var"
                ? "border-blue-500 shadow-blue-500/20 ring-2 ring-blue-500/25 dark:bg-blue-950/60 dark:border-blue-400"
                : "border-slate-200/90 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-400"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300">VaR</span>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            </div>
            <div className="text-sm font-black text-[#1769FF] dark:text-[#38BDF8] tracking-tight leading-tight">
              -3.2%
            </div>
            <div className="text-[9px] text-slate-400 dark:text-slate-400 font-medium">95% 1-day VaR</div>
          </button>
        </Html>
      </group>

      {/* ============================================================ */}
      {/* ORBIT NODE 2: VOLATILITY (LEFT) */}
      {/* ============================================================ */}
      <group position={[-2.2, 0.25, 0.3]}>
        {/* Click ripple wave */}
        <mesh ref={rippleVolRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.24, 0.30, 48]} />
          <meshBasicMaterial color="#2DD4BF" transparent opacity={0} side={THREE.DoubleSide} />
        </mesh>

        {/* Planet Sphere */}
        <mesh ref={volSphereRef} onClick={() => handlePlanetClick("volatility")}>
          <sphereGeometry args={[0.22, 32, 32]} />
          <meshStandardMaterial
            color="#0F766E"
            emissive="#0D9488"
            emissiveIntensity={activeRisk === "volatility" ? 2.0 : 0.8}
            roughness={0.2}
            metalness={0.6}
          />
        </mesh>

        <Html position={[-0.75, 0.05, 0]} center distanceFactor={7.2} className="pointer-events-auto select-none">
          <button
            type="button"
            onClick={() => handlePlanetClick("volatility")}
            className={`group text-left px-3.5 py-1.5 rounded-xl bg-white/95 dark:bg-[#0B1728]/95 backdrop-blur-md shadow-md border transition-all duration-200 cursor-pointer ${
              activeRisk === "volatility"
                ? "border-teal-500 shadow-teal-500/20 ring-2 ring-teal-500/25 dark:bg-teal-950/60 dark:border-teal-400"
                : "border-slate-200/90 dark:border-slate-700/80 hover:border-teal-300 dark:hover:border-teal-400"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300">Volatility</span>
              <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            </div>
            <div className="text-sm font-black text-[#0D9488] dark:text-[#2DD4BF] tracking-tight leading-tight">
              24.8%
            </div>
            <div className="text-[9px] text-slate-400 dark:text-slate-400 font-medium">Annualized Volatility</div>
          </button>
        </Html>
      </group>

      {/* ============================================================ */}
      {/* ORBIT NODE 3: DRAWDOWN (RIGHT) */}
      {/* ============================================================ */}
      <group position={[2.2, 0.25, 0.2]}>
        {/* Click ripple wave */}
        <mesh ref={rippleDdRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.24, 0.30, 48]} />
          <meshBasicMaterial color="#C084FC" transparent opacity={0} side={THREE.DoubleSide} />
        </mesh>

        {/* Planet Sphere */}
        <mesh ref={ddSphereRef} onClick={() => handlePlanetClick("drawdown")}>
          <sphereGeometry args={[0.22, 32, 32]} />
          <meshStandardMaterial
            color="#6B21A8"
            emissive="#7C3AED"
            emissiveIntensity={activeRisk === "drawdown" ? 2.0 : 0.8}
            roughness={0.2}
            metalness={0.6}
          />
        </mesh>

        <Html position={[0.75, 0.05, 0]} center distanceFactor={7.2} className="pointer-events-auto select-none">
          <button
            type="button"
            onClick={() => handlePlanetClick("drawdown")}
            className={`group text-left px-3.5 py-1.5 rounded-xl bg-white/95 dark:bg-[#0B1728]/95 backdrop-blur-md shadow-md border transition-all duration-200 cursor-pointer ${
              activeRisk === "drawdown"
                ? "border-purple-500 shadow-purple-500/20 ring-2 ring-purple-500/25 dark:bg-purple-950/60 dark:border-purple-400"
                : "border-slate-200/90 dark:border-slate-700/80 hover:border-purple-300 dark:hover:border-purple-400"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300">Drawdown</span>
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            </div>
            <div className="text-sm font-black text-[#7C3AED] dark:text-[#C084FC] tracking-tight leading-tight">
              -11.4%
            </div>
            <div className="text-[9px] text-slate-400 dark:text-slate-400 font-medium">Max Drawdown</div>
          </button>
        </Html>
      </group>

      {/* ============================================================ */}
      {/* ORBIT NODE 4: STRESS TESTING (BOTTOM) */}
      {/* ============================================================ */}
      <group position={[0.0, -1.55, 0.35]}>
        {/* Click ripple wave */}
        <mesh ref={rippleStressRef} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.26, 0.32, 48]} />
          <meshBasicMaterial color="#FB7185" transparent opacity={0} side={THREE.DoubleSide} />
        </mesh>

        {/* Planet Sphere */}
        <mesh ref={stressSphereRef} onClick={() => handlePlanetClick("stress")}>
          <sphereGeometry args={[0.24, 32, 32]} />
          <meshStandardMaterial
            color="#DC2626"
            emissive="#EF4444"
            emissiveIntensity={activeRisk === "stress" ? 2.2 : 0.9}
            roughness={0.2}
            metalness={0.6}
          />
        </mesh>

        <Html position={[0.8, -0.05, 0]} center distanceFactor={7.2} className="pointer-events-auto select-none">
          <button
            type="button"
            onClick={() => handlePlanetClick("stress")}
            className={`group text-left px-3.5 py-1.5 rounded-xl bg-white/95 dark:bg-[#0B1728]/95 backdrop-blur-md shadow-md border transition-all duration-200 cursor-pointer ${
              activeRisk === "stress"
                ? "border-rose-500 shadow-rose-500/20 ring-2 ring-rose-500/25 dark:bg-rose-950/60 dark:border-rose-400"
                : "border-slate-200/90 dark:border-slate-700/80 hover:border-rose-300 dark:hover:border-rose-400"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300">Stress Testing</span>
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            </div>
            <div className="text-sm font-black text-[#EF4444] dark:text-[#FB7185] tracking-tight leading-tight">
              -18.7%
            </div>
            <div className="text-[9px] text-slate-400 dark:text-slate-400 font-medium">Extreme scenario loss</div>
          </button>
        </Html>
      </group>

      {/* ============================================================ */}
      {/* REGIME LABELS (NORMAL CONDITIONS vs STRESS CONDITIONS) */}
      {/* ============================================================ */}
      <Html position={[-1.5, -0.95, 0.4]} center distanceFactor={7.2} className="pointer-events-none select-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 dark:bg-[#071322]/90 backdrop-blur-xs border border-teal-200/80 dark:border-teal-700/60 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 dark:bg-teal-400 animate-pulse" />
          <span className="text-[8.5px] font-bold tracking-wider uppercase text-teal-700 dark:text-teal-300">
            NORMAL CONDITIONS
          </span>
        </div>
      </Html>

      <Html position={[1.5, -0.95, 0.4]} center distanceFactor={7.2} className="pointer-events-none select-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 dark:bg-[#071322]/90 backdrop-blur-xs border border-rose-200/80 dark:border-rose-700/60 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400 animate-pulse" />
          <span className="text-[8.5px] font-bold tracking-wider uppercase text-rose-700 dark:text-rose-300">
            STRESS CONDITIONS
          </span>
        </div>
      </Html>
    </group>
  );
}
