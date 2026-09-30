"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { navigateToResearchWorkspace } from "@/lib/tickerSearch";

export default function HeroVisualBackground() {
  const router = useRouter();

  const handleCardClick = (symbol: string, country: "India" | "US") => {
    navigateToResearchWorkspace(symbol, router, country);
  };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-radial from-blue-600/15 via-purple-600/5 to-transparent blur-[120px]" />
      <div className="absolute top-20 -left-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-[100px]" />
      <div className="absolute top-40 -right-20 h-[480px] w-[480px] rounded-full bg-purple-600/12 blur-[120px]" />

      {/* Subtle Financial Coordinate Grid */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(#38BDF8 1px, transparent 1px), linear-gradient(90deg, #38BDF8 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* ========================================================
          LEFT VISUAL: Candlestick Mountain Landscape
          ======================================================== */}
      <div className="hidden lg:block absolute left-0 bottom-16 w-[420px] xl:w-[480px] h-[440px] opacity-75 dark:opacity-85 pointer-events-none">
        <svg
          viewBox="0 0 500 450"
          className="w-full h-full drop-shadow-[0_0_25px_rgba(6,182,212,0.25)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="mountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0B132B" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#050B14" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#020408" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#818CF8" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="candleUp" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="candleDown" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F87171" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Mountain wireframes */}
          <path
            d="M 0 380 Q 80 260 160 300 T 320 220 T 480 340 L 500 450 L 0 450 Z"
            fill="url(#mountainGrad)"
          />
          <path
            d="M 0 380 Q 80 260 160 300 T 320 220 T 480 340"
            stroke="url(#neonCyan)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          <path
            d="M -20 400 Q 120 290 220 330 T 420 250 T 520 400 L 520 450 L -20 450 Z"
            fill="#030712"
            fillOpacity="0.85"
          />
          <path
            d="M -20 400 Q 120 290 220 330 T 420 250 T 520 400"
            stroke="#38BDF8"
            strokeWidth="1"
            strokeOpacity="0.4"
          />

          {/* Neon Candlestick Pillars rising from the terrain */}
          {/* Candle 1 */}
          <line x1="60" y1="180" x2="60" y2="280" stroke="#10B981" strokeWidth="1.5" />
          <rect x="53" y="200" width="14" height="60" rx="2" fill="url(#candleUp)" filter="url(#glow)" />

          {/* Candle 2 */}
          <line x1="95" y1="160" x2="95" y2="290" stroke="#10B981" strokeWidth="1.5" />
          <rect x="88" y="175" width="14" height="85" rx="2" fill="url(#candleUp)" filter="url(#glow)" />

          {/* Candle 3 (Pullback) */}
          <line x1="130" y1="210" x2="130" y2="310" stroke="#F43F5E" strokeWidth="1.5" strokeOpacity="0.8" />
          <rect x="123" y="225" width="14" height="45" rx="2" fill="url(#candleDown)" stroke="#FB7185" strokeWidth="0.5" />

          {/* Candle 4 (Massive Breakout) */}
          <line x1="170" y1="120" x2="170" y2="270" stroke="#34D399" strokeWidth="2" />
          <rect x="162" y="140" width="16" height="100" rx="2" fill="url(#candleUp)" filter="url(#glow)" />

          {/* Candle 5 */}
          <line x1="210" y1="90" x2="210" y2="240" stroke="#34D399" strokeWidth="2" />
          <rect x="202" y="110" width="16" height="110" rx="2" fill="url(#candleUp)" filter="url(#glow)" />

          {/* Candle 6 */}
          <line x1="250" y1="150" x2="250" y2="280" stroke="#06B6D4" strokeWidth="1.5" />
          <rect x="242" y="165" width="15" height="75" rx="2" fill="#06B6D4" fillOpacity="0.85" filter="url(#glow)" />

          {/* Moving average curve through candles */}
          <path
            d="M 30 260 Q 95 210 170 180 T 260 130 T 360 110"
            stroke="#38BDF8"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            filter="url(#glow)"
          />
        </svg>
      </div>

      {/* ========================================================
          RIGHT VISUAL: 3D Illuminated Digital Globe & Tickers
          ======================================================== */}
      <div className="hidden lg:block absolute right-[-40px] xl:right-4 top-16 w-[480px] xl:w-[560px] h-[580px] pointer-events-none">
        {/* Globe SVG Structure with glowing nodes and latitude/longitude rings */}
        <svg
          viewBox="0 0 540 540"
          className="w-full h-full drop-shadow-[0_0_40px_rgba(59,130,246,0.2)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="globeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#0B132B" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.7" />
              <stop offset="50%" stopColor="#818CF8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#C084FC" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Globe Sphere Silhouette */}
          <circle cx="280" cy="270" r="190" fill="url(#globeGlow)" />
          <circle cx="280" cy="270" r="190" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />

          {/* Latitude Lines */}
          <ellipse cx="280" cy="270" rx="190" ry="60" stroke="#38BDF8" strokeOpacity="0.25" strokeWidth="1" />
          <ellipse cx="280" cy="220" rx="175" ry="50" stroke="#38BDF8" strokeOpacity="0.18" strokeWidth="1" />
          <ellipse cx="280" cy="320" rx="175" ry="50" stroke="#38BDF8" strokeOpacity="0.18" strokeWidth="1" />
          <ellipse cx="280" cy="170" rx="135" ry="40" stroke="#818CF8" strokeOpacity="0.15" strokeWidth="1" />

          {/* Longitude Arcs */}
          <ellipse cx="280" cy="270" rx="60" ry="190" stroke="#38BDF8" strokeOpacity="0.25" strokeWidth="1" />
          <ellipse cx="230" cy="270" rx="110" ry="190" stroke="#818CF8" strokeOpacity="0.2" strokeWidth="1" />
          <ellipse cx="330" cy="270" rx="110" ry="190" stroke="#818CF8" strokeOpacity="0.2" strokeWidth="1" />

          {/* Sweeping Orbit Curves */}
          <path
            d="M 80 180 C 140 80, 420 80, 480 220 S 420 460, 200 430"
            stroke="url(#orbitGrad)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />

          {/* Active Capital / Financial Center Nodes (Glowing Dots) */}
          {/* Mumbai / India */}
          <circle cx="270" cy="255" r="5" fill="#38BDF8" />
          <circle cx="270" cy="255" r="12" stroke="#38BDF8" strokeOpacity="0.4" strokeWidth="1.5" />

          {/* New York / Wall Street */}
          <circle cx="160" cy="215" r="4.5" fill="#818CF8" />
          <circle cx="160" cy="215" r="10" stroke="#818CF8" strokeOpacity="0.3" strokeWidth="1" />

          {/* London / European Centre */}
          <circle cx="240" cy="170" r="4" fill="#34D399" />
          <circle cx="240" cy="170" r="9" stroke="#34D399" strokeOpacity="0.3" strokeWidth="1" />

          {/* Tokyo / Singapore */}
          <circle cx="370" cy="270" r="4" fill="#F59E0B" />
          <circle cx="370" cy="270" r="9" stroke="#F59E0B" strokeOpacity="0.3" strokeWidth="1" />

          {/* Connecting Data Rays to Floating Cards */}
          {/* Ray to NIFTY 50 */}
          <line x1="270" y1="255" x2="380" y2="120" stroke="#38BDF8" strokeOpacity="0.5" strokeDasharray="3 3" />
          <circle cx="380" cy="120" r="2.5" fill="#38BDF8" />

          {/* Ray to RELIANCE */}
          <line x1="270" y1="255" x2="430" y2="280" stroke="#34D399" strokeOpacity="0.5" strokeDasharray="3 3" />
          <circle cx="430" cy="280" r="2.5" fill="#34D399" />

          {/* Ray to TCS */}
          <line x1="270" y1="255" x2="330" y2="390" stroke="#818CF8" strokeOpacity="0.5" strokeDasharray="3 3" />
          <circle cx="330" cy="390" r="2.5" fill="#818CF8" />
        </svg>

        {/* ========================================================
            FLOATING MARKET TICKER CARDS (Interactive!)
            ======================================================== */}
        {/* Card 1: NIFTY 50 */}
        <div
          onClick={() => handleCardClick("NIFTY50", "India")}
          className="pointer-events-auto absolute top-12 right-28 cursor-pointer rounded-xl border border-cyan-500/30 bg-[#0B132B]/85 px-3 py-2 font-mono shadow-[0_8px_24px_rgba(6,182,212,0.18)] backdrop-blur-md transition-all hover:scale-105 hover:border-cyan-400 hover:shadow-[0_12px_32px_rgba(6,182,212,0.3)] active:scale-95"
          title="Click to research NIFTY 50"
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-300">NIFTY 50</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="mt-0.5 text-xs font-semibold text-white">24,621.40</div>
          <div className="text-[10px] font-medium text-emerald-400">+0.82% ▲</div>
        </div>

        {/* Card 2: RELIANCE */}
        <div
          onClick={() => handleCardClick("RELIANCE", "India")}
          className="pointer-events-auto absolute top-52 right-8 cursor-pointer rounded-xl border border-emerald-500/30 bg-[#0B132B]/85 px-3 py-2 font-mono shadow-[0_8px_24px_rgba(16,185,129,0.18)] backdrop-blur-md transition-all hover:scale-105 hover:border-emerald-400 hover:shadow-[0_12px_32px_rgba(16,185,129,0.3)] active:scale-95"
          title="Click to research RELIANCE"
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-amber-300">RELIANCE</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="mt-0.5 text-xs font-semibold text-white">₹2,956.20</div>
          <div className="text-[10px] font-medium text-emerald-400">+1.34% ▲</div>
        </div>

        {/* Card 3: TCS */}
        <div
          onClick={() => handleCardClick("TCS", "India")}
          className="pointer-events-auto absolute bottom-28 right-24 cursor-pointer rounded-xl border border-blue-500/30 bg-[#0B132B]/85 px-3 py-2 font-mono shadow-[0_8px_24px_rgba(59,130,246,0.18)] backdrop-blur-md transition-all hover:scale-105 hover:border-blue-400 hover:shadow-[0_12px_32px_rgba(59,130,246,0.3)] active:scale-95"
          title="Click to research TCS"
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-blue-300">TCS</span>
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
          </div>
          <div className="mt-0.5 text-xs font-semibold text-white">₹4,102.55</div>
          <div className="text-[10px] font-medium text-rose-400">-0.21% ▼</div>
        </div>
      </div>
    </div>
  );
}
