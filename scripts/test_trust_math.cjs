#!/usr/bin/env node
/** Block bootstrap and exposure maths, checked against closed forms. Run: node scripts/test_trust_math.cjs */
const ts = require("typescript");
const fs = require("fs"), path = require("path"), Module = require("module");
const ROOT = path.resolve(__dirname, "..");
const orig = Module._resolveFilename;
Module._resolveFilename = function (r, ...a) { if (r.startsWith("@/")) r = path.join(ROOT, r.slice(2)); return orig.call(this, r, ...a); };
require.extensions[".ts"] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, "utf8"), { compilerOptions: { module: "commonjs", target: "es2020", esModuleInterop: true } }).outputText, f);
const { buildRunReport, buildRunJson, esc } = require(path.join(ROOT, "lib/runExport.ts"));
const { describeChanges } = require(path.join(ROOT, "lib/strategyDiff.ts"));
const { blockBootstrap, histogram } = require(path.join(ROOT, "lib/monteCarlo.ts"));
const { exposureSeries, drawdownEpisodes, rollingVol, tradeConcentration, bySide, byHolding, regimeBreakdown, annualTable } = require(path.join(ROOT, "lib/analyticsCalc.ts"));

let failed = 0;
const ok = (c, name, extra = "") => { if (!c) failed++; console.log(`${c ? "PASS" : "FAIL"}  ${name}${!c && extra ? "  -> " + extra : ""}`); };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

// constant daily return: every path is identical, no drawdown
const r = 0.001, n = 100;
let mc = blockBootstrap(Array(n).fill(r), { iterations: 500, block: 10, seed: 1 });
const want = ((1 + r) ** n - 1) * 100;
ok(near(mc.p5, want, 1e-6) && near(mc.p95, want, 1e-6) && near(mc.mean, want, 1e-6), "constant returns: every path ends at (1+r)^n - 1", `${mc.p5} ${mc.mean} want ${want}`);
ok(mc.ddP95 === 0 && mc.probLoss === 0 && mc.probRuin === 0, "constant gains: no drawdown, no loss, no ruin");
ok(near(mc.fan.at(-1).p50, 100 * (1 + r) ** n, 1e-3) && mc.fan.at(-1).step === n, "fan chart ends at the terminal value on the last day");

// reproducible, and a different seed gives a different sample
const rets = Array.from({ length: 250 }, (_, i) => Math.sin(i * 1.3) * 0.01 + (i % 7 === 0 ? -0.02 : 0.002));
const a = blockBootstrap(rets, { iterations: 2000, block: 10, seed: 3 }), b = blockBootstrap(rets, { iterations: 2000, block: 10, seed: 3 }), c = blockBootstrap(rets, { iterations: 2000, block: 10, seed: 4 });
ok(a.mean === b.mean && a.p5 === b.p5, "same seed reproduces the same result");
ok(a.mean !== c.mean, "a new seed changes the sample");

// block bootstrap of the mean: terminal mean log-growth tracks the data's mean
const mu = rets.reduce((s, x) => s + x, 0) / rets.length;
const logMean = a.terminal.reduce((s, v) => s + Math.log(1 + v / 100), 0) / a.terminal.length;
ok(near(logMean, rets.reduce((s, x) => s + Math.log(1 + x), 0), 0.05), "mean log growth of the paths matches the data", `${logMean} vs ${rets.reduce((s, x) => s + Math.log(1 + x), 0)}`);
ok(a.p5 <= a.p50 && a.p50 <= a.p95 && a.ddMedian <= a.ddP95, "percentiles are ordered");
ok(a.probDrawdown(0) === 100 || a.probDrawdown(0) <= 100, "probDrawdown is a percentage");
ok(a.probDrawdown(5) >= a.probDrawdown(20), "a deeper drawdown is never more likely than a shallower one");

