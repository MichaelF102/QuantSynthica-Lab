"use client";

import React, { useEffect, useRef } from "react";

interface HeroWavesBackgroundProps {
  className?: string;
}

export default function HeroWavesBackground({ className = "" }: HeroWavesBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    // Mouse tracking state with smooth spring-like lerping
    const mouse = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      radius: 260,
      active: false,
      activeStrength: 0,
      speed: 0,
      lastMoveTime: 0,
    };

    const handleResize = () => {
      if (!canvas) return;
      const section = canvas.closest("section") || canvas.parentElement;
      if (!section) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = section.clientWidth;
      height = section.clientHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      if (mouse.x === 0 && mouse.y === 0) {
        mouse.x = mouse.targetX = width * 0.5;
        mouse.y = mouse.targetY = height * 0.5;
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Track mouse events relative to hero section
    const section = canvas.closest("section") || canvas.parentElement || window;

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const inHeroX = e.clientX >= rect.left && e.clientX <= rect.right;
      const inHeroY = e.clientY >= rect.top && e.clientY <= rect.bottom;

      if (inHeroX && inHeroY) {
        const newTargetX = e.clientX - rect.left;
        const newTargetY = e.clientY - rect.top;
        const distMoved = Math.hypot(newTargetX - mouse.targetX, newTargetY - mouse.targetY);
        mouse.speed = Math.min(distMoved / 10, 4);

        mouse.targetX = newTargetX;
        mouse.targetY = newTargetY;
        mouse.active = true;
        mouse.lastMoveTime = performance.now();
      } else {
        mouse.active = false;
      }
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.targetX = width * 0.5;
      mouse.targetY = height * 0.5;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    if (section instanceof HTMLElement) {
      section.addEventListener("mouseleave", handleMouseLeave);
    }

    let time = 0;

    // Draw single multi-strand glowing wave
    const drawWave = ({
      baseY,
      speed,
      amplitude,
      frequency1,
      frequency2,
      phaseOffset,
      color,
      glowColor,
      fillGradient,
      ribbonCount = 4,
      mouseRepel = 1,
    }: {
      baseY: number;
      speed: number;
      amplitude: number;
      frequency1: number;
      frequency2: number;
      phaseOffset: number;
      color: string;
      glowColor: string;
      fillGradient: [string, string];
      ribbonCount?: number;
      mouseRepel?: number;
    }) => {
      const step = 8;
      const points: { x: number; y: number }[] = [];

      // Calculate primary wave points
      for (let x = 0; x <= width + step; x += step) {
        // Multi-frequency harmonic undulation
        const sin1 = Math.sin(x * frequency1 + time * speed + phaseOffset);
        const cos1 = Math.cos(x * frequency2 - time * speed * 0.65 + phaseOffset * 0.5) * 0.5;
        const waveY = baseY + (sin1 + cos1) * amplitude;

        // Interactive mouse distortion
        const dx = x - mouse.x;
        const dist = Math.abs(dx);
        let mouseDisplacement = 0;

        if (dist < mouse.radius) {
          // Smooth cosine bell curve
          const factor = Math.cos((dist / mouse.radius) * (Math.PI / 2));
          const normalized = Math.pow(factor, 2);

          // Vertical pull/push towards mouse Y
          const dy = mouse.y - baseY;
          const pull = dy * normalized * 0.42 * mouseRepel;

          // Harmonic ripple wave emitted from cursor
          const ripple = Math.sin((dx / 28) - time * 5) * 16 * normalized;

          mouseDisplacement = (pull + ripple) * mouse.activeStrength;
        }

        points.push({ x, y: waveY + mouseDisplacement });
      }

      if (points.length < 2) return;

      // 1. Subtle luminous under-fill gradient
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const midX = (prev.x + curr.x) / 2;
        const midY = (prev.y + curr.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, baseY - amplitude * 1.5, 0, height);
      grad.addColorStop(0, fillGradient[0]);
      grad.addColorStop(1, fillGradient[1]);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      // 2. Multi-strand glowing ribbons (gives the silky 21st.dev glowy ribbon effect)
      for (let r = 0; r < ribbonCount; r++) {
        const ribbonSpread = (r - (ribbonCount - 1) / 2) * 9;
        const isCenter = r === Math.floor(ribbonCount / 2);
        const alpha = isCenter ? 0.95 : 0.38 / (Math.abs(r - ribbonCount / 2) + 0.8);
        const lineWidth = isCenter ? 2.6 : 1.3;

        ctx.save();
        ctx.beginPath();

        if (isCenter) {
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 24;
        } else {
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 10;
        }

        ctx.strokeStyle = color.replace("ALPHA", alpha.toFixed(3));
        ctx.lineWidth = lineWidth;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        for (let i = 0; i < points.length; i++) {
          const pt = points[i];
          const dynamicOffset =
            ribbonSpread * Math.cos(pt.x * 0.003 + time * speed * 0.7 + r * 0.6);
          const py = pt.y + dynamicOffset;

          if (i === 0) {
            ctx.moveTo(pt.x, py);
          } else {
            const prev = points[i - 1];
            const prevDynamic =
              ribbonSpread * Math.cos(prev.x * 0.003 + time * speed * 0.7 + r * 0.6);
            const midX = (prev.x + pt.x) / 2;
            const midY = (prev.y + prevDynamic + py) / 2;
            ctx.quadraticCurveTo(prev.x, prev.y + prevDynamic, midX, midY);
          }
        }

        ctx.stroke();
        ctx.restore();
      }
    };

    const render = () => {
      time += 0.015;

      // Smooth mouse lerping
      mouse.x += (mouse.targetX - mouse.x) * 0.07;
      mouse.y += (mouse.targetY - mouse.y) * 0.07;

      // Fade active strength if idle
      const now = performance.now();
      const isRecentlyMoved = mouse.active && now - mouse.lastMoveTime < 1800;
      const targetStrength = isRecentlyMoved ? 1 : 0.25;
      mouse.activeStrength += (targetStrength - mouse.activeStrength) * 0.04;

      ctx.clearRect(0, 0, width, height);

      const isDark = document.documentElement.classList.contains("dark");

      // Wave 1: GREEN (Bullish Financial Wave)
      const greenBaseY = height * 0.46;
      const greenStrokeColor = isDark
        ? "rgba(0, 230, 153, ALPHA)" // Vivid neon emerald in dark mode
        : "rgba(16, 185, 129, ALPHA)"; // Emerald in light mode
      const greenGlowColor = isDark ? "rgba(0, 230, 153, 0.85)" : "rgba(16, 185, 129, 0.55)";
      const greenFillGradient: [string, string] = isDark
        ? ["rgba(0, 230, 153, 0.06)", "rgba(0, 230, 153, 0.0)"]
        : ["rgba(16, 185, 129, 0.04)", "rgba(16, 185, 129, 0.0)"];

      drawWave({
        baseY: greenBaseY,
        speed: 0.85,
        amplitude: 38,
        frequency1: 0.0026,
        frequency2: 0.0014,
        phaseOffset: 0,
        color: greenStrokeColor,
        glowColor: greenGlowColor,
        fillGradient: greenFillGradient,
        ribbonCount: 4,
        mouseRepel: 0.9,
      });

      // Wave 2: RED (Bearish Financial Wave)
      const redBaseY = height * 0.54;
      const redStrokeColor = isDark
        ? "rgba(255, 68, 88, ALPHA)" // Vivid neon crimson/rose in dark mode
        : "rgba(239, 68, 68, ALPHA)"; // Rose in light mode
      const redGlowColor = isDark ? "rgba(255, 68, 88, 0.85)" : "rgba(239, 68, 68, 0.55)";
      const redFillGradient: [string, string] = isDark
        ? ["rgba(255, 68, 88, 0.05)", "rgba(255, 68, 88, 0.0)"]
        : ["rgba(239, 68, 68, 0.035)", "rgba(239, 68, 68, 0.0)"];

      drawWave({
        baseY: redBaseY,
        speed: 0.7,
        amplitude: 42,
        frequency1: 0.0022,
        frequency2: 0.0012,
        phaseOffset: 2.4, // Intertwined phase offset
        color: redStrokeColor,
        glowColor: redGlowColor,
        fillGradient: redFillGradient,
        ribbonCount: 4,
        mouseRepel: -0.75, // Reacts in complementary direction for organic interplay
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      if (section instanceof HTMLElement) {
        section.removeEventListener("mouseleave", handleMouseLeave);
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
    >
      <canvas ref={canvasRef} className="h-full w-full block" />
    </div>
  );
}
