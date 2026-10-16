import { mean, std } from "./stats";

export function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 3) return NaN;
  const ma = mean(a.slice(0, n)), mb = mean(b.slice(0, n));
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; }
  return da > 0 && db > 0 ? num / Math.sqrt(da * db) : NaN;
}

export function corrMatrixOf(rows: number[][]): number[][] {
  return rows.map((a, i) => rows.map((b, j) => (i === j ? 1 : pearson(a, b))));
}

/** Correlation of every holding plus the benchmark, in that order. */
export function corrWithBench(tickers: string[], assetReturns: Record<string, number[]>, benchReturns: number[], benchLabel: string) {
  const labels = [...tickers, benchLabel];
  const rows = [...tickers.map((t) => assetReturns[t]), benchReturns];
  return { labels, matrix: corrMatrixOf(rows) };
}

export const annualVol = (r: number[]) => std(r) * Math.sqrt(252) * 100;

// ---------- rank correlations ----------
export type CorrType = "Pearson" | "Spearman" | "Kendall";
export const CORR_TYPES: CorrType[] = ["Pearson", "Spearman", "Kendall"];

/** Average ranks (ties share the mean rank). */
export function ranks(a: number[]): number[] {
  const idx = a.map((v, i) => [v, i] as const).sort((x, y) => x[0] - y[0]);
  const out = new Array(a.length);
  for (let i = 0; i < idx.length;) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    const r = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) out[idx[k][1]] = r;
    i = j + 1;
  }
  return out;
}

export const spearman = (a: number[], b: number[]) => pearson(ranks(a), ranks(b));

/** Kendall tau-b, O(n^2). */
export function kendall(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 3) return NaN;
  let conc = 0, disc = 0, tx = 0, ty = 0;
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = a[i] - a[j], dy = b[i] - b[j];
      if (dx === 0 && dy === 0) continue;
      if (dx === 0) tx++; else if (dy === 0) ty++; else if (dx * dy > 0) conc++; else disc++;
    }
  }
  const den = Math.sqrt((conc + disc + tx) * (conc + disc + ty));
  return den > 0 ? (conc - disc) / den : NaN;
}

export function matrixOf(rows: number[][], type: CorrType): number[][] {
  const f = type === "Pearson" ? pearson : type === "Spearman" ? spearman : kendall;
  const n = rows.length;
  const m: number[][] = Array.from({ length: n }, () => new Array(n).fill(1));
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) m[i][j] = m[j][i] = f(rows[i], rows[j]);
  return m;
}

export interface Pair { a: string; b: string; rho: number }
export function pairs(labels: string[], m: number[][]): Pair[] {
  const out: Pair[] = [];
  for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) if (Number.isFinite(m[i][j])) out.push({ a: labels[i], b: labels[j], rho: m[i][j] });
  return out;
}

export function corrSummary(labels: string[], m: number[][]) {
  const ps = pairs(labels, m);
  if (!ps.length) return null;
  const sorted = [...ps].sort((x, y) => y.rho - x.rho);
  const avg = ps.reduce((s, p) => s + p.rho, 0) / ps.length;
  const avgAbs = ps.reduce((s, p) => s + Math.abs(p.rho), 0) / ps.length;
  return {
    pairs: ps, avg, highest: sorted[0], lowest: sorted[sorted.length - 1],
    positivePct: (ps.filter((p) => p.rho > 0).length / ps.length) * 100, negativePct: (ps.filter((p) => p.rho < 0).length / ps.length) * 100,
    /** 1 − mean |ρ|: 1 = uncorrelated universe, 0 = everything moves together. */
    diversification: 1 - avgAbs,
  };
}

/** Leaf order of an average-linkage hierarchical clustering on distance 1 − ρ, so similar assets sit together. */
export function clusterOrder(m: number[][]): number[] {
  const n = m.length;
  if (n < 3) return m.map((_, i) => i);
  type Node = { items: number[]; order: number[] };
  let nodes: Node[] = m.map((_, i) => ({ items: [i], order: [i] }));
  const dist = (a: Node, b: Node) => {
    let s = 0, c = 0;
    a.items.forEach((i) => b.items.forEach((j) => { s += 1 - (Number.isFinite(m[i][j]) ? m[i][j] : 0); c++; }));
    return s / c;
  };
  while (nodes.length > 1) {
    let bi = 0, bj = 1, best = Infinity;
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) { const d = dist(nodes[i], nodes[j]); if (d < best) { best = d; bi = i; bj = j; } }
    const merged: Node = { items: [...nodes[bi].items, ...nodes[bj].items], order: [...nodes[bi].order, ...nodes[bj].order] };
    nodes = nodes.filter((_, k) => k !== bi && k !== bj).concat(merged);
  }
  return nodes[0].order;
}

export function reorder(labels: string[], m: number[][], order: number[]) {
  return { labels: order.map((i) => labels[i]), matrix: order.map((i) => order.map((j) => m[i][j])) };
}

export function rollingCorr(a: number[], b: number[], dates: string[], win: number) {
  const out: { date: string; rho: number }[] = [];
  for (let i = win; i <= a.length; i++) out.push({ date: dates[i], rho: pearson(a.slice(i - win, i), b.slice(i - win, i)) });
  return out;
}

/** Deterministic force-directed layout: edges with |rho| >= threshold attract in proportion to |rho|; all nodes repel. */
export function forceLayout(labels: string[], m: number[][], threshold: number, size = 100, iterations = 400) {
  const n = labels.length;
  const pos = labels.map((_, i) => ({ x: Math.cos((2 * Math.PI * i) / n) * 0.4, y: Math.sin((2 * Math.PI * i) / n) * 0.4 }));
  const edges: { i: number; j: number; rho: number }[] = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Math.abs(m[i][j]) >= threshold) edges.push({ i, j, rho: m[i][j] });
  for (let it = 0; it < iterations; it++) {
    const f = pos.map(() => ({ x: 0, y: 0 }));
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const dx = pos[i].x - pos[j].x, dy = pos[i].y - pos[j].y, d2 = dx * dx + dy * dy + 1e-4, d = Math.sqrt(d2), rep = 0.02 / d2;
      f[i].x += (dx / d) * rep; f[i].y += (dy / d) * rep; f[j].x -= (dx / d) * rep; f[j].y -= (dy / d) * rep;
    }
    edges.forEach(({ i, j, rho }) => {
      const dx = pos[j].x - pos[i].x, dy = pos[j].y - pos[i].y, d = Math.sqrt(dx * dx + dy * dy) + 1e-6, target = 0.5 * (1 - Math.abs(rho)) + 0.08, k = 0.08 * Math.abs(rho) * (d - target);
      f[i].x += (dx / d) * k; f[i].y += (dy / d) * k; f[j].x -= (dx / d) * k; f[j].y -= (dy / d) * k;
    });
    const cool = 1 - it / iterations;
    pos.forEach((p, i) => { p.x += Math.max(-0.05, Math.min(0.05, f[i].x)) * cool; p.y += Math.max(-0.05, Math.min(0.05, f[i].y)) * cool; p.x -= p.x * 0.01; p.y -= p.y * 0.01; });
  }
  const xs = pos.map((p) => p.x), ys = pos.map((p) => p.y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const sx = x1 - x0 || 1, sy = y1 - y0 || 1;
  return { nodes: pos.map((p, i) => ({ label: labels[i], x: 8 + ((p.x - x0) / sx) * (size - 16), y: 8 + ((p.y - y0) / sy) * (size - 16) })), edges };
}
