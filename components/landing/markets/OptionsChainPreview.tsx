"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Layers,
  BarChart2,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Activity,
  Smile,
} from "lucide-react";
import {
  fetchOptionChain,
  OptionChainData,
  OptionContract,
  formatCurrencyValue,
  formatLargeVolume,
} from "@/lib/market/yahooFinance";
import { OPTIONS_UNDERLYINGS } from "@/lib/market/symbols";

interface OptionsChainPreviewProps {
  initialSymbol?: string;
  onSelectUnderlying?: (symbol: string) => void;
  onSelectExpiration?: (exp: string) => void;
}

export default function OptionsChainPreview({
  initialSymbol = "SPY",
  onSelectUnderlying,
  onSelectExpiration,
}: OptionsChainPreviewProps) {
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
  const [selectedExpiration, setSelectedExpiration] = useState<string | undefined>(undefined);
  const [data, setData] = useState<OptionChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsView, setAnalyticsView] = useState<"table" | "iv_smile" | "oi_profile" | "vol_profile">("table");
  const [strikeFilter, setStrikeFilter] = useState<"near" | "5pct" | "all">("near");

  // Load option chain
  const loadOptions = async (sym: string, exp?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOptionChain(sym, exp);
      setData(res);
      if (res.selectedExpiration && !selectedExpiration) {
        setSelectedExpiration(res.selectedExpiration);
        if (onSelectExpiration) onSelectExpiration(res.selectedExpiration);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load options chain");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions(selectedSymbol, selectedExpiration);
  }, [selectedSymbol, selectedExpiration]);

  const handleSymbolChange = (sym: string) => {
    setSelectedSymbol(sym);
    setSelectedExpiration(undefined);
    if (onSelectUnderlying) onSelectUnderlying(sym);
  };

  const handleExpirationChange = (exp: string) => {
    setSelectedExpiration(exp);
    if (onSelectExpiration) onSelectExpiration(exp);
  };

  const underlyingPrice = data?.underlyingPrice || 0;

  // Filter strikes
  const filteredContracts = useMemo(() => {
    if (!data?.available) return { calls: [], puts: [] };
    const { calls, puts } = data;
    if (strikeFilter === "all" || underlyingPrice <= 0) {
      return { calls, puts };
    }

    const pct = strikeFilter === "5pct" ? 0.05 : 0.08;
    const lowBound = underlyingPrice * (1 - pct);
    const highBound = underlyingPrice * (1 + pct);

    const fCalls = calls.filter((c) => c.strike >= lowBound && c.strike <= highBound);
    const fPuts = puts.filter((p) => p.strike >= lowBound && p.strike <= highBound);

    return {
      calls: fCalls.length > 0 ? fCalls : calls.slice(0, 15),
      puts: fPuts.length > 0 ? fPuts : puts.slice(0, 15),
    };
  }, [data, strikeFilter, underlyingPrice]);

  // Combine calls and puts by strike
  const strikeRows = useMemo(() => {
    const map = new Map<number, { call?: OptionContract; put?: OptionContract }>();

    filteredContracts.calls.forEach((c) => {
      const entry = map.get(c.strike) || {};
      entry.call = c;
      map.set(c.strike, entry);
    });

    filteredContracts.puts.forEach((p) => {
      const entry = map.get(p.strike) || {};
      entry.put = p;
      map.set(p.strike, entry);
    });

    const sortedStrikes = Array.from(map.keys()).sort((a, b) => a - b);
    return sortedStrikes.map((s) => ({
      strike: s,
      call: map.get(s)?.call,
      put: map.get(s)?.put,
      isAtm: Math.abs(s - underlyingPrice) / (underlyingPrice || 1) < 0.008,
    }));
  }, [filteredContracts, underlyingPrice]);

  // Scales for charts
  const maxOi = useMemo(() => {
    let m = 1;
    strikeRows.forEach((r) => {
      if (r.call && r.call.openInterest > m) m = r.call.openInterest;
      if (r.put && r.put.openInterest > m) m = r.put.openInterest;
    });
    return m;
  }, [strikeRows]);

  const maxVol = useMemo(() => {
    let m = 1;
    strikeRows.forEach((r) => {
      if (r.call && r.call.volume > m) m = r.call.volume;
      if (r.put && r.put.volume > m) m = r.put.volume;
    });
    return m;
  }, [strikeRows]);

  // IV Smile path
  const ivSmileData = useMemo(() => {
    const validCalls = strikeRows.filter((r) => r.call && r.call.impliedVolatility > 0);
    if (validCalls.length < 2) return null;
    let minIv = Infinity;
    let maxIv = -Infinity;
    validCalls.forEach((r) => {
      const iv = r.call!.impliedVolatility;
      if (iv < minIv) minIv = iv;
      if (iv > maxIv) maxIv = iv;
    });
    const pad = Math.max(2, (maxIv - minIv) * 0.1);
    return {
      points: validCalls.map((r) => ({
        strike: r.strike,
        iv: r.call!.impliedVolatility,
      })),
      minIv: minIv - pad,
      maxIv: maxIv + pad,
      range: Math.max(1, (maxIv + pad) - (minIv - pad)),
    };
  }, [strikeRows]);

  return (
    <div className="flex h-full flex-col justify-between space-y-3 font-mono text-xs">
      {/* 1. Underlying Ticker Strip */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 border-b border-border/50 text-xs">
        <span className="text-[10px] uppercase font-sans tracking-widest text-muted-foreground px-2 hidden sm:inline-block">
          UNDERLYING:
        </span>
        <div className="flex items-center gap-1">
          {OPTIONS_UNDERLYINGS.map((item, idx) => {
            const isSelected = selectedSymbol.toUpperCase() === item.symbol.toUpperCase();
            return (
              <React.Fragment key={item.symbol}>
                {idx > 0 && <span className="text-border select-none text-[10px]">|</span>}
                <button
                  type="button"
                  onClick={() => handleSymbolChange(item.symbol)}
                  className={`px-2.5 py-1 text-xs font-mono font-medium transition-all ${
                    isSelected
                      ? "text-primary font-bold bg-primary/10 border border-primary/30 rounded-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-sm border border-transparent"
                  }`}
                >
                  <span>{item.symbol}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 2. Compact Spot & Expiration Bar */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border/40 pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{selectedSymbol} OPTIONS DESK</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground uppercase border border-border/50">
              CBOE / OPRA
            </span>
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-2xl font-bold text-foreground tabular-nums">
              {underlyingPrice > 0 ? formatCurrencyValue(underlyingPrice, "$") : "—"}
            </span>
            <span className="text-xs text-muted-foreground">SPOT UNDERLYING</span>
          </div>
        </div>

        {/* Expirations Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-md">
          <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider shrink-0 font-sans">EXPIRY:</span>
          {data?.expirations && data.expirations.length > 0 ? (
            data.expirations.slice(0, 6).map((exp) => {
              const isSelected = (selectedExpiration || data.selectedExpiration) === exp;
              return (
                <button
                  key={exp}
                  type="button"
                  onClick={() => handleExpirationChange(exp)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all whitespace-nowrap ${
                    isSelected
                      ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                      : "bg-muted/30 text-muted-foreground hover:text-foreground border border-border/40"
                  }`}
                >
                  {exp}
                </button>
              );
            })
          ) : (
            <span className="text-xs text-muted-foreground">No expirations</span>
          )}
        </div>
      </div>

      {/* 3. Institutional Option Analytics Sub-bar: Max Pain, PCR, View Modes */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-1.5 px-2 bg-muted/20 border border-border/40 rounded-sm">
        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-sans mr-1.5">MAX PAIN:</span>
            <span className="font-bold text-primary tabular-nums">
              {data?.maxPain ? formatCurrencyValue(data.maxPain, "$") : "—"}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-sans mr-1.5">PCR (OI):</span>
            <span className="font-bold text-foreground tabular-nums">
              {data?.putCallRatioOI != null ? data.putCallRatioOI.toFixed(2) : "—"}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-muted-foreground uppercase font-sans mr-1.5">PCR (VOL):</span>
            <span className="font-bold text-foreground tabular-nums">
              {data?.putCallRatioVol != null ? data.putCallRatioVol.toFixed(2) : "—"}
            </span>
          </div>
        </div>

        {/* View Mode & Strike Range Switchers */}
        <div className="flex items-center gap-1.5">
          <div className="inline-flex rounded border border-border/50 bg-background/50 p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => setAnalyticsView("table")}
              className={`px-2 py-0.5 rounded-xs transition-colors ${
                analyticsView === "table" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"
              }`}
            >
              CHAIN TABLE
            </button>
            <button
              type="button"
              onClick={() => setAnalyticsView("iv_smile")}
              className={`px-2 py-0.5 rounded-xs transition-colors ${
                analyticsView === "iv_smile" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"
              }`}
            >
              IV SMILE
            </button>
            <button
              type="button"
              onClick={() => setAnalyticsView("oi_profile")}
              className={`px-2 py-0.5 rounded-xs transition-colors ${
                analyticsView === "oi_profile" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"
              }`}
            >
              OI PROFILE
            </button>
            <button
              type="button"
              onClick={() => setAnalyticsView("vol_profile")}
              className={`px-2 py-0.5 rounded-xs transition-colors ${
                analyticsView === "vol_profile" ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"
              }`}
            >
              VOL PROFILE
            </button>
          </div>

          <div className="inline-flex rounded border border-border/50 bg-background/50 p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => setStrikeFilter("near")}
              className={`px-1.5 py-0.5 rounded-xs ${
                strikeFilter === "near" ? "bg-muted text-foreground font-bold" : "text-muted-foreground"
              }`}
            >
              ATM
            </button>
            <button
              type="button"
              onClick={() => setStrikeFilter("5pct")}
              className={`px-1.5 py-0.5 rounded-xs ${
                strikeFilter === "5pct" ? "bg-muted text-foreground font-bold" : "text-muted-foreground"
              }`}
            >
              ±5%
            </button>
            <button
              type="button"
              onClick={() => setStrikeFilter("all")}
              className={`px-1.5 py-0.5 rounded-xs ${
                strikeFilter === "all" ? "bg-muted text-foreground font-bold" : "text-muted-foreground"
              }`}
            >
              ALL
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Body: Dual Sided Table or Visual Analytics */}
      <div className="relative flex-1 min-h-[340px]">
        {loading ? (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
            <span className="text-xs font-mono text-muted-foreground">Loading market data...</span>
          </div>
        ) : error || !data?.available ? (
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center p-6 text-center border border-border/50 rounded-sm bg-card">
            <div className="rounded-full bg-amber-500/10 p-3 text-amber-500 mb-2">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold font-mono tracking-wider text-foreground uppercase">
              OPTIONS DATA UNAVAILABLE
            </h4>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground font-sans">
              Option-chain data is not available for this underlying.
            </p>
            <button
              type="button"
              onClick={() => handleSymbolChange("SPY")}
              className="mt-4 px-3 py-1.5 rounded text-xs font-mono bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-2xs"
            >
              Switch to SPY Options
            </button>
          </div>
        ) : analyticsView === "table" ? (
          /* Institutional Dual-Sided Calls / Puts Chain */
          <div className="border border-border/50 rounded-sm overflow-x-auto no-scrollbar max-h-[350px] overflow-y-auto">
            <table className="w-full text-[10px] font-mono border-collapse select-none">
              <thead className="sticky top-0 bg-muted/90 backdrop-blur-xs text-muted-foreground border-b border-border/60 z-10">
                <tr>
                  {/* CALLS HEADER */}
                  <th colSpan={7} className="py-1 px-2 text-center text-emerald-500 border-r border-border/50 font-bold uppercase tracking-wider">
                    CALLS
                  </th>
                  {/* STRIKE HEADER */}
                  <th className="py-1 px-2 text-center text-foreground font-bold uppercase tracking-wider bg-muted border-r border-border/50">
                    STRIKE
                  </th>
                  {/* PUTS HEADER */}
                  <th colSpan={7} className="py-1 px-2 text-center text-rose-500 font-bold uppercase tracking-wider">
                    PUTS
                  </th>
                </tr>
                <tr className="border-t border-border/40 text-[9px] text-muted-foreground/80">
                  {/* Call columns: IV, Vol, OI, Delta, Bid, Ask, Last */}
                  <th className="py-1 px-1.5 text-right">IV</th>
                  <th className="py-1 px-1.5 text-right">VOL</th>
                  <th className="py-1 px-1.5 text-right">OI</th>
                  <th className="py-1 px-1 text-right">Δ</th>
                  <th className="py-1 px-1 text-right">BID</th>
                  <th className="py-1 px-1 text-right">ASK</th>
                  <th className="py-1 px-1.5 text-right border-r border-border/50">LAST</th>

                  {/* STRIKE */}
                  <th className="py-1 px-2 text-center font-bold bg-muted/80 text-foreground border-r border-border/50">
                    STRIKE
                  </th>

                  {/* Put columns: Last, Bid, Ask, Delta, OI, Vol, IV */}
                  <th className="py-1 px-1.5 text-left">LAST</th>
                  <th className="py-1 px-1 text-left">BID</th>
                  <th className="py-1 px-1 text-left">ASK</th>
                  <th className="py-1 px-1 text-left">Δ</th>
                  <th className="py-1 px-1.5 text-left">OI</th>
                  <th className="py-1 px-1.5 text-left">VOL</th>
                  <th className="py-1 px-1.5 text-left">IV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {strikeRows.map((row) => {
                  const call = row.call;
                  const put = row.put;
                  const isCallItm = call?.inTheMoney ?? false;
                  const isPutItm = put?.inTheMoney ?? false;

                  return (
                    <tr
                      key={row.strike}
                      className={`hover:bg-muted/40 transition-colors ${
                        row.isAtm ? "bg-primary/10 font-semibold" : ""
                      }`}
                    >
                      {/* CALL DATA */}
                      <td className={`py-1 px-1.5 text-right tabular-nums ${isCallItm ? "bg-emerald-500/5 text-emerald-600 dark:text-emerald-400" : ""}`}>
                        {call?.impliedVolatility ? `${call.impliedVolatility.toFixed(1)}%` : "—"}
                      </td>
                      <td className={`py-1 px-1.5 text-right tabular-nums ${isCallItm ? "bg-emerald-500/5" : ""}`}>
                        {formatLargeVolume(call?.volume)}
                      </td>
                      <td className={`py-1 px-1.5 text-right tabular-nums ${isCallItm ? "bg-emerald-500/5" : ""}`}>
                        {formatLargeVolume(call?.openInterest)}
                      </td>
                      <td className={`py-1 px-1 text-right tabular-nums text-muted-foreground ${isCallItm ? "bg-emerald-500/5" : ""}`}>
                        {call?.delta != null ? call.delta.toFixed(2) : "—"}
                      </td>
                      <td className={`py-1 px-1 text-right tabular-nums ${isCallItm ? "bg-emerald-500/5" : ""}`}>
                        {call?.bid ? call.bid.toFixed(2) : "—"}
                      </td>
                      <td className={`py-1 px-1 text-right tabular-nums ${isCallItm ? "bg-emerald-500/5" : ""}`}>
                        {call?.ask ? call.ask.toFixed(2) : "—"}
                      </td>
                      <td className={`py-1 px-1.5 text-right font-medium tabular-nums border-r border-border/50 ${isCallItm ? "bg-emerald-500/5 text-emerald-500" : ""}`}>
                        {call?.lastPrice ? call.lastPrice.toFixed(2) : "—"}
                      </td>

                      {/* STRIKE COLUMN */}
                      <td className={`py-1 px-2 text-center font-bold font-mono tabular-nums border-r border-border/50 ${
                        row.isAtm ? "bg-primary text-primary-foreground font-black" : "bg-muted/30 text-foreground"
                      }`}>
                        {row.strike.toFixed(1)}
                      </td>

                      {/* PUT DATA */}
                      <td className={`py-1 px-1.5 text-left font-medium tabular-nums ${isPutItm ? "bg-rose-500/5 text-rose-500" : ""}`}>
                        {put?.lastPrice ? put.lastPrice.toFixed(2) : "—"}
                      </td>
                      <td className={`py-1 px-1 text-left tabular-nums ${isPutItm ? "bg-rose-500/5" : ""}`}>
                        {put?.bid ? put.bid.toFixed(2) : "—"}
                      </td>
                      <td className={`py-1 px-1 text-left tabular-nums ${isPutItm ? "bg-rose-500/5" : ""}`}>
                        {put?.ask ? put.ask.toFixed(2) : "—"}
                      </td>
                      <td className={`py-1 px-1 text-left tabular-nums text-muted-foreground ${isPutItm ? "bg-rose-500/5" : ""}`}>
                        {put?.delta != null ? put.delta.toFixed(2) : "—"}
                      </td>
                      <td className={`py-1 px-1.5 text-left tabular-nums ${isPutItm ? "bg-rose-500/5" : ""}`}>
                        {formatLargeVolume(put?.openInterest)}
                      </td>
                      <td className={`py-1 px-1.5 text-left tabular-nums ${isPutItm ? "bg-rose-500/5" : ""}`}>
                        {formatLargeVolume(put?.volume)}
                      </td>
                      <td className={`py-1 px-1.5 text-left tabular-nums ${isPutItm ? "bg-rose-500/5 text-rose-600 dark:text-rose-400" : ""}`}>
                        {put?.impliedVolatility ? `${put.impliedVolatility.toFixed(1)}%` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : analyticsView === "iv_smile" && ivSmileData ? (
          /* IV Smile Visual Analytics */
          <div className="border border-border/50 rounded-sm bg-card p-4 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-foreground">IMPLIED VOLATILITY SMILE / SURFACE</span>
              <span className="text-muted-foreground">Expiry: {selectedExpiration || data?.selectedExpiration}</span>
            </div>

            <div className="relative flex-1 min-h-[240px]">
              <svg viewBox="0 0 680 220" className="w-full h-full overflow-visible">
                {/* Grid */}
                <line x1="20" y1="20" x2="660" y2="20" stroke="currentColor" className="text-border/40" strokeDasharray="2 3" />
                <line x1="20" y1="100" x2="660" y2="100" stroke="currentColor" className="text-border/40" strokeDasharray="2 3" />
                <line x1="20" y1="180" x2="660" y2="180" stroke="currentColor" className="text-border/40" strokeDasharray="2 3" />

                {/* IV Curve Path */}
                {(() => {
                  const pts = ivSmileData.points.map((p, i) => {
                    const x = 30 + (i / (ivSmileData.points.length - 1)) * 620;
                    const y = 20 + (1 - (p.iv - ivSmileData.minIv) / ivSmileData.range) * 160;
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  });
                  return (
                    <path
                      d={"M " + pts.join(" L ")}
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  );
                })()}

                {/* Dots along IV curve */}
                {ivSmileData.points.map((p, i) => {
                  const x = 30 + (i / (ivSmileData.points.length - 1)) * 620;
                  const y = 20 + (1 - (p.iv - ivSmileData.minIv) / ivSmileData.range) * 160;
                  const isAtm = Math.abs(p.strike - underlyingPrice) / underlyingPrice < 0.015;

                  return (
                    <g key={p.strike}>
                      <circle
                        cx={x}
                        cy={y}
                        r={isAtm ? 4 : 2.5}
                        fill={isAtm ? "#EC4899" : "#3B82F6"}
                        stroke="white"
                        strokeWidth="1"
                      />
                      {i % 3 === 0 && (
                        <text
                          x={x}
                          y="205"
                          textAnchor="middle"
                          fill="currentColor"
                          className="text-[9px] font-mono fill-muted-foreground"
                        >
                          {p.strike.toFixed(0)}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="text-[11px] text-muted-foreground flex justify-between pt-2 border-t border-border/30">
              <span>X-Axis: Strike Price ($)</span>
              <span>Y-Axis: Implied Volatility (%)</span>
            </div>
          </div>
        ) : (
          /* OI Profile or Volume Profile */
          <div className="border border-border/50 rounded-sm bg-card p-3 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                  Calls {analyticsView === "oi_profile" ? "OI" : "Volume"}
                </span>
                <span className="flex items-center gap-1.5 text-rose-500 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
                  Puts {analyticsView === "oi_profile" ? "OI" : "Volume"}
                </span>
              </div>
              <span className="text-muted-foreground text-xs">Underlying: ${underlyingPrice}</span>
            </div>

            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
              {strikeRows.map((r) => {
                const callMetric = analyticsView === "oi_profile" ? r.call?.openInterest || 0 : r.call?.volume || 0;
                const putMetric = analyticsView === "oi_profile" ? r.put?.openInterest || 0 : r.put?.volume || 0;
                const scale = analyticsView === "oi_profile" ? maxOi : maxVol;
                const callPct = (callMetric / (scale || 1)) * 100;
                const putPct = (putMetric / (scale || 1)) * 100;

                return (
                  <div
                    key={r.strike}
                    className={`flex items-center gap-2 py-1 px-2 rounded font-mono text-[11px] ${
                      r.isAtm ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/30"
                    }`}
                  >
                    {/* Call Bar (Left) */}
                    <div className="flex-1 flex justify-end items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{formatLargeVolume(callMetric)}</span>
                      <div className="w-24 sm:w-36 h-2 bg-muted/40 rounded-xs overflow-hidden flex justify-end">
                        <div className="h-full bg-emerald-500 rounded-xs" style={{ width: `${callPct}%` }} />
                      </div>
                    </div>

                    {/* Strike Center */}
                    <div className="w-14 text-center font-bold text-foreground text-xs">
                      {r.strike.toFixed(1)}
                    </div>

                    {/* Put Bar (Right) */}
                    <div className="flex-1 flex justify-start items-center gap-2">
                      <div className="w-24 sm:w-36 h-2 bg-muted/40 rounded-xs overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-xs" style={{ width: `${putPct}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{formatLargeVolume(putMetric)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 5. Institutional Footer */}
      <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time Black-Scholes Greeks calculated (Delta, Gamma, Theta, Vega)</span>
        </div>
        <span>Series Expiry: {selectedExpiration || data?.selectedExpiration || "Active"}</span>
      </div>
    </div>
  );
}
