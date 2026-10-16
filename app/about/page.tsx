import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle, ArrowRight, BarChart3, Boxes, BriefcaseBusiness, CheckCircle2, Database, FlaskConical, Globe2, Search, ShieldAlert,
} from "lucide-react";
import Footer from "@/components/footer/Footer";

export const metadata: Metadata = {
  title: "About — QuantSynthicaLab",
  description: "What QuantSynthica Lab is, how its backtests and risk numbers are computed, what data it uses, and where its limits are.",
  openGraph: {
    title: "About — QuantSynthicaLab",
    description: "A quantitative research workspace for US and Indian equities: research, strategies, backtests, analytics, portfolios and risk.",
  },
};

const card = "rounded-xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-[#0B1528]";
const eyebrow = "text-[12px] font-bold uppercase tracking-[0.2em] text-[#1769FF]";
const h2 = "mt-1 text-2xl font-bold tracking-tight text-[#0B1220] dark:text-white";
const body = "text-sm leading-relaxed text-[#526174] dark:text-slate-400";

const MODULES = [
  { icon: Search, title: "Research", href: "/research", text: "Search any US or Indian stock. Eleven tabs cover price charts and technicals, fundamentals, options, analyst estimates, news, filings, competitors, ownership and ESG." },
  { icon: FlaskConical, title: "Strategy Lab", href: "/strategies/builder", text: "A visual rule builder. Combine 24 indicators into entry and exit rules, set stop loss, take profit and position size, and read every rule back in plain English." },
  { icon: Boxes, title: "Backtests", href: "/backtests", text: "Run a strategy on a stock over a date window, against a benchmark, with commissions, slippage and spread. Every run is saved and can be re-run or compared." },
  { icon: BarChart3, title: "Analytics", href: "/analytics", text: "Performance, risk, trades, market regimes, robustness and attribution, all computed from each run's equity curve and trade log." },
  { icon: BriefcaseBusiness, title: "Portfolio", href: "/portfolio", text: "Build a multi-asset portfolio, compare weighting methods (equal weight, inverse volatility, risk parity, min variance, max Sharpe) and test rebalancing." },
  { icon: ShieldAlert, title: "Risk Lab", href: "/risk", text: "Value at Risk by four methods, drawdowns, correlation, risk decomposition, historical scenario replay and exposure to proxy factors." },
];

const METHOD = [
  { t: "No lookahead", d: "Signals are computed on a bar's close. Orders fill at the next bar's open (t+1), so a backtest never trades on information it could not have had." },
  { t: "Costs are modelled", d: "Commission, slippage and spread are configurable and applied to every fill. Starting capital, position size and the number of open positions are explicit." },
  { t: "Benchmarks stay in market", d: "An Indian stock is measured against an Indian index and a US stock against a US one. Indian indices come from a 162-index universe; only those with price history can be selected." },
  { t: "Risk methods are named", d: "Value at Risk is parametric, historical, Monte Carlo or Cornish-Fisher. Scenario analysis replays real historical episodes. Factor exposure uses ETF and index proxies, not a published factor dataset." },
  { t: "Real data only", d: "Charts and metrics come from market data and your own runs. When the data service is unavailable, results are labelled Sample or Simulated rather than shown as real." },
];

const LIMITS = [
  "Daily bars only. There is no intraday, tick or order-book data.",
  "Market data comes from a public provider (Yahoo Finance) and can be delayed, revised or have gaps. Some Indian indices have no price history at all.",
  "Backtests assume you can trade at the next open at the modelled cost. They do not model market impact, liquidity limits or taxes.",
  "The stock universe reflects current listings, so results carry survivorship bias.",
  "It is a research and paper-trading tool. It does not place orders, hold money or give investment advice, and past performance does not predict future results.",
];

const STACK = ["Next.js and React front end", "FastAPI and Python back end", "pandas, NumPy and statsmodels for the maths", "Browser-side computation for portfolio and risk analytics"];

