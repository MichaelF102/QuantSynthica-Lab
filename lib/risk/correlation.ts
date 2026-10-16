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
