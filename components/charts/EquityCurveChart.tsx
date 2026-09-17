"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot,
} from "recharts";
import { EquityPoint, TradeRecord } from "@/types";
import { formatCurrency, formatPercent } from "@/lib/formatters";

interface EquityCurveProps {
  data: EquityPoint[];
  trades?: TradeRecord[];
  benchmarkSymbol?: string;
  assetSymbol?: string;
  height?: number;
  onSelectTrade?: (trade: TradeRecord) => void;
  selectedTradeId?: string | null;
}

export default function EquityCurveChart({
  data,
  trades = [],
  benchmarkSymbol = "SPY",
  assetSymbol = "ASSET",
  height = 360,
  onSelectTrade,
  selectedTradeId,
}: EquityCurveProps) {
  const [viewMode, setViewMode] = useState<"EQUITY" | "RETURN">("EQUITY");
  const [isLogScale, setIsLogScale] = useState<boolean>(false);
  const [range, setRange] = useState<"1M" | "3M" | "6M" | "1Y" | "ALL">("ALL");
  const [showBenchmark, setShowBenchmark] = useState(true);
  const [showBuyHold, setShowBuyHold] = useState(true);
  const [showTradeMarkers, setShowTradeMarkers] = useState(true);

  // Normalize and slice data based on range
  const { chartData, stratReturn } = useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], stratReturn: 0 };
    }

    let filtered = data;
    if (range !== "ALL") {
      const lastDate = new Date(data[data.length - 1].date);
      let cutoffDays = 365;
      if (range === "1M") cutoffDays = 30;
      if (range === "3M") cutoffDays = 90;
      if (range === "6M") cutoffDays = 180;
      const cutoff = new Date(lastDate);
      cutoff.setDate(cutoff.getDate() - cutoffDays);
      filtered = data.filter((d) => new Date(d.date) >= cutoff);
    }

    if (filtered.length === 0) filtered = data;

    const baseStrat = filtered[0].portfolio_value || 100000;
    const baseBench = filtered[0].benchmark_value || baseStrat;
    
    const mapped = filtered.map((d) => {
      const stratRet = ((d.portfolio_value - baseStrat) / baseStrat) * 100;
      const benchRet = ((d.benchmark_value - baseBench) / baseBench) * 100;
      const bhVal = (d.benchmark_value / baseBench) * baseStrat;
      const bhRet = benchRet;

      return {
        ...d,
        strat_return: stratRet,
        bench_return: benchRet,
        bh_val: bhVal,
        bh_return: bhRet,
      };
    });

    const initV = filtered[0].portfolio_value;
    const currV = filtered[filtered.length - 1].portfolio_value;
    const sRet = ((currV - initV) / initV) * 100;

    return {
      chartData: mapped,
      stratReturn: sRet,
    };
  }, [data, range]);

  // Index trades on chart dates for marker placement
  const tradeMarkers = useMemo(() => {
    if (!showTradeMarkers || !trades || trades.length === 0 || chartData.length === 0) return [];
    const dateMap = new Map<string, typeof chartData[0]>();
    chartData.forEach((d) => dateMap.set(d.date, d));

    const markers: {
      trade: TradeRecord;
      type: "ENTRY" | "EXIT";
      date: string;
      value: number;
      isWin: boolean;
      isSelected: boolean;
    }[] = [];

    trades.forEach((t) => {
      const entryPt = dateMap.get(t.entry_date);
      if (entryPt) {
        markers.push({
          trade: t,
          type: "ENTRY",
          date: t.entry_date,
          value: viewMode === "EQUITY" ? entryPt.portfolio_value : entryPt.strat_return,
          isWin: t.net_pnl > 0,
          isSelected: t.id === selectedTradeId,
        });
      }
      const exitPt = dateMap.get(t.exit_date);
      if (exitPt) {
        markers.push({
          trade: t,
          type: "EXIT",
          date: t.exit_date,
          value: viewMode === "EQUITY" ? exitPt.portfolio_value : exitPt.strat_return,
          isWin: t.net_pnl > 0,
          isSelected: t.id === selectedTradeId,
        });
      }
    });

    return markers;
  }, [trades, chartData, viewMode, showTradeMarkers, selectedTradeId]);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center border border-[#252A31] bg-[#101318] text-[#89919C] font-mono text-xs">
        DATA NOT AVAILABLE FOR THIS RUN
      </div>
    );
  }

  const stratKey = viewMode === "EQUITY" ? "portfolio_value" : "strat_return";
  const benchKey = viewMode === "EQUITY" ? "benchmark_value" : "bench_return";
  const bhKey = viewMode === "EQUITY" ? "bh_val" : "bh_return";

  return (
    <div className="border border-[#252A31] bg-[#101318] rounded-[2px] p-3 select-none">
      {/* Institutional Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#252A31] mb-2.5 text-xs font-mono">
        {/* Left: View Mode & Scale Controls */}
        <div className="flex items-center space-x-2">
          <div className="flex rounded-[2px] border border-[#252A31] bg-[#0B0D10] p-0.5">
            <button
              onClick={() => setViewMode("EQUITY")}
              className={`px-2 py-0.5 text-[11px] font-bold rounded-[2px] transition-colors ${
                viewMode === "EQUITY"
                  ? "bg-[#252A31] text-[#D8DCE2]"
                  : "text-[#89919C] hover:text-[#D8DCE2]"
              }`}
            >
              EQUITY ($)
            </button>
            <button
              onClick={() => setViewMode("RETURN")}
              className={`px-2 py-0.5 text-[11px] font-bold rounded-[2px] transition-colors ${
                viewMode === "RETURN"
                  ? "bg-[#252A31] text-[#D8DCE2]"
                  : "text-[#89919C] hover:text-[#D8DCE2]"
              }`}
            >
              RETURN (%)
            </button>
          </div>

          <button
            onClick={() => setIsLogScale(!isLogScale)}
            className={`px-2 py-1 text-[10px] font-bold uppercase rounded-[2px] border transition-colors ${
              isLogScale
                ? "bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/40"
                : "border-[#252A31] text-[#89919C] hover:border-[#38BDF8]/30"
            }`}
            title="Toggle Logarithmic Y-axis"
          >
            LOG SCALE
          </button>

          <button
            onClick={() => setShowTradeMarkers(!showTradeMarkers)}
            className={`px-2 py-1 text-[10px] font-bold uppercase rounded-[2px] border transition-colors ${
              showTradeMarkers
                ? "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/40"
                : "border-[#252A31] text-[#89919C] hover:border-[#10B981]/30"
            }`}
            title="Toggle Trade Entry/Exit Markers"
          >
            TRADE EVENTS ({trades.length})
          </button>
        </div>

        {/* Center: Comparison Legend Toggles */}
        <div className="flex items-center space-x-3 text-[11px]">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-0.5 bg-[#38BDF8] inline-block"></span>
            <span className="text-[#D8DCE2] font-semibold">STRATEGY</span>
            <span className={`text-[10px] ${stratReturn >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
              {formatPercent(stratReturn)}
            </span>
          </div>

          <button
            onClick={() => setShowBuyHold(!showBuyHold)}
            className={`flex items-center space-x-1.5 px-1.5 py-0.5 rounded-[2px] transition-colors ${
              showBuyHold ? "opacity-100" : "opacity-40 line-through"
            }`}
          >
            <span className="w-2.5 h-0.5 bg-[#818CF8] inline-block"></span>
            <span className="text-[#89919C]">B&H ({assetSymbol})</span>
          </button>

          <button
            onClick={() => setShowBenchmark(!showBenchmark)}
            className={`flex items-center space-x-1.5 px-1.5 py-0.5 rounded-[2px] transition-colors ${
              showBenchmark ? "opacity-100" : "opacity-40 line-through"
            }`}
          >
            <span className="w-2.5 h-0.5 bg-[#59616B] inline-block border-t border-dashed"></span>
            <span className="text-[#89919C]">{benchmarkSymbol}</span>
          </button>
        </div>

        {/* Right: Time Range Slicers */}
        <div className="flex items-center rounded-[2px] border border-[#252A31] bg-[#0B0D10] p-0.5">
          {(["1M", "3M", "6M", "1Y", "ALL"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-[2px] transition-colors ${
                range === r
                  ? "bg-[#252A31] text-[#38BDF8]"
                  : "text-[#89919C] hover:text-[#D8DCE2]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 12, right: 12, left: -10, bottom: 0 }}
          >
            <CartesianGrid stroke="#1E232B" strokeDasharray="1 1" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#59616B"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: "#252A31" }}
              tickFormatter={(v) => v.slice(5)}
            />
            <YAxis
              scale={isLogScale ? "log" : "auto"}
              domain={["auto", "auto"]}
              stroke="#59616B"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) =>
                viewMode === "EQUITY"
                  ? `$${(v / 1000).toFixed(0)}k`
                  : `${v > 0 ? "+" : ""}${v.toFixed(0)}%`
              }
            />
            <Tooltip
              isAnimationActive={false}
              cursor={{ stroke: "#59616B", strokeWidth: 1, strokeDasharray: "2 2" }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                const stratVal = d.portfolio_value;
                const benchVal = d.benchmark_value;
                const delta = stratVal - benchVal;
                const deltaPct = d.strat_return - d.bench_return;

                return (
                  <div className="border border-[#252A31] bg-[#101318] p-2 font-mono text-[11px] shadow-lg rounded-[2px] space-y-1 min-w-[200px]">
                    <div className="text-[#89919C] text-[10px] pb-1 border-b border-[#252A31]">
                      {d.date}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#38BDF8]">STRATEGY:</span>
                      <span className="font-bold text-[#D8DCE2]">
                        {viewMode === "EQUITY" ? formatCurrency(stratVal) : formatPercent(d.strat_return)}
                      </span>
                    </div>
                    {showBuyHold && (
                      <div className="flex justify-between items-center text-[#818CF8]">
                        <span>BUY & HOLD:</span>
                        <span>
                          {viewMode === "EQUITY" ? formatCurrency(d.bh_val) : formatPercent(d.bh_return)}
                        </span>
                      </div>
                    )}
                    {showBenchmark && (
                      <div className="flex justify-between items-center text-[#89919C]">
                        <span>{benchmarkSymbol}:</span>
                        <span>
                          {viewMode === "EQUITY" ? formatCurrency(benchVal) : formatPercent(d.bench_return)}
                        </span>
                      </div>
                    )}
                    <div className="pt-1 border-t border-[#252A31] flex justify-between items-center text-[10px]">
                      <span className="text-[#59616B]">DIFFERENCE:</span>
                      <span className={delta >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}>
                        {viewMode === "EQUITY"
                          ? `${delta >= 0 ? "+" : ""}${formatCurrency(delta)}`
                          : `${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(2)}%`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-[#EF4444]">
                      <span className="text-[#59616B]">UNDERWATER DD:</span>
                      <span>-{Math.abs(d.drawdown).toFixed(2)}%</span>
                    </div>
                  </div>
                );
              }}
            />

            {/* Benchmark line */}
            {showBenchmark && (
              <Line
                type="monotone"
                dataKey={benchKey}
                name={benchmarkSymbol}
                stroke="#59616B"
                strokeWidth={1.2}
                strokeDasharray="3 3"
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* Buy & Hold line */}
            {showBuyHold && (
              <Line
                type="monotone"
                dataKey={bhKey}
                name={`B&H (${assetSymbol})`}
                stroke="#818CF8"
                strokeWidth={1.2}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* Primary Strategy Equity Line */}
            <Line
              type="monotone"
              dataKey={stratKey}
              name="Strategy"
              stroke="#38BDF8"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />

            {/* Trade Event Markers Overlay */}
            {tradeMarkers.map((m, idx) => (
              <ReferenceDot
                key={`${m.trade.id}-${m.type}-${idx}`}
                x={m.date}
                y={m.value}
                r={m.isSelected ? 5 : 3.5}
                fill={
                  m.type === "ENTRY"
                    ? "#10B981"
                    : m.isWin
                    ? "#38BDF8"
                    : "#EF4444"
                }
                stroke={m.isSelected ? "#FFFFFF" : "#0B0D10"}
                strokeWidth={1.5}
                className="cursor-pointer hover:opacity-80"
                onClick={() => onSelectTrade && onSelectTrade(m.trade)}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
