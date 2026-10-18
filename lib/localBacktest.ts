/**
 * Deterministic client-side backtester used when the Python engine is unreachable,
 * and to build the sample runs shown on an empty registry.
 *
 * Honesty contract: when real bars cannot be fetched the series is generated from a seeded
 * PRNG. Such results are tagged `is_synthetic` / `is_sample` and get a visible badge in the UI;
 * they must never be presented as real market performance.
 */
import { BacktestResult, ConditionRule, EquityPoint, MarketBar, MonthlyReturnRecord, StrategyConfig, TradeRecord } from "@/types";
import { SEED_STOCK_PROFILES, SEED_STRATEGIES } from "@/lib/seedData";
import { alignBenchmark, isIndianTicker } from "@/lib/market";

// ---------- deterministic bars ----------
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Bar { date: string; open: number; high: number; low: number; close: number; volume: number }

export function syntheticBars(symbol: string, start: string, end: string): Bar[] {
  const rand = mulberry32(hashSeed(symbol.toUpperCase()));
  const base = SEED_STOCK_PROFILES[symbol.toUpperCase()]?.price ?? (isIndianTicker(symbol) ? 500 : 150);
  const bars: Bar[] = [];
  const d = new Date(start + "T00:00:00Z");
  const last = new Date(end + "T00:00:00Z");
  let price = base;
  while (d <= last) {
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) {
      const shock = (rand() + rand() + rand() - 1.5) * 0.02 + 0.0004;
      const open = price * (1 + (rand() - 0.5) * 0.004);
      const close = Math.max(1, price * (1 + shock));
      const high = Math.max(open, close) * (1 + rand() * 0.008);
      const low = Math.min(open, close) * (1 - rand() * 0.008);
      bars.push({ date: d.toISOString().slice(0, 10), open, high, low, close, volume: Math.round(1e6 + rand() * 5e6) });
      price = close;
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return bars;
}

// ---------- indicators ----------
type Series = number[];
const nan = Number.NaN;

const sma = (x: Series, n: number): Series =>
  x.map((_, i) => (i < n - 1 ? nan : x.slice(i - n + 1, i + 1).reduce((a, b) => a + b, 0) / n));

function ema(x: Series, n: number): Series {
  const k = 2 / (n + 1);
  const out: Series = [];
  x.forEach((v, i) => out.push(i === 0 ? v : v * k + out[i - 1] * (1 - k)));
  return out.map((v, i) => (i < n - 1 ? nan : v));
}

function rsi(x: Series, n: number): Series {
  const out: Series = x.map(() => nan);
  let ag = 0, al = 0;
  for (let i = 1; i < x.length; i++) {
    const ch = x[i] - x[i - 1];
    const g = Math.max(ch, 0), l = Math.max(-ch, 0);
    if (i <= n) {
      ag += g / n; al += l / n;
      if (i < n) continue;
    } else {
      ag = (ag * (n - 1) + g) / n; al = (al * (n - 1) + l) / n;
    }
    out[i] = al === 0 ? 100 : 100 - 100 / (1 + ag / al);
  }
  return out;
}

const stdev = (x: Series, n: number): Series =>
  x.map((_, i) => {
    if (i < n - 1) return nan;
    const w = x.slice(i - n + 1, i + 1);
    const m = w.reduce((a, b) => a + b, 0) / n;
    return Math.sqrt(w.reduce((a, b) => a + (b - m) ** 2, 0) / n);
  });

function trueRange(b: Bar[]): Series {
  return b.map((r, i) => (i === 0 ? r.high - r.low : Math.max(r.high - r.low, Math.abs(r.high - b[i - 1].close), Math.abs(r.low - b[i - 1].close))));
}

function wilder(x: Series, n: number): Series {
  const out: Series = x.map(() => nan);
  let acc = 0;
  for (let i = 0; i < x.length; i++) {
    if (i < n) { acc += x[i]; if (i === n - 1) out[i] = acc / n; }
    else out[i] = (out[i - 1] * (n - 1) + x[i]) / n;
  }
  return out;
}

function adx(b: Bar[], n: number): Series {
  const pdm: Series = [0], mdm: Series = [0];
  for (let i = 1; i < b.length; i++) {
    const up = b[i].high - b[i - 1].high, dn = b[i - 1].low - b[i].low;
    pdm.push(up > dn && up > 0 ? up : 0); mdm.push(dn > up && dn > 0 ? dn : 0);
  }
  const atr = wilder(trueRange(b), n);
  const pdi = wilder(pdm, n).map((v, i) => (100 * v) / atr[i]);
  const mdi = wilder(mdm, n).map((v, i) => (100 * v) / atr[i]);
  const dx = pdi.map((p, i) => (100 * Math.abs(p - mdi[i])) / (p + mdi[i]));
  const clean = dx.map((v) => (Number.isFinite(v) ? v : 0));
  return wilder(clean, n).map((v, i) => (i < 2 * n - 1 ? nan : v));
}

const rolling = (x: Series, n: number, fn: (w: number[]) => number, shift = 0): Series =>
  x.map((_, i) => (i - shift < n - 1 || i - shift < 0 ? nan : fn(x.slice(i - shift - n + 1, i - shift + 1))));

function computeIndicator(name: string, p: Record<string, any>, b: Bar[], unsupported: Set<string>): Series {
  const close = b.map((r) => r.close);
  const n = Number(p.period ?? p.ema_period ?? 14);
  switch (name.toUpperCase()) {
    case "SMA": return sma(close, n);
    case "EMA": return ema(close, n);
    case "RSI": return rsi(close, n);
    case "BB_MIDDLE": return sma(close, n);
    case "BB_UPPER": { const m = sma(close, n), s = stdev(close, n); return m.map((v, i) => v + Number(p.std_dev ?? 2) * s[i]); }
    case "BB_LOWER": { const m = sma(close, n), s = stdev(close, n); return m.map((v, i) => v - Number(p.std_dev ?? 2) * s[i]); }
    case "ATR": return wilder(trueRange(b), n);
    case "ADX": return adx(b, n);
    case "ROC": return close.map((v, i) => (i < n ? nan : ((v - close[i - n]) / close[i - n]) * 100));
    case "MACD": { const f = ema(close, Number(p.fast_period ?? 12)), s = ema(close, Number(p.slow_period ?? 26)); return f.map((v, i) => v - s[i]); }
    case "MACD_SIGNAL": case "MACD_HIST": {
      const f = ema(close, Number(p.fast_period ?? 12)), s = ema(close, Number(p.slow_period ?? 26));
      const macd = f.map((v, i) => v - s[i]);
      const sig = ema(macd.map((v) => (Number.isFinite(v) ? v : 0)), Number(p.signal_period ?? 9));
      return name.toUpperCase() === "MACD_SIGNAL" ? sig : macd.map((v, i) => v - sig[i]);
    }
    // Channels use the prior n bars so a breakout of today's close is detectable.
    case "DONCHIAN_HIGH": return rolling(b.map((r) => r.high), n, (w) => Math.max(...w), 1);
    case "DONCHIAN_LOW": return rolling(b.map((r) => r.low), n, (w) => Math.min(...w), 1);
    default:
      unsupported.add(name);
      return close.map(() => nan);
  }
}

// ---------- rule evaluation ----------
function evalRules(rules: ConditionRule[], i: number, get: (id: string) => Series | undefined): boolean {
  if (!rules.length) return false;
  let result: boolean | null = null;
  for (const r of rules) {
    const a = get(r.indicator_a ?? r.left_indicator ?? "");
    const bId = r.indicator_b ?? r.right_indicator;
    const b = bId ? get(bId) : undefined;
    let ok = false;
    if (a && i > 0) {
      const av = a[i], ap = a[i - 1];
      const bv = b ? b[i] : r.threshold ?? nan;
      const bp = b ? b[i - 1] : r.threshold ?? nan;
      if ([av, bv].every(Number.isFinite)) {
        switch (r.operator) {
          case ">": ok = av > bv; break;
          case "<": ok = av < bv; break;
          case ">=": ok = av >= bv; break;
          case "<=": ok = av <= bv; break;
          case "==": ok = av === bv; break;
          case "!=": ok = av !== bv; break;
          case "CROSS_ABOVE": ok = Number.isFinite(ap) && Number.isFinite(bp) && ap <= bp && av > bv; break;
          case "CROSS_BELOW": ok = Number.isFinite(ap) && Number.isFinite(bp) && ap >= bp && av < bv; break;
        }
      }
    }
    result = result === null ? ok : r.logical_operator === "OR" ? result || ok : result && ok;
  }
  return !!result;
}

// ---------- engine ----------
const round = (v: number, d = 2) => (Number.isFinite(v) ? Number(v.toFixed(d)) : 0);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface LocalRunOptions {
  id?: string;
  bars?: Bar[];
  benchmarkBars?: Bar[];
  synthetic: boolean;
  sample?: boolean;
  note?: string;
}

export function runLocalBacktest(
  strategy: StrategyConfig,
  start: string,
  end: string,
  benchmark: string,
  opts: LocalRunOptions
): BacktestResult {
  const ticker = strategy.asset.toUpperCase();
  const bars = opts.bars?.length ? opts.bars : syntheticBars(ticker, start, end);
  const benchBars = opts.benchmarkBars?.length ? opts.benchmarkBars : syntheticBars(benchmark, start, end);
  const unsupported = new Set<string>();
  const cache = new Map<string, Series>();
  const price = (k: keyof Bar) => bars.map((r) => r[k] as number);
  for (const k of ["open", "high", "low", "close", "volume"] as const) cache.set(k, price(k));
  for (const ind of strategy.indicators) cache.set(ind.id, computeIndicator(ind.name, ind.params, bars, unsupported));
  const get = (id: string) => cache.get(id);

  const ex = strategy.execution;
  const comm = ex.commission_pct / 100;
  const cost = (ex.slippage_pct + ex.spread_pct / 2) / 100; // slippage and half the spread are paid in the fill price
  const rk = strategy.risk;
  const sizePct = Math.min(100, rk.position_size_pct ?? 100) / 100;
  const initial = ex.initial_capital;
  let mode = rk.direction ?? "long";
  if (mode === "long" && rk.allow_short) mode = "both"; // saved before `direction` existed

  // ATR (Wilder) and 20-bar realised volatility, read at the signal bar (i-1) so nothing looks ahead
  const atrN = Math.max(1, rk.atr_period ?? 14);
  const atrArr = wilder(trueRange(bars), atrN);
  const closesArr = bars.map((r) => r.close);
  const rvol: Series = closesArr.map((_, i) => {
    if (i < 20) return nan;
    const r = [] as number[];
    for (let k = i - 19; k <= i; k++) r.push(closesArr[k] / closesArr[k - 1] - 1);
    const m = r.reduce((a, b) => a + b, 0) / r.length;
    return Math.sqrt(r.reduce((a, b) => a + (b - m) ** 2, 0) / (r.length - 1)) * Math.sqrt(252);
  });
  const atrAt = (i: number) => (i > 0 && Number.isFinite(atrArr[i - 1]) && atrArr[i - 1] > 0 ? atrArr[i - 1] : null);
  const sizeFraction = (i: number) => {
    let f = sizePct;
    if (rk.target_volatility) {
      const v = i > 0 ? rvol[i - 1] : nan;
      if (!Number.isFinite(v) || v <= 0) return 0; // no estimate yet: do not size blindly
      f *= Math.min(1, rk.target_volatility / 100 / v);
    }
    return f;
  };

  type Pos = { side: 1 | -1; qty: number; entryFee: number; entry: number; entryIdx: number; entryDate: string; mae: number; mfe: number; stop: number | null; tp: number | null; trailRef: number };
  let cash = initial;
  const st: { pos: Pos | null } = { pos: null };
  const trades: TradeRecord[] = [];
  const curve: EquityPoint[] = [];
  let peak = initial;
  let pendingEntry = false, pendingExit = false;
  const closeTrade = (i: number, px: number, reason: string) => {
    if (!st.pos) return;
    const p = st.pos;
    const fillPx = p.side === 1 ? px * (1 - cost) : px * (1 + cost);
    const gross = (fillPx - p.entry) * p.qty * p.side;
    const exitFee = fillPx * p.qty * comm;
    const fees = p.entryFee + exitFee;
    cash += (p.side === 1 ? p.qty * fillPx : gross) - exitFee;
    trades.push({
      id: `tr_${trades.length + 1}`, ticker, direction: p.side === 1 ? "LONG" : "SHORT",
      entry_date: p.entryDate, exit_date: bars[i].date, entry_price: round(p.entry), exit_price: round(fillPx),
      quantity: round(p.qty, 4), gross_pnl: round(gross), fees: round(fees), net_pnl: round(gross - fees),
      return_pct: round((gross / (p.entry * p.qty)) * 100),
      holding_period_bars: i - p.entryIdx, exit_reason: reason, mae: round(p.mae), mfe: round(p.mfe),
    });
    st.pos = null;
  };
  const openPos = (i: number, side: 1 | -1, b: Bar) => {
    const alloc = Math.min(sizeFraction(i) * cash, cash * 0.98);
    const fillPx = side === 1 ? b.open * (1 + cost) : b.open * (1 - cost);
    const qty = alloc / fillPx;
    if (!(qty > 0) || alloc < 1) return;
    const atr = atrAt(i);
    if ((rk.stop_atr_mult || rk.take_profit_atr_mult) && !atr) return; // ATR stop requested but ATR undefined: skip
    let stop: number | null = null, tp: number | null = null;
    if (rk.stop_atr_mult && atr) stop = fillPx - side * rk.stop_atr_mult * atr;
    else if (rk.stop_loss_pct != null && rk.stop_loss_pct > 0) stop = fillPx * (1 - (side * rk.stop_loss_pct) / 100);
    if (rk.take_profit_atr_mult && atr) tp = fillPx + side * rk.take_profit_atr_mult * atr;
    else if (rk.take_profit_pct != null && rk.take_profit_pct > 0) tp = fillPx * (1 + (side * rk.take_profit_pct) / 100);
    const entryFee = qty * fillPx * comm;
    cash -= (side === 1 ? qty * fillPx : 0) + entryFee;
    st.pos = { side, qty, entryFee, entry: fillPx, entryIdx: i, entryDate: b.date, mae: 0, mfe: 0, stop, tp, trailRef: side === 1 ? b.high : b.low };
  };

  const benchStart = benchBars[0]?.close ?? 1;
  const benchByDate = new Map(benchBars.map((r) => [r.date, r.close]));
  let lastBench = benchStart, prevValue = initial, prevBench = benchStart;

  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    // 1. fills from the previous bar's signal happen at this bar's open (no lookahead)
    const closeSignal = st.pos ? (mode !== "both" || st.pos.side === 1 ? pendingExit : pendingEntry) : false;
    if (closeSignal && st.pos) closeTrade(i, b.open, "SIGNAL");
    if (!st.pos) {
      const side: 1 | -1 | 0 = mode === "long" ? (pendingEntry ? 1 : 0) : mode === "short" ? (pendingEntry ? -1 : 0) : pendingEntry ? 1 : pendingExit ? -1 : 0;
      if (side !== 0) openPos(i, side, b);
    }
    pendingEntry = pendingExit = false;
    // 2. intra-bar stop / target / trailing stop (the trail reference excludes the current bar)
    if (st.pos && i > st.pos.entryIdx) {
      const p: Pos = st.pos;
      p.mae = Math.min(p.mae, p.side === 1 ? ((b.low - p.entry) / p.entry) * 100 : ((p.entry - b.high) / p.entry) * 100);
      p.mfe = Math.max(p.mfe, p.side === 1 ? ((b.high - p.entry) / p.entry) * 100 : ((p.entry - b.low) / p.entry) * 100);
      let stop = p.stop, reason = "STOP_LOSS";
      const tr = rk.trailing_stop_pct;
      if (tr && tr > 0) {
        const trail = p.side === 1 ? p.trailRef * (1 - tr / 100) : p.trailRef * (1 + tr / 100);
        if (stop === null || (p.side === 1 ? trail > stop : trail < stop)) { stop = trail; reason = "TRAILING_STOP"; }
      }
      if (p.side === 1) {
        if (stop !== null && b.low <= stop) closeTrade(i, Math.min(b.open, stop), reason);
        else if (p.tp !== null && b.high >= p.tp) closeTrade(i, Math.max(b.open, p.tp), "TAKE_PROFIT");
      } else {
        if (stop !== null && b.high >= stop) closeTrade(i, Math.max(b.open, stop), reason);
        else if (p.tp !== null && b.low <= p.tp) closeTrade(i, Math.min(b.open, p.tp), "TAKE_PROFIT");
      }
      if (st.pos) (st.pos as Pos).trailRef = p.side === 1 ? Math.max(p.trailRef, b.high) : Math.min(p.trailRef, b.low);
    }
    // 3. signals at close of bar i -> executed at i+1 open
    if (i < bars.length - 1) {
      const eHit = evalRules(strategy.entry_rules, i, get), xHit = evalRules(strategy.exit_rules, i, get);
      if (mode === "both") {
        const cur: Pos | null = st.pos;
        if (!cur ? eHit || xHit : cur.side === 1 ? xHit : eHit) { pendingEntry = eHit; pendingExit = xHit && !(!cur && eHit); }
      } else if (!st.pos) { if (eHit) pendingEntry = true; }
      else if (xHit) pendingExit = true;
    }
    if (i === bars.length - 1 && st.pos) closeTrade(i, b.close, "END_OF_DATA");

    const cur: Pos | null = st.pos;
    const value = cash + (cur ? (cur.side === 1 ? cur.qty * b.close : cur.qty * (cur.entry - b.close)) : 0);
    peak = Math.max(peak, value);
    lastBench = benchByDate.get(b.date) ?? lastBench;
    curve.push({
      date: b.date, portfolio_value: round(value), cash: round(cash),
      drawdown: round(((peak - value) / peak) * 100),
      benchmark_value: round((lastBench / benchStart) * initial),
      returns: round((value / prevValue - 1) * 100, 4), benchmark_returns: round((lastBench / prevBench - 1) * 100, 4),
    });
    prevValue = value; prevBench = lastBench;
  }

  // ---------- metrics ----------
  const rets = curve.map((p) => p.returns / 100);
  const brets = curve.map((p) => p.benchmark_returns / 100);
  const n = rets.length || 1;
  const mean = rets.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(rets.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, n - 1));
  const down = Math.sqrt(rets.reduce((a, b) => a + Math.min(b, 0) ** 2, 0) / n);
  const finalEq = curve[curve.length - 1]?.portfolio_value ?? initial;
  const totalRet = (finalEq / initial - 1) * 100;
  const years = Math.max(n / 252, 1 / 252);
  const cagr = (Math.pow(finalEq / initial, 1 / years) - 1) * 100;
  const maxDD = Math.max(0, ...curve.map((p) => p.drawdown));
  let ddDur = 0, curDur = 0;
  curve.forEach((p) => { curDur = p.drawdown > 0 ? curDur + 1 : 0; ddDur = Math.max(ddDur, curDur); });
  const wins = trades.filter((t) => t.net_pnl > 0), losses = trades.filter((t) => t.net_pnl <= 0);
  const sumW = wins.reduce((a, t) => a + t.net_pnl, 0), sumL = Math.abs(losses.reduce((a, t) => a + t.net_pnl, 0));
  const bmean = brets.reduce((a, b) => a + b, 0) / n;
  const cov = rets.reduce((a, r, i) => a + (r - mean) * (brets[i] - bmean), 0) / Math.max(1, n - 1);
  const bvar = brets.reduce((a, r) => a + (r - bmean) ** 2, 0) / Math.max(1, n - 1);
  const beta = bvar > 1e-12 ? cov / bvar : 0;
  const te = Math.sqrt(rets.reduce((a, r, i) => a + (r - brets[i] - (mean - bmean)) ** 2, 0) / Math.max(1, n - 1)) * Math.sqrt(252);
  const alpha = (mean - beta * bmean) * 252 * 100;
  const totalFees = trades.reduce((a, t) => a + t.fees, 0);

  const metrics = {
    total_return: round(totalRet), cagr: round(cagr), annualized_return: round(mean * 252 * 100),
    annualized_volatility: round(sd * Math.sqrt(252) * 100),
    sharpe_ratio: round(sd > 0 ? (mean / sd) * Math.sqrt(252) : 0),
    sortino_ratio: round(down > 0 ? (mean / down) * Math.sqrt(252) : 0),
    calmar_ratio: round(maxDD > 0 ? cagr / maxDD : 0),
    max_drawdown: round(maxDD), max_drawdown_duration: ddDur,
    win_rate: round(trades.length ? (wins.length / trades.length) * 100 : 0, 1),
    loss_rate: round(trades.length ? (losses.length / trades.length) * 100 : 0, 1),
    profit_factor: round(sumL > 0 ? sumW / sumL : sumW > 0 ? 99 : 0),
    expectancy: round(trades.length ? trades.reduce((a, t) => a + t.return_pct, 0) / trades.length : 0),
    num_trades: trades.length, winning_trades: wins.length, losing_trades: losses.length,
    avg_trade_return: round(trades.length ? trades.reduce((a, t) => a + t.return_pct, 0) / trades.length : 0),
    avg_win: round(wins.length ? wins.reduce((a, t) => a + t.return_pct, 0) / wins.length : 0),
    avg_loss: round(losses.length ? losses.reduce((a, t) => a + t.return_pct, 0) / losses.length : 0),
    avg_holding_period: round(trades.length ? trades.reduce((a, t) => a + t.holding_period_bars, 0) / trades.length : 0, 1),
    turnover: round(trades.reduce((a, t) => a + t.entry_price * t.quantity, 0) / initial),
    total_fees: round(totalFees), gross_pnl: round(trades.reduce((a, t) => a + t.gross_pnl, 0)), net_pnl: round(finalEq - initial),
    final_equity: round(finalEq), total_trades: trades.length,
    best_trade: round(Math.max(0, ...trades.map((t) => t.return_pct))), worst_trade: round(Math.min(0, ...trades.map((t) => t.return_pct))),
    alpha: round(alpha), beta: round(beta), information_ratio: round(te > 0 ? ((mean - bmean) * 252) / te : 0),
    tracking_error: round(te * 100),
  } as BacktestResult["metrics"];

  const sorted = [...rets].sort((a, b) => a - b);
  const q = (p: number) => sorted[Math.max(0, Math.floor(p * sorted.length))] ?? 0;
  const tail95 = sorted.filter((r) => r <= q(0.05)), tail99 = sorted.filter((r) => r <= q(0.01));
  const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const bins = 21, lo = sorted[0] ?? 0, hi = sorted[sorted.length - 1] ?? 0, step = (hi - lo) / bins || 1e-6;
  const dist = Array.from({ length: bins }, (_, k) => {
    const x = lo + (k + 0.5) * step;
    const f = rets.filter((r) => r >= lo + k * step && r < lo + (k + 1) * step + (k === bins - 1 ? 1e-12 : 0)).length / n;
    const nf = sd > 0 ? (step / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(-((x - mean) ** 2) / (2 * sd * sd)) : 0;
    return { return_pct: round(x * 100, 3), frequency: round(f, 4), normal_fit: round(nf, 4) };
  });
  const risk = {
    var_95: round(Math.max(0, -q(0.05) * 100)), var_99: round(Math.max(0, -q(0.01) * 100)),
    cvar_95: round(Math.max(0, -avg(tail95) * 100)), cvar_99: round(Math.max(0, -avg(tail99) * 100)),
    downside_deviation: round(down * Math.sqrt(252) * 100), return_distribution: dist,
  };

  const byYM = new Map<number, Record<string, number>>();
  const lastOfMonth = new Map<string, number>();
  curve.forEach((p) => lastOfMonth.set(p.date.slice(0, 7), p.portfolio_value));
  let prevEq = initial;
  [...lastOfMonth.entries()].forEach(([ym, v]) => {
    const [y, m] = ym.split("-").map(Number);
    const row = byYM.get(y) ?? {};
    row[MONTHS[m - 1]] = round((v / prevEq - 1) * 100);
    byYM.set(y, row); prevEq = v;
  });
  const monthly: MonthlyReturnRecord[] = [...byYM.entries()]
    .map(([year, row]) => ({ year, ...row, YTD: round((Object.values(row).reduce((a, r) => a * (1 + r / 100), 1) - 1) * 100) } as MonthlyReturnRecord))
    .sort((a, b) => b.year - a.year);

  const logs = [
    opts.synthetic
      ? `SIMULATED DATA: ${opts.note ?? "price series generated locally (deterministic seed); not real market performance"}`
      : "Computed in-browser from real price bars",
    "Signals at bar close, fills at next open; costs = commission + slippage + spread per side",
    ...(unsupported.size ? [`Unsupported indicator(s) treated as no-signal: ${[...unsupported].join(", ")}`] : []),
  ];

  return {
    id: opts.id ?? `bt_local_${Date.now().toString(36)}`,
    strategy_id: strategy.id, strategy_name: strategy.name, ticker, asset: ticker, benchmark,
    start_date: start, end_date: end, status: "COMPLETED", metrics, risk,
    equity_curve: curve, trades, monthly_returns: monthly, strategy_config: strategy, logs,
    created_at: new Date().toISOString(),
    is_synthetic: opts.synthetic, is_sample: !!opts.sample,
  };
}

