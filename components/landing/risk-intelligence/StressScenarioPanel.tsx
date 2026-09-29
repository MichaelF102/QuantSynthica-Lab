"use client";

import React, { useState } from "react";
import { Zap, AlertTriangle, ArrowRight, ShieldCheck, Flame, RefreshCw } from "lucide-react";
import { RiskState } from "./RiskNavigation";

interface StressScenarioPanelProps {
  onTriggerScenario: (scenarioId: string) => void;
}

interface Scenario {
  id: string;
  name: string;
  shock: string;
  stressLoss: string;
  drawdownImpact: string;
  volatilitySpike: string;
  var99: string;
  description: string;
  color: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "crash",
    name: "Market Crash",
    shock: "-15% Equity Shock",
    stressLoss: "-15.2%",
    drawdownImpact: "-18.4%",
    volatilitySpike: "38.6%",
    var99: "-8.4%",
    description: "Systemic equity sell-off comparable to March 2020 liquidity plunge.",
    color: "#EF4444",
  },
  {
    id: "rates",
    name: "Rate Shock",
    shock: "+200 bps Yields",
    stressLoss: "-8.1%",
    drawdownImpact: "-12.6%",
    volatilitySpike: "28.4%",
    var99: "-6.9%",
    description: "Sudden central bank tightening and bond yield curve steepening.",
    color: "#F97316",
  },
  {
    id: "vol",
    name: "Volatility Spike",
    shock: "+80% VIX Jump",
    stressLoss: "-12.4%",
    drawdownImpact: "-14.8%",
    volatilitySpike: "45.2%",
    var99: "-9.1%",
    description: "Gamma squeeze and options market implied volatility blowout.",
    color: "#8B5CF6",
  },
  {
    id: "liquidity",
    name: "Liquidity Freeze",
    shock: "-20% Depth Drop",
    stressLoss: "-20.3%",
    drawdownImpact: "-22.7%",
    volatilitySpike: "41.0%",
    var99: "-11.8%",
    description: "Bid-ask spread widening and institutional order book exhaustion.",
    color: "#DC2626",
  },
];

export default function StressScenarioPanel({ onTriggerScenario }: StressScenarioPanelProps) {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0]);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSelect = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setIsSimulating(true);
    onTriggerScenario(scenario.id);
    setTimeout(() => {
      setIsSimulating(false);
    }, 700);
  };

  return (
    <div className="mt-8 p-6 sm:p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-rose-400 mb-1">
            <Flame className="w-3.5 h-3.5 fill-current" />
            WHAT IF? SCENARIO SIMULATOR
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Simulate extreme market conditions.
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Explore how multi-sigma macroeconomic dislocations shock your portfolio before capital is committed.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs shrink-0 self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          <span>Non-linear tail risk engine</span>
        </div>
      </div>

      {/* Interactive Scenario Buttons */}
      <div className="relative z-10 mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {SCENARIOS.map((s) => {
          const isSelected = selectedScenario.id === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelect(s)}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 group relative ${
                isSelected
                  ? "bg-slate-800/90 border-rose-500/80 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500/30"
                  : "bg-slate-900/60 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">
                  {s.name}
                </span>
                <Zap
                  className={`w-3.5 h-3.5 transition-colors ${
                    isSelected ? "text-rose-400 fill-rose-400/20" : "text-slate-500 group-hover:text-rose-400"
                  }`}
                />
              </div>
              <div className="text-sm font-black text-rose-400">{s.shock}</div>
              <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">{s.description}</div>
            </button>
          );
        })}
      </div>

      {/* Active Scenario Impact Dashboard */}
      <div className="relative z-10 mt-6 p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Selected Scenario:</span>
            <span className="text-xs font-black text-white px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
              {selectedScenario.name}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">{selectedScenario.description}</p>
        </div>

        {/* 4 Impact Values */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <div className="border-l border-slate-800 pl-3">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Simulated Loss</div>
            <div className="text-base font-black text-rose-400 mt-0.5">{selectedScenario.stressLoss}</div>
          </div>
          <div className="border-l border-slate-800 pl-3">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Max Drawdown</div>
            <div className="text-base font-black text-rose-400 mt-0.5">{selectedScenario.drawdownImpact}</div>
          </div>
          <div className="border-l border-slate-800 pl-3">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Vol Spike</div>
            <div className="text-base font-black text-purple-400 mt-0.5">{selectedScenario.volatilitySpike}</div>
          </div>
          <div className="border-l border-slate-800 pl-3">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Tail 99% VaR</div>
            <div className="text-base font-black text-rose-500 mt-0.5">{selectedScenario.var99}</div>
          </div>
        </div>
      </div>

      <div className="mt-3 text-[10px] text-slate-500 text-right">
        *Illustrative parametric stress shocks for demo portfolio
      </div>
    </div>
  );
}
