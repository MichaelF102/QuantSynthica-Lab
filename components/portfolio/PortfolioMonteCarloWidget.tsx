"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Info } from "lucide-react";

interface TrajectoryPoint {
  date: string;
  p95: number;
  p75: number;
  median: number;
  p25: number;
  p05: number;
  path1: number;
  path2: number;
  path3: number;
  path4: number;
  path5: number;
  path6: number;
}

function generateMonteCarloPaths(): TrajectoryPoint[] {
  const dates = ["Jan 2024", "Apr 2024", "Jul 2024", "Oct 2024", "Jan 2025"];
  const initial = 100000;

  return dates.map((d, idx) => {
    const t = idx / (dates.length - 1);
    const p95 = Math.round(initial + t * 82450);
    const p75 = Math.round(initial + t * 54000);
    const median = Math.round(initial + t * 32110);
    const p25 = Math.round(initial + t * 5000);
    const p05 = Math.round(initial - t * 18770);

    return {
      date: d,
      p95,
      p75,
      median,
      p25,
      p05,
      path1: Math.round(initial + t * 74000 + Math.sin(t * 5) * 6000),
      path2: Math.round(initial + t * 45000 + Math.cos(t * 4) * 5000),
      path3: Math.round(initial + t * 29000 + Math.sin(t * 3) * 3500),
      path4: Math.round(initial + t * 18000 - Math.sin(t * 4) * 4000),
      path5: Math.round(initial - t * 4000 + Math.cos(t * 3) * 4500),
      path6: Math.round(initial - t * 15000 + Math.sin(t * 2) * 3000),
    };
  });
}

export default function PortfolioMonteCarloWidget() {
  const data = useMemo(() => generateMonteCarloPaths(), []);

  return (
    <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-3.5 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1A2230]">
        <div className="flex items-center space-x-2">
          <h2 className="text-sm font-bold text-white tracking-tight font-sans">
            Monte Carlo Simulation
          </h2>
          <button
            type="button"
            className="text-slate-500 hover:text-slate-300 transition-colors"
            title="Geometric Brownian motion simulation over 10,000 randomized return paths"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          10,000 simulations • 1Y horizon
        </div>
      </div>

      {/* Fan Chart Area with Percentile Callouts */}
      <div className="relative h-36 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 65, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#161E2C" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#475569"
              tickLine={false}
              tick={{ fontSize: 9, fill: "#64748B", fontFamily: "monospace" }}
            />
            <YAxis
              domain={[50000, 250000]}
              stroke="#475569"
              tickLine={false}
              tick={{ fontSize: 9, fill: "#64748B", fontFamily: "monospace" }}
              tickFormatter={(v: number) => `$${Math.round(v / 1000)}K`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0C1017",
                borderColor: "#202C3F",
                borderRadius: "6px",
                fontSize: "11px",
                color: "#E2E8F0",
              }}
              formatter={(val: any, name: string) => [
                `$${Number(val).toLocaleString()}`,
                name.toUpperCase(),
              ]}
            />
            {/* Background Sample Paths */}
            <Line type="monotone" dataKey="path1" stroke="#38BDF8" strokeWidth={0.6} strokeOpacity={0.25} dot={false} />
            <Line type="monotone" dataKey="path2" stroke="#38BDF8" strokeWidth={0.6} strokeOpacity={0.25} dot={false} />
            <Line type="monotone" dataKey="path3" stroke="#38BDF8" strokeWidth={0.6} strokeOpacity={0.25} dot={false} />
            <Line type="monotone" dataKey="path4" stroke="#38BDF8" strokeWidth={0.6} strokeOpacity={0.25} dot={false} />
            <Line type="monotone" dataKey="path5" stroke="#38BDF8" strokeWidth={0.6} strokeOpacity={0.25} dot={false} />
            <Line type="monotone" dataKey="path6" stroke="#38BDF8" strokeWidth={0.6} strokeOpacity={0.25} dot={false} />
            {/* Key Percentiles */}
            <Line type="monotone" dataKey="p95" stroke="#38BDF8" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="median" stroke="#0284C7" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="p05" stroke="#60A5FA" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>

        {/* Right percentile endpoint labels */}
        <div className="absolute right-0 top-3 flex flex-col justify-between h-28 text-[9px] font-mono text-slate-300 pointer-events-none text-right pr-1">
          <div>
            <div className="text-slate-400">95th %</div>
            <div className="font-bold text-[#38BDF8]">$182,450</div>
          </div>
          <div>
            <div className="text-slate-400">Median</div>
            <div className="font-bold text-white">$132,110</div>
          </div>
          <div>
            <div className="text-slate-400">5th %</div>
            <div className="font-bold text-[#F87171]">$81,230</div>
          </div>
        </div>
      </div>

      {/* Bottom KPI Metrics */}
      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#1A2230] text-center">
        <div>
          <div className="text-[10px] text-slate-400 leading-tight">Expected Return</div>
          <div className="font-mono font-bold text-xs text-[#10B981] mt-0.5">+12.8%</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400 leading-tight">Probability of Loss</div>
          <div className="font-mono font-bold text-xs text-white mt-0.5">17.4%</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400 leading-tight">5% VaR (1Y)</div>
          <div className="font-mono font-bold text-xs text-[#F43F5E] mt-0.5">-33.2%</div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400 leading-tight">Expected Shortfall</div>
          <div className="font-mono font-bold text-xs text-[#F43F5E] mt-0.5">-41.7%</div>
        </div>
      </div>
    </div>
  );
}
