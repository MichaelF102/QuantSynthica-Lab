#!/usr/bin/env node
/**
 * Offline regression test for lib/risk and lib/portfolio math (no network, no test framework).
 * Expected values come from scipy / statsmodels / hand calculation. Run: node scripts/test_risk_math.cjs
 */
const ts = require("typescript");
const fs = require("fs"), path = require("path"), Module = require("module");
const ROOT = path.resolve(__dirname, "..");
const stub = path.join(ROOT, ".risk_test_api_stub.js");
fs.writeFileSync(stub, "module.exports={api:{}}");
process.on("exit", () => { try { fs.unlinkSync(stub); } catch {} });
const orig = Module._resolveFilename;
Module._resolveFilename = function (r, ...a) {
  if (r === "@/lib/api") return stub;
  if (r.startsWith("@/")) r = path.join(ROOT, r.slice(2));
  return orig.call(this, r, ...a);
};
require.extensions[".ts"] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, "utf8"), { compilerOptions: { module: "commonjs", target: "es2020", esModuleInterop: true } }).outputText, f);
const req = (p) => require(path.join(ROOT, p));

let failed = 0;
const near = (name, got, want, tol = 1e-4) => {
  const ok = Math.abs(got - want) <= tol;
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: got ${got}, want ${want}`);
};

const s = req("lib/risk/stats.ts"), c = req("lib/risk/correlation.ts"), d = req("lib/risk/drawdown.ts");
const v = req("lib/risk/var.ts"), f = req("lib/risk/factors.ts"), dec = req("lib/risk/decomposition.ts"), eng = req("lib/portfolio/engine.ts");

// distributions
near("normInv(0.975)", s.normInv(0.975), 1.959964, 1e-5);
near("normCdf(1.96)", s.normCdf(1.96), 0.9750021, 1e-5);
near("chi2Sf1(3.841)", s.chi2Sf1(3.841), 0.05, 1e-3);
near("tPValue(2,10)", s.tPValue(2, 10), 0.07339, 1e-4);
near("tPValue(2.5,30)", s.tPValue(2.5, 30), 0.01813, 1e-4);

// rank correlations (scipy)
const a = [1, 2, 3, 4, 5], b = [5, 6, 7, 8, 7];
near("pearson", c.pearson(a, b), 0.8321, 1e-4);
near("spearman", c.spearman(a, b), 0.8208, 1e-4);
near("kendall", c.kendall(a, b), 0.7378, 2e-4);

// drawdown episodes (hand calculation)
const P = [100, 110, 90, 95, 120, 100, 130].map((x, i) => ({ date: `2024-01-${String(1 + i * 10).padStart(2, "0")}`.replace("2024-01-31", "2024-01-31"), value: x }));
const dates = ["2024-01-01", "2024-01-11", "2024-01-21", "2024-01-31", "2024-02-10", "2024-02-20", "2024-03-01"];
const eps = d.findEpisodes(P.map((p, i) => ({ date: dates[i], value: p.value })));
near("episodes", eps.length, 2, 0);
near("episode1 depth", eps[0].depth, 18.1818, 1e-3);
near("episode1 recovery days", eps[0].recoveryDays, 20, 0);
near("episode2 depth", eps[1].depth, 16.6667, 1e-3);

// VaR sanity on a deterministic normal sample
const rnd = s.seeded(7);
const nrm = () => Math.sqrt(-2 * Math.log(rnd())) * Math.cos(2 * Math.PI * rnd());
const rets = Array.from({ length: 6000 }, () => 0.0005 + 0.01 * nrm());
const sd = s.std(rets), mu = s.mean(rets);
near("parametric VaR95 = -(mu + z sd)", v.varEs(rets, 0.95, "Parametric", 1).var, -(mu + sd * s.normInv(0.05)), 1e-9);
near("historical VaR95 within 5% of parametric", v.varEs(rets, 0.95, "Historical", 1).var / v.varEs(rets, 0.95, "Parametric", 1).var, 1, 0.05);
near("sqrt-t scaling", v.varEs(rets, 0.95, "Historical", 10).var / v.varEs(rets, 0.95, "Historical", 1).var, Math.sqrt(10), 1e-9);
near("ES >= VaR", v.varEs(rets, 0.99, "Historical", 1).es >= v.varEs(rets, 0.99, "Historical", 1).var ? 1 : 0, 1, 0);
const bt = v.backtestVar(rets, rets.map((_, i) => String(i)), 0.95, 250);
near("backtest exception rate ~5%", bt.rate, 0.05, 0.01);

// OLS (statsmodels fixture)
const fx = {"y": [-0.220785, -0.860356, 1.797027, -0.341251, -0.581892, 1.797649, -2.568285, 1.594734, 1.010442, -0.336209, -0.970388, 1.306285, -0.04778, -2.121571, -1.674061, -1.364169, 0.291445, -0.547633, -0.293071, 1.106969, 0.842086, -2.54775, -0.965087, 1.554083, 0.249167, 3.232007, 2.19449, -0.297263, 2.507493, 2.942643, 0.254807, 0.074611, 2.20688, 0.233807, 0.969741, -0.549217, 1.053168, 2.818285, -0.40612, 1.923205], "X": [[-0.801931, -0.248362, 1.136047, -0.552647, 0.748746, 0.272769, -0.958265, 0.202882, -0.083696, -0.629288, -0.713313, -0.063086, 0.409638, -1.643023, -0.980747, -1.289419, -0.037886, -1.047927, -1.091329, 0.224786, 1.170296, -1.997817, -1.101717, 0.043632, -0.233423, 0.962001, 0.738042, -0.331291, 1.448731, 2.431733, 0.844993, -0.606612, 1.350389, 0.1888, 0.609216, -0.152362, 0.103023, 0.895783, -1.201116, 0.966972], [-1.324359, 0.420445, 0.109706, -0.78478, 1.634783, -1.233329, 1.600019, -1.732135, -1.163226, -0.488006, 0.553378, -0.589431, 0.829855, -0.25673, -0.173155, 0.02069, -0.304338, -0.39619, -1.355209, -1.10935, 0.716588, 0.272129, 0.033057, -1.98843, -0.25579, -1.181447, -1.098973, -0.840473, 0.568213, 0.641916, 0.840683, -0.070028, -0.396551, -0.021223, -0.364909, 0.242381, -0.864973, -1.298481, -1.282492, -0.360608]]};
const fit = f.ols(fx.y, fx.X, ["A", "B"]);
[0.156073, 1.392757, -0.838609].forEach((w, i) => near(`ols beta[${i}]`, fit.beta[i], w, 1e-5));
[0.064679, 0.064986, 0.072132].forEach((w, i) => near(`ols se[${i}]`, fit.se[i], w, 1e-5));
near("ols p[0]", fit.p[0], 0.02089, 1e-4);
near("ols R2", fit.r2, 0.936376, 1e-5);
const shares = f.riskShares(fx.y, fx.X, fit);
near("factor variance shares + residual = 100", shares.factor.reduce((x, y) => x + y, 0) + shares.residual, 100, 1e-6);

// Euler decomposition vs finite-difference gradient
const T = 600, bench = Array.from({ length: T }, () => 0.01 * nrm());
const rows = [0.8, 1.2, 0.5].map((bt2, i) => bench.map((x) => bt2 * x + 0.008 * (i + 1) * nrm()));
const tickers = ["A", "B", "C"], w = [0.5, 0.3, 0.2];
const res = {
  tickers, targetWeights: { A: 0.5, B: 0.3, C: 0.2 }, finalWeights: { A: 0.5, B: 0.3, C: 0.2 },
  assetReturns: Object.fromEntries(tickers.map((t, i) => [t, rows[i]])), benchReturns: bench,
  returns: bench.map((_, k) => 0.5 * rows[0][k] + 0.3 * rows[1][k] + 0.2 * rows[2][k]),
  prices: Object.fromEntries(tickers.map((t, i) => [t, rows[i].reduce((acc, x) => (acc.push(acc[acc.length - 1] * (1 + x)), acc), [100])])),
  dates: Array.from({ length: T + 1 }, (_, i) => String(i)),
};
const D = dec.decompose(res, 0.95);
near("euler shares sum 100", D.share.reduce((x, y) => x + y, 0), 100, 1e-9);
near("vol points sum = portfolio vol", D.volPoints.reduce((x, y) => x + y, 0), D.portVolAnn, 1e-9);
near("component VaR sums to total VaR", D.cVaR.reduce((x, y) => x + y, 0), D.totalVaR, 1e-9);
near("pairwise matrix sums to 100", D.pairwise.flat().reduce((x, y) => x + y, 0), 100, 1e-9);
const cov = eng.covMatrix(tickers.map((t) => res.assetReturns[t])), base = eng.portfolioVol(cov, w);
w.forEach((wi, i) => { const w2 = [...w]; w2[i] += 1e-6; near(`euler share ${tickers[i]} = finite difference`, D.share[i], ((wi * (eng.portfolioVol(cov, w2) - base)) / 1e-6 / base) * 100, 1e-3); });

// portfolio engine
const days = Array.from({ length: 120 }, (_, i) => new Date(Date.UTC(2023, 0, 2 + i)).toISOString().slice(0, 10));
const A = days.map((_, i) => 100 * Math.pow(1.002, i)), B2 = days.map((_, i) => 50 * Math.pow(1.0005, i));
const bh = eng.simulate(days, { A, B: B2 }, A, [{ ticker: "A", weight: 50 }, { ticker: "B", weight: 50 }], 1000, "Never");
near("buy-and-hold value", bh.value[119] / 1000, 0.5 * A[119] / A[0] + 0.5 * B2[119] / B2[0], 1e-9);
near("weights normalise to 100", eng.normalizeWeights([{ weight: 33 }, { weight: 33 }, { weight: 34 }, { weight: 10 }]).reduce((x, y) => x + y.weight, 0), 100, 1e-9);
const mv = eng.optimise("Min Variance", [[0.04, 0, 0], [0, 0.01, 0], [0, 0, 0.0225]], [0, 0, 0]);
near("min-variance weight[1] (closed form 0.590)", mv[1], (1 / 0.01) / (1 / 0.04 + 1 / 0.01 + 1 / 0.0225), 1e-3);

console.log(failed ? `\n${failed} check(s) FAILED` : "\nAll risk-math checks passed");
process.exit(failed ? 1 : 0);
