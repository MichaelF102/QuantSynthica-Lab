"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle, ArrowLeft, Check, Clock, FlaskConical, Layers, LineChart, Play, Plus, Save, Settings2, ShieldCheck, SlidersHorizontal,
  Target, TrendingDown, TrendingUp, Trash2, UserRound, X, Zap, Undo2, Redo2, Download, Upload, ExternalLink, History, RotateCcw,
} from "lucide-react";
import { api } from "@/lib/api";
import { StrategyConfig, IndicatorConfig, ConditionRule, BacktestResult } from "@/types";
import { AVAILABLE_INDICATORS, DEFAULT_STRATEGY } from "@/lib/constants";
import { SEED_STRATEGIES } from "@/lib/seedData";
import { loadSystemSettings } from "@/lib/settings";
import { alignBenchmark, marketOfTicker } from "@/lib/market";
import { formatRuleSet } from "@/lib/formatRule";
import { describeChanges } from "@/lib/strategyDiff";
import { useEscape } from "@/lib/useEscape";
import { cn } from "@/lib/utils";
import { Card, CardSkeleton } from "@/components/ui/Card";
import BenchmarkSelect from "@/components/ui/BenchmarkSelect";
import Select from "@/components/ui/Select";
import EasyStockPicker from "@/components/strategies/EasyStockPicker";
import TestStrategyModal from "@/components/strategies/TestStrategyModal";
import ParamSweep from "@/components/builder/ParamSweep";
import LivePreview from "@/components/builder/LivePreview";
import { ruleIssues } from "@/lib/ruleLanguage";
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
  { id: "sweep", label: "Parameter sweep" },
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
  const [start, setStart] = useState(yearsBack(3));
  const [end, setEnd] = useState(iso(new Date()));
  const [benchmark, setBenchmark] = useState("SPY");
  const [tried, setTried] = useState(false);

  const market = marketOfTicker(strategy.asset);
  const sym = market === "India" ? "₹" : "$";
  const dirty = ready && JSON.stringify(strategy) !== snapshot;
  const patch = useCallback((p: Partial<StrategyConfig>) => setStrategy((s) => ({ ...s, ...p })), []);
  const patchRisk = (p: Partial<StrategyConfig["risk"]>) => setStrategy((s) => ({ ...s, risk: { ...s.risk, ...p } }));
  const [atrMode, setAtrMode] = useState(false);
  const switchStopMode = (atr: boolean) => {
    setAtrMode(atr);
    patchRisk(atr ? { stop_atr_mult: 2, take_profit_atr_mult: 3, stop_loss_pct: null, take_profit_pct: null } : { stop_atr_mult: null, take_profit_atr_mult: null, stop_loss_pct: 2, take_profit_pct: 6 });
  };
  useEffect(() => {
    const r = strategy.risk;
    if (r.stop_atr_mult || r.take_profit_atr_mult) setAtrMode(true);
    else if (r.stop_loss_pct != null || r.take_profit_pct != null) setAtrMode(false);
  }, [strategy.risk.stop_atr_mult, strategy.risk.take_profit_atr_mult, strategy.risk.stop_loss_pct, strategy.risk.take_profit_pct]); // eslint-disable-line react-hooks/exhaustive-deps
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
      setAtrMode(!!(s.risk.stop_atr_mult || s.risk.take_profit_atr_mult));
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

  // ---- validation (each issue is tagged with the section it belongs to) ----
  const validation = useMemo(() => {
    const issues: { section: SectionId; level: "error" | "warn"; text: string }[] = [];
    const err = (section: SectionId, text: string) => issues.push({ section, level: "error", text });
    const warn = (section: SectionId, text: string) => issues.push({ section, level: "warn", text });
    const ids = new Set([...PRICE_IDS, ...strategy.indicators.map((i) => i.id)]);
    const r = strategy.risk, e = strategy.execution;
    if (!strategy.name.trim()) err("identity", "Give the strategy a name.");
    if (!strategy.asset.trim()) err("universe", "Pick a target stock.");
    if (!strategy.entry_rules.length) err("entry", "Add at least one entry rule.");
    strategy.indicators.forEach((i) => Object.entries(i.params).forEach(([k, v]) => {
      if (v === "" || !Number.isFinite(Number(v)) || Number(v) <= 0) err("indicators", `${i.name} (${i.id}): ${k} must be a positive number.`);
    }));
    const check = (sec: "entry" | "exit", label: string, rules: ConditionRule[]) => rules.forEach((rule, i) => {
      const l = leftOf(rule), rt = rightOf(rule), thr = rule.threshold;
      if (!l || !ids.has(l)) err(sec, `${label} rule ${i + 1}: left side "${l || "empty"}" is not a price or an indicator in this strategy.`);
      if (thr === null || thr === undefined) { if (!rt || !ids.has(rt)) err(sec, `${label} rule ${i + 1}: right side "${rt || "empty"}" is not a price or an indicator in this strategy.`); }
      else if (!Number.isFinite(Number(thr))) err(sec, `${label} rule ${i + 1}: the value is not a number.`);
      ruleIssues(rule, strategy.indicators).filter((x) => x.level === "warn").forEach((x) => warn(sec, `${label} rule ${i + 1}: ${x.text}`));
    });
    check("entry", "Entry", strategy.entry_rules); check("exit", "Exit", strategy.exit_rules);
    if (r.stop_loss_pct != null && r.stop_loss_pct <= 0) err("risk", "Stop loss must be above 0%, or left empty.");
    if (r.take_profit_pct != null && r.take_profit_pct <= 0) err("risk", "Take profit must be above 0%, or left empty.");
    if (r.trailing_stop_pct != null && r.trailing_stop_pct <= 0) err("risk", "Trailing stop must be above 0%, or left empty.");
    if (r.stop_atr_mult != null && !(r.stop_atr_mult > 0)) err("risk", "ATR stop multiple must be above 0, or left empty.");
    if (r.take_profit_atr_mult != null && !(r.take_profit_atr_mult > 0)) err("risk", "ATR target multiple must be above 0, or left empty.");
    if ((r.stop_atr_mult || r.take_profit_atr_mult) && !(Number.isInteger(r.atr_period ?? 14) && (r.atr_period ?? 14) >= 2)) err("risk", "ATR period must be a whole number of at least 2.");
    if (r.target_volatility != null && !(r.target_volatility > 0)) err("risk", "Volatility target must be above 0%, or left empty.");
    if (!(r.position_size_pct > 0 && r.position_size_pct <= 100)) err("risk", "Position size must be between 0% and 100%.");
    if (r.allow_stacking && (!(r.max_positions >= 1) || !Number.isInteger(r.max_positions))) err("risk", "Max positions must be a whole number of at least 1.");
    if (!(e.initial_capital > 0)) err("execution", "Initial capital must be above 0.");
    if (e.commission_pct < 0 || e.slippage_pct < 0 || e.spread_pct < 0) err("execution", "Commission, slippage and spread cannot be negative.");
    if (!start || !end) err("execution", "Choose a backtest start and end date.");
    else if (start >= end) err("execution", "The backtest start date must be before the end date.");
    else if (end > iso(new Date())) err("execution", "The backtest end date cannot be in the future.");
    if (r.stop_loss_pct == null && !r.stop_atr_mult && !r.trailing_stop_pct) warn("risk", "No stop loss: a losing trade is only closed by an exit rule.");
    if (r.stop_atr_mult && r.stop_loss_pct != null) warn("risk", "The ATR stop replaces the percentage stop loss; the percentage value is ignored.");
    if (r.take_profit_atr_mult && r.take_profit_pct != null) warn("risk", "The ATR target replaces the percentage take profit; the percentage value is ignored.");
    if ((r.direction ?? "long") === "both" && !strategy.exit_rules.length) warn("risk", "Long & short flips to short on the exit rules, but there are none, so it will never go short.");
    if ((r.direction ?? "long") !== "long" && !r.stop_loss_pct && !r.stop_atr_mult && !r.trailing_stop_pct) warn("risk", "Short positions have unlimited loss potential; add a stop.");
    if (r.target_volatility && r.position_size_pct >= 100) warn("risk", "A volatility target can only scale the position down from the position size; at 100% it has little room to act.");
    if (!r.stop_atr_mult && !r.take_profit_atr_mult && r.take_profit_pct && r.stop_loss_pct && r.take_profit_pct <= r.stop_loss_pct) warn("risk", "Take profit is not larger than the stop loss (reward/risk below 1).");
    if (!strategy.indicators.length) warn("indicators", "No indicators: rules compare raw prices only.");
    if (!strategy.exit_rules.length) warn("exit", "No exit rules: trades close only on stop loss, take profit or the end of the window.");
    if (r.allow_stacking && r.position_size_pct * r.max_positions > 100) warn("risk", `Position size × max positions is ${r.position_size_pct * r.max_positions}% of capital, which may exceed 100%.`);
    if (start && end && start < end) {
      const days = (new Date(end).getTime() - new Date(start).getTime()) / 864e5;
      const barDays = strategy.timeframe === "1W" ? 7 : 1.45; // calendar days per bar (≈252 trading days a year)
      const longest = Math.max(0, ...strategy.indicators.flatMap((i) => Object.values(i.params ?? {}).filter((v): v is number => typeof v === "number")));
      if (days < 120) warn("execution", "The window is under 4 months, so few or no trades may trigger.");
      else if (days < 730) warn("execution", "The window is under 2 years: a crossover-style strategy may produce only a handful of trades, too few to judge it. Use 3–5 years.");
      else if (longest > 0 && days / barDays < longest * 6) warn("execution", `The longest indicator period is ${longest} bars but the window has only about ${Math.round(days / barDays)}, so few signals are expected. Widen the window.`);
    }
    const errors = issues.filter((x) => x.level === "error").map((x) => x.text);
    const warnings = issues.filter((x) => x.level === "warn").map((x) => x.text);
    const bySection = (sec: SectionId) => ({ errors: issues.filter((x) => x.section === sec && x.level === "error").length, warnings: issues.filter((x) => x.section === sec && x.level === "warn").length });
    return { errors, warnings, isValid: errors.length === 0, bySection };
  }, [strategy, start, end]);

  // ---- undo / redo (edits within 500 ms are one step) ----
  const hist = useRef<{ past: StrategyConfig[]; future: StrategyConfig[]; committed: StrategyConfig | null; timer: ReturnType<typeof setTimeout> | null }>({ past: [], future: [], committed: null, timer: null });
  const [, setHistTick] = useState(0);
  const flushHistory = useCallback((current: StrategyConfig) => {
    const h = hist.current;
    if (h.timer) { clearTimeout(h.timer); h.timer = null; }
    if (h.committed && JSON.stringify(h.committed) !== JSON.stringify(current)) {
      h.past.push(h.committed); if (h.past.length > 100) h.past.shift();
      h.future = [];
      h.committed = current;
      setHistTick((t) => t + 1);
    }
  }, []);
  useEffect(() => {
    if (!ready) return;
    const h = hist.current;
    if (!h.committed) { h.committed = strategy; return; }
    if (JSON.stringify(h.committed) === JSON.stringify(strategy)) return;
    if (h.timer) clearTimeout(h.timer);
    h.timer = setTimeout(() => flushHistory(strategy), 500);
    return () => { if (h.timer) clearTimeout(h.timer); };
  }, [strategy, ready, flushHistory]);
  const undo = useCallback(() => {
    const h = hist.current;
    flushHistory(strategy);
    const prev = h.past.pop();
    if (!prev) return;
    h.future.push(strategy); h.committed = prev;
    setStrategy(prev); setHistTick((t) => t + 1);
  }, [strategy, flushHistory]);
  const redo = useCallback(() => {
    const h = hist.current;
    const next = h.future.pop();
    if (!next) return;
    h.past.push(strategy); h.committed = next;
    setStrategy(next); setHistTick((t) => t + 1);
  }, [strategy]);
  const canUndo = hist.current.past.length > 0 || (!!hist.current.committed && JSON.stringify(hist.current.committed) !== JSON.stringify(strategy));
  const canRedo = hist.current.future.length > 0;

  // ---- JSON import / export ----
  const fileInput = useRef<HTMLInputElement>(null);
  const exportJson = () => {
    const payload = { format: "quantsynthica.strategy/1", exported_at: new Date().toISOString(), strategy, window: { start, end }, benchmark };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url; a.download = `${(strategy.name || "strategy").trim().replace(/[^\w-]+/g, "_")}.json`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    setNotice({ tone: "ok", text: "Strategy exported as JSON" });
  };
  const importJson = async (file: File) => {
    try {
      const raw = JSON.parse(await file.text());
      const st = raw?.strategy ?? raw;
      const bad = !st || typeof st.name !== "string" || !Array.isArray(st.indicators) || !Array.isArray(st.entry_rules) || !Array.isArray(st.exit_rules) || typeof st.risk !== "object" || typeof st.execution !== "object" || !st.risk || !st.execution || typeof st.asset !== "string";
      if (bad) throw new Error("That file is not a QuantSynthica strategy (needs name, asset, indicators, entry/exit rules, risk and execution).");
      const imported: StrategyConfig = { ...DEFAULT_STRATEGY, ...st, risk: { ...DEFAULT_STRATEGY.risk, ...st.risk }, execution: { ...DEFAULT_STRATEGY.execution, ...st.execution }, id: `strat_${Date.now()}`, created_at: undefined, updated_at: undefined, archived: false };
      setStrategy(imported);
      if (raw?.window?.start && raw?.window?.end) { setStart(String(raw.window.start)); setEnd(String(raw.window.end)); }
      setBenchmark(alignBenchmark(imported.asset, raw?.benchmark || benchmark));
      setNotice({ tone: "ok", text: `Imported "${imported.name}". Review it, then save.` });
    } catch (e: any) {
      setNotice({ tone: "err", text: e instanceof SyntaxError ? "That file is not valid JSON." : e?.message || "Could not import the file" });
    }
  };

  // ---- last result of this strategy ----
  const [lastRun, setLastRun] = useState<BacktestResult | null>(null);
  useEffect(() => {
    if (!ready) return;
    let live = true;
    api.getBacktests().then((bts) => {
      if (!live) return;
      const mine = (bts ?? []).filter((b) => b.strategy_id === strategy.id && b.status === "COMPLETED" && b.metrics && !b.is_sample);
      setLastRun(mine.length ? mine[mine.length - 1] : null);
    }).catch(() => live && setLastRun(null));
    return () => { live = false; };
  }, [ready, strategy.id]);

  // ---- guard in-app navigation while there are unsaved edits ----
  useEffect(() => {
    if (!dirty) return;
    const h = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.origin !== window.location.origin || a.pathname === window.location.pathname) return;
      if (!confirm("You have unsaved changes in this strategy. Leave without saving?")) { e.preventDefault(); e.stopPropagation(); }
    };
    document.addEventListener("click", h, true);
    return () => document.removeEventListener("click", h, true);
  }, [dirty]);

  // ---- apply the best values from a parameter sweep ----
  const applyBest = (vals: Record<string, number>) => {
    setStrategy((s) => {
      const next: StrategyConfig = { ...s, indicators: s.indicators.map((i) => ({ ...i, params: { ...i.params } })), risk: { ...s.risk } };
      Object.entries(vals).forEach(([key, v]) => {
        if (key.startsWith("risk.")) (next.risk as any)[key.slice(5)] = v;
        else {
          const dot = key.indexOf(".");
          const ind = next.indicators.find((i) => i.id === key.slice(0, dot));
          if (ind) ind.params[key.slice(dot + 1)] = v;
        }
      });
      return next;
    });
    setNotice({ tone: "ok", text: "Applied the best values from the sweep. Review the preview, then save." });
  };

  // ---- version history ----
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState<{ version: number; saved_at: string | null; strategy: StrategyConfig }[] | null>(null);
  useEscape(showHistory, () => setShowHistory(false));
  const openHistory = () => { setShowHistory(true); setVersions(null); api.getStrategyVersions(strategy.id).then(setVersions); };
  const restoreVersion = (v: StrategyConfig) => {
    setStrategy({ ...v, id: strategy.id, created_at: strategy.created_at, updated_at: strategy.updated_at });
    setShowHistory(false);
    setNotice({ tone: "ok", text: "Restored as an unsaved edit. Save to make it the current version." });
  };

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

  const handlers = useRef({ save, saveAndRun, undo, redo });
  handlers.current = { save, saveAndRun, undo, redo };
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName);
      if (!typing && e.key.toLowerCase() === "z") { e.preventDefault(); (e.shiftKey ? handlers.current.redo : handlers.current.undo)(); }
      else if (!typing && e.key.toLowerCase() === "y") { e.preventDefault(); handlers.current.redo(); }
      else if (e.key.toLowerCase() === "s") { e.preventDefault(); handlers.current.save(); }
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
    risk: strategy.risk.stop_atr_mult ? `SL ${strategy.risk.stop_atr_mult}×ATR` : strategy.risk.stop_loss_pct != null ? `SL ${strategy.risk.stop_loss_pct}%` : "No SL", execution: `${start.slice(0, 4)}–${end.slice(0, 4)}`,
    sweep: Object.keys(strategy.param_ranges ?? {}).length || null,
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
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-slate-400">
            <Link href="/strategies" className="inline-flex items-center gap-1.5 transition-colors hover:text-white"><ArrowLeft className="h-3.5 w-3.5" />Strategies</Link>
            <span aria-hidden className="text-slate-600">/</span>
            <span className="text-slate-200" aria-current="page">Strategy Lab</span>
          </nav>
          <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">Strategy <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">Lab</span></h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">{strategy.name || "Untitled strategy"}</span>
            {dirty ? <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-400">Unsaved changes</span> : <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400">Saved</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo (Ctrl Z)" className={btn}><Undo2 className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo (Ctrl Shift Z)" className={btn}><Redo2 className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={() => setShowPresets(true)} className={btn}><Layers className="h-3.5 w-3.5 text-blue-400" />Presets</button>
          <button type="button" onClick={openHistory} title="Saved versions of this strategy" className={btn}><History className="h-3.5 w-3.5" />History</button>
          <button type="button" onClick={() => fileInput.current?.click()} title="Import a strategy from a JSON file" className={btn}><Upload className="h-3.5 w-3.5" />Import</button>
          <button type="button" onClick={exportJson} title="Download this strategy as JSON" className={btn}><Download className="h-3.5 w-3.5" />Export</button>
          <input ref={fileInput} type="file" accept="application/json,.json" aria-label="Import strategy JSON" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ""; }} />
          {lastRun && (
            <Link href={`/backtests/${lastRun.id}`} title={`Latest run on ${lastRun.ticker}`} className={btn}><ExternalLink className="h-3.5 w-3.5 text-emerald-400" />Last result<span className={cn("font-mono", (lastRun.metrics?.total_return ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400")}>{lastRun.metrics ? `${lastRun.metrics.total_return >= 0 ? "+" : ""}${lastRun.metrics.total_return.toFixed(2)}%` : ""}</span></Link>
          )}
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
                <span>{s.label}</span>
                <span className="flex items-center gap-1.5">
                  {counts[s.id] !== null && <span className={cn("font-mono text-[10px]", active === s.id ? "text-blue-100" : "text-slate-500")}>{counts[s.id]}</span>}
                  {(() => {
                    const st = validation.bySection(s.id);
                    if (st.errors > 0) return <span title={`${st.errors} issue${st.errors > 1 ? "s" : ""} to fix`} aria-label={`${st.errors} issues to fix`} className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 font-mono text-[9px] font-bold text-white">{st.errors}</span>;
                    if (st.warnings > 0) return <span title={`${st.warnings} warning${st.warnings > 1 ? "s" : ""}`} aria-label={`${st.warnings} warnings`} className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/90 font-mono text-[10px] font-bold text-black">!</span>;
                    return <Check aria-label="No issues" className="h-3.5 w-3.5 text-emerald-400" />;
                  })()}
                </span>
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
              <Field label="Style category"><Select label="Style category" value={strategy.strategy_type || "trend"} onChange={(v) => patch({ strategy_type: v })} options={[["trend", "Trend following"], ["mean_reversion", "Mean reversion"], ["momentum", "Momentum"], ["breakout", "Breakout"], ["volatility", "Volatility"], ["factor", "Quantitative factor"], ["systematic", "Systematic composite"], ["custom", "Bespoke custom"]].map(([value, label]) => ({ value, label }))} /></Field>
              <Field label="Timeframe"><Select label="Timeframe" value={strategy.timeframe} onChange={(v) => patch({ timeframe: v })} options={[{ value: "1D", label: "1D · daily bars" }, { value: "1W", label: "1W · weekly bars" }]} /></Field>
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

          {section("risk", 6, "Risk management", "Direction, stops and position sizing", ShieldCheck, "amber", (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Direction" className="sm:col-span-1">
                  <Select label="Direction" value={strategy.risk.direction ?? (strategy.risk.allow_short ? "both" : "long")} onChange={(v) => patchRisk({ direction: v as "long" | "short" | "both", allow_short: v !== "long" })} options={[{ value: "long", label: "Long only" }, { value: "short", label: "Short only" }, { value: "both", label: "Long & short" }]} />
                </Field>
                <p className="text-[11px] leading-relaxed text-slate-400 sm:col-span-2 sm:pt-5" data-testid="direction-help">
                  {(strategy.risk.direction ?? (strategy.risk.allow_short ? "both" : "long")) === "long" && "Entry rules buy; exit rules sell. Stops and targets close the trade early."}
                  {(strategy.risk.direction ?? "long") === "short" && "Entry rules open a short sale; exit rules cover it. The stop sits above the entry and the target below."}
                  {(strategy.risk.direction ?? "long") === "both" && "Entry rules go long. Exit rules flip the position to short, and the entry rules flip it back."}
                </p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Stop and target</span>
                  <div className="flex rounded-lg border border-slate-800 bg-[#080d1a] p-0.5 text-[11px]" role="group" aria-label="Stop type">
                    {([["pct", "Percent"], ["atr", "ATR multiple"]] as const).map(([m, l]) => (
                      <button key={m} type="button" aria-pressed={atrMode === (m === "atr")} onClick={() => switchStopMode(m === "atr")} className={cn("rounded-md px-2.5 py-1 font-semibold", atrMode === (m === "atr") ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white")}>{l}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {atrMode ? (<>
                    <Field label="Stop (× ATR)" hint="optional"><input type="number" step="0.1" min="0" value={strategy.risk.stop_atr_mult ?? ""} onChange={(e) => patchRisk({ stop_atr_mult: num(e.target.value) })} placeholder="e.g. 2" className={cn(INPUT, "font-mono text-rose-300")} /></Field>
                    <Field label="Target (× ATR)" hint="optional"><input type="number" step="0.1" min="0" value={strategy.risk.take_profit_atr_mult ?? ""} onChange={(e) => patchRisk({ take_profit_atr_mult: num(e.target.value) })} placeholder="e.g. 3" className={cn(INPUT, "font-mono text-emerald-300")} /></Field>
                    <Field label="ATR period"><input type="number" step="1" min="2" value={strategy.risk.atr_period ?? 14} onChange={(e) => patchRisk({ atr_period: Number(e.target.value) })} className={cn(INPUT, "font-mono")} /></Field>
                  </>) : (<>
                    <Field label="Stop loss (%)" hint="optional"><input type="number" step="0.1" min="0" value={strategy.risk.stop_loss_pct ?? ""} onChange={(e) => patchRisk({ stop_loss_pct: num(e.target.value) })} placeholder="e.g. 2" className={cn(INPUT, "font-mono text-rose-300")} /></Field>
                    <Field label="Take profit (%)" hint="optional"><input type="number" step="0.1" min="0" value={strategy.risk.take_profit_pct ?? ""} onChange={(e) => patchRisk({ take_profit_pct: num(e.target.value) })} placeholder="e.g. 6" className={cn(INPUT, "font-mono text-emerald-300")} /></Field>
                  </>)}
                  <Field label="Trailing stop (%)" hint="optional"><input type="number" step="0.5" min="0" value={strategy.risk.trailing_stop_pct ?? ""} onChange={(e) => patchRisk({ trailing_stop_pct: num(e.target.value) })} placeholder="None" className={cn(INPUT, "font-mono")} /></Field>
                </div>
                {atrMode && <p className="mt-1.5 text-[10px] text-slate-500">Distances are measured from the entry price in multiples of the ATR at the signal bar. No trade is opened until the ATR exists.</p>}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Position size (% of capital)"><input type="number" step="1" min="1" max="100" value={strategy.risk.position_size_pct} onChange={(e) => patchRisk({ position_size_pct: Number(e.target.value) })} className={cn(INPUT, "font-mono")} /></Field>
                <Field label="Positions">
                  <Select label="Positions" value={strategy.risk.allow_stacking ? "stack" : "one"} onChange={(v) => patchRisk({ allow_stacking: v === "stack" })} options={[{ value: "one", label: "One at a time" }, { value: "stack", label: "Stack up to N" }]} />
                </Field>
                <Field label="Volatility target (% / yr)" hint="optional"><input type="number" step="1" min="0" value={strategy.risk.target_volatility ?? ""} onChange={(e) => patchRisk({ target_volatility: num(e.target.value) })} placeholder="Off" className={cn(INPUT, "font-mono")} /></Field>
              </div>
              {strategy.risk.allow_stacking && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="Max stacked positions"><input type="number" step="1" min="1" value={strategy.risk.max_positions} onChange={(e) => patchRisk({ max_positions: Number(e.target.value) })} className={cn(INPUT, "font-mono")} /></Field>
                  <p className="text-[11px] leading-relaxed text-amber-300 sm:col-span-2 sm:pt-5">A new position is added on every bar the entry rule is true, so trades overlap and the trade count rises. Win rate and resampling results then describe correlated bets. The live preview always trades one at a time.</p>
                </div>
              )}
              {strategy.risk.target_volatility ? <p className="text-[10px] text-slate-500">Size is scaled down by target ÷ the stock&apos;s 20-day realised volatility, never above the position size. No trade is opened during the first 20 bars.</p> : null}
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

          {section("sweep", 8, "Parameter sweep", "Test a range of values on the real engine before you commit to one", SlidersHorizontal, "purple", (
            <ParamSweep strategy={strategy} start={start} end={end} benchmark={benchmark} valid={validation.isValid}
              onRanges={(r) => patch({ param_ranges: r })}
              onApply={applyBest} />
          ))}
        </div>

        {/* right: summary */}
        <aside className="space-y-3 lg:sticky lg:top-20 lg:col-span-4 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
          <LivePreview strategy={strategy} start={start} end={end} benchmark={benchmark} valid={validation.isValid} issueCount={validation.errors.length} />

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
                  ["Direction", ({ long: "Long only", short: "Short only", both: "Long & short" } as const)[strategy.risk.direction ?? (strategy.risk.allow_short ? "both" : "long")], "text-white"],
                  ["Stop loss", strategy.risk.stop_atr_mult ? `${strategy.risk.stop_atr_mult} × ATR(${strategy.risk.atr_period ?? 14})` : strategy.risk.stop_loss_pct != null ? `-${strategy.risk.stop_loss_pct}%` : "None", "text-rose-400"],
                  ["Take profit", strategy.risk.take_profit_atr_mult ? `${strategy.risk.take_profit_atr_mult} × ATR` : strategy.risk.take_profit_pct != null ? `+${strategy.risk.take_profit_pct}%` : "None", "text-emerald-400"],
                  ["Trailing stop", strategy.risk.trailing_stop_pct ? `${strategy.risk.trailing_stop_pct}%` : "None", "text-slate-200"],
                  ["Vol target", strategy.risk.target_volatility ? `${strategy.risk.target_volatility}% / yr` : "Off", "text-slate-200"],
                  ["Position size", strategy.risk.allow_stacking ? `${strategy.risk.position_size_pct}% × up to ${strategy.risk.max_positions} stacked` : `${strategy.risk.position_size_pct}% · one at a time`, "text-white"],
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

      {showHistory && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Version history" onClick={(e) => e.target === e.currentTarget && setShowHistory(false)}>
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-800/90 bg-[#0b1222] shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between border-b border-slate-800 p-4"><div><h3 className="text-sm font-bold text-white">Version history</h3><p className="text-[11px] text-slate-400">Each save that changes something is kept (latest 30). Compared with what you have open now.</p></div><button type="button" aria-label="Close" onClick={() => setShowHistory(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800/60 hover:text-white"><X className="h-4 w-4" /></button></div>
            <div className="space-y-2 overflow-y-auto p-4" data-testid="history-list">
              {versions === null ? <p className="text-xs text-slate-400">Loading…</p> : versions.length === 0 ? <p className="rounded-lg border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500">No saved versions yet. Save the strategy to start its history (history needs the backend running).</p> : versions.map((v) => {
                const changes = describeChanges(v.strategy, strategy);
                return (
                  <div key={v.version} className="rounded-xl border border-slate-800 bg-[#080d1a] p-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div><span className="font-bold text-white">Version {v.version}</span><span className="ml-2 text-slate-400">{v.saved_at ? new Date(v.saved_at).toLocaleString() : "unknown time"}</span><span className="ml-2 text-slate-500">{v.strategy.name}</span></div>
                      <button type="button" onClick={() => restoreVersion(v.strategy)} disabled={changes.length === 0} className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1 font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-40"><RotateCcw className="h-3 w-3" />{changes.length === 0 ? "Same as now" : "Restore"}</button>
                    </div>
                    {changes.length > 0 && <ul className="mt-1.5 space-y-0.5 font-mono text-[10px] text-slate-400">{changes.slice(0, 6).map((c, i) => <li key={i} className="truncate" title={c}>• {c}</li>)}{changes.length > 6 && <li>…and {changes.length - 6} more</li>}</ul>}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end border-t border-slate-800 p-3"><button type="button" onClick={() => setShowHistory(false)} className={btn}>Close</button></div>
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
