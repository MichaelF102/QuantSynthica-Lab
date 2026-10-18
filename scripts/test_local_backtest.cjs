#!/usr/bin/env node
/** Browser backtester risk features, mirroring backend/tests/test_risk_engine.py. Run: node scripts/test_local_backtest.cjs */
const ts = require("typescript");
const fs = require("fs"), path = require("path"), Module = require("module");
const ROOT = path.resolve(__dirname, "..");
const stub = path.join(ROOT, ".lb_test_api_stub.js");
fs.writeFileSync(stub, "module.exports={api:{}}");
process.on("exit", () => { try { fs.unlinkSync(stub); } catch {} });
const orig = Module._resolveFilename;
Module._resolveFilename = function (r, ...a) {
  if (r === "@/lib/api") return stub;
  if (r.startsWith("@/")) r = path.join(ROOT, r.slice(2));
  return orig.call(this, r, ...a);
};
require.extensions[".ts"] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, "utf8"), { compilerOptions: { module: "commonjs", target: "es2020", esModuleInterop: true } }).outputText, f);
const { runLocalBacktest } = require(path.join(ROOT, "lib/localBacktest.ts"));

let failed = 0;
const ok = (c, name, extra = "") => { if (!c) failed++; console.log(`${c ? "PASS" : "FAIL"}  ${name}${!c && extra ? "  -> " + extra : ""}`); };
const lin = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
const bars = (closes, spread = 1) => closes.map((c, i) => {
  const o = i === 0 ? c : closes[i - 1];
  const d = new Date(Date.UTC(2023, 0, 2 + i)).toISOString().slice(0, 10);
  return { date: d, open: o, high: Math.max(o, c) + spread, low: Math.min(o, c) - spread, close: c, volume: 1e9 };
});
const strat = (risk, entryThr = 0, exit = null) => ({
  id: "t", name: "t", asset: "X", universe: ["X"], timeframe: "1D", description: "", indicators: [],
  entry_rules: [{ id: "e", indicator_a: "close", operator: ">", indicator_b: null, threshold: entryThr, logical_operator: "AND" }],
  exit_rules: exit ? [exit] : [],
  risk: { stop_loss_pct: null, take_profit_pct: null, position_size_pct: 50, max_positions: 1, allow_short: false, ...risk },
  execution: { commission_pct: 0, slippage_pct: 0, spread_pct: 0, allow_fractional: true, initial_capital: 100000 },
});
const run = (s, closes, spread = 1) => runLocalBacktest(s, "2023-01-01", "2024-01-01", "SPY", { bars: bars(closes, spread), benchmarkBars: bars(closes, spread), synthetic: false });

const falling = lin(100, 80, 40);
let r = run(strat({}), falling);
ok(r.trades.length === 1 && r.trades[0].direction === "LONG" && r.trades[0].net_pnl < 0, "default is long-only and loses on a falling market");

r = run(strat({ direction: "short" }), falling);
ok(r.trades.length === 1 && r.trades[0].direction === "SHORT" && r.trades[0].net_pnl > 0, "short side profits when price falls");
ok(Math.abs(r.equity_curve.at(-1).portfolio_value - (100000 + r.trades[0].net_pnl)) < 1, "short equity equals cash plus realised P&L (no phantom collateral)");

r = run(strat({ direction: "short", stop_loss_pct: 5 }), lin(100, 130, 40));
ok(r.trades[0].direction === "SHORT" && r.trades[0].exit_reason === "STOP_LOSS" && r.trades[0].exit_price > r.trades[0].entry_price, "short stop loss sits above entry");

const flip = [...lin(100, 125, 20), ...lin(125, 95, 30)];
r = run(strat({ direction: "both" }, 110, { id: "x", indicator_a: "close", operator: "<", indicator_b: null, threshold: 110, logical_operator: "OR" }), flip);
ok(r.trades.map((t) => t.direction).join() === "SHORT,LONG,SHORT", "both mode flips short -> long -> short", r.trades.map((t) => t.direction).join());

r = run(strat({ trailing_stop_pct: 5 }), [...lin(100, 120, 20), ...lin(120, 100, 20)]);
ok(r.trades[0].exit_reason === "TRAILING_STOP" && r.trades[0].exit_price > 112, "trailing stop works without a fixed stop", JSON.stringify(r.trades[0]));

const flat = [...Array(30).fill(100), ...lin(100, 85, 10)];
const d = {};
for (const m of [1, 2]) { const t = run(strat({ stop_atr_mult: m, atr_period: 10 }), flat).trades[0]; d[m] = t.entry_price - t.exit_price; ok(t.exit_reason === "STOP_LOSS", `ATR stop x${m} triggers`, t.exit_reason); }
ok(d[1] > 1.5 && d[1] < 3 && d[2] > d[1] * 1.6, "ATR stop distance scales with the multiple", JSON.stringify(d));

let seed = 3; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const noisy = []; let px = 100; for (let i = 0; i < 120; i++) { px *= 1 + (rnd() - 0.5) * 0.1; noisy.push(px); }
const q0 = run(strat({ position_size_pct: 90 }), noisy).trades[0].quantity;
const q1 = run(strat({ position_size_pct: 90, target_volatility: 10 }), noisy).trades[0].quantity;
ok(q1 < q0 * 0.6, "volatility target shrinks the position in choppy markets", `${q1} vs ${q0}`);

console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