// ---------- sample runs for an empty registry ----------
const SAMPLES: { id: string; strategy: string; ticker: string }[] = [
  { id: "sample_dual_ma_aapl", strategy: "tpl_sma_crossover", ticker: "AAPL" },
  { id: "sample_bollinger_genuspower", strategy: "tpl_bollinger_breakout", ticker: "GENUSPOWER" },
  { id: "sample_rsi_reversion_spy", strategy: "tpl_rsi_reversion", ticker: "SPY" },
  { id: "sample_india_momentum_reliance", strategy: "tpl_india_momentum_alpha", ticker: "RELIANCE" },
];

let sampleCache: BacktestResult[] | null = null;
export function buildSampleBacktests(): BacktestResult[] {
  if (sampleCache) return sampleCache;
  sampleCache = SAMPLES.flatMap((s) => {
    const base = SEED_STRATEGIES.find((x) => x.id === s.strategy);
    if (!base) return [];
    const india = isIndianTicker(s.ticker);
    const strat: StrategyConfig = {
      ...base, asset: s.ticker, universe: [s.ticker],
      execution: { ...base.execution, initial_capital: india ? 1000000 : 100000 },
    };
    return [runLocalBacktest(strat, "2021-01-01", "2024-01-01", alignBenchmark(s.ticker, null), {
      id: s.id, synthetic: true, sample: true,
      note: "illustrative sample run on seeded price data; run your own backtest for real results",
    })];
  });
  return sampleCache;
}