export default function AboutPage() {
  return (
    <div className="w-full bg-white text-slate-900 transition-colors duration-300 dark:bg-[#070D18] dark:text-white">
      <section className="border-b border-slate-200/80 bg-[#F8FAFC] py-16 dark:border-slate-800 dark:bg-[#070D18] sm:py-20">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
          <div className={eyebrow}>About</div>
          <h1 className="mt-3 text-4xl font-bold tracking-[-0.03em] text-[#0B1220] dark:text-white sm:text-5xl">
            A research workspace for <span className="bg-gradient-to-r from-[#1769FF] via-[#3B82F6] to-[#4F46E5] bg-clip-text text-transparent">US and Indian equities.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-[1.65] text-[#526174] dark:text-slate-400">
            QuantSynthica Lab puts the whole research loop in one place: look at a market, turn an idea into rules, test the rules on history with realistic assumptions, then check what the result says about risk. It is built to show its working, so you can see how a number was produced and where it stops being reliable.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/research" className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#1769FF] px-5 text-sm font-semibold text-white shadow-lg shadow-[#1769FF]/25 transition-colors hover:bg-[#1258db]">Open Research <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/strategies/builder" className="inline-flex h-11 items-center gap-2 rounded-[10px] border border-slate-200/90 bg-white px-5 text-sm font-semibold text-[#0B1220] transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0B1528] dark:text-slate-200 dark:hover:bg-slate-800/80">Build a strategy</Link>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
          <div className={eyebrow}>What is inside</div>
          <h2 className={h2}>Six connected tools</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map(({ icon: Icon, title, href, text }) => (
              <Link key={title} href={href} className={`${card} group transition-colors hover:border-[#1769FF]/40`}>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#1769FF] dark:bg-blue-950/40 dark:text-blue-400"><Icon className="h-4.5 w-4.5" /></span>
                  <h3 className="text-base font-bold text-[#0B1220] dark:text-white">{title}</h3>
                  <ArrowRight className="ml-auto h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#1769FF]" />
                </div>
                <p className={`mt-3 ${body}`}>{text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-[#F8FAFC] py-14 dark:border-slate-800 dark:bg-[#060D17]">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
          <div className={eyebrow}>How the numbers are made</div>
          <h2 className={h2}>Method, in plain terms</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {METHOD.map((m, i) => (
              <div key={m.t} className={card}>
                <div className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[#1769FF]">{String(i + 1).padStart(2, "0")} • {m.t}</div>
                <p className={body}>{m.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto grid max-w-[1100px] gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <div className={eyebrow}>Data and coverage</div>
            <h2 className={h2}>What it covers</h2>
            <ul className="mt-5 space-y-3">
              {[
                ["US and Indian stocks", "About 18,500 listed stocks across NYSE, NASDAQ, NSE and BSE, with sector and company data."],
                ["ETFs and indices", "Broad-market and sector benchmarks for both markets."],
                ["Options and fundamentals", "Option chains with Black-Scholes Greeks estimated from implied volatility, plus valuation and financial ratios where the provider has them."],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3"><Database className="mt-0.5 h-4 w-4 shrink-0 text-[#1769FF]" /><span className={body}><b className="font-semibold text-[#0B1220] dark:text-white">{t}.</b> {d}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Limits</div>
            <h2 className={h2}>What to keep in mind</h2>
            <ul className="mt-5 space-y-3">
              {LIMITS.map((l) => (
                <li key={l} className="flex gap-3"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /><span className={body}>{l}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200/80 bg-[#F8FAFC] py-14 dark:border-slate-800 dark:bg-[#060D17]">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <div className={eyebrow}>Built with</div>
              <h2 className={h2}>Under the hood</h2>
              <ul className="mt-5 space-y-2.5">
                {STACK.map((s) => <li key={s} className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /><span className={body}>{s}</span></li>)}
              </ul>
              <p className={`mt-4 ${body}`}>Strategies, backtests and settings are stored by the server you run it on. The only outside requests are for market data.</p>
            </div>
            <div className={`${card} flex flex-col justify-center`}>
              <Globe2 className="h-6 w-6 text-[#1769FF]" />
              <h3 className="mt-3 text-lg font-bold text-[#0B1220] dark:text-white">Ready to look at a market?</h3>
              <p className={`mt-1.5 ${body}`}>Start from any stock, or go straight to the Strategy Lab and test an idea.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/research" className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1769FF] px-4 text-sm font-semibold text-white hover:bg-[#1258db]">Open Research <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/docs" className="inline-flex h-10 items-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-[#0B1220] hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Read the docs</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
