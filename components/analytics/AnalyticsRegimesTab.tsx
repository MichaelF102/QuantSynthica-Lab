"use client";

import React, { useState, useMemo } from "react";
import {
  Info,
  ChevronDown,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import { BacktestResult } from "@/types";

interface AnalyticsRegimesTabProps {
  selectedBacktests: BacktestResult[];
  benchmark: string;
}

type RegimeChartMode = "Price" | "Returns";
type RollingMetricType = "Rolling Sharpe" | "Rolling Sortino" | "Rolling Beta" | "Rolling Volatility";
type RollingRange = "3M" | "6M" | "1Y" | "ALL";

export default function AnalyticsRegimesTab({
  selectedBacktests,
  benchmark,
}: AnalyticsRegimesTabProps) {
  const [chartMode, setChartMode] = useState<RegimeChartMode>("Price");
  const [selectedBenchmark, setSelectedBenchmark] = useState(benchmark || "SPY");
  const [rollingMetric, setRollingMetric] = useState<RollingMetricType>("Rolling Sharpe");
  const [rollingRange, setRollingRange] = useState<RollingRange>("1Y");
  const [contributorMetric, setContributorMetric] = useState<"By Total Return" | "By Sharpe Contribution">("By Total Return");

  const primaryBt = selectedBacktests[0];

  // Market Regime price & returns curve with regime categorization
  const regimeCurveData = useMemo(() => {
    // 12-month synthetic daily curve matching Screenshot 1 exactly
    const months = ["Jan 2023", "Feb 2023", "Mar 2023", "Apr 2023", "May 2023", "Jun 2023", "Jul 2023", "Aug 2023", "Sep 2023", "Oct 2023", "Nov 2023", "Dec 2023", "Jan 2024"];
    const pts: any[] = [];
    
    let price = 105;
    for (let m = 0; m < months.length; m++) {
      for (let day = 1; day <= 20; day++) {
        const step = m * 20 + day;
        let delta = (Math.sin(step * 0.15) * 1.5) + (Math.cos(step * 0.05) * 1.2) + 0.45;
        // March/April banking dip
        if (m === 2 || (m === 3 && day < 10)) delta -= 1.8;
        // Bull run in May/June
        if (m === 4 || m === 5) delta += 1.4;
        // Sideways August
        if (m === 7) delta = (Math.random() - 0.5) * 1.8;
        // Fall pullback Sept
        if (m === 8) delta -= 1.2;
        // Q4 rally Nov/Dec
        if (m >= 10) delta += 1.6;

        price += delta;
        pts.push({
          step,
          date: day === 10 ? months[m] : "",
          fullDate: `${months[m]} ${day}`,
          price: Math.max(95, Math.round(price * 10) / 10),
          returns: Math.round(((price - 105) / 105) * 1000) / 10,
        });
      }
    }
    return pts;
  }, []);

  // Factor Exposure Analysis data (Strategy vs SPY)
  const factorExposureData = [
    { factor: "Market\n(Beta)", strategy: 0.78, benchmark: 1.0 },
    { factor: "Size\n(SMB)", strategy: 0.32, benchmark: 0.12 },
    { factor: "Value\n(HML)", strategy: -0.18, benchmark: -0.05 },
    { factor: "Momentum\n(UMD)", strategy: 1.24, benchmark: 0.32 },
    { factor: "Volatility\n(VIX)", strategy: -0.56, benchmark: 0.08 },
    { factor: "Quality\n(QMJ)", strategy: 0.41, benchmark: 0.15 },
    { factor: "Low Vol\n(MINV)", strategy: -0.22, benchmark: -0.08 },
    { factor: "Liquidity\n(ILL)", strategy: 0.17, benchmark: 0.05 },
  ];

  // Asset Correlation Matrix 8x8 data
  const correlationMatrix = [
    { asset: "Strategy", AAPL: 0.42, SPY: 0.68, QQQ: 0.71, NVDA: 0.38, TSLA: 0.33, Bonds: -0.12, Gold: -0.18 },
    { asset: "AAPL", AAPL: 1.00, SPY: 0.54, QQQ: 0.62, NVDA: 0.48, TSLA: 0.41, Bonds: -0.10, Gold: -0.15 },
    { asset: "SPY", AAPL: 0.54, SPY: 1.00, QQQ: 0.92, NVDA: 0.67, TSLA: 0.58, Bonds: -0.25, Gold: -0.32 },
    { asset: "QQQ", AAPL: 0.62, SPY: 0.92, QQQ: 1.00, NVDA: 0.69, TSLA: 0.61, Bonds: -0.28, Gold: -0.35 },
    { asset: "NVDA", AAPL: 0.48, SPY: 0.67, QQQ: 0.69, NVDA: 1.00, TSLA: 0.55, Bonds: -0.20, Gold: -0.26 },
    { asset: "TSLA", AAPL: 0.41, SPY: 0.58, QQQ: 0.61, NVDA: 0.55, TSLA: 1.00, Bonds: -0.18, Gold: -0.21 },
    { asset: "Bonds", AAPL: -0.10, SPY: -0.25, QQQ: -0.28, NVDA: -0.20, TSLA: -0.18, Bonds: 1.00, Gold: 0.46 },
    { asset: "Gold", AAPL: -0.15, SPY: -0.32, QQQ: -0.35, NVDA: -0.26, TSLA: -0.21, Bonds: 0.46, Gold: 1.00 },
  ];

  // Function to calculate cell background color based on correlation value
  const getCorrelationColor = (val: number, isDiag = false) => {
    if (isDiag) return "bg-[#06B6D4]/30 text-[#38BDF8] font-bold";
    if (val >= 0.8) return "bg-[#10B981]/50 text-white font-semibold";
    if (val >= 0.5) return "bg-[#10B981]/30 text-emerald-200";
    if (val >= 0.3) return "bg-[#10B981]/15 text-slate-200";
    if (val >= 0) return "bg-[#1E2530]/40 text-slate-400";
    if (val >= -0.2) return "bg-[#EF4444]/20 text-rose-300";
    return "bg-[#EF4444]/40 text-white font-semibold";
  };

  // Rolling metrics series (Sharpe, Sortino, Beta, Volatility)
  const rollingData = useMemo(() => {
    const dates = ["Jan 2023", "Mar 2023", "May 2023", "Jul 2023", "Sep 2023", "Nov 2023", "Jan 2024"];
    return [
      { date: "Jan 2023", Strategy: 0.4, Benchmark: 0.1 },
      { date: "Feb 2023", Strategy: 0.8, Benchmark: 0.2 },
      { date: "Mar 2023", Strategy: 1.2, Benchmark: 0.3 },
      { date: "Apr 2023", Strategy: 1.5, Benchmark: 0.6 },
      { date: "May 2023", Strategy: 1.8, Benchmark: 0.9 },
      { date: "Jun 2023", Strategy: 2.1, Benchmark: 1.1 },
      { date: "Jul 2023", Strategy: 1.4, Benchmark: 0.8 },
      { date: "Aug 2023", Strategy: 0.6, Benchmark: 0.2 },
      { date: "Sep 2023", Strategy: -0.4, Benchmark: -0.2 },
      { date: "Oct 2023", Strategy: -0.2, Benchmark: -0.5 },
      { date: "Nov 2023", Strategy: 0.8, Benchmark: 0.3 },
      { date: "Dec 2023", Strategy: 1.6, Benchmark: 0.9 },
      { date: "Jan 2024", Strategy: 1.32, Benchmark: 0.86 },
    ];
  }, []);

  // Top 5 and Bottom 5 contributors
  const topContributors = [
    { asset: "AAPL", contribution: "+12.34%", pctReturn: "42.1%" },
    { asset: "NVDA", contribution: "+8.76%", pctReturn: "29.9%" },
    { asset: "MSFT", contribution: "+4.21%", pctReturn: "14.4%" },
    { asset: "GOOGL", contribution: "+2.98%", pctReturn: "10.2%" },
    { asset: "AMZN", contribution: "+1.87%", pctReturn: "6.4%" },
  ];

  const bottomContributors = [
    { asset: "TSLA", contribution: "-6.21%", pctReturn: "-21.2%" },
    { asset: "META", contribution: "-3.44%", pctReturn: "-11.8%" },
    { asset: "AMD", contribution: "-2.98%", pctReturn: "-10.2%" },
    { asset: "NFLX", contribution: "-1.76%", pctReturn: "-6.0%" },
    { asset: "INTC", contribution: "-1.23%", pctReturn: "-4.2%" },
  ];

  // Custom renderer for Factor Exposure labels
  const renderBarLabel = (props: any): React.ReactElement => {
    const { x, y, width, height, value } = props;
    if (value === undefined || value === null) return <g />;
    const num = Number(value);
    const isPos = num >= 0;
    const yPos = isPos ? y - 5 : y + height + 11;
    return (
      <text
        x={x + width / 2}
        y={yPos}
        fill="#CBD5E1"
        fontSize={9}
        fontFamily="monospace"
        textAnchor="middle"
      >
        {num.toFixed(2)}
      </text>
    );
  };

  const renderCustomFactorTick = (props: any) => {
    const { x, y, payload } = props;
    const parts = String(payload?.value || "").split("\n");
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={8} textAnchor="middle" fill="#89919C" fontSize={9} fontFamily="sans-serif">
          <tspan x={0} dy="0.71em">{parts[0]}</tspan>
          {parts[1] && <tspan x={0} dy="1.15em" fill="#59616B">{parts[1]}</tspan>}
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-4">
      {/* ========================================================
          1. TOP ROW: MARKET REGIME ANALYSIS & REGIME PERFORMANCE
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Card (~68%): Market Regime Analysis Chart */}
        <div className="lg:col-span-8 bg-[#090D14] border border-[#1E2530] rounded-lg p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between pb-2 border-b border-[#1E2530] gap-2">
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-white text-xs tracking-tight">
                  Market Regime Analysis
                </span>
                <Info className="w-3.5 h-3.5 text-slate-500 cursor-pointer" />
              </div>
              <p className="text-[11px] text-[#89919C]">
                Strategy performance across different market regimes
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {/* Price | Returns Toggle */}
              <div className="flex items-center space-x-1 bg-[#111622] p-0.5 rounded border border-[#202C3F] text-[11px]">
                {(["Price", "Returns"] as RegimeChartMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setChartMode(m)}
                    className={`px-2.5 py-0.5 rounded transition-all font-medium ${
                      chartMode === m
                        ? "bg-[#0284C7] text-white font-semibold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Benchmark Selector */}
              <div className="relative">
                <select
                  value={selectedBenchmark}
                  onChange={(e) => setSelectedBenchmark(e.target.value)}
                  className="appearance-none bg-[#111622] border border-[#202C3F] text-slate-200 pl-2.5 pr-6 py-1 rounded text-xs focus:outline-none focus:border-[#38BDF8] cursor-pointer font-sans"
                >
                  <option value="SPY">SPY (Benchmark)</option>
                  <option value="QQQ">QQQ (Nasdaq 100)</option>
                  <option value="IWM">IWM (Russell 2000)</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Regime Shaded Background Chart */}
          <div className="h-[280px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={regimeCurveData}
                margin={{ top: 15, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid stroke="#18202C" strokeDasharray="2 2" vertical={false} />

                {/* Shaded vertical regime areas matching Screenshot 1 */}
                <ReferenceArea x1={0} x2={25} fill="#10B981" fillOpacity={0.16} />
                <ReferenceArea x1={25} x2={50} fill="#3B82F6" fillOpacity={0.18} />
                <ReferenceArea x1={50} x2={75} fill="#EF4444" fillOpacity={0.18} />
                <ReferenceArea x1={75} x2={120} fill="#10B981" fillOpacity={0.16} />
                <ReferenceArea x1={120} x2={140} fill="#3B82F6" fillOpacity={0.18} />
                <ReferenceArea x1={140} x2={165} fill="#EF4444" fillOpacity={0.18} />
                <ReferenceArea x1={165} x2={185} fill="#F59E0B" fillOpacity={0.18} />
                <ReferenceArea x1={185} x2={210} fill="#EF4444" fillOpacity={0.18} />
                <ReferenceArea x1={210} x2={245} fill="#10B981" fillOpacity={0.16} />
                <ReferenceArea x1={245} x2={260} fill="#3B82F6" fillOpacity={0.18} />

                <XAxis
                  dataKey="step"
                  stroke="#485362"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "#1E2530" }}
                  tickFormatter={(val) => {
                    const item = regimeCurveData.find((d) => d.step === val);
                    return item?.date || "";
                  }}
                  interval={18}
                />
                <YAxis
                  stroke="#485362"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={chartMode === "Price" ? [95, 230] : [-15, 115]}
                  ticks={chartMode === "Price" ? [100, 130, 160, 190, 220] : [-10, 20, 50, 80, 110]}
                  tickFormatter={(v) => (chartMode === "Price" ? `$${v}` : `${v}%`)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0C1017",
                    borderColor: "#202C3F",
                    fontSize: "11px",
                    fontFamily: "monospace",
                    borderRadius: "6px",
                  }}
                  formatter={(val: any) => [
                    chartMode === "Price" ? `$${val}` : `${val}%`,
                    "Strategy Value",
                  ]}
                  labelFormatter={(step: any) => {
                    const item = regimeCurveData.find((d) => d.step === step);
                    return item?.fullDate || "";
                  }}
                />

                {/* Strategy Price/Return curve with subtle glow */}
                <Line
                  type="monotone"
                  dataKey={chartMode === "Price" ? "price" : "returns"}
                  stroke="#38BDF8"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Regime Legend */}
          <div className="flex justify-center space-x-6 text-[11px] pt-2 border-t border-[#1E2530]">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              <span className="text-slate-300">Bull</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
              <span className="text-slate-300">Bear</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
              <span className="text-slate-300">Sideways</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
              <span className="text-slate-300">High Volatility</span>
            </div>
          </div>
        </div>

        {/* Right Card (~32%): Regime Performance Table + Lightbulb Callout */}
        <div className="lg:col-span-4 bg-[#090D14] border border-[#1E2530] rounded-lg p-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="pb-2 border-b border-[#1E2530]">
              <span className="font-semibold text-white text-xs tracking-tight">
                Regime Performance
              </span>
            </div>

            {/* Performance Breakdown Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#1E2530] text-[10px] text-slate-400 uppercase font-sans">
                    <th className="py-2">Regime</th>
                    <th className="py-2 text-right">Occurrence</th>
                    <th className="py-2 text-right">Avg Return</th>
                    <th className="py-2 text-right">Sharpe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2530]/50">
                  <tr>
                    <td className="py-2.5 font-medium text-slate-200 font-sans flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                      <span>Bull</span>
                    </td>
                    <td className="py-2.5 text-right text-slate-300">42.3%</td>
                    <td className="py-2.5 text-right text-[#10B981] font-semibold">+18.6%</td>
                    <td className="py-2.5 text-right text-white font-semibold">1.42</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-slate-200 font-sans flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                      <span>Bear</span>
                    </td>
                    <td className="py-2.5 text-right text-slate-300">22.1%</td>
                    <td className="py-2.5 text-right text-[#EF4444] font-semibold">-12.4%</td>
                    <td className="py-2.5 text-right text-[#EF4444] font-semibold">-0.81</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-slate-200 font-sans flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                      <span>Sideways</span>
                    </td>
                    <td className="py-2.5 text-right text-slate-300">20.5%</td>
                    <td className="py-2.5 text-right text-[#10B981] font-semibold">+4.7%</td>
                    <td className="py-2.5 text-right text-white font-semibold">0.62</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-slate-200 font-sans flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                      <span>High Volatility</span>
                    </td>
                    <td className="py-2.5 text-right text-slate-300">15.1%</td>
                    <td className="py-2.5 text-right text-[#EF4444] font-semibold">-6.3%</td>
                    <td className="py-2.5 text-right text-[#EF4444] font-semibold">-0.48</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Yellow Lightbulb Insight Callout */}
          <div className="bg-[#131822] border border-[#252E3E] rounded-lg p-3 flex items-start space-x-2.5 mt-4">
            <span className="text-amber-400 text-sm mt-0.5">💡</span>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              Strategy performs best in Bull markets with <span className="text-[#10B981] font-semibold">1.42 Sharpe ratio</span>, but shows weakness during high volatility regimes.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. MIDDLE ROW: FACTOR EXPOSURE ANALYSIS & ASSET CORRELATION MATRIX
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Factor Exposure Analysis */}
        <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1E2530]">
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-white text-xs tracking-tight">
                  Factor Exposure Analysis
                </span>
                <Info className="w-3.5 h-3.5 text-slate-500 cursor-pointer" />
              </div>
              <p className="text-[11px] text-[#89919C]">
                Strategy sensitivity to common risk factors (vs SPY)
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]" />
                <span className="text-slate-300 text-[11px]">Strategy</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#64748B]" />
                <span className="text-slate-300 text-[11px]">SPY (Benchmark)</span>
              </div>
            </div>
          </div>

          {/* Paired Bar Chart */}
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={factorExposureData}
                margin={{ top: 25, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid stroke="#18202C" strokeDasharray="2 2" vertical={false} />
                <XAxis
                  dataKey="factor"
                  stroke="#485362"
                  tick={renderCustomFactorTick}
                  interval={0}
                  tickLine={false}
                />
                <YAxis
                  stroke="#485362"
                  fontSize={10}
                  domain={[-2.0, 2.0]}
                  ticks={[-2.0, -1.0, 0.0, 1.0, 2.0]}
                  tickFormatter={(v) => v.toFixed(1)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0C1017",
                    borderColor: "#202C3F",
                    fontSize: "11px",
                    fontFamily: "monospace",
                  }}
                />
                <ReferenceLine y={0} stroke="#2E384D" />
                <Bar dataKey="strategy" fill="#0284C7" isAnimationActive={false} label={renderBarLabel as any} />
                <Bar dataKey="benchmark" fill="#64748B" isAnimationActive={false} label={renderBarLabel as any} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Asset Correlation Matrix (Heatmap) */}
        <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1E2530]">
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-white text-xs tracking-tight">
                  Asset Correlation Matrix
                </span>
                <Info className="w-3.5 h-3.5 text-slate-500 cursor-pointer" />
              </div>
              <p className="text-[11px] text-[#89919C]">
                Correlation of strategy returns with key assets
              </p>
            </div>
          </div>

          {/* Heatmap Grid with Color Gradient Legend on Right */}
          <div className="flex items-center space-x-3">
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-center text-xs font-mono">
                <thead>
                  <tr className="text-[10px] text-slate-400 font-sans">
                    <th className="py-1 text-left font-normal pl-1"></th>
                    <th className="py-1">AAPL</th>
                    <th className="py-1">SPY</th>
                    <th className="py-1">QQQ</th>
                    <th className="py-1">NVDA</th>
                    <th className="py-1">TSLA</th>
                    <th className="py-1">Bonds</th>
                    <th className="py-1">Gold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2530]/40">
                  {correlationMatrix.map((row) => (
                    <tr key={row.asset}>
                      <td className="py-1.5 text-left font-sans text-slate-300 font-medium pl-1 text-[11px]">
                        {row.asset}
                      </td>
                      <td className={`py-1.5 px-1.5 rounded-sm ${getCorrelationColor(row.AAPL, row.asset === "AAPL")}`}>
                        {row.AAPL.toFixed(2)}
                      </td>
                      <td className={`py-1.5 px-1.5 rounded-sm ${getCorrelationColor(row.SPY, row.asset === "SPY")}`}>
                        {row.SPY.toFixed(2)}
                      </td>
                      <td className={`py-1.5 px-1.5 rounded-sm ${getCorrelationColor(row.QQQ, row.asset === "QQQ")}`}>
                        {row.QQQ.toFixed(2)}
                      </td>
                      <td className={`py-1.5 px-1.5 rounded-sm ${getCorrelationColor(row.NVDA, row.asset === "NVDA")}`}>
                        {row.NVDA.toFixed(2)}
                      </td>
                      <td className={`py-1.5 px-1.5 rounded-sm ${getCorrelationColor(row.TSLA, row.asset === "TSLA")}`}>
                        {row.TSLA.toFixed(2)}
                      </td>
                      <td className={`py-1.5 px-1.5 rounded-sm ${getCorrelationColor(row.Bonds, row.asset === "Bonds")}`}>
                        {row.Bonds.toFixed(2)}
                      </td>
                      <td className={`py-1.5 px-1.5 rounded-sm ${getCorrelationColor(row.Gold, row.asset === "Gold")}`}>
                        {row.Gold.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vertical Color Scale Legend */}
            <div className="flex flex-col items-center justify-between h-48 py-1 text-[9px] font-mono text-slate-400">
              <span>1.0</span>
              <div className="w-2 flex-1 my-1 rounded bg-gradient-to-b from-[#10B981] via-[#1E2530] to-[#EF4444]" />
              <span>0.5</span>
              <span>0.0</span>
              <span>-0.5</span>
              <span>-1.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          3. BOTTOM ROW: ROLLING METRICS & TOP/BOTTOM CONTRIBUTORS
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Rolling Metrics */}
        <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between pb-2 border-b border-[#1E2530] gap-2">
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-white text-xs tracking-tight">
                Rolling Metrics
              </span>
              <Info className="w-3.5 h-3.5 text-slate-500 cursor-pointer" />
            </div>

            {/* Metric Pills */}
            <div className="flex items-center space-x-1 bg-[#111622] p-0.5 rounded border border-[#202C3F] text-[11px]">
              {(["Rolling Sharpe", "Rolling Sortino", "Rolling Beta", "Rolling Volatility"] as RollingMetricType[]).map(
                (m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setRollingMetric(m)}
                    className={`px-2 py-0.5 rounded transition-all font-medium ${
                      rollingMetric === m
                        ? "bg-[#0284C7] text-white font-semibold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {m.replace("Rolling ", "")}
                  </button>
                )
              )}
            </div>

            {/* Timeframe Range */}
            <div className="flex items-center space-x-1 text-[10px] font-mono">
              {(["3M", "6M", "1Y", "ALL"] as RollingRange[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRollingRange(r)}
                  className={`px-1.5 py-0.5 rounded transition-all ${
                    rollingRange === r
                      ? "bg-[#252E3E] text-[#38BDF8] font-bold"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Rolling Line Chart */}
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={rollingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#18202C" strokeDasharray="2 2" vertical={false} />
                <XAxis dataKey="date" stroke="#485362" fontSize={10} />
                <YAxis stroke="#485362" fontSize={10} domain={[-3.0, 3.0]} ticks={[-3, -1.5, 0, 1.5, 3]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0C1017",
                    borderColor: "#202C3F",
                    fontSize: "11px",
                    fontFamily: "monospace",
                  }}
                />
                <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="Strategy"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="Benchmark"
                  stroke="#94A3B8"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex justify-center space-x-6 text-[11px] pt-2 border-t border-[#1E2530]">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8]" />
              <span className="text-slate-300">Strategy</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 border-t-2 border-[#94A3B8]" />
              <span className="text-slate-400">SPY (Benchmark)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 border-t-2 border-dashed border-[#475569]" />
              <span className="text-slate-500">Zero Line</span>
            </div>
          </div>
        </div>

        {/* Right: Top & Bottom Contributors */}
        <div className="bg-[#090D14] border border-[#1E2530] rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#1E2530]">
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-white text-xs tracking-tight">
                Top & Bottom Contributors
              </span>
              <Info className="w-3.5 h-3.5 text-slate-500 cursor-pointer" />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={contributorMetric}
                onChange={(e) => setContributorMetric(e.target.value as any)}
                className="appearance-none bg-[#111622] border border-[#202C3F] text-slate-200 pl-2.5 pr-6 py-0.5 rounded text-[11px] focus:outline-none focus:border-[#38BDF8] cursor-pointer"
              >
                <option value="By Total Return">By Total Return</option>
                <option value="By Sharpe Contribution">By Sharpe Contribution</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* 2-Column Split: Top 5 & Bottom 5 */}
          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            {/* Top 5 Contributors */}
            <div className="space-y-1.5">
              <div className="text-[10px] text-[#10B981] font-semibold font-sans uppercase tracking-wider pb-1 border-b border-[#1E2530]/40">
                Top 5 Contributors
              </div>
              <div className="space-y-1">
                {topContributors.map((c) => (
                  <div key={c.asset} className="flex items-center justify-between py-1">
                    <div className="flex items-center space-x-1.5 font-sans">
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#10B981]" />
                      <span className="text-white font-medium">{c.asset}</span>
                    </div>
                    <span className="text-[#10B981] font-semibold">{c.contribution}</span>
                    <span className="text-slate-400 text-[10px]">{c.pctReturn}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom 5 Contributors */}
            <div className="space-y-1.5 border-l border-[#1E2530] pl-4">
              <div className="text-[10px] text-[#EF4444] font-semibold font-sans uppercase tracking-wider pb-1 border-b border-[#1E2530]/40">
                Bottom 5 Contributors
              </div>
              <div className="space-y-1">
                {bottomContributors.map((c) => (
                  <div key={c.asset} className="flex items-center justify-between py-1">
                    <div className="flex items-center space-x-1.5 font-sans">
                      <ArrowDownRight className="w-3.5 h-3.5 text-[#EF4444]" />
                      <span className="text-white font-medium">{c.asset}</span>
                    </div>
                    <span className="text-[#EF4444] font-semibold">{c.contribution}</span>
                    <span className="text-slate-400 text-[10px]">{c.pctReturn}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
