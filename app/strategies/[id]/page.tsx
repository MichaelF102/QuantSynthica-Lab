"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Play,
  Edit3,
  ArrowLeft,
  Copy,
  Check,
  AlertTriangle,
  Layers,
  Shield,
  Activity,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { StrategyConfig } from "@/types";
import { formatConditionRule, formatRuleSet } from "@/lib/formatRule";
import TestStrategyModal from "@/components/strategies/TestStrategyModal";

export default function StrategyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [strategy, setStrategy] = useState<StrategyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [testModalOpen, setTestModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      api
        .getStrategy(id)
        .then(setStrategy)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!strategy) return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      ) {
        return;
      }

      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        router.push(`/strategies/builder?clone=${strategy.id}`);
      } else if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        setTestModalOpen(true);
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        router.push(`/backtests?run=${strategy.id}`);
      } else if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        router.push(`/backtests?run=${strategy.id}`);
      } else if (e.key === "d" || e.key === "D") {
        e.preventDefault();
        router.push(`/strategies/builder?clone=${strategy.id}`);
      } else if (e.key === "Escape") {
        e.preventDefault();
        router.push("/strategies");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [strategy, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0D10] text-[#D8DCE2] flex items-center justify-center font-mono text-xs">
        LOADING STRATEGY SPECIFICATION...
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="min-h-screen bg-[#0B0D10] text-[#EF4444] flex flex-col items-center justify-center font-mono text-xs space-y-3">
        <span>STRATEGY SPECIFICATION NOT FOUND</span>
        <Link
          href="/strategies"
          className="text-[#38BDF8] underline text-xs font-sans"
        >
          &larr; Return to Strategy Registry
        </Link>
      </div>
    );
  }

  const sType = (strategy.strategy_type || "trend").toUpperCase();

  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#D8DCE2] flex flex-col font-mono selection:bg-[#38BDF8] selection:text-black">
      {/* 1. TOP TERMINAL NAVIGATION STRIP */}
      <div className="border-b border-[#252A31] bg-[#05070A] px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <Link
            href="/strategies"
            className="text-[#59616B] hover:text-[#D8DCE2] flex items-center space-x-1"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>REGISTRY</span>
          </Link>
          <span className="text-[#59616B]">│</span>
          <span className="text-[#FF9900] font-bold tracking-wider">
            SPECIFICATION
          </span>
          <span className="text-[#59616B]">│</span>
          <span className="text-[#D8DCE2] font-semibold">{strategy.name}</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 font-sans">
          <Link
            href={`/strategies/builder?clone=${strategy.id}`}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-[2px] border border-[#252A31] bg-[#101318] text-[#D8DCE2] hover:bg-[#141820] hover:border-[#38BDF8]/40 transition-colors text-xs"
          >
            <Edit3 className="h-3 w-3 text-[#38BDF8]" />
            <span>EDIT</span>
            <span className="text-[10px] text-[#59616B] font-mono">[E]</span>
          </Link>

          <Link
            href={`/strategies/builder?clone=${strategy.id}`}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-[2px] border border-[#252A31] bg-[#101318] text-[#D8DCE2] hover:bg-[#141820] transition-colors text-xs"
          >
            <Copy className="h-3 w-3 text-[#F59E0B]" />
            <span>DUPLICATE</span>
            <span className="text-[10px] text-[#59616B] font-mono">[D]</span>
          </Link>

          <button
            onClick={() => setTestModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-[2px] bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-colors text-xs shadow-sm"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>TEST ON STOCK</span>
            <span className="text-[10px] font-mono opacity-70">[T]</span>
          </button>

          <Link
            href={`/backtests?run=${strategy.id}`}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-[2px] bg-[#38BDF8] hover:bg-[#0284C7] text-black font-semibold transition-colors text-xs"
          >
            <Play className="h-3 w-3" />
            <span>RUN SIMULATION</span>
            <span className="text-[10px] font-mono opacity-70">[S]</span>
          </Link>
        </div>
      </div>

      {/* 2. SPECIFICATION WORKSPACE CONTAINER */}
      <div className="max-w-5xl mx-auto w-full p-4 md:p-6 space-y-6 flex-1">
        {/* Identity Card */}
        <div className="border border-[#252A31] bg-[#101318] p-4 rounded-[2px] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#252A31] pb-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base md:text-lg font-bold text-[#D8DCE2]">
                  {strategy.name}
                </span>
                <span className="px-1.5 py-0.5 rounded-[2px] bg-[#141820] border border-[#252A31] text-[10px] text-[#38BDF8]">
                  {sType.replace(/_/g, " ")}
                </span>
              </div>
              <div className="text-xs text-[#89919C] mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  DEFAULT ASSET: <strong className="text-[#D8DCE2]">{strategy.asset}</strong>
                </span>
                <span>·</span>
                <button
                  onClick={() => setTestModalOpen(true)}
                  className="text-[#38BDF8] hover:text-[#7DD3FC] underline font-sans text-xs flex items-center gap-1"
                >
                  <span>Test on Indian or US Stock (NSE/BSE/US) →</span>
                </button>
                <span>·</span>
                <span>
                  TIMEFRAME: <strong className="text-[#D8DCE2]">{strategy.timeframe}</strong>
                </span>
                <span>·</span>
                <span>
                  UNIVERSE: <strong className="text-[#D8DCE2]">{strategy.universe.join(", ")}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-[11px] font-mono">
              <span className="text-[#59616B]">ID: {strategy.id}</span>
            </div>
          </div>

          {/* Thesis */}
          <div>
            <span className="text-[10px] uppercase font-bold text-[#59616B] tracking-wider block mb-1">
              QUANTITATIVE THESIS
            </span>
            <p className="text-xs text-[#D8DCE2] leading-relaxed">
              {strategy.description ||
                "Exploits statistical pricing anomalies and structural market microstructure dynamics using systematic quantitative indicators. Signals execute with strict zero-lookahead bias at bar t+1 Open."}
            </p>
          </div>
        </div>

        {/* Indicator Pipeline */}
        <div className="border border-[#252A31] bg-[#101318] rounded-[2px] overflow-hidden">
          <div className="px-4 py-2 bg-[#0B0D10] border-b border-[#252A31] flex items-center justify-between text-xs">
            <span className="font-bold text-[#FF9900] tracking-wider text-[11px]">
              INDICATOR PIPELINE ({strategy.indicators.length})
            </span>
            <span className="text-[#59616B] text-[10px]">
              Strict Backward-Looking Evaluation
            </span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#252A31] bg-[#05070A] text-[10px] text-[#59616B] font-semibold uppercase">
                <th className="py-2 px-4">INDICATOR</th>
                <th className="py-2 px-4">INSTANCE ID</th>
                <th className="py-2 px-4">MATHEMATICAL PARAMETERS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E232B] font-mono text-[11px]">
              {strategy.indicators.map((ind) => (
                <tr key={ind.id} className="hover:bg-[#141820]">
                  <td className="py-2 px-4 font-semibold text-[#D8DCE2]">
                    {ind.name}
                  </td>
                  <td className="py-2 px-4 text-[#89919C]">{ind.id}</td>
                  <td className="py-2 px-4 text-[#38BDF8]">
                    {Object.entries(ind.params || {})
                      .map(([k, v]) => `${k}=${v}`)
                      .join(", ") || "Default"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Entry and Exit Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Entry Rules */}
          <div className="border border-[#252A31] bg-[#101318] rounded-[2px] overflow-hidden">
            <div className="px-4 py-2 bg-[#0B0D10] border-b border-[#252A31] flex items-center justify-between text-xs">
              <span className="font-bold text-[#10B981] tracking-wider text-[11px]">
                ENTRY SIGNAL RULES ({strategy.entry_rules.length})
              </span>
            </div>

            <div className="p-3 space-y-2 font-mono text-xs">
              {strategy.entry_rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="p-2 border border-[#252A31] bg-[#0B0D10] rounded-[2px] flex items-center justify-between"
                >
                  <span className="text-[#59616B] text-[10px]">
                    {idx === 0 ? "WHEN" : rule.logical_operator || "AND"}
                  </span>
                  <span className="text-[#D8DCE2] font-semibold text-right">
                    {formatConditionRule(rule, strategy.indicators)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Exit Rules */}
          <div className="border border-[#252A31] bg-[#101318] rounded-[2px] overflow-hidden">
            <div className="px-4 py-2 bg-[#0B0D10] border-b border-[#252A31] flex items-center justify-between text-xs">
              <span className="font-bold text-[#EF4444] tracking-wider text-[11px]">
                EXIT SIGNAL RULES ({strategy.exit_rules.length})
              </span>
            </div>

            <div className="p-3 space-y-2 font-mono text-xs">
              {strategy.exit_rules.length === 0 ? (
                <div className="p-3 text-center text-[#59616B] text-[11px]">
                  Exits controlled strictly by Risk Stop Loss & Take Profit limits.
                </div>
              ) : (
                strategy.exit_rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-2 border border-[#252A31] bg-[#0B0D10] rounded-[2px] flex items-center justify-between"
                  >
                    <span className="text-[#59616B] text-[10px]">
                      {idx === 0 ? "EXIT WHEN" : rule.logical_operator || "OR"}
                    </span>
                    <span className="text-[#D8DCE2] font-semibold text-right">
                      {formatConditionRule(rule, strategy.indicators)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Risk & Execution Specifications */}
        <div className="border border-[#252A31] bg-[#101318] rounded-[2px] p-4 space-y-4">
          <div className="border-b border-[#252A31] pb-2 flex items-center justify-between">
            <span className="font-bold text-[#FF9900] tracking-wider text-[11px]">
              RISK PARAMETERS & EXECUTION FRICTION
            </span>
            <span className="text-[#59616B] text-[10px]">
              Institutional Execution Model
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-[#59616B] text-[10px] block">STOP LOSS</span>
              <span className="font-bold text-[#EF4444] text-sm mt-0.5 block">
                {strategy.risk.stop_loss_pct ? `-${strategy.risk.stop_loss_pct}%` : "Unbounded"}
              </span>
            </div>

            <div>
              <span className="text-[#59616B] text-[10px] block">TAKE PROFIT</span>
              <span className="font-bold text-[#10B981] text-sm mt-0.5 block">
                {strategy.risk.take_profit_pct ? `+${strategy.risk.take_profit_pct}%` : "Unbounded"}
              </span>
            </div>

            <div>
              <span className="text-[#59616B] text-[10px] block">POSITION SIZE</span>
              <span className="font-bold text-[#D8DCE2] text-sm mt-0.5 block">
                {strategy.risk.position_size_pct}% Equity
              </span>
            </div>

            <div>
              <span className="text-[#59616B] text-[10px] block">MAX POSITIONS</span>
              <span className="font-bold text-[#D8DCE2] text-sm mt-0.5 block">
                {strategy.risk.max_positions} Concurrent
              </span>
            </div>

            <div>
              <span className="text-[#59616B] text-[10px] block">COMMISSION</span>
              <span className="text-[#89919C] text-xs mt-0.5 block">
                {strategy.execution.commission_pct}% per trade
              </span>
            </div>

            <div>
              <span className="text-[#59616B] text-[10px] block">SLIPPAGE</span>
              <span className="text-[#89919C] text-xs mt-0.5 block">
                {strategy.execution.slippage_pct}% per order
              </span>
            </div>

            <div>
              <span className="text-[#59616B] text-[10px] block">INITIAL CAPITAL</span>
              <span className="text-[#89919C] text-xs mt-0.5 block">
                ${strategy.execution.initial_capital.toLocaleString()}
              </span>
            </div>

            <div>
              <span className="text-[#59616B] text-[10px] block">EXECUTION TIMING</span>
              <span className="text-[#38BDF8] text-xs mt-0.5 block">
                NEXT BAR OPEN (t+1)
              </span>
            </div>
          </div>
        </div>

        {/* Pre-Flight Action Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Link
            href="/strategies"
            className="px-3 py-1.5 border border-[#252A31] hover:bg-[#141820] text-xs text-[#89919C] rounded-[2px]"
          >
            &larr; Back to Registry [ESC]
          </Link>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setTestModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-[2px] transition-colors"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Test on Custom Stock (India / US)</span>
            </button>

            <Link
              href={`/strategies/builder?clone=${strategy.id}`}
              className="px-3 py-1.5 border border-[#252A31] hover:bg-[#141820] text-xs text-[#D8DCE2] rounded-[2px]"
            >
              Modify in Builder [E]
            </Link>

            <Link
              href={`/backtests?run=${strategy.id}`}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-[#38BDF8] hover:bg-[#0284C7] text-black font-semibold text-xs rounded-[2px] transition-colors"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Launch Backtest [B]</span>
            </Link>
          </div>
        </div>
      </div>

      <TestStrategyModal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        strategy={strategy}
      />
    </div>
  );
}