// a guaranteed -30% day: every path with it has at least a 30% drawdown, and ruin needs a 50% fall
const crash = Array(60).fill(0); crash[10] = -0.3;
mc = blockBootstrap(crash, { iterations: 800, block: 1, seed: 2 });
ok(mc.ddMedian > 0 || mc.ddP95 > 0, "a crash day shows up as drawdown");
// ruin needs the crash day drawn at least twice (0.7^2 < 0.5): P = 1 - P(0) - P(1) of Binomial(60, 1/60) = 26.2%
ok(near(mc.probRuin, 26.2, 4), "ruin probability matches the binomial closed form (26.2%)", String(mc.probRuin));
ok(blockBootstrap(Array(29).fill(0.01), { iterations: 10, block: 5, seed: 1 }) === null, "fewer than 30 days: no result");
ok(histogram(a.terminal).reduce((s, h) => s + h.count, 0) === 2000, "histogram counts every path");

// exposure
const day = (i) => `2024-01-${String(i + 1).padStart(2, "0")}`;
const curve = Array.from({ length: 10 }, (_, i) => ({ date: day(i), portfolio_value: 100000 }));
const trades = [
  { entry_date: day(1), exit_date: day(5), entry_price: 100, quantity: 100 },   // held closes of days 1-4
  { entry_date: day(3), exit_date: day(7), entry_price: 50, quantity: 200 },    // held closes of days 3-6
];
const ex = exposureSeries({ trades, equity_curve: curve });
ok(ex.series[0].positions === 0 && ex.series[1].positions === 1 && ex.series[3].positions === 2 && ex.series[5].positions === 1 && ex.series[7].positions === 0, "open positions counted per close (exit date excluded)", JSON.stringify(ex.series.map((p) => p.positions)));
ok(near(ex.series[3].exposure, 20, 1e-9) && near(ex.series[1].exposure, 10, 1e-9), "exposure is cost of open positions over portfolio value");
ok(ex.maxConcurrent === 2 && near(ex.timeInMarket, 60, 1e-9), "max concurrent and time in market");
ok(exposureSeries({ trades: [], equity_curve: [] }) === null, "empty curve gives no exposure series");


// drawdown episodes
const mk = (vals) => vals.map((v, i) => ({ date: `2024-02-${String(i + 1).padStart(2, "0")}`, value: v, bench: 100, dd: 0 }));
const eps = drawdownEpisodes(mk([100, 110, 99, 90, 105, 110, 120, 108, 114]), 0.1, 5);
ok(eps.length === 2, "two drawdown episodes found", String(eps.length));
ok(near(eps[0].depth, (1 - 90 / 110) * 100, 1e-9) && eps[0].peakDate === "2024-02-02" && eps[0].troughDate === "2024-02-04" && eps[0].recoveryDate === "2024-02-06", "deepest episode: depth, peak, trough and recovery dates", JSON.stringify(eps[0]));
ok(eps[0].daysToTrough === 2 && eps[0].daysToRecover === 2, "days to trough and to recover");
ok(eps[1].recoveryDate === null && eps[1].daysToRecover === null && near(eps[1].depth, (1 - 108 / 120) * 100, 1e-9), "an unrecovered drawdown at the end has no recovery date");
ok(drawdownEpisodes(mk([100, 101, 102, 103]), 0.1).length === 0, "a rising curve has no drawdowns");

// rolling volatility of a constant return is zero; alternating returns match the closed form
const flatPts = mk(Array.from({ length: 40 }, (_, i) => 100 * 1.001 ** i));
ok(rollingVol(flatPts, 10).every((p) => p.strat < 1e-9), "constant returns have zero rolling volatility");
const alt = mk(Array.from({ length: 41 }, (_, i) => 100 * Array.from({ length: i }).reduce((a, _, k) => a * (k % 2 ? 0.99 : 1.01), 1)));
const rv = rollingVol(alt, 20)[0].strat;
const sdExp = Math.sqrt((20 * 0.01 ** 2) / 19) * Math.sqrt(252) * 100; // returns +-1% alternating, sample sd
ok(near(rv, sdExp, 0.6), "rolling volatility annualises the sample standard deviation", `${rv} vs ${sdExp}`);

