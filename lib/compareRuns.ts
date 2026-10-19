import { BacktestResult } from "@/types";
import { AnalyticsFilters, btPoints, btTrades, captureRatios, distStats, exposureSeries, regimeProfile, riskStats, seriesStats, tradeStats } from "@/lib/analyticsCalc";
import { psr, sharpeStats } from "@/lib/overfit";

export interface CompareRow { group: string; key: string; label: string; values: (number | null)[]; fmt: (v: number) => string; better: "high" | "low" | null }
export interface CompareSetup { label: string; values: string[] }
export interface Comparison { rows: CompareRow[]; setup: CompareSetup[]; warnings: string[] }

const f1 = (v: number) => v.toFixed(1), f2 = (v: number) => v.toFixed(2);
// never print "-0%" or "-0.00%": tiny values read as zero
const pct1 = (v: number) => (Math.abs(v) < 0.05 ? "0.0%" : `${v > 0 ? "+" : ""}${v.toFixed(1)}%`), pct0 = (v: number) => `${(Math.abs(v) < 0.5 ? 0 : v).toFixed(0)}%`;
const minus = (d: number) => (v: number) => (v < 0.5 * 10 ** -d ? `${(0).toFixed(d)}%` : `-${v.toFixed(d)}%`);

/** Runs that are the same strategy, security, window and results (re-runs of one thing). */
export function duplicateGroups(runs: BacktestResult[]): number[][] {
  const sig = (b: BacktestResult) => [b.strategy_name, b.ticker, b.start_date, b.end_date, b.benchmark, (b.metrics?.total_return ?? 0).toFixed(6), (b.metrics?.sharpe_ratio ?? 0).toFixed(6), b.trades.length].join("|");
  const g = new Map<string, number[]>();
  runs.forEach((b, i) => g.set(sig(b), [...(g.get(sig(b)) ?? []), i]));
  return [...g.values()].filter((x) => x.length > 1);
}

