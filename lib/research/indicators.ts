/** Technical indicators computed client-side from OHLCV bars. Arrays align with the input; warm-up values are null. */
export interface Ohlcv { date: string; open: number; high: number; low: number; close: number; volume: number }
type S = (number | null)[];

export function sma(x: number[], n: number): S {
  const out: S = [];
  let sum = 0;
  x.forEach((v, i) => { sum += v; if (i >= n) sum -= x[i - n]; out.push(i >= n - 1 ? sum / n : null); });
  return out;
}

export function ema(x: number[], n: number): S {
  const k = 2 / (n + 1);
  const out: S = [];
  let prev: number | null = null;
  x.forEach((v, i) => {
    if (i < n - 1) { out.push(null); return; }
    prev = prev === null ? x.slice(0, n).reduce((a, b) => a + b, 0) / n : v * k + prev * (1 - k);
    out.push(prev);
  });
  return out;
}

export function bollinger(x: number[], n = 20, k = 2) {
  const mid = sma(x, n);
  const upper: S = [], lower: S = [];
  x.forEach((_, i) => {
    const m = mid[i];
    if (m === null) { upper.push(null); lower.push(null); return; }
    const sd = Math.sqrt(x.slice(i - n + 1, i + 1).reduce((s, v) => s + (v - m) ** 2, 0) / n);
    upper.push(m + k * sd); lower.push(m - k * sd);
  });
  return { mid, upper, lower };
}

/** Wilder's RSI. */
export function rsi(x: number[], n = 14): S {
  const out: S = x.map(() => null);
  let ag = 0, al = 0;
  for (let i = 1; i < x.length; i++) {
    const ch = x[i] - x[i - 1], g = Math.max(ch, 0), l = Math.max(-ch, 0);
    if (i <= n) { ag += g / n; al += l / n; if (i < n) continue; } else { ag = (ag * (n - 1) + g) / n; al = (al * (n - 1) + l) / n; }
    out[i] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  }
  return out;
}

/** MACD with EMA seeded from the first value (matches pandas ewm(adjust=False)). */
function emaSeeded(x: number[], n: number): number[] {
  const k = 2 / (n + 1);
  const out: number[] = [];
  x.forEach((v, i) => out.push(i === 0 ? v : v * k + out[i - 1] * (1 - k)));
  return out;
}
export function macd(x: number[], fast = 12, slow = 26, sig = 9) {
  const f = emaSeeded(x, fast), s = emaSeeded(x, slow);
  const line = f.map((v, i) => v - s[i]);
  const signal = emaSeeded(line, sig);
  return { line: line.map((v, i) => (i >= slow - 1 ? v : null)) as S, signal: signal.map((v, i) => (i >= slow - 1 ? v : null)) as S, hist: line.map((v, i) => (i >= slow - 1 ? v - signal[i] : null)) as S };
}

export function stochastic(b: Ohlcv[], n = 14, d = 3) {
  const k: S = b.map((_, i) => {
    if (i < n - 1) return null;
    const w = b.slice(i - n + 1, i + 1);
    const hi = Math.max(...w.map((r) => r.high)), lo = Math.min(...w.map((r) => r.low));
    return hi === lo ? 50 : ((b[i].close - lo) / (hi - lo)) * 100;
  });
  const dd: S = k.map((_, i) => {
    const w = k.slice(i - d + 1, i + 1);
    return i >= d - 1 && w.every((v) => v !== null) ? (w as number[]).reduce((a, c) => a + c, 0) / d : null;
  });
  return { k, d: dd };
}

/** Wilder's ATR. */
export function atr(b: Ohlcv[], n = 14): S {
  const tr = b.map((r, i) => (i === 0 ? r.high - r.low : Math.max(r.high - r.low, Math.abs(r.high - b[i - 1].close), Math.abs(r.low - b[i - 1].close))));
  const out: S = b.map(() => null);
  let prev = 0;
  tr.forEach((v, i) => {
    if (i < n - 1) { prev += v; return; }
    if (i === n - 1) { prev = (prev + v) / n; out[i] = prev; return; }
    prev = (prev * (n - 1) + v) / n; out[i] = prev;
  });
  return out;
}

export const last = <T,>(a: (T | null)[]): T | null => { for (let i = a.length - 1; i >= 0; i--) if (a[i] !== null) return a[i]; return null; };
