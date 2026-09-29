"use client";

import React from "react";

interface VisualProps {
  accentColor: string;
  isHovered?: boolean;
}

/**
 * 01 Technical Analysis Visual:
 * Abstract candlestick chart + dual EMA trendlines + volume bars + mini RSI oscillator.
 */
export const TechnicalVisual: React.FC<VisualProps> = ({ accentColor }) => {
  return (
    <svg
      viewBox="0 0 360 260"
      className="w-full h-full overflow-visible select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="techVolGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.4" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Grid Lines */}
      <line x1="20" y1="30" x2="340" y2="30" stroke="currentColor" className="text-border/40" strokeDasharray="3 3" />
      <line x1="20" y1="80" x2="340" y2="80" stroke="currentColor" className="text-border/40" strokeDasharray="3 3" />
      <line x1="20" y1="130" x2="340" y2="130" stroke="currentColor" className="text-border/40" strokeDasharray="3 3" />
      <line x1="20" y1="180" x2="340" y2="180" stroke="currentColor" className="text-border/50" />

      {/* Candlesticks (Sample price series) */}
      {[
        { x: 35, o: 110, c: 95, h: 90, l: 118, up: true },
        { x: 55, o: 95, c: 85, h: 80, l: 102, up: true },
        { x: 75, o: 85, c: 92, h: 82, l: 98, up: false },
        { x: 95, o: 92, c: 75, h: 70, l: 95, up: true },
        { x: 115, o: 75, c: 68, h: 62, l: 82, up: true },
        { x: 135, o: 68, c: 78, h: 65, l: 84, up: false },
        { x: 155, o: 78, c: 60, h: 54, l: 80, up: true },
        { x: 175, o: 60, c: 50, h: 45, l: 65, up: true },
        { x: 195, o: 50, c: 58, h: 48, l: 64, up: false },
        { x: 215, o: 58, c: 42, h: 36, l: 62, up: true },
        { x: 235, o: 42, c: 38, h: 32, l: 48, up: true },
        { x: 255, o: 38, c: 45, h: 35, l: 52, up: false },
        { x: 275, o: 45, c: 30, h: 26, l: 48, up: true },
        { x: 295, o: 30, c: 24, h: 18, l: 34, up: true },
        { x: 315, o: 24, c: 28, h: 20, l: 32, up: false },
      ].map((bar, i) => {
        const color = bar.up ? "#10B981" : "#EF4444";
        const top = Math.min(bar.o, bar.c);
        const height = Math.max(3, Math.abs(bar.c - bar.o));

        return (
          <g key={i}>
            {/* Wick */}
            <line x1={bar.x} y1={bar.h} x2={bar.x} y2={bar.l} stroke={color} strokeWidth="1.2" />
            {/* Body */}
            <rect
              x={bar.x - 4}
              y={top}
              width={8}
              height={height}
              fill={color}
              rx={0.5}
            />
            {/* Volume Bar */}
            <rect
              x={bar.x - 4}
              y={180 - (height * 2.4 + (i % 3) * 6)}
              width={8}
              height={height * 2.4 + (i % 3) * 6}
              fill={color}
              opacity="0.3"
            />
          </g>
        );
      })}

      {/* 20 EMA Smooth Line (Accent Blue) */}
      <path
        d="M 30,115 C 70,95 110,75 150,65 C 190,55 230,42 270,32 C 290,26 315,25 335,26"
        stroke={accentColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* 50 EMA Smooth Line (Cyan / Secondary) */}
      <path
        d="M 30,128 C 80,112 130,95 180,78 C 230,62 280,48 335,40"
        stroke="#06B6D4"
        strokeWidth="1.8"
        strokeDasharray="4 2"
        strokeLinecap="round"
      />

      {/* Mini RSI Oscillator Panel */}
      <g transform="translate(0, 195)">
        <rect x="20" y="5" width="320" height="48" rx="3" className="fill-muted/20 stroke-border/40" />
        <line x1="20" y1="18" x2="340" y2="18" stroke="currentColor" className="text-border/30" strokeDasharray="2 2" />
        <line x1="20" y1="38" x2="340" y2="38" stroke="currentColor" className="text-border/30" strokeDasharray="2 2" />
        <text x="25" y="15" className="fill-muted-foreground font-mono text-[8px]">70 OB</text>
        <text x="25" y="45" className="fill-muted-foreground font-mono text-[8px]">30 OS</text>
        {/* RSI Curve */}
        <path
          d="M 35,40 Q 75,45 115,32 T 195,16 T 275,12 T 325,18"
          fill="none"
          stroke={accentColor}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

/**
 * 02 Statistical Analysis Visual:
 * Regression scatter plot + OLS fitted line + error residuals + correlation matrix.
 */
export const StatisticalVisual: React.FC<VisualProps> = ({ accentColor }) => {
  return (
    <svg
      viewBox="0 0 360 260"
      className="w-full h-full overflow-visible select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Coordinate axes */}
      <line x1="35" y1="20" x2="35" y2="200" stroke="currentColor" className="text-border/60" strokeWidth="1.5" />
      <line x1="35" y1="200" x2="335" y2="200" stroke="currentColor" className="text-border/60" strokeWidth="1.5" />

      {/* Axis ticks & labels */}
      <text x="25" y="25" className="fill-muted-foreground font-mono text-[9px]">Y</text>
      <text x="330" y="215" className="fill-muted-foreground font-mono text-[9px]">X</text>

      {/* Grid lines */}
      <line x1="35" y1="140" x2="335" y2="140" stroke="currentColor" className="text-border/30" strokeDasharray="2 2" />
      <line x1="35" y1="80" x2="335" y2="80" stroke="currentColor" className="text-border/30" strokeDasharray="2 2" />
      <line x1="135" y1="20" x2="135" y2="200" stroke="currentColor" className="text-border/30" strokeDasharray="2 2" />
      <line x1="235" y1="20" x2="235" y2="200" stroke="currentColor" className="text-border/30" strokeDasharray="2 2" />

      {/* 95% Confidence Band (Shaded) */}
      <path
        d="M 50,185 L 320,38 L 320,68 L 50,195 Z"
        fill={accentColor}
        opacity="0.1"
      />

      {/* OLS Linear Regression Line (y = alpha + beta * x) */}
      <line
        x1="45"
        y1="190"
        x2="325"
        y2="50"
        stroke={accentColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Scatter Points & Residual Lines */}
      {[
        { x: 65, y: 172, regY: 180 },
        { x: 85, y: 178, regY: 170 },
        { x: 105, y: 150, regY: 160 },
        { x: 125, y: 155, regY: 150 },
        { x: 145, y: 132, regY: 140 },
        { x: 165, y: 142, regY: 130 },
        { x: 185, y: 118, regY: 120 },
        { x: 205, y: 108, regY: 110 },
        { x: 225, y: 115, regY: 100 },
        { x: 245, y: 88, regY: 90 },
        { x: 265, y: 72, regY: 80 },
        { x: 285, y: 78, regY: 70 },
        { x: 305, y: 55, regY: 60 },
      ].map((pt, i) => (
        <g key={i}>
          {/* Vertical Residual (Error e_i) */}
          <line
            x1={pt.x}
            y1={pt.y}
            x2={pt.x}
            y2={pt.regY}
            stroke={accentColor}
            strokeWidth="1"
            strokeDasharray="1.5 1.5"
            opacity="0.6"
          />
          {/* Point */}
          <circle
            cx={pt.x}
            cy={pt.y}
            r="3.5"
            fill={accentColor}
            stroke="white"
            strokeWidth="1"
          />
        </g>
      ))}

      {/* Inset: Correlation Matrix Heatmap */}
      <g transform="translate(230, 130)">
        <rect width="95" height="60" rx="3" className="fill-card/90 stroke-border/60" />
        <text x="8" y="14" className="fill-foreground font-mono text-[8px] font-bold">CORR MATRIX</text>
        {/* Heatmap cells */}
        {[
          { x: 8, y: 20, v: "1.00", c: accentColor, op: 0.8 },
          { x: 36, y: 20, v: "0.84", c: accentColor, op: 0.65 },
          { x: 64, y: 20, v: "0.32", c: accentColor, op: 0.25 },
          { x: 8, y: 38, v: "0.84", c: accentColor, op: 0.65 },
          { x: 36, y: 38, v: "1.00", c: accentColor, op: 0.8 },
          { x: 64, y: 38, v: "-0.21", c: "#EF4444", op: 0.35 },
        ].map((cell, idx) => (
          <g key={idx}>
            <rect x={cell.x} y={cell.y} width="24" height="15" rx="1.5" fill={cell.c} opacity={cell.op} />
            <text x={cell.x + 12} y={cell.y + 10} textAnchor="middle" fill="white" className="font-mono text-[7px] font-bold">
              {cell.v}
            </text>
          </g>
        ))}
      </g>

      {/* Regression Equation Formula Badge */}
      <g transform="translate(50, 35)">
        <rect width="110" height="24" rx="2" className="fill-card/90 stroke-border/50" />
        <text x="8" y="16" className="fill-foreground font-mono text-[9px] font-bold">
          R² = 0.884 · β = 1.24
        </text>
      </g>
    </svg>
  );
};

/**
 * 03 Time Series Visual:
 * Historical wave -> Vertical divider (t=0) -> Expanding forecast cone + confidence interval.
 */
export const TimeSeriesVisual: React.FC<VisualProps> = ({ accentColor }) => {
  return (
    <svg
      viewBox="0 0 360 260"
      className="w-full h-full overflow-visible select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="forecastGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Grid */}
      <line x1="20" y1="60" x2="340" y2="60" stroke="currentColor" className="text-border/30" strokeDasharray="3 3" />
      <line x1="20" y1="120" x2="340" y2="120" stroke="currentColor" className="text-border/30" strokeDasharray="3 3" />
      <line x1="20" y1="180" x2="340" y2="180" stroke="currentColor" className="text-border/30" strokeDasharray="3 3" />

      {/* Forecast Confidence Fan (95% CI) expanding from t=190 */}
      <path
        d="M 190,110 C 230,85 280,65 340,40 L 340,185 C 280,155 230,135 190,110 Z"
        fill="url(#forecastGrad)"
      />

      {/* Inner 80% CI Fan */}
      <path
        d="M 190,110 C 230,95 280,82 340,65 L 340,155 C 280,138 230,125 190,110 Z"
        fill={accentColor}
        opacity="0.12"
      />

      {/* Vertical Transition Boundary: "T (NOW)" */}
      <line
        x1="190"
        y1="25"
        x2="190"
        y2="215"
        stroke="#64748B"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <rect x="165" y="10" width="50" height="18" rx="2" className="fill-muted stroke-border/50" />
      <text x="190" y="22" textAnchor="middle" className="fill-foreground font-mono text-[8px] font-bold">
        t = NOW
      </text>

      {/* Historical Time Series Path (Solid Cyan) */}
      <path
        d="M 25,160 Q 50,115 75,135 T 125,95 T 160,125 L 190,110"
        stroke={accentColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Forecast Expected Path (Dashed Projected Curve) */}
      <path
        d="M 190,110 C 225,98 265,108 300,92 T 340,110"
        stroke={accentColor}
        strokeWidth="2.5"
        strokeDasharray="5 3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Labels */}
      <text x="80" y="210" textAnchor="middle" className="fill-muted-foreground font-mono text-[9px] font-semibold">
        HISTORICAL OBSERVED
      </text>
      <text x="270" y="210" textAnchor="middle" className="fill-foreground font-mono text-[9px] font-bold" style={{ fill: accentColor }}>
        ARIMA PROJECTION (95% CI)
      </text>

      {/* Stationarity / ACF indicator badge */}
      <g transform="translate(30, 30)">
        <rect width="105" height="22" rx="2" className="fill-card/90 stroke-border/50" />
        <text x="6" y="15" className="fill-foreground font-mono text-[8px] font-bold">
          ADF: p &lt; 0.01 (Stationary)
        </text>
      </g>
    </svg>
  );
};

/**
 * 04 Volatility Visual:
 * Low-vol regime transitioning to GARCH high-vol cluster + conditional sigma envelope.
 */
export const VolatilityVisual: React.FC<VisualProps> = ({ accentColor }) => {
  return (
    <svg
      viewBox="0 0 360 260"
      className="w-full h-full overflow-visible select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="volClustGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accentColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Center line (Mean Return = 0) */}
      <line x1="20" y1="120" x2="340" y2="120" stroke="currentColor" className="text-border/60" strokeWidth="1.2" />

      {/* Conditional Sigma Envelope +2σ (Upper) */}
      <path
        d="M 25,95 Q 60,98 90,92 T 150,85 C 180,50 200,30 230,42 C 260,54 290,75 335,88"
        stroke={accentColor}
        strokeWidth="1.8"
        strokeDasharray="4 2"
        fill="none"
      />

      {/* Conditional Sigma Envelope -2σ (Lower) */}
      <path
        d="M 25,145 Q 60,142 90,148 T 150,155 C 180,190 200,210 230,198 C 260,186 290,165 335,152"
        stroke={accentColor}
        strokeWidth="1.8"
        strokeDasharray="4 2"
        fill="none"
      />

      {/* Clustered Return Spikes (Calm regime -> Turbulent GARCH cluster) */}
      {[
        { x: 30, h: 10 }, { x: 42, h: -14 }, { x: 54, h: 8 }, { x: 66, h: -12 },
        { x: 78, h: 15 }, { x: 90, h: -9 }, { x: 102, h: 18 }, { x: 114, h: -16 },
        { x: 126, h: 22 }, { x: 138, h: -25 },
        // High volatility cluster
        { x: 152, h: 48 }, { x: 164, h: -56 }, { x: 176, h: 68 }, { x: 188, h: -74 },
        { x: 200, h: 82 }, { x: 212, h: -65 }, { x: 224, h: 54 }, { x: 236, h: -48 },
        { x: 248, h: 36 }, { x: 260, h: -40 }, { x: 272, h: 28 }, { x: 284, h: -32 },
        { x: 296, h: 22 }, { x: 308, h: -20 }, { x: 320, h: 18 }, { x: 332, h: -16 },
      ].map((s, idx) => (
        <line
          key={idx}
          x1={s.x}
          y1={120}
          x2={s.x}
          y2={120 - s.h}
          stroke={Math.abs(s.h) > 40 ? accentColor : "#64748B"}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      ))}

      {/* Regime Labels */}
      <rect x="35" y="25" width="80" height="20" rx="2" className="fill-muted stroke-border/40" />
      <text x="75" y="38" textAnchor="middle" className="fill-muted-foreground font-mono text-[8px] font-bold">
        LOW VOL REGIME
      </text>

      <rect x="180" y="10" width="105" height="20" rx="2" className="fill-card stroke-border/50" />
      <text x="232" y="23" textAnchor="middle" fill={accentColor} className="font-mono text-[8px] font-black">
        GARCH CLUSTER SPIKE
      </text>

      {/* Implied Volatility Surface / Smile Inset */}
      <g transform="translate(40, 185)">
        <rect width="125" height="30" rx="3" className="fill-card/90 stroke-border/50" />
        <text x="8" y="18" className="fill-foreground font-mono text-[9px] font-bold">
          EGARCH(1,1) · σ = 28.4%
        </text>
      </g>
    </svg>
  );
};

