"use client";

import React from "react";
import { Network } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PortfolioResult, riskModel } from "@/lib/portfolio/engine";

const cellColor = (v: number) => {
  const a = Math.min(1, Math.abs(v));
  return v >= 0 ? `rgba(37,99,235,${0.1 + a * 0.6})` : `rgba(220,38,38,${0.1 + a * 0.6})`;
};

export default function PortfolioCorrelationMatrixWidget({ result }: { result: PortfolioResult }) {
  const m = riskModel(result);
  const off = m.corr.flatMap((r, i) => r.filter((_, j) => j > i));
  const avg = off.length ? off.reduce((a, b) => a + b, 0) / off.length : null;
  return (
    <Card title="Correlation matrix" subtitle={avg === null ? "Single holding" : `Average pairwise ρ = ${avg.toFixed(2)}`} info="Pearson correlation of daily returns over the analysis window. Lower average correlation means more diversification." icon={Network} tone="purple">
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-center font-mono text-[11px]">
          <thead><tr><th />{result.tickers.map((t) => <th key={t} className="px-1 py-1 text-[10px] font-semibold text-slate-400">{t}</th>)}</tr></thead>
          <tbody>
            {m.corr.map((row, i) => (
              <tr key={result.tickers[i]}>
                <th className="pr-2 text-right text-[10px] font-semibold text-slate-400">{result.tickers[i]}</th>
                {row.map((v, j) => <td key={j} className="border border-[#0b1222] px-1 py-1.5 text-white" style={{ backgroundColor: cellColor(v) }}>{v.toFixed(2)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
