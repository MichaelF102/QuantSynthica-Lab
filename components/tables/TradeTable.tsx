"use client";

import React, { useState, useMemo } from "react";
import { ArrowLeftRight, Download, Search, ChevronUp, ChevronDown } from "lucide-react";
import { TradeRecord } from "@/types";
import { Card, EmptyState, Kpi, signTone } from "@/components/ui/Card";
import { fmtPct, fmtInt, cn } from "@/lib/utils";

interface TradeTableProps {
  trades: TradeRecord[];
  backtestId?: string;
  /** Currency symbol used for prices and P&L. */
  currency?: string;
  onSelectTrade?: (trade: TradeRecord) => void;
  selectedTradeId?: string | null;
}

type SortField = "entry_date" | "exit_date" | "net_pnl" | "return_pct" | "holding_period_bars" | "mae" | "mfe";
type Filter = "All" | "Long" | "Short" | "Winners" | "Losers";
const FILTERS: Filter[] = ["All", "Long", "Short", "Winners", "Losers"];

export default function TradeTable({ trades, backtestId, currency = "$", onSelectTrade, selectedTradeId }: TradeTableProps) {
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("entry_date");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const money = (v: number) => `${v < 0 ? "-" : ""}${currency}${Math.abs(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

  const summary = useMemo(() => {
    if (!trades?.length) return null;
    const rets = trades.map((t) => t.return_pct).sort((a, b) => a - b);
    const wins = trades.filter((t) => t.net_pnl > 0).length;
    return {
      best: rets[rets.length - 1], worst: rets[0], avg: rets.reduce((a, b) => a + b, 0) / rets.length, median: rets[Math.floor(rets.length / 2)],
      wins, losses: trades.length - wins, winRate: (wins / trades.length) * 100,
      fees: trades.reduce((a, b) => a + b.fees, 0), net: trades.reduce((a, b) => a + b.net_pnl, 0),
      hold: trades.reduce((a, b) => a + b.holding_period_bars, 0) / trades.length,
    };
  }, [trades]);

  const rows = useMemo(() => trades.filter((t) => {
    if (filter === "Long" && !t.direction.includes("LONG")) return false;
    if (filter === "Short" && !t.direction.includes("SHORT")) return false;
    if (filter === "Winners" && t.net_pnl <= 0) return false;
    if (filter === "Losers" && t.net_pnl > 0) return false;
    const q = query.trim().toLowerCase();
    return !q || [t.id, t.ticker, t.exit_reason, t.direction].some((s) => s.toLowerCase().includes(q));
  }).sort((a, b) => {
    const x = a[sortField] as any, y = b[sortField] as any;
    return typeof x === "string" ? (sortAsc ? x.localeCompare(y) : y.localeCompare(x)) : sortAsc ? x - y : y - x;
  }), [trades, filter, query, sortField, sortAsc]);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const view = rows.slice((page - 1) * pageSize, page * pageSize);
  const sort = (f: SortField) => { if (sortField === f) setSortAsc(!sortAsc); else { setSortField(f); setSortAsc(true); } setPage(1); };

  const exportCsv = () => {
    const head = ["Trade ID", "Ticker", "Direction", "Entry Date", "Exit Date", "Entry Price", "Exit Price", "Quantity", "Gross PnL", "Fees", "Net PnL", "Return %", "Holding Bars", "Exit Reason", "MAE %", "MFE %"];
    const body = trades.map((t) => [t.id, t.ticker, t.direction, t.entry_date, t.exit_date, t.entry_price, t.exit_price, t.quantity, t.gross_pnl, t.fees, t.net_pnl, t.return_pct, t.holding_period_bars, t.exit_reason, t.mae, t.mfe]);
    const url = URL.createObjectURL(new Blob([[head, ...body].map((r) => r.join(",")).join("\n")], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `trades_${backtestId || "export"}.csv` });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  if (!trades?.length) return <Card title="Trades" icon={ArrowLeftRight}><EmptyState icon={ArrowLeftRight} title="No trades" hint="No entry conditions were triggered during this backtest period." /></Card>;

  const Th = ({ f, children, left }: { f?: SortField; children: React.ReactNode; left?: boolean }) => (
    <th onClick={f ? () => sort(f) : undefined} className={cn("whitespace-nowrap px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400", left ? "text-left" : "text-right", f && "cursor-pointer hover:text-white")}>
      <span className="inline-flex items-center gap-0.5">{children}{f && sortField === f && (sortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</span>
    </th>
  );

  return (
    <div className="space-y-4 font-sans">
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          <Kpi label="Win rate" value={fmtPct(summary.winRate, 1, false)} sub={`${summary.wins}W / ${summary.losses}L`} />
          <Kpi label="Net P&L" value={money(summary.net)} tone={signTone(summary.net)} sub={`Fees ${money(summary.fees)}`} />
          <Kpi label="Avg trade" value={fmtPct(summary.avg)} tone={signTone(summary.avg)} sub={`Median ${fmtPct(summary.median)}`} />
          <Kpi label="Best trade" value={fmtPct(summary.best)} tone="text-emerald-400" />
          <Kpi label="Worst trade" value={fmtPct(summary.worst)} tone="text-rose-400" />
          <Kpi label="Avg holding" value={`${summary.hold.toFixed(1)} bars`} />
          <Kpi label="Total trades" value={fmtInt(trades.length)} tone="text-blue-400" />
        </div>
      )}
      <Card title="Trade log" subtitle={`${fmtInt(rows.length)} of ${fmtInt(trades.length)} trades`} info="Every closed trade in this run. Click a row for entry/exit detail. P&L is net of fees; MAE/MFE are the worst and best excursion while the trade was open." icon={ArrowLeftRight} tone="blue"
        action={<div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-800 bg-[#080d1a] p-0.5">{FILTERS.map((f) => <button key={f} onClick={() => { setFilter(f); setPage(1); }} className={cn("rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors", filter === f ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white")}>{f}</button>)}</div>
          <div className="relative"><Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search trades" className="w-40 rounded-lg border border-slate-800 bg-[#080d1a] py-1.5 pl-8 pr-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none" /></div>
          <button onClick={exportCsv} className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#080d1a] px-2.5 py-1.5 text-xs text-slate-300 hover:text-white"><Download className="h-3.5 w-3.5" />CSV</button>
        </div>}>
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse font-mono text-xs">
            <thead><tr className="border-b border-slate-800">
              <Th left>#</Th><Th left>Ticker</Th><Th left>Side</Th><Th f="entry_date" left>Entry</Th><Th f="exit_date" left>Exit</Th>
              <Th>Entry price</Th><Th>Exit price</Th><Th>Qty</Th><Th f="net_pnl">P&amp;L</Th><Th f="return_pct">Return</Th><Th f="holding_period_bars">Bars</Th><Th f="mae">MAE</Th><Th f="mfe">MFE</Th><Th left>Reason</Th>
            </tr></thead>
            <tbody className="divide-y divide-slate-800/50">
              {view.map((t, i) => (
                <tr key={t.id} onClick={() => onSelectTrade?.(t)} className={cn("cursor-pointer transition-colors", t.id === selectedTradeId ? "bg-blue-500/10" : "hover:bg-slate-800/30")}>
                  <td className="px-2 py-2 text-slate-500">{(page - 1) * pageSize + i + 1}</td>
                  <td className="px-2 py-2 font-bold text-white">{t.ticker}</td>
                  <td className="px-2 py-2"><span className={cn("rounded-md border px-1.5 py-0.5 text-[10px] font-bold", t.direction.includes("LONG") ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-rose-500/30 bg-rose-500/10 text-rose-400")}>{t.direction}</span></td>
                  <td className="px-2 py-2 text-slate-300">{t.entry_date}</td><td className="px-2 py-2 text-slate-300">{t.exit_date}</td>
                  <td className="px-2 py-2 text-right text-white">{money(t.entry_price)}</td><td className="px-2 py-2 text-right text-white">{money(t.exit_price)}</td>
                  <td className="px-2 py-2 text-right text-slate-400">{t.quantity.toFixed(2)}</td>
                  <td className={cn("px-2 py-2 text-right font-semibold", signTone(t.net_pnl))}>{money(t.net_pnl)}</td>
                  <td className={cn("px-2 py-2 text-right font-semibold", signTone(t.return_pct))}>{fmtPct(t.return_pct)}</td>
                  <td className="px-2 py-2 text-right text-slate-400">{t.holding_period_bars}</td>
                  <td className="px-2 py-2 text-right text-rose-400">{typeof t.mae === "number" ? `-${Math.abs(t.mae).toFixed(1)}%` : "—"}</td>
                  <td className="px-2 py-2 text-right text-emerald-400">{typeof t.mfe === "number" ? `+${Math.abs(t.mfe).toFixed(1)}%` : "—"}</td>
                  <td className="px-2 py-2"><span className="rounded-md border border-slate-800 bg-[#080d1a] px-1.5 py-0.5 text-[10px] text-slate-400">{t.exit_reason}</span></td>
                </tr>))}
              {!view.length && <tr><td colSpan={14} className="py-8 text-center font-sans text-xs text-slate-500">No trades match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span>{rows.length ? `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, rows.length)} of ${fmtInt(rows.length)}` : "No results"}</span>
          <div className="flex items-center gap-1">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-800 bg-[#080d1a] px-2.5 py-1 hover:text-white disabled:opacity-30">Prev</button>
            <span className="px-2 font-mono text-slate-300">{page} / {pages}</span>
            <button disabled={page === pages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-800 bg-[#080d1a] px-2.5 py-1 hover:text-white disabled:opacity-30">Next</button>
          </div>
        </div>
      </Card>
    </div>
  );
}
