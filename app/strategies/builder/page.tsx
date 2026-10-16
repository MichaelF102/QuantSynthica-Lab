"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle, ArrowLeft, Check, Clock, FlaskConical, Layers, LineChart, Play, Plus, Save, Settings2, ShieldCheck, SlidersHorizontal,
  Target, TrendingDown, TrendingUp, Trash2, UserRound, X, Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { StrategyConfig, IndicatorConfig, ConditionRule } from "@/types";
import { AVAILABLE_INDICATORS, DEFAULT_STRATEGY } from "@/lib/constants";
import { SEED_STRATEGIES } from "@/lib/seedData";
import { loadSystemSettings } from "@/lib/settings";
import { alignBenchmark, marketOfTicker } from "@/lib/market";
import { formatRuleSet } from "@/lib/formatRule";
import { useEscape } from "@/lib/useEscape";
import { cn } from "@/lib/utils";
import { Card, CardSkeleton } from "@/components/ui/Card";
import BenchmarkSelect from "@/components/ui/BenchmarkSelect";
import EasyStockPicker from "@/components/strategies/EasyStockPicker";
import TestStrategyModal from "@/components/strategies/TestStrategyModal";
import RuleEditor, { leftOf, rightOf } from "@/components/builder/RuleEditor";
import { Field, INPUT, SELECT } from "@/components/builder/fields";

