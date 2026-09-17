"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export interface PortfolioKpiData {
  totalReturn: number; // e.g. 22.34
  totalReturnDelta: number; // e.g. 12.8
  annualizedReturn: number; // e.g. 20.12
  annualizedReturnDelta: number; // e.g. 11.5
  volatilityAnn: number; // e.g. 18.43
  volatilityDelta: number; // e.g. -4.2
  sharpeRatio: number; // e.g. 1.21
  sharpeDelta: number; // e.g. 0.46
  sortinoRatio: number; // e.g. 1.87
  sortinoDelta: number; // e.g. 0.71
  maxDrawdown: number; // e.g. -14.93
  maxDrawdownDelta: number; // e.g. -5.1
  calmarRatio: number; // e.g. 1.35
  calmarDelta: number; // e.g. 0.62
  alphaAnn: number; // e.g. 8.21
  alphaDelta: number; // e.g. 4.3
  beta: number; // e.g. 0.78
  betaDelta: number; // e.g. -0.22
}

const DEFAULT_KPIS: PortfolioKpiData = {
  totalReturn: 22.34,
  totalReturnDelta: 12.8,
  annualizedReturn: 20.12,
  annualizedReturnDelta: 11.5,
  volatilityAnn: 18.43,
  volatilityDelta: -4.2,
  sharpeRatio: 1.21,
  sharpeDelta: 0.46,
  sortinoRatio: 1.87,
  sortinoDelta: 0.71,
  maxDrawdown: -14.93,
  maxDrawdownDelta: -5.1,
  calmarRatio: 1.35,
  calmarDelta: 0.62,
  alphaAnn: 8.21,
  alphaDelta: 4.3,
  beta: 0.78,
  betaDelta: -0.22,
};

interface PortfolioKpiStripProps {
  data?: Partial<PortfolioKpiData>;
  benchmarkSymbol?: string;
}

export default function PortfolioKpiStrip({
  data = {},
  benchmarkSymbol = "SPY",
}: PortfolioKpiStripProps) {
  const kpis: PortfolioKpiData = { ...DEFAULT_KPIS, ...data };

  const bmLabel = (() => {
    switch (benchmarkSymbol) {
      case "^NSEI":
        return "NIFTY 50";
      case "^NSEBANK":
        return "NIFTY Bank";
      case "^BSESN":
        return "SENSEX";
      case "NIFTY_IT":
        return "NIFTY IT";
      case "NIFTY_MIDCAP":
        return "NIFTY Midcap";
      case "SPY":
        return "S&P 500";
      case "QQQ":
        return "QQQ";
      case "IWM":
        return "Russell 2000";
      case "DIA":
        return "Dow Jones";
      default:
        return benchmarkSymbol;
    }
  })();

  const cards = [
    {
      label: "Total Return",
      value: `+${kpis.totalReturn.toFixed(2)}%`,
      valColor: "text-[#10B981]",
      delta: `+${kpis.totalReturnDelta.toFixed(1)}% vs ${bmLabel}`,
      isPositiveDelta: true,
      deltaDir: "up" as const,
    },
    {
      label: "Annualized Return",
      value: `+${kpis.annualizedReturn.toFixed(2)}%`,
      valColor: "text-[#10B981]",
      delta: `+${kpis.annualizedReturnDelta.toFixed(1)}% vs ${bmLabel}`,
      isPositiveDelta: true,
      deltaDir: "up" as const,
    },
    {
      label: "Volatility (Ann.)",
      value: `${kpis.volatilityAnn.toFixed(2)}%`,
      valColor: "text-white",
      delta: `${kpis.volatilityDelta > 0 ? "+" : ""}${kpis.volatilityDelta.toFixed(1)}% vs ${bmLabel}`,
      isPositiveDelta: true, // Lower vol is positive
      deltaDir: "down" as const,
    },
    {
      label: "Sharpe Ratio",
      value: kpis.sharpeRatio.toFixed(2),
      valColor: "text-white",
      delta: `+${kpis.sharpeDelta.toFixed(2)} vs ${bmLabel}`,
      isPositiveDelta: true,
      deltaDir: "up" as const,
    },
    {
      label: "Sortino Ratio",
      value: kpis.sortinoRatio.toFixed(2),
      valColor: "text-white",
      delta: `+${kpis.sortinoDelta.toFixed(2)} vs ${bmLabel}`,
      isPositiveDelta: true,
      deltaDir: "up" as const,
    },
    {
      label: "Max Drawdown",
      value: `${kpis.maxDrawdown.toFixed(2)}%`,
      valColor: "text-[#F43F5E]",
      delta: `${kpis.maxDrawdownDelta > 0 ? "+" : ""}${kpis.maxDrawdownDelta.toFixed(1)}% vs ${bmLabel}`,
      isPositiveDelta: false,
      deltaDir: "down" as const,
    },
    {
      label: "Calmar Ratio",
      value: kpis.calmarRatio.toFixed(2),
      valColor: "text-white",
      delta: `+${kpis.calmarDelta.toFixed(2)} vs ${bmLabel}`,
      isPositiveDelta: true,
      deltaDir: "up" as const,
    },
    {
      label: "Alpha (Ann.)",
      value: `${kpis.alphaAnn.toFixed(2)}%`,
      valColor: "text-white",
      delta: `+${kpis.alphaDelta.toFixed(1)}% vs ${bmLabel}`,
      isPositiveDelta: true,
      deltaDir: "up" as const,
    },
    {
      label: "Beta",
      value: kpis.beta.toFixed(2),
      valColor: "text-white",
      delta: `${kpis.betaDelta > 0 ? "+" : ""}${kpis.betaDelta.toFixed(2)} vs ${bmLabel}`,
      isPositiveDelta: false,
      deltaDir: "down" as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-9 gap-2">
      {cards.map((c, i) => (
        <div
          key={i}
          className="bg-[#090D14] border border-[#1E2530] rounded-lg p-2.5 flex flex-col justify-between hover:border-[#2B374A] transition-colors"
        >
          <div className="text-[11px] text-[#8490A0] font-medium leading-tight truncate">
            {c.label}
          </div>
          <div className={`text-lg font-bold font-mono tracking-tight my-1 ${c.valColor}`}>
            {c.value}
          </div>
          <div
            className={`flex items-center space-x-1 text-[10px] font-mono font-medium ${
              c.isPositiveDelta ? "text-[#10B981]" : "text-[#F43F5E]"
            }`}
          >
            {c.deltaDir === "up" ? (
              <ArrowUpRight className="w-3 h-3 shrink-0" />
            ) : (
              <ArrowDownRight className="w-3 h-3 shrink-0" />
            )}
            <span className="truncate">{c.delta}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
