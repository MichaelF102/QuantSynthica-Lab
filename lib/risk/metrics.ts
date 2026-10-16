import { PortfolioResult } from "@/lib/portfolio/engine";
import { seriesStats } from "@/lib/analyticsCalc";
import { mean, std } from "./stats";
import { varEs, VarMethod } from "./var";

export interface Headline {
  var: number; es: number; vol: number; maxDD: number; sharpe: number; sortino: number; calmar: number; beta: number | null;
  bench: { var: number; es: number; vol: number; maxDD: number; sharpe: number; sortino: number; calmar: number };
}

const sharpeOf = (cagr: number, vol: number) => (vol > 0 ? cagr / vol : 0);

export function headline(r: PortfolioResult, conf: number, horizon: number, method: VarMethod = "Historical"): Headline | null {
  const s = r.stats ?? seriesStats(r.pts);
  if (!s) return null;
  const p = varEs(r.returns, conf, method, horizon), b = varEs(r.benchReturns, conf, method, horizon);
  const benchCalmar = s.benchMaxDD > 0 ? s.benchCagr / s.benchMaxDD : 0;
  return {
    var: p.var, es: p.es, vol: s.vol, maxDD: s.maxDD, sharpe: sharpeOf(s.cagr, s.vol), sortino: s.sortino, calmar: s.calmar, beta: s.beta,
    bench: { var: b.var, es: b.es, vol: s.benchVol, maxDD: s.benchMaxDD, sharpe: sharpeOf(s.benchCagr, s.benchVol), sortino: NaN, calmar: benchCalmar },
  };
}

/** Rolling series for KPI sparklines, thinned to at most `max` points. */
export function kpiSeries(r: PortfolioResult, conf: number, win = 60, max = 60) {
  const ret = r.returns, br = r.benchReturns;
  const idx: number[] = [];
  for (let i = win; i <= ret.length; i++) idx.push(i);
  const step = Math.max(1, Math.ceil(idx.length / max));
  const pick = idx.filter((_, k) => k % step === 0);
  const out = { var: [] as number[], es: [] as number[], vol: [] as number[], sharpe: [] as number[], beta: [] as number[] };
  pick.forEach((i) => {
    const w = ret.slice(i - win, i), bw = br.slice(i - win, i);
    const e = varEs(w, conf, "Historical", 1);
    out.var.push(-e.var * 100); out.es.push(-e.es * 100);
    out.vol.push(std(w) * Math.sqrt(252) * 100);
    out.sharpe.push(std(w) > 0 ? (mean(w) / std(w)) * Math.sqrt(252) : 0);
    const mb = mean(bw), mw = mean(w);
    const vb = bw.reduce((s, x) => s + (x - mb) ** 2, 0);
    out.beta.push(vb > 0 ? w.reduce((s, x, k) => s + (x - mw) * (bw[k] - mb), 0) / vb : 0);
  });
  return { ...out, dd: r.pts.filter((_, k) => k % Math.max(1, Math.ceil(r.pts.length / max)) === 0).map((p) => -p.dd) };
}
