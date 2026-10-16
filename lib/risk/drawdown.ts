/** Drawdown episode detection and statistics. Percentages are positive depths (18.2 = -18.2%). */
import { Pt } from "@/lib/analyticsCalc";
import { mean, quantile } from "./stats";

export interface Episode {
  peakDate: string; peakValue: number; troughDate: string; troughValue: number; depth: number;
  recoveryDate: string | null;
  /** Calendar days from peak to recovery (or to the last observation if still underwater). */
  durationDays: number;
  /** Calendar days from trough to recovery; null while still underwater. */
  recoveryDays: number | null;
}

const days = (a: string, b: string) => Math.round((new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86400000);

export function findEpisodes(pts: { date: string; value: number }[]): Episode[] {
  const out: Episode[] = [];
  let peakI = 0, cur: { peakI: number; troughI: number } | null = null;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].value >= pts[peakI].value) {
      if (cur) {
        out.push(build(pts, cur.peakI, cur.troughI, i));
        cur = null;
      }
      peakI = i;
    } else if (!cur) cur = { peakI, troughI: i };
    else if (pts[i].value < pts[cur.troughI].value) cur.troughI = i;
  }
  if (cur) out.push(build(pts, cur.peakI, cur.troughI, null));
  return out;
}

function build(pts: { date: string; value: number }[], p: number, t: number, rec: number | null): Episode {
  const last = pts[pts.length - 1].date;
  return {
    peakDate: pts[p].date, peakValue: pts[p].value, troughDate: pts[t].date, troughValue: pts[t].value,
    depth: ((pts[p].value - pts[t].value) / pts[p].value) * 100,
    recoveryDate: rec === null ? null : pts[rec].date,
    durationDays: days(pts[p].date, rec === null ? last : pts[rec].date),
    recoveryDays: rec === null ? null : days(pts[t].date, pts[rec].date),
  };
}

export function underwater(pts: { value: number }[]): number[] {
  let pk = -Infinity;
  return pts.map((p) => { pk = Math.max(pk, p.value); return ((pk - p.value) / pk) * 100; });
}

export function runningMax(pts: { value: number }[]): number[] {
  let pk = -Infinity;
  return pts.map((p) => (pk = Math.max(pk, p.value)));
}

export function drawdownStats(pts: Pt[], cagr: number | null) {
  const dd = underwater(pts);
  const eps = findEpisodes(pts);
  const under = dd.filter((d) => d > 0);
  const maxEp = eps.reduce<Episode | null>((m, e) => (!m || e.depth > m.depth ? e : m), null);
  const longest = eps.reduce<Episode | null>((m, e) => (!m || e.durationDays > m.durationDays ? e : m), null);
  const rec = eps.filter((e) => e.recoveryDays !== null).map((e) => e.recoveryDays as number);
  const sortedUnder = [...under].sort((a, b) => a - b);
  const maxDD = maxEp?.depth ?? 0;
  return {
    episodes: eps, dd, maxEp, longest,
    maxDD, avgDD: under.length ? mean(under) : 0, medianDD: under.length ? quantile(sortedUnder, 0.5) : 0, currentDD: dd[dd.length - 1] ?? 0,
    currentSince: (() => { const l = eps[eps.length - 1]; return l && l.recoveryDate === null ? l.peakDate : null; })(),
    avgDuration: eps.length ? mean(eps.map((e) => e.durationDays)) : 0,
    avgRecovery: rec.length ? mean(rec) : null, maxRecovery: rec.length ? Math.max(...rec) : null,
    ulcer: Math.sqrt(mean(dd.map((d) => d * d))), pain: mean(dd),
    calmar: cagr !== null && maxDD > 0 ? cagr / maxDD : null, underwaterDays: under.length, totalDays: dd.length,
    top: [...eps].sort((a, b) => b.depth - a.depth).slice(0, 5),
  };
}

export const DURATION_BUCKETS = [
  { label: "1–30", min: 0, max: 30 }, { label: "31–90", min: 31, max: 90 }, { label: "91–180", min: 91, max: 180 },
  { label: "181–365", min: 181, max: 365 }, { label: ">365", min: 366, max: Infinity },
];

export function durationHistogram(eps: Episode[]) {
  let cum = 0;
  return DURATION_BUCKETS.map((b) => {
    const count = eps.filter((e) => e.durationDays >= b.min && e.durationDays <= b.max).length;
    cum += count;
    return { bucket: b.label, count, cumPct: eps.length ? (cum / eps.length) * 100 : 0 };
  });
}

/** Rolling maximum drawdown over the last `win` observations. */
export function rollingMaxDD(pts: { date: string; value: number }[], win: number) {
  const out: { date: string; dd: number }[] = [];
  for (let i = win - 1; i < pts.length; i++) {
    let pk = -Infinity, m = 0;
    for (let k = i - win + 1; k <= i; k++) { pk = Math.max(pk, pts[k].value); m = Math.max(m, ((pk - pts[k].value) / pk) * 100); }
    out.push({ date: pts[i].date, dd: -m });
  }
  return out;
}