const SECTIONS = [
  { id: "identity", label: "Identity & thesis" },
  { id: "universe", label: "Universe & asset" },
  { id: "indicators", label: "Indicators" },
  { id: "entry", label: "Entry conditions" },
  { id: "exit", label: "Exit conditions" },
  { id: "risk", label: "Risk management" },
  { id: "execution", label: "Execution & window" },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

const iso = (d: Date) => d.toISOString().slice(0, 10);
const yearsBack = (n: number) => { const d = new Date(); d.setFullYear(d.getFullYear() - n); return iso(d); };
const PRICE_IDS = ["close", "open", "high", "low", "volume"];
const num = (v: string) => (v === "" ? null : Number(v));
const btn = "flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0b1222] px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50";

function BuilderContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const cloneId = sp.get("clone");
  const editId = sp.get("edit");
  const assetParam = sp.get("asset");
  const timeframeParam = sp.get("timeframe");
  const indicatorsParam = sp.get("indicators");
  const benchmarkParam = sp.get("benchmark");

  const [strategy, setStrategy] = useState<StrategyConfig>(DEFAULT_STRATEGY);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [templates, setTemplates] = useState<StrategyConfig[]>(SEED_STRATEGIES);
  const [active, setActive] = useState<SectionId>("identity");
  const [start, setStart] = useState(yearsBack(1));
  const [end, setEnd] = useState(iso(new Date()));
  const [benchmark, setBenchmark] = useState("SPY");
  const [tried, setTried] = useState(false);

  const market = marketOfTicker(strategy.asset);
  const sym = market === "India" ? "₹" : "$";
  const dirty = ready && JSON.stringify(strategy) !== snapshot;
  const patch = useCallback((p: Partial<StrategyConfig>) => setStrategy((s) => ({ ...s, ...p })), []);
  const patchRisk = (p: Partial<StrategyConfig["risk"]>) => setStrategy((s) => ({ ...s, risk: { ...s.risk, ...p } }));
  const patchExec = (p: Partial<StrategyConfig["execution"]>) => setStrategy((s) => ({ ...s, execution: { ...s.execution, ...p } }));

  // ---- initial load (client only, so server and browser HTML match) ----
  useEffect(() => {
    let live = true;
    const cfg = loadSystemSettings();
    const base: StrategyConfig = {
      ...DEFAULT_STRATEGY,
      id: `strat_${Date.now()}`,
      execution: {
        ...DEFAULT_STRATEGY.execution,
        initial_capital: cfg.backtest.initialCapital || DEFAULT_STRATEGY.execution.initial_capital,
        commission_pct: cfg.backtest.commission ?? DEFAULT_STRATEGY.execution.commission_pct,
        slippage_pct: cfg.backtest.slippage ?? DEFAULT_STRATEGY.execution.slippage_pct,
      },
    };
    const finish = (s: StrategyConfig) => {
      if (!live) return;
      setStrategy(s);
      setBenchmark(alignBenchmark(s.asset, benchmarkParam || cfg.research.defaultBenchmark));
      setSnapshot(JSON.stringify(s));
      setReady(true);
    };
    api.getStrategies().then((l) => live && l?.length && setTemplates(l)).catch(() => {});

    const source = editId || cloneId;
    if (source) {
      const seed = SEED_STRATEGIES.find((s) => s.id === source);
      const load = seed ? Promise.resolve(seed) : api.getStrategy(source);
      load.then((s) => finish(editId && !seed && !s.id.startsWith("tpl_") ? { ...s } : { ...s, id: `strat_${Date.now()}`, name: `${s.name} (Copy)`, created_at: new Date().toISOString() }))
        .catch(() => { if (live) { setLoadError(`Strategy "${source}" could not be loaded, so you are starting from the default model.`); finish(base); } });
    } else if (assetParam || indicatorsParam) {
      const asset = (assetParam || base.asset).toUpperCase();
      const inds: IndicatorConfig[] = (indicatorsParam ?? "").split(",").map((n) => n.trim()).filter(Boolean).map((n) => {
        const m = AVAILABLE_INDICATORS.find((i) => i.id.toLowerCase() === n.toLowerCase());
        return m ? { id: m.id.toLowerCase(), name: m.id, params: { ...m.defaultParams } } : null;
      }).filter(Boolean) as IndicatorConfig[];
      finish({ ...base, name: `${asset} Research Model`, asset, universe: [asset], timeframe: timeframeParam || base.timeframe, indicators: inds.length ? inds : base.indicators });
    } else {
      let ticker: string | null = null;
      try { ticker = localStorage.getItem("algolab_active_ticker"); } catch { /* storage unavailable */ }
      const asset = (ticker || base.asset).toUpperCase();
      const india = marketOfTicker(asset) === "India";
      finish({ ...base, asset, universe: [asset], execution: { ...base.execution, initial_capital: india && base.execution.initial_capital === 100000 ? 1000000 : base.execution.initial_capital } });
    }
    return () => { live = false; };
  }, [cloneId, editId, assetParam, indicatorsParam, timeframeParam, benchmarkParam]);

  // warn before leaving with unsaved edits
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(null), 4000); return () => clearTimeout(t); }, [notice]);
  useEscape(showPresets, () => setShowPresets(false));

  // ---- asset / market ----
  const selectAsset = (symbol: string, details?: { market: "India" | "US"; benchmark: string }) => {
    const m = details?.market ?? marketOfTicker(symbol);
    setStrategy((s) => {
      const cap = s.execution.initial_capital;
      const initial_capital = m === "India" && cap === 100000 ? 1000000 : m === "US" && cap === 1000000 ? 100000 : cap;
      return { ...s, asset: symbol, universe: [symbol], execution: { ...s.execution, initial_capital } };
    });
    setBenchmark(details?.benchmark ?? alignBenchmark(symbol, benchmark));
  };

  // ---- indicators ----
  const addIndicator = (id: string) => {
    const t = AVAILABLE_INDICATORS.find((i) => i.id === id);
    if (!t) return;
    setStrategy((s) => {
      let n = s.indicators.filter((i) => i.name === t.id).length + 1;
      while (s.indicators.some((i) => i.id === `${t.id.toLowerCase()}_${n}`)) n++;
      return { ...s, indicators: [...s.indicators, { id: `${t.id.toLowerCase()}_${n}`, name: t.id, params: { ...t.defaultParams } }] };
    });
  };
  const removeIndicator = (id: string) => setStrategy((s) => ({ ...s, indicators: s.indicators.filter((i) => i.id !== id) }));
  const setParam = (id: string, key: string, v: string) =>
    setStrategy((s) => ({ ...s, indicators: s.indicators.map((i) => (i.id === id ? { ...i, params: { ...i.params, [key]: v === "" ? "" : Number(v) } } : i)) }));

  // ---- rules ----
  const ruleKey = (k: "entry" | "exit") => (k === "entry" ? "entry_rules" : "exit_rules") as "entry_rules" | "exit_rules";
  const addRule = (k: "entry" | "exit") => setStrategy((s) => {
    const first = s.indicators[0]?.id ?? "close";
    const r: ConditionRule = { id: `r_${Date.now().toString(36)}`, indicator_a: "close", left_indicator: "close", operator: ">", indicator_b: first, right_indicator: first, threshold: null, logical_operator: k === "entry" ? "AND" : "OR" };
    return { ...s, [ruleKey(k)]: [...s[ruleKey(k)], r] };
  });
  const removeRule = (k: "entry" | "exit", id: string) => setStrategy((s) => ({ ...s, [ruleKey(k)]: s[ruleKey(k)].filter((r) => r.id !== id) }));
  const updateRule = (k: "entry" | "exit", id: string, p: Partial<ConditionRule>) => setStrategy((s) => ({ ...s, [ruleKey(k)]: s[ruleKey(k)].map((r) => (r.id === id ? { ...r, ...p } : r)) }));

  // ---- validation ----
  const validation = useMemo(() => {
    const errors: string[] = [], warnings: string[] = [];
    const ids = new Set([...PRICE_IDS, ...strategy.indicators.map((i) => i.id)]);
    const r = strategy.risk, e = strategy.execution;
    if (!strategy.name.trim()) errors.push("Give the strategy a name.");
    if (!strategy.asset.trim()) errors.push("Pick a target stock.");
    if (!strategy.entry_rules.length) errors.push("Add at least one entry rule.");
    strategy.indicators.forEach((i) => Object.entries(i.params).forEach(([k, v]) => {
      if (v === "" || !Number.isFinite(Number(v)) || Number(v) <= 0) errors.push(`${i.name} (${i.id}): ${k} must be a positive number.`);
    }));
    const check = (label: string, rules: ConditionRule[]) => rules.forEach((rule, i) => {
      const l = leftOf(rule), rt = rightOf(rule), thr = rule.threshold;
      if (!l || !ids.has(l)) errors.push(`${label} rule ${i + 1}: left side "${l || "empty"}" is not a price or an indicator in this strategy.`);
      if (thr === null || thr === undefined) { if (!rt || !ids.has(rt)) errors.push(`${label} rule ${i + 1}: right side "${rt || "empty"}" is not a price or an indicator in this strategy.`); }
      else if (!Number.isFinite(Number(thr))) errors.push(`${label} rule ${i + 1}: the value is not a number.`);
    });
    check("Entry", strategy.entry_rules); check("Exit", strategy.exit_rules);
    if (r.stop_loss_pct != null && r.stop_loss_pct <= 0) errors.push("Stop loss must be above 0%, or left empty.");
    if (r.take_profit_pct != null && r.take_profit_pct <= 0) errors.push("Take profit must be above 0%, or left empty.");
    if (r.trailing_stop_pct != null && r.trailing_stop_pct <= 0) errors.push("Trailing stop must be above 0%, or left empty.");
    if (!(r.position_size_pct > 0 && r.position_size_pct <= 100)) errors.push("Position size must be between 0% and 100%.");
    if (!(r.max_positions >= 1) || !Number.isInteger(r.max_positions)) errors.push("Max positions must be a whole number of at least 1.");
    if (!(e.initial_capital > 0)) errors.push("Initial capital must be above 0.");
    if (e.commission_pct < 0 || e.slippage_pct < 0 || e.spread_pct < 0) errors.push("Commission, slippage and spread cannot be negative.");
    if (!start || !end) errors.push("Choose a backtest start and end date.");
    else if (start >= end) errors.push("The backtest start date must be before the end date.");
    else if (end > iso(new Date())) errors.push("The backtest end date cannot be in the future.");
    if (r.stop_loss_pct == null) warnings.push("No stop loss: a losing trade is only closed by an exit rule.");
    if (r.take_profit_pct && r.stop_loss_pct && r.take_profit_pct <= r.stop_loss_pct) warnings.push("Take profit is not larger than the stop loss (reward/risk below 1).");
    if (!strategy.indicators.length) warnings.push("No indicators: rules compare raw prices only.");
    if (!strategy.exit_rules.length) warnings.push("No exit rules: trades close only on stop loss, take profit or the end of the window.");
    if (r.position_size_pct * r.max_positions > 100) warnings.push(`Position size × max positions is ${r.position_size_pct * r.max_positions}% of capital, which may exceed 100%.`);
    if (start && end && start < end && (new Date(end).getTime() - new Date(start).getTime()) / 864e5 < 120) warnings.push("The window is under 4 months, so few or no trades may trigger.");
    return { errors, warnings, isValid: errors.length === 0 };
  }, [strategy, start, end]);

  // ---- save / run ----
  const save = useCallback(async (): Promise<StrategyConfig | null> => {
    setSaving(true);
    try {
      const saved = await api.saveStrategy(strategy);
      setSnapshot(JSON.stringify(strategy));
      setNotice({ tone: "ok", text: "Strategy saved" });
      return saved;
    } catch (err: any) {
      setNotice({ tone: "err", text: err?.message || "Could not save the strategy" });
      return null;
    } finally { setSaving(false); }
  }, [strategy]);

  const saveAndRun = useCallback(async () => {
    setTried(true);
    if (!validation.isValid) { setNotice({ tone: "err", text: validation.errors[0] }); return; }
    const saved = await save();
    if (!saved) return;
    const q = new URLSearchParams({ strategy: saved.id, ticker: strategy.asset, benchmark, startDate: start, endDate: end, autolaunch: "true" });
    router.push(`/backtests?${q.toString()}`);
  }, [validation, save, strategy.asset, benchmark, start, end, router]);

  const handlers = useRef({ save, saveAndRun });
  handlers.current = { save, saveAndRun };
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() === "s") { e.preventDefault(); handlers.current.save(); }
      else if (e.key === "Enter") { e.preventDefault(); handlers.current.saveAndRun(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // ---- section nav ----
  const lockUntil = useRef(0);
  const jump = (id: SectionId) => {
    setActive(id);
    lockUntil.current = Date.now() + 1000; // let the smooth scroll finish before the scroll-spy takes over again
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  useEffect(() => {
    if (!ready) return;
    const els = SECTIONS.map((s) => document.getElementById(`section-${s.id}`)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((entries) => {
      if (Date.now() < lockUntil.current) return;
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (vis) setActive(vis.target.id.replace("section-", "") as SectionId);
    }, { rootMargin: "-140px 0px -60% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ready]);

  const counts: Record<SectionId, string | number | null> = {
    identity: null, universe: strategy.asset, indicators: strategy.indicators.length, entry: strategy.entry_rules.length, exit: strategy.exit_rules.length,
    risk: strategy.risk.stop_loss_pct != null ? `SL ${strategy.risk.stop_loss_pct}%` : "No SL", execution: `${start.slice(0, 4)}–${end.slice(0, 4)}`,
  };
  const why = validation.errors[0];

  if (!ready) {
    return (
      <main className="app-container min-h-screen space-y-4 py-6" aria-busy="true">
        <CardSkeleton rows={1} className="h-20" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12"><div className="lg:col-span-2"><CardSkeleton rows={6} /></div><div className="lg:col-span-6"><CardSkeleton rows={8} /></div><div className="lg:col-span-4"><CardSkeleton rows={8} /></div></div>
      </main>
    );
  }

  const section = (id: SectionId, n: number, title: string, subtitle: string, icon: React.ComponentType<{ className?: string }>, tone: "blue" | "emerald" | "rose" | "amber" | "purple", children: React.ReactNode, action?: React.ReactNode) => (
    <div id={`section-${id}`} className="scroll-mt-36">
      <Card title={`${n}. ${title}`} subtitle={subtitle} icon={icon as any} tone={tone} action={action}>{children}</Card>
    </div>
  );

  return (
    <main className="app-container min-h-screen animate-fade-up space-y-4 py-6 font-sans">
      <header className="relative flex flex-col justify-between gap-4 border-b border-slate-800/60 pb-5 lg:flex-row lg:items-end">
        <div className="pointer-events-none absolute left-1/4 top-0 -z-10 h-24 w-96 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 top-0 -z-10 h-24 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="min-w-0">
          <Link href="/strategies" className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-white"><ArrowLeft className="h-3.5 w-3.5" />Strategies</Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">Strategy <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">Lab</span></h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">{strategy.name || "Untitled strategy"}</span>
            {dirty ? <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-400">Unsaved changes</span> : <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400">Saved</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setShowPresets(true)} className={btn}><Layers className="h-3.5 w-3.5 text-blue-400" />Presets</button>
          <button type="button" onClick={save} disabled={saving} className={btn}><Save className="h-3.5 w-3.5 text-blue-400" />{saving ? "Saving…" : "Save"}<kbd className="ml-1 font-mono text-[10px] text-slate-500">Ctrl S</kbd></button>
          <button type="button" onClick={() => { setTried(true); if (validation.isValid) setShowTest(true); else setNotice({ tone: "err", text: why }); }} title={validation.isValid ? "Run a quick test on any stock" : why} className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"><Play className="h-3.5 w-3.5 fill-current" />Test on stock</button>
          <button type="button" onClick={saveAndRun} disabled={saving} title={validation.isValid ? "Save, then run a full backtest" : why} className={cn("flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors", validation.isValid ? "bg-blue-600 shadow-lg shadow-blue-600/30 hover:bg-blue-500" : "bg-slate-700 hover:bg-slate-600")}><Play className="h-3.5 w-3.5" />Run backtest<kbd className="ml-1 font-mono text-[10px] opacity-70">Ctrl ⏎</kbd></button>
        </div>
      </header>

      {(notice || loadError) && (
        <div role={notice?.tone === "err" || loadError ? "alert" : "status"} className={cn("flex items-center justify-between gap-2 rounded-lg border p-3 text-xs", notice?.tone === "ok" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-rose-500/30 bg-rose-500/10 text-rose-300")}>
          <span className="flex items-center gap-2">{notice?.tone === "ok" ? <Check className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}{notice?.text ?? loadError}</span>
          <button type="button" aria-label="Dismiss" onClick={() => { setNotice(null); setLoadError(null); }} className="opacity-70 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* left: jump nav */}
        <aside className="lg:sticky lg:top-20 lg:col-span-2 lg:self-start">
          <nav aria-label="Strategy sections" className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-slate-800/80 bg-[#0b1120]/80 p-1 backdrop-blur-md lg:flex-col lg:overflow-visible">
            {SECTIONS.map((s) => (
              <button key={s.id} type="button" onClick={() => jump(s.id)} aria-current={active === s.id ? "true" : undefined}
                className={cn("flex min-w-max items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors", active === s.id ? "bg-blue-600 font-semibold text-white shadow-lg shadow-blue-600/30" : "font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200")}>
                <span>{s.label}</span>{counts[s.id] !== null && <span className={cn("font-mono text-[10px]", active === s.id ? "text-blue-100" : "text-slate-500")}>{counts[s.id]}</span>}
              </button>
            ))}
          </nav>
          <div className="mt-3 hidden space-y-1 rounded-xl border border-slate-800/90 bg-[#0b1222]/95 p-3 text-[11px] text-slate-400 lg:block">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200"><Zap className="h-3.5 w-3.5 text-amber-400" />No look-ahead</div>
            <p>Signals use data available at the bar close. Orders fill at the next bar&apos;s open.</p>
          </div>
        </aside>

        {/* centre: sections */}
        <div className="space-y-4 lg:col-span-6">
          {section("identity", 1, "Model identity & thesis", "Name it and say why it should work", UserRound, "blue", (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Strategy name" className="sm:col-span-2" hint={tried && !strategy.name.trim() ? "Required" : undefined} error><input value={strategy.name} onChange={(e) => patch({ name: e.target.value })} placeholder="e.g. EMA Momentum Alpha" className={cn(INPUT, tried && !strategy.name.trim() && "border-rose-500/60")} /></Field>
              <Field label="Style category"><select value={strategy.strategy_type || "trend"} onChange={(e) => patch({ strategy_type: e.target.value })} className={SELECT}>
                {[["trend", "Trend following"], ["mean_reversion", "Mean reversion"], ["momentum", "Momentum"], ["breakout", "Breakout"], ["volatility", "Volatility"], ["factor", "Quantitative factor"], ["systematic", "Systematic composite"], ["custom", "Bespoke custom"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
              <Field label="Timeframe"><select value={strategy.timeframe} onChange={(e) => patch({ timeframe: e.target.value })} className={SELECT}><option value="1D">1D · daily bars</option><option value="1W">1W · weekly bars</option></select></Field>
              <Field label="Hypothesis" className="sm:col-span-2"><textarea rows={3} value={strategy.description} onChange={(e) => patch({ description: e.target.value })} placeholder="What edge or anomaly does this exploit?" className={cn(INPUT, "resize-y")} /></Field>
            </div>
          ))}

          {section("universe", 2, "Target security", "India (NSE/BSE) and US equities; benchmark follows the market", Target, "emerald", (
            <EasyStockPicker selectedAsset={strategy.asset} onSelectAsset={(s, d) => selectAsset(s, d)} selectedBenchmark={benchmark} onBenchmarkChange={setBenchmark} />
          ))}

          {section("indicators", 3, "Indicator pipeline", `${strategy.indicators.length} defined; rules can reference them by id`, LineChart, "purple", (
            strategy.indicators.length === 0 ? <div className="rounded-lg border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500">No indicators yet. Add one, or rules will compare raw prices only.</div> : (
              <div className="space-y-2">{strategy.indicators.map((ind) => {
                const used = [...strategy.entry_rules, ...strategy.exit_rules].filter((r) => leftOf(r) === ind.id || rightOf(r) === ind.id).length;
                return (
                  <div key={ind.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#080d1a] p-3 text-xs">
                    <div className="flex items-center gap-2"><span className="font-bold text-white">{ind.name}</span><span className="rounded-md border border-slate-800 bg-[#0b1222] px-1.5 py-0.5 font-mono text-[10px] text-slate-400">{ind.id}</span>{used > 0 && <span className="text-[10px] text-slate-500">used in {used} rule{used > 1 ? "s" : ""}</span>}</div>
                    <div className="flex flex-wrap items-center gap-2">
                      {Object.entries(ind.params).map(([k, v]) => (
                        <label key={k} className="flex items-center gap-1 text-[10px] uppercase text-slate-400">{k.replace(/_/g, " ")}
                          <input type="number" min="0" step="any" value={v as number | string} onChange={(e) => setParam(ind.id, k, e.target.value)} className="w-16 rounded-md border border-slate-800 bg-[#0b1222] px-1.5 py-1 text-center font-mono text-xs normal-case text-blue-300 focus:border-blue-500 focus:outline-none" />
                        </label>
                      ))}
                      <button type="button" aria-label={`Remove ${ind.id}`} title={used ? `Used by ${used} rule(s); they will need fixing` : "Remove"} onClick={() => removeIndicator(ind.id)} className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                );
              })}</div>
            )
          ), (
            <select aria-label="Add indicator" value="" onChange={(e) => e.target.value && addIndicator(e.target.value)} className="cursor-pointer rounded-lg border border-slate-800 bg-[#080d1a] px-2 py-1.5 text-xs font-medium text-blue-300 focus:border-blue-500 focus:outline-none">
              <option value="">+ Add indicator</option>
              {AVAILABLE_INDICATORS.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          ))}

          {section("entry", 4, "Entry conditions", "All AND/OR rules are evaluated at the bar close", TrendingUp, "emerald",
            <RuleEditor kind="entry" rules={strategy.entry_rules} indicators={strategy.indicators} onAdd={() => addRule("entry")} onRemove={(id) => removeRule("entry", id)} onUpdate={(id, p) => updateRule("entry", id, p)} emptyIsError emptyHint="No entry rules. At least one is required to generate buy signals." />)}

          {section("exit", 5, "Exit conditions", "Optional: stop loss and take profit also close trades", TrendingDown, "rose",
            <RuleEditor kind="exit" rules={strategy.exit_rules} indicators={strategy.indicators} onAdd={() => addRule("exit")} onRemove={(id) => removeRule("exit", id)} onUpdate={(id, p) => updateRule("exit", id, p)} emptyHint="No exit rules. Trades close on stop loss, take profit or the end of the window." />)}

          {section("risk", 6, "Risk management", "Portfolio protection per trade", ShieldCheck, "amber", (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Stop loss (%)" hint="optional"><input type="number" step="0.1" min="0" value={strategy.risk.stop_loss_pct ?? ""} onChange={(e) => patchRisk({ stop_loss_pct: num(e.target.value) })} placeholder="e.g. 2" className={cn(INPUT, "font-mono text-rose-300")} /></Field>
              <Field label="Take profit (%)" hint="optional"><input type="number" step="0.1" min="0" value={strategy.risk.take_profit_pct ?? ""} onChange={(e) => patchRisk({ take_profit_pct: num(e.target.value) })} placeholder="e.g. 6" className={cn(INPUT, "font-mono text-emerald-300")} /></Field>
              <Field label="Trailing stop (%)" hint="optional"><input type="number" step="0.5" min="0" value={strategy.risk.trailing_stop_pct ?? ""} onChange={(e) => patchRisk({ trailing_stop_pct: num(e.target.value) })} placeholder="None" className={cn(INPUT, "font-mono")} /></Field>
              <Field label="Position size (% of capital)"><input type="number" step="1" min="1" max="100" value={strategy.risk.position_size_pct} onChange={(e) => patchRisk({ position_size_pct: Number(e.target.value) })} className={cn(INPUT, "font-mono")} /></Field>
              <Field label="Max concurrent positions"><input type="number" step="1" min="1" value={strategy.risk.max_positions} onChange={(e) => patchRisk({ max_positions: Number(e.target.value) })} className={cn(INPUT, "font-mono")} /></Field>
              <Field label="Direction"><label className="flex h-[34px] cursor-pointer items-center gap-2 rounded-lg border border-slate-800 bg-[#080d1a] px-3 text-xs text-slate-300"><input type="checkbox" checked={strategy.risk.allow_short} onChange={(e) => patchRisk({ allow_short: e.target.checked })} className="accent-blue-600" />Allow shorting</label></Field>
            </div>
          ))}

          {section("execution", 7, "Execution friction & window", "Costs and the period the backtest covers", Settings2, "blue", (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <Field label={`Initial capital (${sym})`}><input type="number" min="1" value={strategy.execution.initial_capital} onChange={(e) => patchExec({ initial_capital: Number(e.target.value) })} className={cn(INPUT, "font-mono")} /></Field>
                <Field label="Commission (%)"><input type="number" step="0.01" min="0" value={strategy.execution.commission_pct} onChange={(e) => patchExec({ commission_pct: Number(e.target.value) })} className={cn(INPUT, "font-mono")} /></Field>
                <Field label="Slippage (%)"><input type="number" step="0.01" min="0" value={strategy.execution.slippage_pct} onChange={(e) => patchExec({ slippage_pct: Number(e.target.value) })} className={cn(INPUT, "font-mono")} /></Field>
                <Field label="Spread (%)"><input type="number" step="0.01" min="0" value={strategy.execution.spread_pct} onChange={(e) => patchExec({ spread_pct: Number(e.target.value) })} className={cn(INPUT, "font-mono")} /></Field>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <Field label="Start date"><input type="date" value={start} max={end || undefined} onChange={(e) => setStart(e.target.value)} className={cn(INPUT, "font-mono")} /></Field>
                <Field label="End date"><input type="date" value={end} min={start || undefined} max={iso(new Date())} onChange={(e) => setEnd(e.target.value)} className={cn(INPUT, "font-mono")} /></Field>
                <Field label={`Benchmark (${market})`} className="sm:col-span-2"><BenchmarkSelect market={market} value={benchmark} onChange={setBenchmark} /></Field>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                <Clock className="h-3.5 w-3.5" />Quick window
                {[1, 2, 3, 5].map((y) => <button key={y} type="button" onClick={() => { setStart(yearsBack(y)); setEnd(iso(new Date())); }} className="rounded-md border border-slate-800 bg-[#080d1a] px-2 py-1 font-semibold text-slate-300 hover:text-white">{y}Y</button>)}
                <label className="ml-2 flex cursor-pointer items-center gap-1.5"><input type="checkbox" checked={strategy.execution.allow_fractional} onChange={(e) => patchExec({ allow_fractional: e.target.checked })} className="accent-blue-600" />Fractional shares</label>
              </div>
            </div>
          ))}
        </div>

        {/* right: summary */}
        <aside className="space-y-3 lg:sticky lg:top-20 lg:col-span-4 lg:self-start">
          <Card title="Strategy summary" subtitle="Live blueprint" icon={SlidersHorizontal} tone="blue">
            <div className="space-y-3 text-xs">
              <div><div className="text-sm font-bold text-white">{strategy.name || "Untitled strategy"}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400"><span className="font-mono font-bold text-blue-300">{strategy.asset}</span>·<span>{strategy.timeframe}</span>·<span className="uppercase">{(strategy.strategy_type || "trend").replace("_", " ")}</span>·<span>{market}</span></div></div>
              <div><div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Indicators ({strategy.indicators.length})</div>
                <div className="flex flex-wrap gap-1">{strategy.indicators.length ? strategy.indicators.map((i) => <span key={i.id} className="rounded-md border border-slate-800 bg-[#080d1a] px-1.5 py-0.5 font-mono text-[10px] text-slate-200">{i.name}({Object.values(i.params).join(",")})</span>) : <span className="text-slate-500">None</span>}</div></div>
              <div className="space-y-2 rounded-lg border border-slate-800 bg-[#080d1a] p-2.5 font-mono text-[11px]">
                <div><span className="font-sans text-[10px] font-bold uppercase text-emerald-400">Entry</span><p className="mt-0.5 text-slate-200">{strategy.entry_rules.length ? formatRuleSet(strategy.entry_rules, strategy.indicators) : "—"}</p></div>
                <div className="border-t border-slate-800 pt-2"><span className="font-sans text-[10px] font-bold uppercase text-rose-400">Exit</span><p className="mt-0.5 text-slate-200">{strategy.exit_rules.length ? formatRuleSet(strategy.exit_rules, strategy.indicators) : "Stop loss / take profit only"}</p></div>
              </div>
              <div className="divide-y divide-slate-800/60 rounded-lg border border-slate-800 bg-[#080d1a] px-2.5 text-[11px]">
                {([
                  ["Stop loss", strategy.risk.stop_loss_pct != null ? `-${strategy.risk.stop_loss_pct}%` : "None", "text-rose-400"],
                  ["Take profit", strategy.risk.take_profit_pct != null ? `+${strategy.risk.take_profit_pct}%` : "None", "text-emerald-400"],
                  ["Position size", `${strategy.risk.position_size_pct}% × max ${strategy.risk.max_positions}`, "text-white"],
                  ["Capital", `${sym}${Number(strategy.execution.initial_capital).toLocaleString(market === "India" ? "en-IN" : "en-US")}`, "text-white"],
                  ["Costs", `${strategy.execution.commission_pct}% + ${strategy.execution.slippage_pct}% slip`, "text-slate-200"],
                  ["Window", `${start} → ${end}`, "text-slate-200"],
                  ["Benchmark", benchmark, "text-blue-300"],
                  ["Execution", "Next bar open (t+1)", "text-blue-300"],
                ] as const).map(([k, v, c]) => <div key={k} className="flex justify-between py-1.5"><span className="text-slate-400">{k}</span><span className={cn("font-mono font-semibold", c)}>{v}</span></div>)}
              </div>
            </div>
          </Card>

          <div className={cn("rounded-xl border p-3 text-xs", validation.isValid ? "border-emerald-500/30 bg-emerald-500/10" : "border-rose-500/30 bg-rose-500/10")} role="status">
            <div className={cn("flex items-center gap-1.5 font-semibold", validation.isValid ? "text-emerald-300" : "text-rose-300")}>{validation.isValid ? <><Check className="h-3.5 w-3.5" />Ready to test and backtest</> : <><AlertTriangle className="h-3.5 w-3.5" />{validation.errors.length} issue{validation.errors.length > 1 ? "s" : ""} to fix</>}</div>
            {validation.errors.map((m, i) => <p key={i} className="mt-1 pl-5 text-[11px] text-rose-300">• {m}</p>)}
            {validation.warnings.map((m, i) => <p key={i} className="mt-1 pl-5 text-[11px] text-amber-300">• {m}</p>)}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={saveAndRun} disabled={saving} className={cn("col-span-2 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold text-white transition-colors", validation.isValid ? "bg-blue-600 shadow-lg shadow-blue-600/30 hover:bg-blue-500" : "bg-slate-700 hover:bg-slate-600")}><Play className="h-3.5 w-3.5" />Run full backtest</button>
            <button type="button" onClick={save} disabled={saving} className={cn(btn, "justify-center")}><Save className="h-3.5 w-3.5 text-blue-400" />{saving ? "Saving…" : "Save"}</button>
            <button type="button" onClick={() => { setTried(true); if (validation.isValid) setShowTest(true); else setNotice({ tone: "err", text: why }); }} className={cn(btn, "justify-center")}><FlaskConical className="h-3.5 w-3.5 text-emerald-400" />Test on stock</button>
          </div>
        </aside>
      </div>

      {showPresets && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Presets" onClick={(e) => e.target === e.currentTarget && setShowPresets(false)}>
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-800/90 bg-[#0b1222] shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between border-b border-slate-800 p-4"><div><h3 className="text-sm font-bold text-white">Start from a preset</h3><p className="text-[11px] text-slate-400">Your selected stock, benchmark and window are kept.</p></div><button type="button" aria-label="Close" onClick={() => setShowPresets(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800/60 hover:text-white"><X className="h-4 w-4" /></button></div>
            <div className="space-y-3 overflow-y-auto p-4">
              <button type="button" onClick={() => { setStrategy((s) => ({ ...DEFAULT_STRATEGY, id: `strat_${Date.now()}`, name: "New strategy", description: "", asset: s.asset, universe: [s.asset], indicators: [], entry_rules: [], exit_rules: [], execution: s.execution })); setShowPresets(false); setTried(false); }} className="w-full rounded-xl border border-dashed border-slate-700 bg-[#080d1a] p-3 text-left transition-colors hover:border-blue-500/50"><div className="flex items-center gap-1.5 text-xs font-semibold text-white"><Plus className="h-3.5 w-3.5 text-blue-400" />Blank canvas</div><p className="mt-0.5 text-[11px] text-slate-400">Empty indicator pipeline and no rules.</p></button>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Templates</div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {templates.map((t) => (
                  <button key={t.id} type="button" onClick={() => { setStrategy((s) => ({ ...t, id: `strat_${Date.now()}`, name: `${t.name} (Custom)`, asset: s.asset, universe: [s.asset], execution: { ...t.execution, initial_capital: s.execution.initial_capital }, created_at: undefined })); setShowPresets(false); setTried(false); }} className="rounded-xl border border-slate-800 bg-[#080d1a] p-3 text-left transition-colors hover:border-blue-500/50 hover:bg-[#0b1222]">
                    <div className="truncate text-xs font-semibold text-white">{t.name}</div><div className="mt-0.5 text-[10px] uppercase text-blue-300">{(t.strategy_type || "custom").replace("_", " ")} · {t.indicators.length} indicators</div></button>
                ))}
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-800 p-3"><button type="button" onClick={() => setShowPresets(false)} className={btn}>Cancel</button></div>
          </div>
        </div>
      )}

      <TestStrategyModal isOpen={showTest} onClose={() => setShowTest(false)} strategy={strategy} initialStock={strategy.asset} />
    </main>
  );
}

export default function StrategyBuilderPage() {
  return <Suspense fallback={<main className="app-container min-h-screen py-6" aria-busy="true"><CardSkeleton rows={8} /></main>}><BuilderContent /></Suspense>;
}
