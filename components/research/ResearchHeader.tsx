"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, CandlestickChart, GitCompare, MoreHorizontal, Copy, Check, FlaskConical, Hammer, ShieldAlert, AlertTriangle } from "lucide-react";
import { StockFundamentals, StockProfile } from "@/types";
import { keyStats } from "@/lib/research/derive";
import { Region, fmtBig, fmtPx, fmtVol, num, daysSince } from "@/lib/research/format";
import { Spark } from "@/components/risk/ui/charts";
import { cn, fmtPct } from "@/lib/utils";
import { isNum } from "@/lib/formatters";

type Stats = NonNullable<ReturnType<typeof keyStats>>;
interface Props {
  ticker: string; region: Region; profile?: StockProfile; fundamentals: StockFundamentals | null; stats: Stats; closes: number[];
  beta: number | null; onChart: () => void; onCompare: () => void;
}

const KEY = "algolab_watchlist";
const readWatch = (): { ticker: string; region: Region }[] => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };

function RangeBar({ lo, hi, v, region }: { lo: number | null; hi: number | null; v: number; region: Region }) {
  const ok = isNum(lo) && isNum(hi) && hi > lo;
  const pct = ok ? Math.max(0, Math.min(100, ((v - lo!) / (hi! - lo!)) * 100)) : 0;
  return (
    <div className="min-w-[120px]">
      <div className="font-mono text-[11px] font-semibold text-slate-100">{ok ? `${fmtPx(lo, region)} – ${fmtPx(hi, region)}` : "—"}</div>
      <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export default function ResearchHeader({ ticker, region, profile, fundamentals: f, stats: s, closes, beta, onChart, onCompare }: Props) {
  const router = useRouter();
  const [watched, setWatched] = useState(false);
  const [menu, setMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const name = f?.name || profile?.name || ticker;
  const clean = ticker.replace(/\.(NS|BO)$/, "");
  const stale = daysSince(s.date) > 5;
  const up = (s.changePct ?? 0) >= 0;

  useEffect(() => setWatched(readWatch().some((w) => w.ticker === ticker)), [ticker]);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("mousedown", close); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, []);

  const toggleWatch = () => {
    const list = readWatch();
    const next = list.some((w) => w.ticker === ticker) ? list.filter((w) => w.ticker !== ticker) : [...list, { ticker, region }];
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
    setWatched(next.some((w) => w.ticker === ticker));
  };
  const openRisk = () => {
    try { localStorage.setItem("qs_risk_settings", JSON.stringify({ market: region, sourceKey: "asset", assetTicker: ticker, lookback: "3Y" })); } catch { /* ignore */ }
    router.push("/risk?tab=overview");
  };
  const copy = async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ } };

  const btn = "inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/70";
  const item = "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-slate-200 hover:bg-slate-800/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/70";

  return (
    <section className="relative space-y-4 border-b border-slate-800/60 pb-4">
      <div className="pointer-events-none absolute left-1/4 top-0 -z-10 h-24 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 top-0 -z-10 h-24 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
      <nav aria-label="Breadcrumb" className="font-mono text-[11px] text-slate-500"><Link href="/research" className="hover:text-slate-300">Research</Link> <span className="mx-1">/</span> <span className="text-slate-300">{clean}</span></nav>

      <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 font-mono text-sm font-bold text-blue-400">{clean.slice(0, 2)}</div>
          <div className="min-w-0">
            <h1 className="flex flex-wrap items-baseline gap-x-2 text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
              <span className="font-mono">{clean}</span><span className="truncate text-sm font-semibold text-secondary sm:text-base">{name}</span>
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
              {[profile?.exchange || f?.exchange, f?.sector || profile?.sector, f?.industry, region === "India" ? "INR" : "USD"].filter(Boolean).map((c, i) => <span key={i} className="rounded-full border border-slate-700/70 bg-slate-800/40 px-2 py-0.5 font-mono text-slate-300">{c}</span>)}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={toggleWatch} aria-pressed={watched} className={cn(btn, watched && "border-amber-500/40 bg-amber-500/10 text-amber-300")}><Star className={cn("h-3.5 w-3.5", watched && "fill-current")} />{watched ? "Watching" : "Watchlist"}</button>
          <button type="button" onClick={onChart} className={btn}><CandlestickChart className="h-3.5 w-3.5" /> Chart</button>
          <button type="button" onClick={onCompare} className={btn}><GitCompare className="h-3.5 w-3.5" /> Compare</button>
          <div className="relative" ref={menuRef}>
            <button type="button" onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu} className={btn}><MoreHorizontal className="h-3.5 w-3.5" /> Actions</button>
            {menu && (
              <div role="menu" className="absolute right-0 top-full z-[60] mt-1 w-60 rounded-xl border border-slate-800 bg-[#0B101C] p-1.5 shadow-[0_18px_48px_-12px_rgba(0,0,0,0.65)]">
                <Link role="menuitem" href={`/backtests?ticker=${encodeURIComponent(ticker)}`} className={item}><FlaskConical className="h-4 w-4 text-slate-400" />Backtest this stock</Link>
                <Link role="menuitem" href={`/strategies/builder?asset=${encodeURIComponent(ticker)}`} className={item}><Hammer className="h-4 w-4 text-slate-400" />Build a strategy</Link>
                <button role="menuitem" type="button" onClick={openRisk} className={item}><ShieldAlert className="h-4 w-4 text-slate-400" />Analyse risk</button>
                <button role="menuitem" type="button" onClick={copy} className={item}>{copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-slate-400" />}{copied ? "Link copied" : "Copy link"}</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-end gap-4">
          <div>
            <div className="font-mono text-4xl font-bold tracking-tight text-white">{fmtPx(s.close, region)}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className={cn("rounded-md px-2 py-0.5 font-semibold", s.changePct === null ? "text-slate-500" : up ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>{s.change === null ? "—" : `${up ? "+" : ""}${s.change.toFixed(2)} (${fmtPct(s.changePct)})`}</span>
              <span className="text-slate-400">Close · {s.date}</span>
              {stale && <span className="inline-flex items-center gap-1 text-amber-400" title="The latest price bar is more than 5 days old"><AlertTriangle className="h-3 w-3" />stale</span>}
            </div>
          </div>
          <Spark data={closes.slice(-60)} color={up ? "#10B981" : "#F43F5E"} width={150} height={44} />
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4 xl:grid-cols-9">
          {([
            ["Volume", fmtVol(s.volume, region), `Avg 30D ${fmtVol(s.avgVol30, region)}`],
            ["Market cap", fmtBig(f?.market_cap ?? profile?.market_cap, region), ""],
            ["P/E (TTM)", num(f?.pe_ratio ?? profile?.pe_ratio, 1), ""],
            ["EPS (TTM)", fmtPx(f?.eps_ttm ?? profile?.eps_ttm, region), ""],
            ["Div. yield", isNum(f?.dividend_yield) ? fmtPct(f!.dividend_yield, 2, false) : "—", ""],
            ["Beta", num(beta ?? f?.beta, 2), "vs benchmark"],
          ] as [string, string, string][]).map(([k, v, sub]) => (
            <div key={k}><dt className="text-[10px] uppercase tracking-wider text-slate-400">{k}</dt><dd className={cn("whitespace-nowrap font-mono text-sm font-semibold", v === "—" ? "text-slate-500" : "text-white")}>{v}</dd>{sub && <div className="whitespace-nowrap font-mono text-[10px] text-slate-500">{sub}</div>}</div>
          ))}
          <div className="col-span-2 sm:col-span-2"><dt className="text-[10px] uppercase tracking-wider text-slate-400">52W range</dt><dd><RangeBar lo={s.low52} hi={s.high52} v={s.close} region={region} /></dd>{s.bars52 < 240 && <div className="font-mono text-[10px] text-slate-500">{s.bars52} sessions only</div>}</div>
          <div className="col-span-2 sm:col-span-2"><dt className="text-[10px] uppercase tracking-wider text-slate-400">Day range</dt><dd><RangeBar lo={s.low} hi={s.high} v={s.close} region={region} /></dd></div>
        </dl>
      </div>
    </section>
  );
}
