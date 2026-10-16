"use client";

import React, { useMemo, useState } from "react";
import { LineChart as LineIcon } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card } from "@/components/ui/Card";
import { fmtPct, cn } from "@/lib/utils";
import { PortfolioResult } from "@/lib/portfolio/engine";
import { CurrencyCode, fmtMoney, windowPts, seriesStats } from "@/lib/analyticsCalc";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE } from "@/lib/chartTheme";

type Range = "1M" | "3M" | "6M" | "YTD" | "1Y" | "ALL";
interface Props { result: PortfolioResult; portfolioName: string; benchmarkSymbol: string; benchmarkName: string; currency: CurrencyCode }

function startFor(r: Range, last: string): string | null {
  if (r === "ALL") return null;
  if (r === "YTD") return `${last.slice(0, 4)}-01-01`;
  const d = new Date(last + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() - { "1M": 1, "3M": 3, "6M": 6, "1Y": 12 }[r]);
  return d.toISOString().slice(0, 10);
}

export default function PortfolioEquityCurveWidget({ result, portfolioName, benchmarkSymbol, benchmarkName, currency }: Props) {
  const [range, setRange] = useState<Range>("ALL");
  const [log, setLog] = useState(false);
  const pts = useMemo(() => windowPts(result.pts, startFor(range, result.dates[result.dates.length - 1]), null, "Daily"), [result, range]);
  const stats = useMemo(() => seriesStats(pts), [pts]);
  const base = pts[0]?.value ?? 1;
  const bbase = pts[0]?.bench ?? 1;
  // Both lines are rebased to the portfolio's value at the start of the visible range.
  const data = pts.map((p) => ({ date: p.date, Portfolio: p.value, Benchmark: (p.bench / bbase) * base }));
  const last = data[data.length - 1];

  return (
    <Card
      title="Portfolio equity curve"
      subtitle={`${portfolioName} vs ${benchmarkName}`}
      info="Value of the basket from real constituent prices, starting at your initial capital and rebalanced on your chosen schedule. The benchmark is rebased to the same start."
      icon={LineIcon}
      tone="blue"
      action={
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-800 bg-[#0b1222] p-0.5 font-mono text-[11px]">
            {(["1M", "3M", "6M", "YTD", "1Y", "ALL"] as Range[]).map((r) => (
              <button key={r} type="button" onClick={() => setRange(r)} className={cn("rounded px-2 py-1 transition-colors", range === r ? "bg-blue-600 font-semibold text-white shadow-sm" : "font-medium text-slate-400 hover:text-white")}>{r}</button>
            ))}
          </div>
          <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-slate-400">
            Log
            <input type="checkbox" checked={log} onChange={(e) => setLog(e.target.checked)} className="accent-blue-500" />
          </label>
        </div>
      }
    >
      <div className="mb-3 grid grid-cols-2 gap-3 border-b border-slate-800 pb-3 sm:grid-cols-5">
        {([
          ["Final value", fmtMoney(last?.Portfolio, currency), "text-white"],
          ["Total return", fmtPct(stats?.totalReturn), stats && stats.totalReturn < 0 ? "text-rose-400" : "text-emerald-400"],
          ["CAGR", fmtPct(stats?.cagr), stats && stats.cagr < 0 ? "text-rose-400" : "text-emerald-400"],
          ["Volatility", fmtPct(stats?.vol, 2, false), "text-white"],
          ["Max drawdown", stats ? fmtPct(-stats.maxDD) : "—", "text-rose-400"],
        ] as [string, string, string][]).map(([k, v, t]) => (
          <div key={k}><div className="text-[10px] text-slate-400">{k}</div><div className={cn("font-mono text-sm font-bold", v === "—" ? "text-slate-500" : t)}>{v}</div></div>
        ))}
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 5, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis dataKey="date" {...AXIS_PROPS} minTickGap={50} />
            <YAxis {...AXIS_PROPS} scale={log ? "log" : "auto"} domain={["auto", "auto"]} tickFormatter={(v) => fmtMoney(v, currency, true)} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, n: any) => [fmtMoney(Number(v), currency), n === "Benchmark" ? benchmarkSymbol : "Portfolio"]} />
            <Line type="monotone" dataKey="Benchmark" stroke="#64748B" strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="Portfolio" stroke="#2563EB" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-[#2563EB]" />{portfolioName}</span>
        <span className="flex items-center gap-1.5"><span className="w-4 border-b-2 border-dashed border-slate-500" />{benchmarkSymbol} <span className="font-mono">{fmtPct(stats?.benchReturn)}</span></span>
      </div>
    </Card>
  );
}
