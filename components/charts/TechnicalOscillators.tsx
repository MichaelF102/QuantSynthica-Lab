"use client";

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Cell,
} from "recharts";
import { MarketBar } from "@/types";

interface TechnicalOscillatorsProps {
  bars: MarketBar[];
  activeOscillators?: ("rsi" | "macd" | "stochastic" | "atr")[];
}

export default function TechnicalOscillators({
  bars,
  activeOscillators = ["rsi", "macd", "stochastic", "atr"],
}: TechnicalOscillatorsProps) {
  if (!bars || bars.length === 0) return null;

  const latest = bars[bars.length - 1];

  const showRsi = activeOscillators.includes("rsi") && latest?.rsi_14 !== undefined;
  const showMacd = activeOscillators.includes("macd") && (latest?.macd_line !== undefined || latest?.macd_hist !== undefined);
  const showStoch = activeOscillators.includes("stochastic") && latest?.stoch_k !== undefined;
  const showAtr = activeOscillators.includes("atr") && latest?.atr_14 !== undefined;

  return (
    <div className="space-y-3">
      {/* 1. RSI (14) Subpanel */}
      {showRsi && (
        <div className="border border-[#252A31] rounded-[2px] bg-[#101318] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#252A31] bg-[#0B0D10] text-xs font-mono">
            <div className="flex items-center space-x-3">
              <span className="font-bold text-[#D8DCE2]">RSI (14)</span>
              <span className="text-[#F59E0B] font-bold">
                {latest.rsi_14 ? latest.rsi_14.toFixed(2) : "--"}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] text-[#89919C]">
              <span className="text-[#EF4444]">OB 70</span>
              <span>&bull;</span>
              <span className="text-[#10B981]">OS 30</span>
              <span>&bull;</span>
              <span className={latest.rsi_14! > 70 ? "text-[#EF4444] font-bold" : latest.rsi_14! < 30 ? "text-[#10B981] font-bold" : "text-[#89919C]"}>
                {latest.rsi_14! > 70 ? "OVERBOUGHT" : latest.rsi_14! < 30 ? "OVERSOLD" : "NEUTRAL"}
              </span>
            </div>
          </div>

          <div style={{ width: "100%", height: 110 }} className="pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={bars} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#1E232B" strokeDasharray="1 1" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis
                  domain={[10, 90]}
                  ticks={[30, 50, 70]}
                  stroke="#59616B"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  orientation="right"
                />
                <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="2 2" strokeOpacity={0.6} />
                <ReferenceLine y={50} stroke="#252A31" strokeDasharray="1 1" />
                <ReferenceLine y={30} stroke="#10B981" strokeDasharray="2 2" strokeOpacity={0.6} />
                <Tooltip
                  cursor={{ stroke: "#59616B", strokeWidth: 1, strokeDasharray: "2 2" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as MarketBar;
                    return (
                      <div className="rounded-[2px] border border-[#252A31] bg-[#101318] p-1.5 font-mono text-[11px] shadow-none">
                        <div className="text-[#89919C]">{d.date}</div>
                        <div className="text-[#F59E0B] font-bold">RSI: {d.rsi_14?.toFixed(2)}</div>
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rsi_14"
                  stroke="#F59E0B"
                  strokeWidth={1.2}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 2. MACD Subpanel */}
      {showMacd && (
        <div className="border border-[#252A31] rounded-[2px] bg-[#101318] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#252A31] bg-[#0B0D10] text-xs font-mono">
            <div className="flex items-center space-x-3">
              <span className="font-bold text-[#D8DCE2]">MACD (12, 26, 9)</span>
              <span className="text-[#38BDF8]">
                MACD {latest.macd_line !== undefined ? latest.macd_line.toFixed(2) : "--"}
              </span>
              <span className="text-[#F59E0B]">
                SIG {latest.macd_signal !== undefined ? latest.macd_signal.toFixed(2) : "--"}
              </span>
              <span className={latest.macd_hist && latest.macd_hist >= 0 ? "text-[#10B981] font-bold" : "text-[#EF4444] font-bold"}>
                HIST {latest.macd_hist !== undefined ? latest.macd_hist.toFixed(2) : "--"}
              </span>
            </div>
            <div className="text-[10px] text-[#89919C]">
              {latest.macd_hist && latest.macd_hist >= 0 ? (
                <span className="text-[#10B981]">BULLISH MOMENTUM</span>
              ) : (
                <span className="text-[#EF4444]">BEARISH MOMENTUM</span>
              )}
            </div>
          </div>

          <div style={{ width: "100%", height: 120 }} className="pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={bars} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#1E232B" strokeDasharray="1 1" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis
                  stroke="#59616B"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  orientation="right"
                  tickFormatter={(v) => v.toFixed(1)}
                />
                <ReferenceLine y={0} stroke="#252A31" strokeWidth={1} />
                <Tooltip
                  cursor={{ stroke: "#59616B", strokeWidth: 1, strokeDasharray: "2 2" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as MarketBar;
                    return (
                      <div className="rounded-[2px] border border-[#252A31] bg-[#101318] p-1.5 font-mono text-[11px] shadow-none">
                        <div className="text-[#89919C]">{d.date}</div>
                        <div className="text-[#38BDF8]">MACD: {d.macd_line?.toFixed(2)}</div>
                        <div className="text-[#F59E0B]">SIG: {d.macd_signal?.toFixed(2)}</div>
                        <div className={d.macd_hist && d.macd_hist >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}>
                          HIST: {d.macd_hist?.toFixed(2)}
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="macd_hist" isAnimationActive={false}>
                  {bars.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={(entry.macd_hist || 0) >= 0 ? "#10B981" : "#EF4444"}
                      opacity={0.8}
                    />
                  ))}
                </Bar>
                <Line
                  type="monotone"
                  dataKey="macd_line"
                  stroke="#38BDF8"
                  strokeWidth={1.2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="macd_signal"
                  stroke="#F59E0B"
                  strokeWidth={1.2}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 3. Stochastic Oscillator Subpanel */}
      {showStoch && (
        <div className="border border-[#252A31] rounded-[2px] bg-[#101318] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#252A31] bg-[#0B0D10] text-xs font-mono">
            <div className="flex items-center space-x-3">
              <span className="font-bold text-[#D8DCE2]">STOCHASTIC (14, 3)</span>
              <span className="text-[#38BDF8]">
                %K {latest.stoch_k ? latest.stoch_k.toFixed(1) : "--"}
              </span>
              <span className="text-[#F59E0B]">
                %D {latest.stoch_d ? latest.stoch_d.toFixed(1) : "--"}
              </span>
            </div>
            <div className="text-[10px] text-[#89919C]">
              {latest.stoch_k! > 80 ? (
                <span className="text-[#EF4444] font-bold">OVERBOUGHT (&gt;80)</span>
              ) : latest.stoch_k! < 20 ? (
                <span className="text-[#10B981] font-bold">OVERSOLD (&lt;20)</span>
              ) : (
                <span>NEUTRAL</span>
              )}
            </div>
          </div>

          <div style={{ width: "100%", height: 110 }} className="pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={bars} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#1E232B" strokeDasharray="1 1" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis
                  domain={[0, 100]}
                  ticks={[20, 50, 80]}
                  stroke="#59616B"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  orientation="right"
                />
                <ReferenceLine y={80} stroke="#EF4444" strokeDasharray="2 2" strokeOpacity={0.6} />
                <ReferenceLine y={20} stroke="#10B981" strokeDasharray="2 2" strokeOpacity={0.6} />
                <Tooltip
                  cursor={{ stroke: "#59616B", strokeWidth: 1, strokeDasharray: "2 2" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as MarketBar;
                    return (
                      <div className="rounded-[2px] border border-[#252A31] bg-[#101318] p-1.5 font-mono text-[11px] shadow-none">
                        <div className="text-[#89919C]">{d.date}</div>
                        <div className="text-[#38BDF8]">%K: {d.stoch_k?.toFixed(1)}</div>
                        <div className="text-[#F59E0B]">%D: {d.stoch_d?.toFixed(1)}</div>
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="stoch_k"
                  stroke="#38BDF8"
                  strokeWidth={1.2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="stoch_d"
                  stroke="#F59E0B"
                  strokeWidth={1.2}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. ATR (14) Subpanel */}
      {showAtr && (
        <div className="border border-[#252A31] rounded-[2px] bg-[#101318] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#252A31] bg-[#0B0D10] text-xs font-mono">
            <div className="flex items-center space-x-3">
              <span className="font-bold text-[#D8DCE2]">ATR (14) VOLATILITY</span>
              <span className="text-[#A855F7] font-bold">
                ${latest.atr_14 ? latest.atr_14.toFixed(2) : "--"}
              </span>
            </div>
            <div className="text-[10px] text-[#89919C] font-mono">
              RANGE &plusmn;{((latest.atr_14! / latest.close) * 100).toFixed(2)}% OF PRICE
            </div>
          </div>

          <div style={{ width: "100%", height: 100 }} className="pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={bars} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#1E232B" strokeDasharray="1 1" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#59616B"
                  fontSize={9}
                  tickLine={false}
                  axisLine={{ stroke: "#252A31" }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis
                  stroke="#59616B"
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  orientation="right"
                  tickFormatter={(v) => `$${v.toFixed(1)}`}
                />
                <Tooltip
                  cursor={{ stroke: "#59616B", strokeWidth: 1, strokeDasharray: "2 2" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as MarketBar;
                    return (
                      <div className="rounded-[2px] border border-[#252A31] bg-[#101318] p-1.5 font-mono text-[11px] shadow-none">
                        <div className="text-[#89919C]">{d.date}</div>
                        <div className="text-[#A855F7] font-bold">ATR: ${d.atr_14?.toFixed(2)}</div>
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="atr_14"
                  stroke="#A855F7"
                  strokeWidth={1.2}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
