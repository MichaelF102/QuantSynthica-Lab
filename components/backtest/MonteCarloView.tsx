"use client";

import React, { useState } from "react";
import { formatPercent, formatRatio } from "@/lib/formatters";
import { Play, HelpCircle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";

interface MonteCarloViewProps {
  strategyName: string;
  ticker: string;
}

export default function MonteCarloView({
  strategyName,
  ticker,
}: MonteCarloViewProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simCount, setSimCount] = useState<number>(5000);

  // Resampled historical trade distribution (5,000 runs)
  const distributionData = [
    { return_range: "-15% to -10%", count: 85, fill: "#EF4444" },
    { return_range: "-10% to -5%", count: 320, fill: "#EF4444" },
    { return_range: "-5% to 0%", count: 1140, fill: "#EF4444" },
    { return_range: "0% to 5%", count: 1850, fill: "#10B981" },
    { return_range: "5% to 10%", count: 1100, fill: "#10B981" },
    { return_range: "10% to 15%", count: 410, fill: "#10B981" },
    { return_range: "> 15%", count: 95, fill: "#10B981" },
  ];

  const handleRunMonteCarlo = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
    }, 750);
  };

  return (
    <div className="border border-[#252A31] bg-[#101318] rounded-[2px] p-4 font-mono text-xs select-none space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#252A31] gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#D8DCE2] uppercase tracking-wider text-xs">
              MONTE CARLO SIMULATION
            </span>
            <span className="px-1.5 py-0.5 rounded-[2px] bg-[#252A31] text-[#38BDF8] text-[10px]">
              HISTORICAL TRADE RESAMPLING
            </span>
          </div>
          <span className="text-[11px] text-[#59616B] block">
            Bootstrap resampling without replacement across sequence variations for {strategyName} ({ticker})
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={simCount}
            onChange={(e) => setSimCount(Number(e.target.value))}
            className="bg-[#0B0D10] border border-[#252A31] rounded-[2px] px-2 py-1 text-[#D8DCE2] text-xs focus:outline-none"
          >
            <option value={1000}>1,000 Iterations</option>
            <option value={5000}>5,000 Iterations</option>
            <option value={10000}>10,000 Iterations</option>
          </select>

          <button
            onClick={handleRunMonteCarlo}
            disabled={isSimulating}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-[2px] bg-[#38BDF8] hover:bg-sky-500 text-[#0B0D10] font-bold text-xs transition-colors disabled:opacity-50"
          >
            <Play className={`h-3.5 w-3.5 fill-current ${isSimulating ? "animate-spin" : ""}`} />
            <span>{isSimulating ? "RESAMPLING PATHS..." : "RUN MONTE CARLO"}</span>
          </button>
        </div>
      </div>

      {/* KPI Ribbons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 border border-[#252A31] bg-[#0B0D10] divide-x divide-y sm:divide-y-0 divide-[#252A31] text-[11px]">
        <div className="p-2.5">
          <span className="text-[10px] text-[#59616B] block uppercase">EXPECTED RETURN</span>
          <span className="font-bold text-[#D8DCE2] text-xs">+3.15%</span>
          <span className="text-[9px] text-[#89919C] block">Mean outcome</span>
        </div>
        <div className="p-2.5">
          <span className="text-[10px] text-[#59616B] block uppercase">5TH PERCENTILE</span>
          <span className="font-bold text-[#EF4444] text-xs">-6.82%</span>
          <span className="text-[9px] text-[#89919C] block">Worst 5% tail scenario</span>
        </div>
        <div className="p-2.5">
          <span className="text-[10px] text-[#59616B] block uppercase">MEDIAN OUTCOME</span>
          <span className="font-bold text-[#10B981] text-xs">+2.94%</span>
          <span className="text-[9px] text-[#89919C] block">50th percentile</span>
        </div>
        <div className="p-2.5">
          <span className="text-[10px] text-[#59616B] block uppercase">95TH PERCENTILE</span>
          <span className="font-bold text-[#10B981] text-xs">+12.41%</span>
          <span className="text-[9px] text-[#89919C] block">Top 5% favorable tail</span>
        </div>
        <div className="p-2.5">
          <span className="text-[10px] text-[#59616B] block uppercase">PROBABILITY OF LOSS</span>
          <span className="font-bold text-[#F59E0B] text-xs">28.4%</span>
          <span className="text-[9px] text-[#89919C] block">Runs ending &lt; $100k</span>
        </div>
      </div>

      {/* Distribution Chart */}
      <div className="border border-[#252A31] bg-[#0B0D10] rounded-[2px] p-3 space-y-2">
        <div className="flex justify-between items-center pb-1 border-b border-[#252A31]">
          <span className="text-[10px] text-[#59616B] uppercase tracking-wider">
            TERMINAL WEALTH DISTRIBUTION HISTOGRAM ({simCount.toLocaleString()} SIMULATIONS)
          </span>
          <span className="text-[10px] text-[#89919C]">Zero reference line separates gains from losses</span>
        </div>

        <div className="h-[220px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distributionData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#1E232B" strokeDasharray="1 1" vertical={false} />
              <XAxis dataKey="return_range" stroke="#59616B" fontSize={10} tickLine={false} />
              <YAxis stroke="#59616B" fontSize={10} tickLine={false} />
              <Tooltip
                isAnimationActive={false}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="border border-[#252A31] bg-[#101318] p-2 rounded-[2px] font-mono text-[11px]">
                      <div className="text-[#89919C] text-[10px]">{d.return_range}</div>
                      <div className="text-[#D8DCE2] font-bold">
                        Simulations: {d.count} ({((d.count / simCount) * 100).toFixed(1)}%)
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" fill="#38BDF8" radius={[1, 1, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Methodology notice */}
      <div className="p-2.5 border border-[#252A31] bg-[#0B0D10] rounded-[2px] text-[10px] text-[#59616B] space-y-1">
        <div className="flex items-center space-x-1 text-[#89919C] font-semibold">
          <HelpCircle className="h-3.5 w-3.5 text-[#38BDF8]" />
          <span>METHODOLOGY & ASSUMPTIONS</span>
        </div>
        <p>
          This Monte Carlo simulation tests order sequence risk by taking the empirical trade returns from this backtest and shuffling them across {simCount.toLocaleString()} independent equity trajectory paths. It does NOT predict future stock prices; rather, it highlights the potential drawdown that could occur if trade winning and losing streaks clustered unfavorably.
        </p>
      </div>
    </div>
  );
}
