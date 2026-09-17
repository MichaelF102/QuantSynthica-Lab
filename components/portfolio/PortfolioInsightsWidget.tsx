"use client";

import React from "react";
import {
  TrendingUp,
  ShieldAlert,
  AlertTriangle,
  RotateCw,
  Compass,
} from "lucide-react";

export default function PortfolioInsightsWidget() {
  const insights = [
    {
      title: "Well Diversified",
      desc: "Portfolio correlation is 0.41, indicating good diversification.",
      icon: TrendingUp,
      iconColor: "text-[#10B981]",
      bgColor: "bg-[#064E3B]/20",
      borderColor: "border-[#065F46]/40",
    },
    {
      title: "High NVDA Risk Contribution",
      desc: "NVDA contributes 34.7% of total portfolio risk.",
      icon: ShieldAlert,
      iconColor: "text-[#F43F5E]",
      bgColor: "bg-[#7F1D1D]/20",
      borderColor: "border-[#991B1B]/40",
    },
    {
      title: "Tail Risk Elevated",
      desc: "5% 1Y Monte Carlo loss is -33.2%. Consider protective strategies.",
      icon: AlertTriangle,
      iconColor: "text-[#F59E0B]",
      bgColor: "bg-[#78350F]/20",
      borderColor: "border-[#92400E]/40",
    },
    {
      title: "Rebalancing Improves Stability",
      desc: "Monthly rebalancing improves Sharpe by 18.7% vs no rebalancing.",
      icon: RotateCw,
      iconColor: "text-[#38BDF8]",
      bgColor: "bg-[#075985]/20",
      borderColor: "border-[#0284C7]/40",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
      {/* 1. Left: Key Risk Insights 4-Card Strip (8 cols) */}
      <div className="lg:col-span-8 bg-[#090D14] border border-[#1E2530] rounded-lg p-3.5 flex flex-col justify-between">
        <div className="flex items-center space-x-2 pb-2 border-b border-[#1A2230]">
          <Compass className="w-4 h-4 text-[#38BDF8]" />
          <h2 className="text-sm font-bold text-white tracking-tight font-sans">
            Key Risk Insights
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 pt-2.5">
          {insights.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className={`p-2.5 rounded-lg border flex flex-col justify-between space-y-2 hover:border-[#38BDF8]/40 transition-colors ${card.bgColor} ${card.borderColor}`}
              >
                <div className="flex items-center space-x-2">
                  <div className="p-1 rounded bg-[#090D14]/80 shrink-0">
                    <Icon className={`w-3.5 h-3.5 ${card.iconColor}`} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-100 font-sans leading-tight">
                    {card.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                  {card.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Right: Portfolio Risk Summary (4 cols) */}
      <div className="lg:col-span-4 bg-[#090D14] border border-[#1E2530] rounded-lg p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-2 border-b border-[#1A2230]">
          <h2 className="text-sm font-bold text-white tracking-tight font-sans">
            Portfolio Risk Summary
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-2 text-xs">
          {/* Col 1 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Overall Risk Level</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40">
                MODERATE
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Diversification Score</span>
              <span className="font-mono font-bold text-slate-200">3.7 / 5</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Tail Risk (CVaR 95%)</span>
              <span className="font-mono font-bold text-[#F43F5E]">-41.7%</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Risk of Ruin (1Y)</span>
              <span className="font-mono font-bold text-[#F43F5E]">8.1%</span>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-1.5 border-l border-[#1A2230] pl-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Largest Risk Contributor</span>
              <span className="font-mono font-bold text-slate-200 truncate ml-1 text-right">
                NVDA (34.7%)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Highest Correlation</span>
              <span className="font-mono font-bold text-slate-200 truncate ml-1 text-right">
                AAPL ↔ SPY (0.84)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Best Performing Asset</span>
              <span className="font-mono font-bold text-[#10B981] truncate ml-1 text-right">
                NVDA (+34.2%)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Worst Performing Asset</span>
              <span className="font-mono font-bold text-[#F43F5E] truncate ml-1 text-right">
                TLT (-6.8%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