/**
 * 05 Options Visual:
 * Hockey-stick Long Call Payoff curve + Strike K + Breakeven + Greeks badge.
 */
export const OptionsVisual: React.FC<VisualProps> = ({ accentColor }) => {
  return (
    <svg
      viewBox="0 0 360 260"
      className="w-full h-full overflow-visible select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
        </linearGradient>
        <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EF4444" stopOpacity="0.0" />
          <stop offset="100%" stopColor="#EF4444" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Zero P&L Axis */}
      <line x1="25" y1="140" x2="335" y2="140" stroke="currentColor" className="text-border/70" strokeWidth="1.5" />
      <text x="15" y="143" className="fill-muted-foreground font-mono text-[9px]">0</text>
      <text x="330" y="132" className="fill-muted-foreground font-mono text-[9px]">S_T</text>

      {/* Profit Zone shading */}
      <path
        d="M 210,140 L 325,45 L 325,140 Z"
        fill="url(#profitGrad)"
      />

      {/* Loss Zone shading */}
      <path
        d="M 35,140 L 35,180 L 155,180 L 210,140 Z"
        fill="url(#lossGrad)"
      />

      {/* Strike Price Vertical Line (K = $150) */}
      <line x1="155" y1="35" x2="155" y2="215" stroke="#64748B" strokeWidth="1.2" strokeDasharray="3 3" />
      <rect x="135" y="215" width="40" height="18" rx="2" className="fill-muted stroke-border/50" />
      <text x="155" y="227" textAnchor="middle" className="fill-foreground font-mono text-[8px] font-bold">
        K (Strike)
      </text>

      {/* Breakeven Marker */}
      <circle cx="210" cy="140" r="4" fill={accentColor} stroke="white" strokeWidth="1.5" />
      <text x="210" y="130" textAnchor="middle" fill={accentColor} className="font-mono text-[8px] font-bold">
        B/E Point
      </text>

      {/* Long Call Payoff Hockey Stick Curve */}
      <path
        d="M 35,180 L 155,180 L 325,45"
        stroke={accentColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Max Loss Label */}
      <text x="45" y="195" className="fill-rose-500 font-mono text-[9px] font-bold">
        -Premium (Max Loss)
      </text>

      {/* Unlimited Profit Label */}
      <text x="250" y="35" className="fill-emerald-500 font-mono text-[9px] font-bold">
        +Unlimited Profit →
      </text>

      {/* Greeks Mini Dashboard Inset */}
      <g transform="translate(25, 25)">
        <rect width="90" height="85" rx="3" className="fill-card/90 stroke-border/60" />
        <text x="8" y="16" className="fill-foreground font-mono text-[8px] font-bold">BLACK-SCHOLES</text>
        <line x1="8" y1="22" x2="82" y2="22" stroke="currentColor" className="text-border/40" />
        <text x="8" y="36" className="fill-muted-foreground font-mono text-[8px]">Delta (Δ): <tspan fill={accentColor} fontWeight="bold">+0.62</tspan></text>
        <text x="8" y="50" className="fill-muted-foreground font-mono text-[8px]">Gamma (Γ): <tspan fill="currentColor" fontWeight="bold">0.038</tspan></text>
        <text x="8" y="64" className="fill-muted-foreground font-mono text-[8px]">Theta (Θ): <tspan fill="#EF4444" fontWeight="bold">-0.05</tspan></text>
        <text x="8" y="78" className="fill-muted-foreground font-mono text-[8px]">Vega (ν): <tspan fill="currentColor" fontWeight="bold">+0.14</tspan></text>
      </g>
    </svg>
  );
};