/** One table's worth of numbers for several runs over the same date window, with the caveats that make them (not) comparable. */
export function compareRuns(runs: BacktestResult[], f: AnalyticsFilters, names: string[]): Comparison {
  const daily = { ...f, frequency: "Daily" as const };
  const per = runs.map((b) => {
    const pts = btPoints(b, daily), trades = btTrades(b, daily);
    const st = seriesStats(pts), risk = riskStats(pts), ts = tradeStats(trades), ex = exposureSeries({ ...b, trades, equity_curve: b.equity_curve.filter((p) => pts.some((q) => q.date === p.date)) });
    const regimes = regimeProfile(pts), cap = pts.some((p) => p.bench !== pts[0]?.bench) ? captureRatios(pts) : null;
    const sh = sharpeStats(pts.slice(1).map((p, i) => (pts[i].value > 0 ? p.value / pts[i].value - 1 : 0)));
    const dist = distStats(pts);
    return { b, st, risk, ts, ex, regimes, cap, sh, dist };
  });
  const row = (group: string, key: string, label: string, get: (p: (typeof per)[number]) => number | null | undefined, fmt: (v: number) => string, better: CompareRow["better"] = null): CompareRow =>
    ({ group, key, label, values: per.map((p) => { const v = get(p); return typeof v === "number" && Number.isFinite(v) ? v : null; }), fmt, better });
  const reg = (name: string) => (p: (typeof per)[number]) => p.regimes?.find((r) => r.regime.startsWith(name))?.annReturn;

  const rows: CompareRow[] = [
    row("Performance", "total_return", "Total return", (p) => p.st?.totalReturn, pct1, "high"),
    row("Performance", "cagr", "CAGR", (p) => p.st?.cagr, pct1, "high"),
    row("Performance", "vol", "Volatility (ann.)", (p) => p.st?.vol, f1, "low"),
    row("Performance", "sharpe", "Sharpe", (p) => p.st?.sharpe, f2, "high"),
    row("Performance", "sortino", "Sortino", (p) => p.st?.sortino, f2, "high"),
    row("Performance", "mdd", "Max drawdown", (p) => p.st?.maxDD, minus(1), "low"),
    row("Performance", "calmar", "Calmar", (p) => p.st?.calmar, f2, "high"),
    row("Performance", "beta", "Beta", (p) => p.st?.beta, f2),
    row("Performance", "alpha", "Alpha (ann.)", (p) => p.st?.alpha, pct1, "high"),
    row("Performance", "up_capture", "Up capture", (p) => p.cap?.up, pct0, "high"),
    row("Performance", "down_capture", "Down capture", (p) => p.cap?.down, pct0, "low"),
    row("Risk", "var95", "VaR 95% (1 day)", (p) => p.risk?.var95, minus(2), "low"),
    row("Risk", "es95", "Expected shortfall 95%", (p) => p.risk?.cvar95, minus(2), "low"),
    row("Risk", "downside", "Downside deviation", (p) => p.risk?.downsideDev, f1, "low"),
    row("Risk", "ulcer", "Ulcer index", (p) => p.risk?.ulcer, f2, "low"),
    row("Risk", "skew", "Skew", (p) => p.dist?.skew, f2),
    row("Trades", "trades", "Closed trades", (p) => p.ts?.count, (v) => String(v)),
    row("Trades", "win", "Win rate", (p) => p.ts?.winRate, pct0, "high"),
    row("Trades", "pf", "Profit factor", (p) => p.ts?.profitFactor, f2, "high"),
    row("Trades", "payoff", "Payoff (avg win ÷ avg loss)", (p) => p.ts?.payoff, f2, "high"),
    row("Trades", "hold", "Average hold (bars)", (p) => p.ts?.avgHold, f1),
    row("Trades", "tim", "Time in market", (p) => p.ex?.timeInMarket, pct0),
    row("Trades", "maxopen", "Most trades open at once", (p) => p.ex?.maxConcurrent, (v) => String(v)),
    row("Regimes", "bull", "Return in Bull regimes (ann.)", reg("Bull"), pct1, "high"),
    row("Regimes", "bear", "Return in Bear regimes (ann.)", reg("Bear"), pct1, "high"),
    row("Regimes", "highvol", "Return in High-volatility regimes (ann.)", reg("High"), pct1, "high"),
    row("Robustness", "psr", "Probability Sharpe > 0", (p) => (p.sh ? psr(p.sh) * 100 : null), pct0, "high"),
  ];
  const text = (label: string, get: (b: BacktestResult) => string): CompareSetup => ({ label, values: runs.map(get) });
  const setup: CompareSetup[] = [
    text("Security", (b) => b.ticker), text("Window", (b) => `${b.start_date} → ${b.end_date}`), text("Benchmark", (b) => b.benchmark),
    text("Direction", (b) => { const r = b.strategy_config?.risk; return r ? ({ long: "Long only", short: "Short only", both: "Long & short" } as const)[r.direction ?? (r.allow_short ? "both" : "long")] : "—"; }),
    text("Open at once", (b) => { const r = b.strategy_config?.risk; return r ? (r.allow_stacking ? `Up to ${r.max_positions} (stacked)` : "One at a time") : "not recorded"; }),
    text("Engine revision", (b) => b.engine_version ?? "not recorded"),
  ];

  const warnings: string[] = [];
  duplicateGroups(runs).forEach((g) => warnings.push(`${g.map((i) => names[i]).join(" and ")} are the same run (same strategy, window and results). Comparing or combining them counts one result more than once.`));
  if (new Set(runs.map((b) => b.ticker)).size > 1) warnings.push("These runs trade different securities, so their returns are not like for like.");
  if (new Set(runs.map((b) => `${b.start_date}|${b.end_date}`)).size > 1) warnings.push("The runs were made over different windows. The statistics use each run's own dates unless you set a window above.");
  if (new Set(runs.map((b) => b.benchmark)).size > 1) warnings.push("The runs use different benchmarks, so alpha, beta and capture are measured against different things.");
  if (new Set(runs.map((b) => b.engine_version ?? "none")).size > 1) warnings.push("The runs come from different engine revisions, so differences may come from changes to the simulation rather than the strategies.");
  if (runs.some((b) => !b.engine_version)) warnings.push("Runs made before engine revisions were recorded may have stacked overlapping trades, which inflates their trade counts.");
  const small = runs.map((b, i) => (b.trades.length < 30 ? names[i] : null)).filter(Boolean);
  if (small.length) warnings.push(`Fewer than 30 trades: ${small.join(", ")}. Ratios for these runs are noisy.`);
  return { rows, setup, warnings };
}

export const BEST = (row: CompareRow): number | null => {
  if (!row.better) return null;
  const v = row.values.filter((x): x is number => x !== null);
  return v.length < 2 ? null : row.better === "high" ? Math.max(...v) : Math.min(...v);
};
