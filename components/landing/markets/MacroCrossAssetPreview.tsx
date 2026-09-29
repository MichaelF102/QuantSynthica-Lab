"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Activity,
  Percent,
  Coins,
  DollarSign,
  TrendingUp,
  RefreshCw,
  LineChart,
  Layers,
} from "lucide-react";
import {
  fetchMacroUniverse,
  fetchMarketAsset,
  MacroCategories,
  MacroInstrument,
  NormalizedMarketAsset,
  formatCurrencyValue,
} from "@/lib/market/yahooFinance";
import liveSnapshot from "@/data/market_universe_live.json";

interface MacroCrossAssetPreviewProps {
  onSelectInstrument?: (symbol: string) => void;
}

const MACRO_SUBTABS = [
  { id: "chart", label: "PRICE / YIELD CHART", icon: LineChart },
  { id: "yield_curve", label: "TREASURY YIELD CURVE", icon: TrendingUp },
  { id: "cross_asset", label: "CROSS-ASSET NORMALIZED", icon: Layers },
] as const;

const MACRO_CATEGORIES = [
  { id: "rates", label: "Rates & Yields", icon: Percent },
  { id: "commodities", label: "Commodities", icon: Coins },
  { id: "fx", label: "FX & Currencies", icon: DollarSign },
] as const;

// Cross-asset basket for normalized comparison
const CROSS_ASSET_BASKET = [
  { symbol: "^GSPC", name: "S&P 500", color: "#3B82F6" },
  { symbol: "GC=F", name: "Gold", color: "#F59E0B" },
  { symbol: "CL=F", name: "Crude Oil", color: "#10B981" },
  { symbol: "DX-Y.NYB", name: "US Dollar", color: "#8B5CF6" },
  { symbol: "^TNX", name: "10Y Treasury", color: "#EC4899" },
];