/**
 * 06 Factor Research Visual:
 * Multi-factor contribution horizontal bar chart + quintile monotonic ranking curve.
 */
export const FactorVisual: React.FC<VisualProps> = ({ accentColor }) => {
  return (
    <svg
      viewBox="0 0 360 260"
      className="w-full h-full overflow-visible select-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Zero axis for horizontal bar contributions */}
      <line x1="160" y1="20" x2="160" y2="155" stroke="currentColor" className="text-border/60" strokeWidth="1.2" />

      {/* Factor Bars */}
      {[
        { label: "MOMENTUM", val: "+3.8%", w: 105, pos: true, y: 25 },
        { label: "QUALITY (ROE)", val: "+2.6%", w: 75, pos: true, y: 52 },
        { label: "VALUE (P/B)", val: "+1.9%", w: 55, pos: true, y: 79 },
        { label: "LOW VOLATILITY", val: "+1.2%", w: 35, pos: true, y: 106 },
        { label: "SIZE (SMB)", val: "-0.8%", w: 25, pos: false, y: 133 },
      ].map((f, i) => (
        <g key={i}>
          {/* Label */}
          <text
            x="150"
            y={f.y + 12}
            textAnchor="end"
            className="fill-foreground font-mono text-[9px] font-bold"
          >
            {f.label}
          </text>

          {/* Bar */}
          <rect
            x={f.pos ? 160 : 160 - f.w}
            y={f.y}
            width={f.w}
            height={16}
            rx="2"
            fill={f.pos ? accentColor : "#EF4444"}
            opacity={f.pos ? 0.85 : 0.6}
          />

          {/* Value text */}
          <text
            x={f.pos ? 168 + f.w : 152 - f.w}
            y={f.y + 12}
            textAnchor={f.pos ? "start" : "end"}
            fill={f.pos ? accentColor : "#EF4444"}
            className="font-mono text-[9px] font-bold"
          >
            {f.val}
          </text>
        </g>
      ))}

      {/* Lower Inset: Quintile Spread Q1 -> Q5 Monotonic Alpha */}
      <g transform="translate(25, 170)">
        <rect width="310" height="70" rx="3" className="fill-muted/20 stroke-border/40" />
        <text x="12" y="16" className="fill-foreground font-mono text-[8px] font-bold">
          QUINTILE LONG/SHORT PERFORMANCE (Q1 TOP → Q5 BOTTOM)
        </text>

        {/* Quintile columns */}
        {[
          { q: "Q1", h: 36, ret: "+4.2%", pos: true },
          { q: "Q2", h: 26, ret: "+2.8%", pos: true },
          { q: "Q3", h: 16, ret: "+1.1%", pos: true },
          { q: "Q4", h: 10, ret: "-0.6%", pos: false },
          { q: "Q5", h: 24, ret: "-2.9%", pos: false },
        ].map((q, idx) => {
          const x = 35 + idx * 56;
          const barColor = q.pos ? accentColor : "#EF4444";
          return (
            <g key={idx}>
              <rect
                x={x}
                y={q.pos ? 52 - q.h : 52}
                width="24"
                height={q.h}
                rx="1.5"
                fill={barColor}
                opacity="0.8"
              />
              <text x={x + 12} y="64" textAnchor="middle" className="fill-muted-foreground font-mono text-[8px] font-bold">
                {q.q}
              </text>
              <text
                x={x + 12}
                y={q.pos ? 48 - q.h : 62 + q.h}
                textAnchor="middle"
                fill={barColor}
                className="font-mono text-[7px] font-bold"
              >
                {q.ret}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};
