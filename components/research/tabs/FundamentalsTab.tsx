"use client";

import React, { useState } from "react";
import { Scale, TrendingUp, Landmark, Banknote, Award, BarChart3, Info, Percent } from "lucide-react";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Card, CardSkeleton, EmptyState } from "@/components/ui/Card";
import { FeedGate, StatRow } from "../ui";
import { useResearch } from "../context";
import { CorporateFeed, researchPath, useFeed } from "@/lib/research/feeds";
import { fmtBig, fmtPx, num } from "@/lib/research/format";
import { AXIS_PROPS, GRID_PROPS, TOOLTIP_STYLE } from "@/lib/chartTheme";
import { fmtPct, cn } from "@/lib/utils";
import { isNum } from "@/lib/formatters";

const pctOf = (v: unknown) => (isNum(v) ? fmtPct(v > -5 && v < 5 && Math.abs(v) < 5 ? v * 100 : v, 1, false) : "—");

export default function FundamentalsTab() {
  const { ticker, region, fundamentals: f, fundamentalsLoading } = useResearch();
  const corp = useFeed<CorporateFeed>(researchPath(ticker, "corporate"));
  const [more, setMore] = useState(false);
  if (fundamentalsLoading && !f) return <div className="grid grid-cols-1 gap-4 lg:grid-cols-3"><CardSkeleton rows={6} /><CardSkeleton rows={6} /><CardSkeleton rows={6} /></div>;
  if (!f) return <EmptyState icon={Info} title="Fundamentals unavailable" hint="The fundamentals service returned nothing for this security." />;
  const big = (v: unknown) => fmtBig(v, region);
  const hist = (f.annual_history ?? []).filter((h) => isNum(h.revenue) || isNum(h.net_income)).map((h) => ({ year: h.year, revenue: h.revenue, net: h.net_income, margin: isNum(h.revenue) && h.revenue !== 0 && isNum(h.net_income) ? (h.net_income / h.revenue) * 100 : null })).sort((a, b) => String(a.year).localeCompare(String(b.year)));
  const pio = f.piotroski_score;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Valuation" subtitle="Multiples" info="Price-based multiples from the fundamentals feed. A dash means the source reports no value (for example negative earnings)." icon={Scale} tone="blue">
          <StatRow label="Market cap" value={big(f.market_cap)} /><StatRow label="Enterprise value" value={big(f.enterprise_value)} /><StatRow label="P/E (TTM)" value={num(f.pe_ratio, 1)} /><StatRow label="Forward P/E" value={num(f.forward_pe, 1)} />
          <StatRow label="PEG" value={num(f.peg_ratio, 2)} /><StatRow label="Price / book" value={num(f.price_to_book, 2)} /><StatRow label="Price / sales" value={num(f.price_to_sales, 2)} /><StatRow label="EV / EBITDA" value={num(f.ev_ebitda, 1)} /><StatRow label="EV / revenue" value={num(f.ev_revenue, 2)} />
        </Card>
        <Card title="Profitability" subtitle="Margins and returns" info="Margins and return ratios in percent. Values the source reports as fractions are converted to percent." icon={Percent} tone="emerald">
          <StatRow label="Gross margin" value={pctOf(f.gross_margin)} /><StatRow label="Operating margin" value={pctOf(f.operating_margin)} /><StatRow label="Net margin" value={pctOf(f.net_margin)} /><StatRow label="Return on equity" value={pctOf(f.roe)} /><StatRow label="Return on assets" value={pctOf(f.roa)} />
          <StatRow label="EPS (TTM)" value={fmtPx(f.eps_ttm, region)} /><StatRow label="Book value / share" value={fmtPx(f.book_value, region)} />
        </Card>
        <Card title="Financials (TTM)" subtitle="Income and cash flow" info="Trailing-twelve-month totals, shown in lakh crore / crore for Indian listings and K/M/B/T for US." icon={Banknote} tone="amber">
          <StatRow label="Revenue" value={big(f.revenue_ttm)} /><StatRow label="EBITDA" value={big(f.ebitda_ttm)} /><StatRow label="Net income" value={big(f.net_income_ttm)} /><StatRow label="Operating cash flow" value={big(f.operating_cash_flow)} /><StatRow label="Free cash flow" value={big(f.free_cash_flow)} />
        </Card>
        <Card title="Balance sheet" subtitle="Solvency and liquidity" info="Debt, cash and the leverage and liquidity ratios reported by the fundamentals feed." icon={Landmark} tone="rose">
          <StatRow label="Total debt" value={big(f.total_debt)} /><StatRow label="Total cash" value={big(f.total_cash)} /><StatRow label="Debt / equity" value={num(f.debt_to_equity, 1)} /><StatRow label="Current ratio" value={num(f.current_ratio, 2)} /><StatRow label="Quick ratio" value={num(f.quick_ratio, 2)} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Card title="Annual revenue and net income" subtitle="Reported fiscal years" info="Annual statements from the fundamentals feed with the resulting net margin. Years the source did not report are omitted." icon={BarChart3} tone="blue">
            {hist.length < 2 ? <EmptyState icon={BarChart3} title="No multi-year history" hint="The source returned fewer than two annual periods." /> : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={hist} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid {...GRID_PROPS} /><XAxis dataKey="year" {...AXIS_PROPS} /><YAxis yAxisId="a" {...AXIS_PROPS} tickFormatter={(v) => fmtBig(v, region).replace(/^[₹$]/, "")} width={60} /><YAxis yAxisId="m" orientation="right" {...AXIS_PROPS} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any, n: any) => [n === "Net margin" ? fmtPct(Number(v), 1, false) : fmtBig(Number(v), region), n]} /><Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="a" dataKey="revenue" name="Revenue" fill="#2563EB" radius={[3, 3, 0, 0]} isAnimationActive={false} /><Bar yAxisId="a" dataKey="net" name="Net income" fill="#16A34A" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                    <Line yAxisId="m" dataKey="margin" name="Net margin" stroke="#D97706" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
        <div className="space-y-4 lg:col-span-5">
          <Card title="Quality scores" subtitle="Piotroski F-score and Altman Z" info="Piotroski F-score (0–9) counts passed fundamental-strength tests; ≥7 is strong. Altman Z estimates bankruptcy risk: above 3 safe, below 1.8 distress. Computed by the backend from reported statements." icon={Award} tone="purple">
            <div className="space-y-3">
              <div>
                <div className="flex items-baseline justify-between text-xs"><span className="text-slate-400">Piotroski F-score</span><span className="font-mono font-bold text-white">{isNum(pio) ? `${pio} / 9` : "—"} <span className="text-[11px] font-normal text-slate-400">{f.piotroski_rating}</span></span></div>
                <div className="mt-1.5 flex gap-0.5">{Array.from({ length: 9 }).map((_, i) => <span key={i} className={cn("h-2 flex-1 rounded-sm", isNum(pio) && i < pio ? (pio >= 7 ? "bg-emerald-500" : pio >= 4 ? "bg-amber-500" : "bg-rose-500") : "bg-slate-800")} />)}</div>
              </div>
              <StatRow label="Altman Z-score" value={num(f.altman_z_score, 2)} /><StatRow label="Altman rating" value={f.altman_rating || "—"} />
            </div>
          </Card>
          <Card title="Dividends" subtitle="Yield, payout and history" info="Dividend yield and payout ratio from fundamentals, and the most recent dividends paid." icon={TrendingUp} tone="emerald">
            <StatRow label="Dividend yield" value={isNum(f.dividend_yield) ? fmtPct(f.dividend_yield, 2, false) : "—"} /><StatRow label="Payout ratio" value={pctOf(f.payout_ratio)} />
            <FeedGate state={corp} rows={2} title="No dividend history">{(c) => c.dividends.length === 0 ? <p className="py-2 text-xs text-slate-500">No dividends on record.</p> : <div className="mt-1">{c.dividends.slice(0, 5).map((d) => <StatRow key={d.date} label={d.date} value={fmtPx(d.amount, region)} />)}</div>}</FeedGate>
          </Card>
        </div>
      </div>

      {f.summary && (
        <Card title="Business summary" subtitle={[f.sector, f.industry].filter(Boolean).join(" · ")} info="Company description supplied with the fundamentals data." icon={Info} tone="blue">
          <p className={cn("text-xs leading-relaxed text-slate-300", !more && "line-clamp-4")}>{f.summary}</p>
          <button type="button" onClick={() => setMore((m) => !m)} className="mt-2 text-[11px] font-medium text-blue-400 hover:text-blue-300">{more ? "Show less" : "Read more"}</button>
        </Card>
      )}
    </div>
  );
}
