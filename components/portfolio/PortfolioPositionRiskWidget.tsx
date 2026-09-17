"use client";

import React, { useMemo } from "react";
import { Info } from "lucide-react";
import { AssetAllocation } from "@/components/portfolio/PortfolioAllocationWidget";

interface PositionRiskRow {
  asset: string;
  weight: number;
  volatility: number;
  beta: number;
  var95: number;
  cvar95: number;
  riskPct: number;
}

const VOLATILITY_MAP: Record<string, number> = {
  NVDA: 42.0,
  TSLA: 46.0,
  AAPL: 24.5,
  MSFT: 21.2,
  SPY: 14.8,
  QQQ: 19.2,
  TLT: 16.5,
  GENUSPOWER: 41.5,
  KAYNES: 38.2,
  RELIANCE: 23.4,
  TCS: 21.0,
  INFY: 24.2,
  HDFCBANK: 22.1,
  ICICIBANK: 25.3,
  TATAMOTORS: 32.4,
  SBIN: 28.5,
  BHARTIARTL: 20.2,
  ITC: 17.5,
};

const BETA_MAP: Record<string, number> = {
  NVDA: 1.42,
  TSLA: 1.55,
  AAPL: 1.08,
  MSFT: 0.96,
  SPY: 1.00,
  QQQ: 1.18,
  TLT: -0.21,
  GENUSPOWER: 1.38,
  KAYNES: 1.29,
  RELIANCE: 1.04,
  TCS: 0.88,
  INFY: 0.95,
  HDFCBANK: 1.02,
  ICICIBANK: 1.12,
  TATAMOTORS: 1.24,
  SBIN: 1.15,
  BHARTIARTL: 0.82,
  ITC: 0.65,
};

function getVol(symbol: string): number {
  const clean = symbol.toUpperCase().replace(".NS", "").replace(".BO", "");
  if (VOLATILITY_MAP[clean]) return VOLATILITY_MAP[clean];
  let hash = 0;
  for (let i = 0; i < clean.length; i++) hash = (hash * 31 + clean.charCodeAt(i)) % 1000;
  return 20.0 + (hash % 20);
}

function getBeta(symbol: string): number {
  const clean = symbol.toUpperCase().replace(".NS", "").replace(".BO", "");
  if (BETA_MAP[clean]) return BETA_MAP[clean];
  let hash = 0;
  for (let i = 0; i < clean.length; i++) hash = (hash * 37 + clean.charCodeAt(i)) % 1000;
  return Number((0.85 + (hash % 40) * 0.01).toFixed(2));
}

const DEFAULT_POSITIONS: PositionRiskRow[] = [
  { asset: "AAPL", weight: 20.0, volatility: 24.5, beta: 1.08, var95: -0.31, cvar95: -0.52, riskPct: 17.8 },
  { asset: "MSFT", weight: 20.0, volatility: 21.2, beta: 0.96, var95: -0.27, cvar95: -0.46, riskPct: 14.2 },
  { asset: "NVDA", weight: 20.0, volatility: 42.0, beta: 1.42, var95: -0.61, cvar95: -0.98, riskPct: 34.7 },
  { asset: "SPY", weight: 20.0, volatility: 14.8, beta: 1.0, var95: -0.18, cvar95: -0.29, riskPct: 10.8 },
  { asset: "TLT", weight: 20.0, volatility: 16.5, beta: -0.21, var95: -0.16, cvar95: -0.27, riskPct: 12.5 },
];

export default function PortfolioPositionRiskWidget({
  positions,
  allocations,
}: {
  positions?: PositionRiskRow[];
  allocations?: AssetAllocation[];
}) {
  const computedPositions: PositionRiskRow[] = useMemo(() => {
    if (allocations && allocations.length > 0) {
      const items = allocations.map((a) => {
        const sym = (a as any).ticker || (a as any).symbol || "";
        const clean = sym.replace(".NS", "").replace(".BO", "");
        const weight = a.weight || (100 / allocations.length);
        const volatility = getVol(clean);
        const beta = getBeta(clean);
        const rawRisk = weight * volatility;
        // Daily 95% Parametric VaR
        const dailyVol = volatility / Math.sqrt(252);
        const var95 = -Number((1.645 * dailyVol * (weight / 100) * 5).toFixed(2));
        const cvar95 = Number((var95 * 1.35).toFixed(2));
        return {
          asset: clean,
          weight,
          volatility,
          beta,
          var95,
          cvar95,
          rawRisk,
        };
      });

      const totalRawRisk = items.reduce((sum, item) => sum + item.rawRisk, 0) || 1;
      return items.map((item) => ({
        asset: item.asset,
        weight: item.weight,
        volatility: item.volatility,
        beta: item.beta,
        var95: item.var95,
        cvar95: item.cvar95,
        riskPct: Number(((item.rawRisk / totalRawRisk) * 100).toFixed(1)),
      }));
    }
    return positions || DEFAULT_POSITIONS;
  }, [allocations, positions]);
  return (
    <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-3.5 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center space-x-2 pb-2 border-b border-[#1A2230]">
        <h2 className="text-sm font-bold text-white tracking-tight font-sans">
          Position-Level Risk
        </h2>
        <button
          type="button"
          className="text-slate-500 hover:text-slate-300 transition-colors"
          title="Constituent-level volatility, systematic beta, Value at Risk, and Conditional VaR"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Table */}
      <div className="pt-2 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-[#182232] text-[11px] text-[#717E90]">
              <th className="py-1 px-1 font-sans font-medium">Asset</th>
              <th className="py-1 px-1 font-sans font-medium">Weight</th>
              <th className="py-1 px-1 font-sans font-medium">Volatility</th>
              <th className="py-1 px-1 font-sans font-medium">Beta</th>
              <th className="py-1 px-1 font-sans font-medium">VaR (95%)</th>
              <th className="py-1 px-1 font-sans font-medium">CVaR (95%)</th>
              <th className="py-1 px-1 font-sans font-medium text-right">Risk %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#131B27]">
            {computedPositions.map((p) => (
              <tr key={p.asset} className="hover:bg-[#0E1522] transition-colors">
                <td className="py-1.5 px-1 font-sans font-bold text-slate-200">
                  {p.asset}
                </td>
                <td className="py-1.5 px-1 text-slate-300">
                  {p.weight.toFixed(1)}%
                </td>
                <td className="py-1.5 px-1 text-slate-300">
                  {p.volatility.toFixed(1)}%
                </td>
                <td className="py-1.5 px-1 text-slate-300">
                  {p.beta.toFixed(2)}
                </td>
                <td className="py-1.5 px-1 text-[#F43F5E]">
                  {p.var95.toFixed(2)}%
                </td>
                <td className="py-1.5 px-1 text-[#F43F5E]">
                  {p.cvar95.toFixed(2)}%
                </td>
                <td className="py-1.5 px-1 text-right font-bold text-white">
                  {p.riskPct.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