// attribution buckets
const tr = (pnl, ret, bars, dir = "LONG") => ({ net_pnl: pnl, return_pct: ret, holding_period_bars: bars, direction: dir, entry_date: "2024-01-01", exit_date: "2024-01-05" });
const T = [tr(100, 2, 1), tr(-50, -1, 3), tr(300, 5, 8), tr(-20, -0.5, 25, "SHORT"), tr(10, 0.2, 2, "SHORT"), tr(20, 0.4, 2), tr(15, 0.3, 2), tr(5, 0.1, 2), tr(8, 0.2, 2), tr(12, 0.3, 2)];
const sides = bySide(T);
ok(sides.find((s) => s.label === "Short").n === 2 && near(sides.find((s) => s.label === "Short").pnl, -10, 1e-9), "P&L and count by side");
ok(byHolding(T).reduce((s, b) => s + b.n, 0) === T.length && byHolding(T).find((b) => b.label === "21+ bars").n === 1, "holding-period buckets cover every trade");
const conc = tradeConcentration(T);
ok(conc.topN === 1 && near(conc.topShare, 75, 1e-9) && conc.withoutBest === 100, "the best 10% of trades' share of P&L", JSON.stringify(conc));
ok(tradeConcentration([tr(1, 1, 1)]) === null, "too few trades for a concentration figure");

// regimes: a benchmark that rises steadily is always Bull; the strategy that tracks it earns the same
const up = Array.from({ length: 200 }, (_, i) => ({ date: new Date(Date.UTC(2024, 0, 1 + i)).toISOString().slice(0, 10), value: 100 * 1.001 ** i, bench: 100 * 1.001 ** i, dd: 0 }));
const rb = regimeBreakdown(up, [{ ...tr(10, 1, 3), entry_date: up[120].date }]);
const bull = rb.find((r) => r.regime.startsWith("Bull")), bear = rb.find((r) => r.regime.startsWith("Bear"));
ok(bear.days === 0 && bull.days > 100, "a steadily rising benchmark is all Bull", `${bull.days}/${bear.days}`);
ok(near(bull.strat, bull.bench, 1e-6) && near(bull.strat, (0.001) * 252 * 100, 1e-6), "annualised return per regime matches the closed form");
ok(bull.trades === 1 && bear.trades === 0, "a trade is counted in the regime visible when it was entered");
ok(regimeBreakdown(up.slice(0, 40), []) === null, "too short to classify regimes");
const yrs = annualTable([{ date: "2023-12-29", value: 100, bench: 100, dd: 0 }, { date: "2024-06-28", value: 110, bench: 105, dd: 0 }, { date: "2024-12-31", value: 121, bench: 110, dd: 0 }]);
ok(yrs.length === 2 && near(yrs.find((y) => y.year === 2024).strat, 21, 1e-9) && near(yrs.find((y) => y.year === 2024).excess, 11, 1e-9), "annual summary: return from the prior year-end, and excess over the benchmark");