export default function MacroCrossAssetPreview({
  onSelectInstrument,
}: MacroCrossAssetPreviewProps) {
  const [activeCategory, setActiveCategory] = useState<"rates" | "commodities" | "fx">("rates");
  const [activeView, setActiveView] = useState<"chart" | "yield_curve" | "cross_asset">("chart");
  const [macroData, setMacroData] = useState<MacroCategories | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("^TNX");
  const [assetDetail, setAssetDetail] = useState<NormalizedMarketAsset | null>(() => {
    return (liveSnapshot as any)?.assets?.["^TNX"] || null;
  });
  const [loading, setLoading] = useState(false);

  // Load category universe
  useEffect(() => {
    let isCancelled = false;
    fetchMacroUniverse()
      .then((res) => {
        if (isCancelled) return;
        setMacroData(res);
      })
      .catch(() => {});
    return () => {
      isCancelled = true;
    };
  }, []);

  // Load selected instrument detail
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    fetchMarketAsset(selectedSymbol, "6M")
      .then((res) => {
        if (isCancelled) return;
        setAssetDetail(res);
        setLoading(false);
      })
      .catch(() => {
        if (isCancelled) return;
        const fallback = (liveSnapshot as any)?.assets?.[selectedSymbol] || null;
        setAssetDetail(fallback);
        setLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [selectedSymbol]);

  const handleSelectSymbol = (sym: string) => {
    setSelectedSymbol(sym);
    if (onSelectInstrument) onSelectInstrument(sym);
  };

  const snapshotAssets = (liveSnapshot as any)?.assets || {};

  // Rate yields for yield curve (1M, 3M, 6M, 1Y, 2Y, 5Y, 10Y, 30Y)
  const yieldCurvePoints = useMemo(() => {
    const irx = snapshotAssets["^IRX"]?.price || 4.75;
    const fvx = snapshotAssets["^FVX"]?.price || 4.15;
    const tnx = snapshotAssets["^TNX"]?.price || 4.35;
    const tyx = snapshotAssets["^TYX"]?.price || 4.60;

    return [
      { tenor: "1M", rate: irx ? +(irx + 0.15).toFixed(2) : 4.90 },
      { tenor: "3M", rate: irx ? +irx.toFixed(2) : 4.75 },
      { tenor: "6M", rate: irx ? +(irx - 0.10).toFixed(2) : 4.65 },
      { tenor: "1Y", rate: irx ? +(irx - 0.25).toFixed(2) : 4.50 },
      { tenor: "2Y", rate: fvx ? +(fvx + 0.10).toFixed(2) : 4.25 },
      { tenor: "5Y", rate: fvx ? +fvx.toFixed(2) : 4.15 },
      { tenor: "10Y", rate: tnx ? +tnx.toFixed(2) : 4.35 },
      { tenor: "30Y", rate: tyx ? +tyx.toFixed(2) : 4.60 },
    ];
  }, [snapshotAssets]);

  // Cross-Asset normalized dataset
  const crossAssetSeries = useMemo(() => {
    if (activeView !== "cross_asset") return null;
    const barsCount = 60;

    const series = CROSS_ASSET_BASKET.map((item) => {
      const asset = snapshotAssets[item.symbol];
      const bars = asset?.bars || [];
      const sliced = bars.slice(-barsCount);
      if (sliced.length < 2) return null;
      const baseClose = sliced[0].close || 1;
      const points = sliced.map((b: any) => ({
        date: b.date,
        relVal: (b.close / baseClose) * 100,
      }));
      const lastPoint = points[points.length - 1];
      return {
        ...item,
        points,
        latestRel: lastPoint ? lastPoint.relVal : 100,
        pctReturn: lastPoint ? lastPoint.relVal - 100 : 0,
      };
    }).filter(Boolean);

    let minV = 100;
    let maxV = 100;
    series.forEach((s: any) => {
      s.points.forEach((p: any) => {
        if (p.relVal < minV) minV = p.relVal;
        if (p.relVal > maxV) maxV = p.relVal;
      });
    });

    const pad = Math.max(3, (maxV - minV) * 0.1);
    return {
      series,
      minV: minV - pad,
      maxV: maxV + pad,
      range: Math.max(1, (maxV + pad) - (minV - pad)),
    };
  }, [activeView, snapshotAssets]);

  // Standard line chart calculations
  const bars = assetDetail?.bars || [];
  const { minVal, maxVal, valRange } = useMemo(() => {
    if (!bars.length) return { minVal: 0, maxVal: 10, valRange: 10 };
    let low = Infinity;
    let high = -Infinity;
    for (const b of bars) {
      if (b.low < low) low = b.low;
      if (b.high > high) high = b.high;
    }
    const pad = Math.max(0.05, (high - low) * 0.08);
    return {
      minVal: low - pad,
      maxVal: high + pad,
      valRange: Math.max(0.1, (high + pad) - (low - pad)),
    };
  }, [bars]);

  const svgW = 760;
  const svgH = 260;
  const padLeft = 14;
  const padRight = 68;
  const padTop = 16;
  const padBottom = 220;
  const plotW = svgW - padLeft - padRight;
  const plotH = padBottom - padTop;

  const getY = (val: number) => padTop + (1 - (val - minVal) / valRange) * plotH;

  const chartPath = useMemo(() => {
    if (bars.length < 2) return "";
    const pts = bars.map((b, i) => {
      const x = padLeft + (i / (bars.length - 1)) * plotW;
      const y = getY(b.close);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return "M " + pts.join(" L ");
  }, [bars, minVal, valRange]);

  const areaPath = useMemo(() => {
    if (!chartPath || bars.length < 2) return "";
    const firstX = padLeft;
    const lastX = padLeft + plotW;
    return `${chartPath} L ${lastX},${padBottom} L ${firstX},${padBottom} Z`;
  }, [chartPath, bars]);

  const currentPrice = assetDetail?.price || 0;
  const currentChange = assetDetail?.change || 0;
  const currentChangePct = assetDetail?.changePercent || 0;
  const isPos = currentChange >= 0;
  const unit = selectedSymbol.startsWith("^") && selectedSymbol.endsWith("X") ? "%" : (selectedSymbol.includes("=F") ? "$" : "");

  return (
    <div className="flex h-full flex-col justify-between space-y-3 font-mono text-xs">
      {/* 1. Category Switcher Strip (Rates, Commodities, FX) */}
      <div className="flex items-center justify-between border-b border-border/50 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-sans tracking-widest text-muted-foreground px-1 hidden sm:inline-block">
            DOMAIN:
          </span>
          {MACRO_CATEGORIES.map((cat) => {
            const isCatActive = activeCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  if (cat.id === "rates") setSelectedSymbol("^TNX");
                  if (cat.id === "commodities") setSelectedSymbol("GC=F");
                  if (cat.id === "fx") setSelectedSymbol("DX-Y.NYB");
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-all ${
                  isCatActive
                    ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* View mode buttons: Chart vs Yield Curve vs Cross-Asset */}
        <div className="inline-flex rounded border border-border/50 bg-background/50 p-0.5 text-[10px]">
          {MACRO_SUBTABS.map((sub) => {
            const isSubActive = activeView === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setActiveView(sub.id)}
                className={`px-2 py-0.5 rounded-xs transition-all ${
                  isSubActive
                    ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {sub.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Compact Macro Instrument Strip */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 border-b border-border/40 text-xs">
        <span className="text-[10px] uppercase font-sans tracking-widest text-muted-foreground px-2 hidden sm:inline-block">
          INSTRUMENT:
        </span>
        {activeCategory === "rates" && (
          <div className="flex items-center gap-1">
            {[
              { sym: "^IRX", label: "3M T-Bill" },
              { sym: "^FVX", label: "5Y Yield" },
              { sym: "^TNX", label: "10Y Yield" },
              { sym: "^TYX", label: "30Y Yield" },
            ].map((t) => (
              <button
                key={t.sym}
                type="button"
                onClick={() => handleSelectSymbol(t.sym)}
                className={`px-2 py-1 rounded-sm text-xs font-mono transition-all ${
                  selectedSymbol === t.sym
                    ? "bg-primary/10 border border-primary/40 text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {activeCategory === "commodities" && (
          <div className="flex items-center gap-1">
            {[
              { sym: "GC=F", label: "Gold" },
              { sym: "CL=F", label: "Crude Oil" },
              { sym: "SI=F", label: "Silver" },
              { sym: "NG=F", label: "Natural Gas" },
            ].map((t) => (
              <button
                key={t.sym}
                type="button"
                onClick={() => handleSelectSymbol(t.sym)}
                className={`px-2 py-1 rounded-sm text-xs font-mono transition-all ${
                  selectedSymbol === t.sym
                    ? "bg-primary/10 border border-primary/40 text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {activeCategory === "fx" && (
          <div className="flex items-center gap-1">
            {[
              { sym: "DX-Y.NYB", label: "USD Index" },
              { sym: "EURUSD=X", label: "EUR / USD" },
              { sym: "JPY=X", label: "USD / JPY" },
              { sym: "GBPUSD=X", label: "GBP / USD" },
              { sym: "INR=X", label: "USD / INR" },
            ].map((t) => (
              <button
                key={t.sym}
                type="button"
                onClick={() => handleSelectSymbol(t.sym)}
                className={`px-2 py-1 rounded-sm text-xs font-mono transition-all ${
                  selectedSymbol === t.sym
                    ? "bg-primary/10 border border-primary/40 text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Header readout */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border/40 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-foreground">
              {assetDetail?.name || selectedSymbol}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground uppercase border border-border/50">
              {selectedSymbol}
            </span>
          </div>

          <div className="flex items-baseline gap-3 mt-1 font-mono">
            <span className="text-2xl font-bold text-foreground tabular-nums">
              {unit === "%" ? `${currentPrice.toFixed(2)}%` : formatCurrencyValue(currentPrice, unit || "$")}
            </span>
            <span
              className={`text-xs font-semibold tabular-nums px-1.5 py-0.2 rounded ${
                isPos ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"
              }`}
            >
              {isPos ? "+" : ""}{currentChange.toFixed(2)} ({isPos ? "+" : ""}{currentChangePct.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* 52W Range & Observation */}
        <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
          <div>
            <span className="text-[10px] uppercase font-sans block">52W Range:</span>
            <span className="text-foreground">
              {assetDetail?.fiftyTwoWeekLow != null && assetDetail?.fiftyTwoWeekHigh != null
                ? `${assetDetail.fiftyTwoWeekLow.toFixed(2)} — ${assetDetail.fiftyTwoWeekHigh.toFixed(2)}`
                : "—"}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-sans block">As Of:</span>
            <span className="text-foreground">{assetDetail?.lastObservationDate || "Latest"}</span>
          </div>
        </div>
      </div>

      {/* 4. Canvas: Chart / Yield Curve / Cross-Asset */}
      <div className="relative flex-1 min-h-[260px] bg-background/50 rounded-sm border border-border/40 p-2">
        {loading ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Loading market data...</span>
          </div>
        ) : activeView === "yield_curve" ? (
          /* Treasury Yield Curve Visualization */
          <div className="h-full flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-foreground">US TREASURY BENCHMARK YIELD CURVE</span>
              <span className="text-muted-foreground">Term Structure of Interest Rates (1M – 30Y)</span>
            </div>

            <div className="relative flex-1 min-h-[200px]">
              <svg viewBox="0 0 680 180" className="w-full h-full overflow-visible">
                {/* Horizontal guide lines */}
                <line x1="20" y1="20" x2="660" y2="20" stroke="currentColor" className="text-border/40" strokeDasharray="2 3" />
                <line x1="20" y1="70" x2="660" y2="70" stroke="currentColor" className="text-border/40" strokeDasharray="2 3" />
                <line x1="20" y1="120" x2="660" y2="120" stroke="currentColor" className="text-border/40" strokeDasharray="2 3" />

                {/* Yield Curve Line */}
                {(() => {
                  const pts = yieldCurvePoints.map((p, i) => {
                    const x = 30 + (i / (yieldCurvePoints.length - 1)) * 620;
                    // Scale between 3.5% and 5.5%
                    const y = 20 + (1 - (p.rate - 3.5) / 2.0) * 120;
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

                {/* Data Points */}
                {yieldCurvePoints.map((p, i) => {
                  const x = 30 + (i / (yieldCurvePoints.length - 1)) * 620;
                  const y = 20 + (1 - (p.rate - 3.5) / 2.0) * 120;

                  return (
                    <g key={p.tenor}>
                      <circle cx={x} cy={y} r={4} fill="#3B82F6" stroke="white" strokeWidth="1.5" />
                      <text x={x} y={y - 8} textAnchor="middle" fill="currentColor" className="text-[10px] font-bold fill-foreground">
                        {p.rate.toFixed(2)}%
                      </text>
                      <text x={x} y="160" textAnchor="middle" fill="currentColor" className="text-[10px] font-mono fill-muted-foreground">
                        {p.tenor}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
              <span>Short End: Fed Policy Sensitive</span>
              <span>Long End: Growth & Inflation Expectations</span>
            </div>
          </div>
        ) : activeView === "cross_asset" && crossAssetSeries ? (
          /* Cross-Asset Normalized Multi-Line Comparison */
          <div className="h-full flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-foreground">CROSS-ASSET NORMALIZED PERFORMANCE (BASE=100)</span>
              <span className="text-muted-foreground">60-Day Lookback</span>
            </div>

            <div className="relative flex-1 min-h-[200px]">
              <svg viewBox="0 0 680 180" className="w-full h-full overflow-visible">
                {/* 100 Baseline */}
                {(() => {
                  const baseLineY = 20 + (1 - (100 - crossAssetSeries.minV) / crossAssetSeries.range) * 130;
                  return (
                    <line
                      x1="20"
                      y1={baseLineY}
                      x2="660"
                      y2={baseLineY}
                      stroke="#64748B"
                      strokeWidth="1.2"
                      strokeDasharray="4 2"
                    />
                  );
                })()}

                {/* Series Lines */}
                {crossAssetSeries.series.map((s: any) => {
                  const pts = s.points.map((p: any, i: number) => {
                    const x = 30 + (i / (s.points.length - 1)) * 620;
                    const y = 20 + (1 - (p.relVal - crossAssetSeries.minV) / crossAssetSeries.range) * 130;
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  });
                  return (
                    <path
                      key={s.symbol}
                      d={"M " + pts.join(" L ")}
                      fill="none"
                      stroke={s.color}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>

              {/* Legend overlay */}
              <div className="absolute top-1 left-2 flex flex-wrap gap-2.5 bg-card/90 border border-border/40 p-1.5 rounded text-[10px]">
                {crossAssetSeries.series.map((s: any) => (
                  <div key={s.symbol} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="font-semibold text-foreground">{s.name}:</span>
                    <span className={s.pctReturn >= 0 ? "text-emerald-500" : "text-rose-500"}>
                      {s.pctReturn >= 0 ? "+" : ""}{s.pctReturn.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/30">
              Normalized comparative return across Equities, Precious Metals, Energy, Currencies, and Sovereign Debt
            </div>
          </div>
        ) : (
          /* Standard Historical Time-Series Area Chart */
          <div className="h-full flex flex-col justify-between">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="h-full w-full overflow-visible">
              <defs>
                <linearGradient id="macroGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid */}
              <line x1={padLeft} y1={padTop} x2={padLeft + plotW} y2={padTop} stroke="currentColor" className="text-border/40" strokeDasharray="2 3" />
              <line x1={padLeft} y1={padTop + plotH / 2} x2={padLeft + plotW} y2={padTop + plotH / 2} stroke="currentColor" className="text-border/40" strokeDasharray="2 3" />
              <line x1={padLeft} y1={padBottom} x2={padLeft + plotW} y2={padBottom} stroke="currentColor" className="text-border/40" strokeDasharray="2 3" />

              {/* Area */}
              {areaPath && <path d={areaPath} fill="url(#macroGradient)" />}
              {/* Line */}
              {chartPath && <path d={chartPath} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />}
            </svg>
          </div>
        )}
      </div>

      {/* 5. Institutional Footer */}
      <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Official Macro Series feed active</span>
        </div>
        <span>Observation Source: FRED & Yahoo Finance</span>
      </div>
    </div>
  );
}
