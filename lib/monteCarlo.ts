/**
 * Resampling of a strategy's own daily returns. A circular moving-block bootstrap keeps short-run
 * dependence (streaks, volatility clustering, flat stretches while out of the market) that
 * resampling single trades or single days would destroy. It describes how much the result depends on
 * the order of what happened; it is not a forecast.
 */
export function rng(seed: number) {
  let a = seed | 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export interface FanPoint { step: number; p5: number; p25: number; p50: number; p75: number; p95: number }
export interface McResult {
  iterations: number; days: number; block: number;
  terminal: number[];            // sorted, % return over the whole path
  maxDrawdown: number[];         // sorted ascending, % (positive numbers)
  mean: number; p5: number; p50: number; p95: number;
  probLoss: number;              // % of paths ending below the start
  ddMedian: number; ddP95: number;
  probDrawdown: (threshold: number) => number; // % of paths whose max drawdown reached `threshold` %
  probRuin: number;              // % of paths that ever fell below half the starting value
  fan: FanPoint[];               // percentile bands of the equity path (start = 100)
}

const pct = (sorted: number[], p: number) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(p * sorted.length)))];

export function blockBootstrap(returns: number[], opts: { iterations: number; block: number; seed: number; fanPoints?: number }): McResult | null {
  const n = returns.length;
  if (n < 30) return null;
  const block = Math.max(1, Math.min(Math.floor(opts.block), Math.floor(n / 2)));
  const rand = rng(n * 7919 + opts.seed * 104729);
  const iters = opts.iterations;
  const fp = Math.min(opts.fanPoints ?? 60, n);
  const stepIdx = Array.from({ length: fp }, (_, k) => Math.max(0, Math.round(((k + 1) / fp) * n) - 1));
  const marks = new Float32Array(iters * fp);
  const terminal: number[] = new Array(iters), dd: number[] = new Array(iters);
  let ruin = 0;
  for (let k = 0; k < iters; k++) {
    let eq = 1, peak = 1, worst = 0, minEq = 1, day = 0, m = 0;
    while (day < n) {
      const start = Math.floor(rand() * n);
      for (let j = 0; j < block && day < n; j++, day++) {
        eq *= 1 + returns[(start + j) % n];
        if (eq > peak) peak = eq;
        const d = peak > 0 ? (peak - eq) / peak : 0;
        if (d > worst) worst = d;
        if (eq < minEq) minEq = eq;
        if (m < fp && day === stepIdx[m]) marks[k * fp + m++] = eq * 100;
      }
    }
    terminal[k] = (eq - 1) * 100; dd[k] = worst * 100;
    if (minEq < 0.5) ruin++;
  }
  const t = [...terminal].sort((a, b) => a - b), d = [...dd].sort((a, b) => a - b);
  const fan: FanPoint[] = stepIdx.map((s, m) => {
    const col = new Array(iters); for (let k = 0; k < iters; k++) col[k] = marks[k * fp + m];
    col.sort((a, b) => a - b);
    return { step: s + 1, p5: pct(col, 0.05), p25: pct(col, 0.25), p50: pct(col, 0.5), p75: pct(col, 0.75), p95: pct(col, 0.95) };
  });
  return {
    iterations: iters, days: n, block, terminal: t, maxDrawdown: d,
    mean: terminal.reduce((a, b) => a + b, 0) / iters, p5: pct(t, 0.05), p50: pct(t, 0.5), p95: pct(t, 0.95),
    probLoss: (t.filter((v) => v < 0).length / iters) * 100,
    ddMedian: pct(d, 0.5), ddP95: pct(d, 0.95),
    probDrawdown: (th) => (d.filter((v) => v >= th).length / iters) * 100,
    probRuin: (ruin / iters) * 100, fan,
  };
}

export function histogram(sorted: number[], bins = 14) {
  const lo = sorted[0], hi = sorted[sorted.length - 1], w = (hi - lo) / bins || 1;
  const h = Array.from({ length: bins }, (_, i) => ({ from: lo + i * w, to: lo + (i + 1) * w, count: 0 }));
  sorted.forEach((v) => { h[Math.min(bins - 1, Math.floor((v - lo) / w))].count++; });
  return h;
}
