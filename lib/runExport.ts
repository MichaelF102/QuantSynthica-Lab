import { BacktestResult, StrategyConfig } from "@/types";
import { formatRuleSet } from "@/lib/formatRule";
import { currencyOf, CURRENCY_SYMBOL, monthlyMatrix, MONTH_NAMES, toPts, benchmarkLabel } from "@/lib/analyticsCalc";

/** Everything needed to reproduce a run. The Strategy Lab's Import reads the `strategy`, `window` and `benchmark` keys. */
export function buildRunJson(bt: BacktestResult, strategy: StrategyConfig | null) {
  return {
    format: "quantsynthica.run/1",
    exported_at: new Date().toISOString(),
    engine_version: bt.engine_version ?? null,
    data_fingerprint: bt.data_fingerprint ?? null,
    window: { start: bt.start_date, end: bt.end_date },
    benchmark: bt.benchmark,
    strategy: strategy ?? bt.strategy_config ?? null,
    run: bt,
  };
}

export const esc = (v: unknown) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const pct = (v: number | null | undefined, d = 2, sign = true) => (typeof v === "number" && Number.isFinite(v) ? `${sign && v > 0 ? "+" : ""}${v.toFixed(d)}%` : "—");
const num = (v: number | null | undefined, d = 2) => (typeof v === "number" && Number.isFinite(v) ? v.toFixed(d) : "—");

