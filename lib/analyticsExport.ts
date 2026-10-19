import { BacktestResult } from "@/types";
import { CompareRow, Comparison, BEST } from "@/lib/compareRuns";
import { esc, lineSvg } from "@/lib/runExport";
import { AlignedReturns, equityFrom, portfolioReturns, maxDrawdown, sd } from "@/lib/portfolioOfRuns";

const csvCell = (v: unknown) => { const t = String(v ?? ""); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };

/** Raw (unformatted) numbers, one column per run, so the file can be used in a spreadsheet. */
export function comparisonCsv(cmp: Comparison, names: string[]): string {
  const lines: string[][] = [["Group", "Metric", ...names]];
  cmp.setup.forEach((s) => lines.push(["Setup", s.label, ...s.values]));
  cmp.rows.forEach((r) => lines.push([r.group, r.label, ...r.values.map((v) => (v === null ? "" : String(v)))]));
  cmp.warnings.forEach((w) => lines.push(["Note", w]));
  return lines.map((l) => l.map(csvCell).join(",")).join("\n") + "\n";
}

export interface PortfolioSummary { weights: number[]; mode: string; totalReturn: number; vol: number; sharpe: number | null; maxDD: number; diversification: number | null; window: { start: string; end: string } }

export function portfolioSummary(al: AlignedReturns, w: number[], mode: string, diversification: number | null): PortfolioSummary {
  const r = portfolioReturns(al.returns, w), eq = equityFrom(r, 100), s = sd(r), m = r.reduce((a, b) => a + b, 0) / r.length;
  return { weights: w, mode, totalReturn: eq[eq.length - 1] - 100, vol: s * Math.sqrt(252) * 100, sharpe: s > 1e-12 ? (m / s) * Math.sqrt(252) : null, maxDD: maxDrawdown(eq), diversification, window: al.window };
}

const COLORS = ["#2563eb", "#16a34a", "#d97706", "#7c3aed", "#dc2626", "#0891b2"];

/** Self-contained HTML (no scripts, no external requests) comparing the selected runs. */
export function selectionReport(runs: BacktestResult[], names: string[], cmp: Comparison, port?: PortfolioSummary | null): string {
  const common = runs.map((b) => b.equity_curve.map((p) => p.date)).reduce((a, d) => a.filter((x) => new Set(d).has(x)));
  const rebased = runs.map((b) => { const m = new Map(b.equity_curve.map((p) => [p.date, p.portfolio_value])); const base = m.get(common[0]) ?? 1; return common.map((d) => ((m.get(d) ?? base) / base) * 100); });
  const chart = common.length > 2 ? lineSvg(runs.map((_, i) => ({ name: names[i], color: COLORS[i % COLORS.length], values: rebased[i] })), common) : "";
  const cell = (r: CompareRow, v: number | null, best: number | null) => `<td class="n${v !== null && best !== null && v === best ? " best" : ""}">${v === null ? "—" : esc(r.fmt(v))}</td>`;
  const groups = [...new Set(cmp.rows.map((r) => r.group))];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Strategy comparison</title>
<style>body{font:14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;max-width:960px;margin:32px auto;padding:0 16px}h1{margin:0 0 2px;font-size:24px}h2{margin:26px 0 8px;font-size:15px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}.sub{color:#475569;font-size:13px}table{border-collapse:collapse;width:100%;font-size:13px}td,th{border-bottom:1px solid #f1f5f9;padding:4px 6px;text-align:left}th{font-size:11px;text-transform:uppercase;color:#64748b}td.n,th.n{text-align:right;font-family:ui-monospace,Menlo,monospace}td.best{color:#15803d;font-weight:700}tr.g td{background:#f8fafc;font-weight:700;font-size:11px;text-transform:uppercase;color:#475569}.warn{background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:6px 10px;margin:6px 0;font-size:13px}.foot{margin-top:32px;font-size:12px;color:#64748b}@media print{body{margin:0}}</style></head><body>
<h1>Strategy comparison</h1><div class="sub">${runs.length} runs · generated ${esc(new Date().toISOString().slice(0, 16).replace("T", " "))} UTC</div>
${cmp.warnings.map((w) => `<div class="warn">${esc(w)}</div>`).join("")}
${chart ? `<h2>Growth of 100 over the shared dates (${esc(common[0])} → ${esc(common[common.length - 1])})</h2>${chart}` : ""}
<h2>Setup</h2><table><tr><th></th>${names.map((n) => `<th>${esc(n)}</th>`).join("")}</tr>${cmp.setup.map((s) => `<tr><td>${esc(s.label)}</td>${s.values.map((v) => `<td>${esc(v)}</td>`).join("")}</tr>`).join("")}</table>
<h2>Metrics</h2><table><tr><th></th>${names.map((n) => `<th class="n">${esc(n)}</th>`).join("")}</tr>${groups.map((g) => `<tr class="g"><td colspan="${names.length + 1}">${esc(g)}</td></tr>${cmp.rows.filter((r) => r.group === g).map((r) => { const b = BEST(r); return `<tr><td>${esc(r.label)}</td>${r.values.map((v) => cell(r, v, b)).join("")}</tr>`; }).join("")}`).join("")}</table>
${port ? `<h2>Combined portfolio (${esc(port.mode)} weights, ${esc(port.window.start)} → ${esc(port.window.end)})</h2><table><tr><th>Run</th><th class="n">Weight</th></tr>${names.map((n, i) => `<tr><td>${esc(n)}</td><td class="n">${(port.weights[i] * 100).toFixed(1)}%</td></tr>`).join("")}</table><p class="sub">Return ${port.totalReturn.toFixed(1)}% · volatility ${port.vol.toFixed(1)}% · Sharpe ${port.sharpe === null ? "—" : port.sharpe.toFixed(2)} · max drawdown ${port.maxDD.toFixed(1)}% · diversification ratio ${port.diversification === null ? "—" : port.diversification.toFixed(2)}. Daily rebalanced; ignores costs of rebalancing and currency differences.</p>` : ""}
<div class="foot">Backtested, hypothetical results on historical data. They do not reflect real trading, market impact or liquidity, and are not investment advice.</div></body></html>`;
}
