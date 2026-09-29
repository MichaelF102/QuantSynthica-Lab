"use client";

import React from "react";

export type SectionBackgroundVariant =
  | "hero"
  | "workflow"
  | "research"
  | "strategy-backtest"
  | "labs"
  | "markets"
  | "risk"
  | "portfolio"
  | "methodology"
  | "cta";

interface SectionBackgroundProps {
  variant: SectionBackgroundVariant;
  className?: string;
  children?: React.ReactNode;
}

/**
 * SectionBackground: Component-specific, accessible, responsive background environment.
 * All layers are pointer-events-none, hardware-accelerated, and respect prefers-reduced-motion.
 */
export default function SectionBackground({
  variant,
  className = "",
  children,
}: SectionBackgroundProps) {
  switch (variant) {
    case "hero":
      return (
        <div
          aria-hidden="true"
          className={`pointer-events-none select-none absolute inset-0 -z-10 overflow-hidden bg-[var(--bg-hero)] transition-colors duration-500 ${className}`}
        >
          {/* Subtle Ambient Radial Glows */}
          <div
            className="absolute -top-24 right-0 h-[680px] w-[880px] opacity-70 dark:opacity-85"
            style={{
              background:
                "radial-gradient(circle at 70% 30%, rgba(23,105,255,0.09) 0%, rgba(67,56,202,0.04) 40%, transparent 70%)",
            }}
          />
          <div
            className="absolute left-[-80px] top-[35%] h-[500px] w-[500px] opacity-40 dark:opacity-60"
            style={{
              background:
                "radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 65%)",
            }}
          />

          {/* Technical Micro-Coordinate Grid with Faint Cross Marks */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.025)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />

          {/* Top Edge Horizon Highlight */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#1769FF]/20 to-transparent" />

          {children}
        </div>
      );

    case "workflow":
      return (
        <div
          aria-hidden="true"
          className={`pointer-events-none select-none absolute inset-0 -z-10 overflow-hidden bg-[var(--bg-workflow)] transition-colors duration-500 ${className}`}
        >
          {/* Central Radial Spotlight focused on the Workflow Engine */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[650px] opacity-75 dark:opacity-90"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(67,56,202,0.08) 0%, rgba(23,105,255,0.04) 45%, transparent 70%)",
            }}
          />

          {/* Workflow Pipeline Grid (56px pitch) */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.028)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.028)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:56px_56px]" />

          {/* Delicate Top/Bottom Gradient Blend to Neighboring Sections */}
          <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-[var(--bg-hero)] to-transparent opacity-80" />
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[var(--bg-research)] to-transparent opacity-80" />

          {children}
        </div>
      );

    case "research":
      return (
        <div
          aria-hidden="true"
          className={`pointer-events-none select-none absolute inset-0 -z-10 overflow-hidden bg-[var(--bg-research)] transition-colors duration-500 ${className}`}
        >
          {/* Security Research Terminal Radial Wash (Cyan & Blue Data Hues) */}
          <div
            className="absolute top-12 right-[10%] w-[800px] h-[550px] opacity-65 dark:opacity-80"
            style={{
              background:
                "radial-gradient(circle at center, rgba(2,132,199,0.075) 0%, rgba(99,102,241,0.035) 50%, transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-10 left-[5%] w-[600px] h-[450px] opacity-50 dark:opacity-70"
            style={{
              background:
                "radial-gradient(circle at center, rgba(56,189,248,0.05) 0%, transparent 65%)",
            }}
          />

          {/* Technical Terminal Fine Grid (36px) */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.025)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:36px_36px]" />

          {children}
        </div>
      );

    case "strategy-backtest":
      return (
        <div
          aria-hidden="true"
          className={`pointer-events-none select-none absolute inset-0 -z-10 overflow-hidden bg-[var(--bg-strategy)] transition-colors duration-500 ${className}`}
        >
          {/* Dual-Zone Environment: Left Strategy (Violet) to Right Backtest (Teal) */}
          <div
            className="absolute top-1/4 left-1/4 w-[750px] h-[600px] opacity-70 dark:opacity-85"
            style={{
              background:
                "radial-gradient(circle at center, rgba(139,92,246,0.075) 0%, transparent 65%)",
            }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-[750px] h-[600px] opacity-65 dark:opacity-80"
            style={{
              background:
                "radial-gradient(circle at center, rgba(13,148,136,0.065) 0%, transparent 65%)",
            }}
          />

          {/* Historical Chart Coordinate Grid Pattern (48px) */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.028)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.028)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:48px_48px]" />

          {children}
        </div>
      );

    case "labs":
      return (
        <div
          aria-hidden="true"
          className={`pointer-events-none select-none absolute inset-0 -z-10 overflow-hidden bg-[var(--bg-labs)] transition-colors duration-500 ${className}`}
        >
          {/* Computational Matrix Glow */}
          <div
            className="absolute top-1/3 right-1/3 w-[900px] h-[600px] opacity-70 dark:opacity-85"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(56,189,248,0.075) 0%, rgba(99,102,241,0.04) 50%, transparent 70%)",
            }}
          />

          {/* Lab Matrix Grid (40px) */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.025)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:40px_40px]" />

          {children}
        </div>
      );

    case "markets":
      return (
        <div
          aria-hidden="true"
          className={`pointer-events-none select-none absolute inset-0 -z-10 overflow-hidden bg-[var(--bg-markets)] transition-colors duration-500 ${className}`}
        >
          {/* Market Universe Celestial Radial Bloom */}
          <div
            className="absolute -top-10 right-[-5%] w-[850px] h-[750px] opacity-65 dark:opacity-85"
            style={{
              background:
                "radial-gradient(circle at 65% 35%, rgba(23,105,255,0.08) 0%, rgba(56,189,248,0.04) 45%, transparent 70%)",
            }}
          />

          {/* Orbital Contour Arcs (SVG) */}
          <svg
            className="absolute right-0 top-0 h-[600px] w-[700px] opacity-30 dark:opacity-20"
            viewBox="0 0 700 600"
            fill="none"
          >
            <ellipse
              cx="550"
              cy="250"
              rx="400"
              ry="260"
              stroke="#1769FF"
              strokeWidth="1"
              strokeDasharray="4 8"
            />
            <ellipse
              cx="550"
              cy="250"
              rx="280"
              ry="180"
              stroke="#0284C7"
              strokeWidth="0.8"
            />
          </svg>

          {/* Universe Technical Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.025)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />

          {children}
        </div>
      );

    case "risk":
      return (
        <div
          aria-hidden="true"
          className={`pointer-events-none select-none absolute inset-0 -z-10 overflow-hidden bg-[var(--bg-risk)] transition-colors duration-500 ${className}`}
        >
          {/* Volatility & VaR Atmosphere: Cool slate/charcoal with restrained Crimson/Purple risk contour */}
          <div
            className="absolute top-1/3 right-[15%] w-[800px] h-[650px] opacity-60 dark:opacity-75"
            style={{
              background:
                "radial-gradient(circle at center, rgba(225,29,72,0.04) 0%, rgba(139,92,246,0.035) 45%, transparent 68%)",
            }}
          />
          <div
            className="absolute bottom-10 left-[10%] w-[650px] h-[500px] opacity-40 dark:opacity-60"
            style={{
              background:
                "radial-gradient(circle at center, rgba(23,105,255,0.04) 0%, transparent 65%)",
            }}
          />

          {/* Subtle Concentric Risk Contour Rings (SVG) */}
          <svg
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[750px] opacity-25 dark:opacity-20"
            viewBox="0 0 1100 750"
            fill="none"
          >
            <circle cx="550" cy="375" r="320" stroke="#E11D48" strokeWidth="0.8" strokeDasharray="3 6" />
            <circle cx="550" cy="375" r="230" stroke="#8B5CF6" strokeWidth="0.8" />
            <circle cx="550" cy="375" r="140" stroke="#38BDF8" strokeWidth="0.8" strokeDasharray="2 4" />
          </svg>

          {/* Grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.024)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.024)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.024)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.024)_1px,transparent_1px)] bg-[size:48px_48px]" />

          {children}
        </div>
      );

    case "portfolio":
      return (
        <div
          aria-hidden="true"
          className={`pointer-events-none select-none absolute inset-0 -z-10 overflow-hidden bg-[var(--bg-portfolio)] transition-colors duration-500 ${className}`}
        >
          {/* Capital Constellation Mesh Atmosphere (Teal & Blue Hues) */}
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] opacity-70 dark:opacity-85"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(16,185,129,0.06) 0%, rgba(23,105,255,0.04) 45%, transparent 70%)",
            }}
          />

          {/* Constellation Dashed Network Lines (SVG) */}
          <svg
            className="absolute inset-0 w-full h-full opacity-20 dark:opacity-15"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line x1="20%" y1="30%" x2="50%" y2="40%" stroke="#10B981" strokeWidth="0.8" strokeDasharray="3 4" />
            <line x1="50%" y1="40%" x2="80%" y2="25%" stroke="#1769FF" strokeWidth="0.8" strokeDasharray="3 4" />
            <line x1="50%" y1="40%" x2="45%" y2="70%" stroke="#8B5CF6" strokeWidth="0.8" strokeDasharray="3 4" />
            <line x1="45%" y1="70%" x2="75%" y2="75%" stroke="#06B6D4" strokeWidth="0.8" strokeDasharray="3 4" />
            <circle cx="20%" cy="30%" r="2.5" fill="#10B981" />
            <circle cx="50%" cy="40%" r="3" fill="#1769FF" />
            <circle cx="80%" cy="25%" r="2.5" fill="#1769FF" />
            <circle cx="45%" cy="70%" r="2.5" fill="#8B5CF6" />
            <circle cx="75%" cy="75%" r="2.5" fill="#06B6D4" />
          </svg>

          {/* Portfolio Allocation Coordinate Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.025)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />

          {children}
        </div>
      );

    case "methodology":
      return (
        <div
          aria-hidden="true"
          className={`pointer-events-none select-none absolute inset-0 -z-10 overflow-hidden bg-[var(--bg-methodology)] transition-colors duration-500 ${className}`}
        >
          {/* Institutional Document Texture: Dot-matrix pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(15,23,42,0.06)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px]" />

          {/* Calm Institutional Slate Glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] opacity-40 dark:opacity-60"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(100,116,139,0.06) 0%, transparent 70%)",
            }}
          />

          {children}
        </div>
      );

    case "cta":
      return (
        <div
          aria-hidden="true"
          className={`pointer-events-none select-none absolute inset-0 -z-10 overflow-hidden bg-[var(--bg-cta)] transition-colors duration-500 ${className}`}
        >
          {/* Deep Space Cosmic Atmospheric Nebula Fields */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1400px] h-[800px] bg-[radial-gradient(ellipse_at_top,rgba(23,105,255,0.22),transparent_70%)]" />
          <div className="absolute top-1/3 left-1/4 w-[700px] h-[700px] bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.1),transparent_70%)]" />
          <div className="absolute top-1/3 right-1/4 w-[700px] h-[700px] bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.1),transparent_70%)]" />

          {/* Faint Starfield Particles */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />

          {children}
        </div>
      );

    default:
      return null;
  }
}