export function lineSvg(series: { name: string; color: string; values: number[]; dash?: string }[], dates: string[], height = 200): string {
  const W = 760, H = height, L = 46, R = 8, T = 8, B = 20;
  const all = series.flatMap((s) => s.values).filter(Number.isFinite);
  if (!all.length || dates.length < 2) return "";
  const lo = Math.min(...all), hi = Math.max(...all), span = hi - lo || 1;
  const x = (i: number) => L + (i / (dates.length - 1)) * (W - L - R), y = (v: number) => T + (1 - (v - lo) / span) * (H - T - B);
  const lines = series.map((s) => `<polyline fill="none" stroke="${s.color}" stroke-width="1.6"${s.dash ? ` stroke-dasharray="${s.dash}"` : ""} points="${s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ")}"/>`).join("");
  const ticks = [lo, lo + span / 2, hi].map((v) => `<text x="${L - 6}" y="${(y(v) + 3).toFixed(1)}" text-anchor="end" font-size="10" fill="#64748b">${esc(v.toFixed(0))}</text><line x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="#e2e8f0"/>`).join("");
  const xs = [0, Math.floor(dates.length / 2), dates.length - 1].map((i) => `<text x="${x(i).toFixed(1)}" y="${H - 4}" text-anchor="${i === 0 ? "start" : i === dates.length - 1 ? "end" : "middle"}" font-size="10" fill="#64748b">${esc(dates[i])}</text>`).join("");
  const legend = series.map((s, i) => `<text x="${L + 8 + i * 130}" y="${T + 12}" font-size="11" fill="${s.color}">${s.dash ? "- - " : "— "}${esc(s.name)}</text>`).join("");
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="chart">${ticks}${lines}${xs}${legend}</svg>`;
}

/** A single self-contained HTML file (no scripts, no external requests) that can be emailed, archived or printed. */
export function buildRunReport(bt: BacktestResult, strategy: StrategyConfig | null): string {
  const m = bt.metrics, cur = CURRENCY_SYMBOL[currencyOf(bt)];
  const strat = strategy ?? bt.strategy_config ?? null;
  const curve = bt.equity_curve, dates = curve.map((p) => p.date);
  const base = curve[0]?.portfolio_value || 1, bbase = curve[0]?.benchmark_value || 1;
  const equity = lineSvg([{ name: bt.strategy_name, color: "#2563eb", values: curve.map((p) => (p.portfolio_value / base) * 100) }, { name: benchmarkLabel(bt.benchmark), color: "#64748b", dash: "4 3", values: curve.map((p) => (p.benchmark_value / bbase) * 100) }], dates);
  const dd = lineSvg([{ name: "Drawdown %", color: "#dc2626", values: curve.map((p) => -Math.abs(p.drawdown)) }], dates, 140);
  const matrix = monthlyMatrix(toPts(curve));
  const wins = bt.trades.filter((t) => t.net_pnl > 0).length;
  const top = [...bt.trades].sort((a, b) => Math.abs(b.net_pnl) - Math.abs(a.net_pnl)).slice(0, 10);
  const money = (v: number) => `${v < 0 ? "-" : ""}${cur}${Math.abs(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  const kpi = (k: string, v: string) => `<div class="k"><div class="v">${esc(v)}</div><div class="l">${esc(k)}</div></div>`;
  const row = (k: string, v: unknown) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`;
  const r = strat?.risk, e = strat?.execution;
  const dir = r ? ({ long: "Long only", short: "Short only", both: "Long & short" } as const)[r.direction ?? (r.allow_short ? "both" : "long")] : "—";
  const small = (m?.num_trades ?? bt.trades.length) < 30;

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(bt.strategy_name)} · ${esc(bt.ticker)} · backtest report</title>
<style>body{font:14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;max-width:860px;margin:32px auto;padding:0 16px}h1{margin:0 0 2px;font-size:24px}h2{margin:28px 0 8px;font-size:15px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}.sub{color:#475569;font-size:13px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}.k{border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px}.v{font:600 17px ui-monospace,Menlo,monospace}.l{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.04em}table{border-collapse:collapse;width:100%;font-size:13px}td,th{border-bottom:1px solid #f1f5f9;padding:4px 6px;text-align:left}th{font-size:11px;text-transform:uppercase;color:#64748b}td.n,th.n{text-align:right;font-family:ui-monospace,Menlo,monospace}.warn{background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:8px 10px;margin:12px 0;font-size:13px}.note{white-space:pre-wrap;border-left:3px solid #cbd5e1;padding:2px 10px;margin:8px 0}.foot{margin-top:32px;font-size:12px;color:#64748b}@media print{body{margin:0}}</style></head><body>
<h1>${esc(bt.strategy_name)}</h1>
<div class="sub">${esc(bt.ticker)} vs ${esc(benchmarkLabel(bt.benchmark))} · ${esc(bt.start_date)} → ${esc(bt.end_date)} · run ${esc(bt.id)}</div>
<div class="sub">Generated ${esc(new Date().toISOString().slice(0, 16).replace("T", " "))} UTC · engine ${esc(bt.engine_version ?? "unknown")} · data fingerprint ${esc(bt.data_fingerprint ?? "unknown")}</div>
${bt.is_synthetic ? `<div class="warn"><b>Generated prices.</b> This run did not use real market data and is not real market performance.</div>` : ""}
${small ? `<div class="warn"><b>Small sample: ${bt.trades.length} trade${bt.trades.length === 1 ? "" : "s"}.</b> Sharpe, Sortino and win rate rest on very few observations.</div>` : ""}
<h2>Performance</h2>
<div class="grid">${m ? [kpi("Total return", pct(m.total_return)), kpi("CAGR", pct(m.cagr)), kpi("Sharpe", num(m.sharpe_ratio)), kpi("Sortino", num(m.sortino_ratio)), kpi("Max drawdown", pct(-Math.abs(m.max_drawdown), 1)), kpi("Volatility", pct(m.annualized_volatility, 1, false)), kpi("Win rate", pct(m.win_rate, 1, false)), kpi("Profit factor", num(m.profit_factor)), kpi("Trades", String(m.num_trades))].join("") : ""}</div>
<h2>Equity vs benchmark (rebased to 100)</h2>${equity}
<h2>Drawdown</h2>${dd}
${matrix.length ? `<h2>Monthly returns (%)</h2><table><tr><th>Year</th>${MONTH_NAMES.map((mo) => `<th class="n">${mo}</th>`).join("")}<th class="n">YTD</th></tr>${matrix.map((rw) => `<tr><td>${rw.year}</td>${MONTH_NAMES.map((mo) => `<td class="n">${typeof rw[mo] === "number" ? (rw[mo] as number).toFixed(1) : ""}</td>`).join("")}<td class="n">${rw.YTD.toFixed(1)}</td></tr>`).join("")}</table>` : ""}
<h2>Trades</h2><p class="sub">${bt.trades.length} closed trades, ${wins} winners (${bt.trades.length ? ((wins / bt.trades.length) * 100).toFixed(0) : 0}%), net ${esc(money(bt.trades.reduce((s, t) => s + t.net_pnl, 0)))} after costs. Ten largest by absolute P&amp;L:</p>
${top.length ? `<table><tr><th>Entry</th><th>Exit</th><th>Side</th><th>Reason</th><th class="n">Return</th><th class="n">Net P&amp;L</th></tr>${top.map((t) => `<tr><td>${esc(t.entry_date)}</td><td>${esc(t.exit_date)}</td><td>${esc(t.direction)}</td><td>${esc(t.exit_reason)}</td><td class="n">${esc(pct(t.return_pct))}</td><td class="n">${esc(money(t.net_pnl))}</td></tr>`).join("")}</table>` : ""}
<h2>Strategy</h2>${strat ? `<table>${row("Indicators", strat.indicators.map((i) => `${i.name}(${Object.values(i.params).join(",")})`).join(", ") || "none")}${row("Entry", formatRuleSet(strat.entry_rules, strat.indicators) || "—")}${row("Exit", formatRuleSet(strat.exit_rules, strat.indicators) || "stops only")}${row("Direction", dir)}${row("Position size", `${r!.position_size_pct}% of equity, ${r!.allow_stacking ? `up to ${r!.max_positions} stacked` : "one at a time"}`)}${row("Stop / target", `${r!.stop_atr_mult ? `${r!.stop_atr_mult}×ATR` : r!.stop_loss_pct != null ? `${r!.stop_loss_pct}%` : "none"} / ${r!.take_profit_atr_mult ? `${r!.take_profit_atr_mult}×ATR` : r!.take_profit_pct != null ? `${r!.take_profit_pct}%` : "none"}`)}${row("Trailing stop", r!.trailing_stop_pct ? `${r!.trailing_stop_pct}%` : "none")}${row("Costs per side", `commission ${e!.commission_pct}%, slippage ${e!.slippage_pct}%, spread ${e!.spread_pct}% (half per side)`)}${row("Initial capital", money(e!.initial_capital))}${row("Fills", "Next bar open (t+1)")}</table>` : `<p class="sub">The strategy behind this run is no longer available.</p>`}
${bt.notes?.length ? `<h2>Notes</h2>${bt.notes.map((n) => `<div class="note"><div class="sub">${esc(n.timestamp)}</div>${esc(n.content)}</div>`).join("")}` : ""}
<div class="foot">Backtested, hypothetical results on historical data. They do not reflect real trading, market impact or liquidity, and are not investment advice. Past performance does not predict future results.</div>
</body></html>`;
}