// report and export
const dayN = (i) => new Date(Date.UTC(2024, 0, 1 + i)).toISOString().slice(0, 10);
const rcurve = Array.from({ length: 90 }, (_, i) => ({ date: dayN(i), portfolio_value: 100000 * 1.001 ** i, cash: 0, drawdown: i % 30 === 0 ? 0 : 1.2, benchmark_value: 100000 * 1.0005 ** i, returns: 0, benchmark_returns: 0 }));
const strategyCfg = { id: "s1", name: "S", description: "", asset: "AAPL", universe: ["AAPL"], timeframe: "1D", indicators: [{ id: "sma_1", name: "SMA", params: { period: 20 } }], entry_rules: [{ id: "e", indicator_a: "close", operator: ">", indicator_b: "sma_1", threshold: null }], exit_rules: [], risk: { stop_loss_pct: 2, take_profit_pct: 6, position_size_pct: 10, max_positions: 5, allow_short: false, direction: "long", allow_stacking: false }, execution: { commission_pct: 0.05, slippage_pct: 0.05, spread_pct: 0.02, initial_capital: 100000, allow_fractional: true } };
const evil = '<img src=x onerror=alert(1)>';
const run = { id: "bt_x", strategy_id: "s1", strategy_name: evil, ticker: "AAPL", benchmark: "SPY", start_date: dayN(0), end_date: dayN(89), status: "COMPLETED", engine_version: "3", data_fingerprint: "abc123abc123", equity_curve: rcurve, monthly_returns: [], logs: [], notes: [{ id: "n", timestamp: "2026-01-01", content: "<script>alert(2)</script> hypothesis" }],
  metrics: { total_return: 9.4, cagr: 40, sharpe_ratio: 1.2, sortino_ratio: 1.5, max_drawdown: 1.2, annualized_volatility: 8, win_rate: 50, profit_factor: 1.4, num_trades: 2 },
  trades: [{ id: "t1", ticker: "AAPL", direction: "LONG", entry_date: dayN(2), exit_date: dayN(9), entry_price: 100, exit_price: 106, quantity: 10, gross_pnl: 60, fees: 1, net_pnl: 59, return_pct: 5.9, holding_period_bars: 7, exit_reason: "TAKE_PROFIT", mae: -1, mfe: 6 }, { id: "t2", ticker: "AAPL", direction: "LONG", entry_date: dayN(12), exit_date: dayN(15), entry_price: 100, exit_price: 98, quantity: 10, gross_pnl: -20, fees: 1, net_pnl: -21, return_pct: -2.1, holding_period_bars: 3, exit_reason: "STOP_LOSS", mae: -2, mfe: 0.5 }] };
const html = buildRunReport(run, strategyCfg);
ok(html.startsWith("<!doctype html>") && html.includes("Total return") && html.includes("+9.40%") && html.includes("<svg"), "report is a complete HTML page with the key figures and charts");
ok(!/<(script|img)\b/i.test(html) && html.includes("&lt;img src=x onerror=alert(1)&gt;") && html.includes("&lt;script&gt;"), "names and notes are escaped (no HTML injection)");
ok(!/<[^>]*\s(src|href)=|https?:\/\//i.test(html), "report makes no external requests");
ok(/Small sample: 2 trades/.test(html) && html.includes("abc123abc123") && html.includes("engine 3"), "report flags a small sample and records the engine and data fingerprint");
ok(html.includes("Next bar open") && html.includes("one at a time"), "report states the fill rule and positioning");
const js = buildRunJson(run, strategyCfg);
ok(js.format === "quantsynthica.run/1" && js.strategy.id === "s1" && js.window.start === run.start_date && js.benchmark === "SPY" && js.run.trades.length === 2 && js.data_fingerprint === "abc123abc123", "run JSON carries the strategy, window, benchmark, fingerprint and the full run");
ok(esc(`<&>"'`) === "&lt;&amp;&gt;&quot;&#39;", "escape covers the five HTML characters");
const changed = describeChanges(strategyCfg, { ...strategyCfg, risk: { ...strategyCfg.risk, stop_loss_pct: 3 }, indicators: [{ id: "sma_1", name: "SMA", params: { period: 30 } }] });
ok(changed.length === 3 && changed.some((c) => /Indicators/.test(c)) && changed.some((c) => /stop loss pct: 2 → 3/i.test(c)), "config diff lists exactly what changed", JSON.stringify(changed));
ok(describeChanges(strategyCfg, JSON.parse(JSON.stringify(strategyCfg))).length === 0, "identical configs have no differences");

console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
