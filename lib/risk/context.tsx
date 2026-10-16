"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Holding, PortfolioResult, runPortfolio } from "@/lib/portfolio/engine";
import type { Frequency } from "@/lib/analyticsCalc";
import type { CorrType } from "./correlation";
import {
  BENCHMARK_OPTIONS, HORIZONS, Lookback, MARKET_DEFAULTS, Market, PRESETS, RiskSource, startFromLookback, todayISO,
} from "./presets";

const SETTINGS_KEY = "qs_risk_settings";
const PORTFOLIOS_KEY = "algolab_portfolios";

export interface RiskSettings {
  market: Market;
  sourceKey: string;
  customHoldings: Holding[];
  assetTicker: string;
  benchmark: string;
  lookback: Lookback;
  start: string;
  end: string;
  confidence: number;
  horizon: number;
  positionValue: number;
  frequency: Frequency;
  corrType: CorrType;
  /** User-selected extra assets for the correlation universe (e.g. gold, USDINR, Brent). */
  extraAssets: string[];
  factorModel: "Multi-factor" | "CAPM";
}

interface RiskCtx {
  settings: RiskSettings;
  update: (patch: Partial<RiskSettings>) => void;
  setLookback: (lb: Exclude<Lookback, "Custom">) => void;
  setMarket: (m: Market) => void;
  sources: RiskSource[];
  source: RiskSource;
  result: PortfolioResult | null;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
  reload: () => void;
  currency: "INR" | "USD";
}

const Ctx = createContext<RiskCtx | null>(null);
export const useRisk = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useRisk must be used inside <RiskProvider>");
  return c;
};

function defaultSettings(market: Market): RiskSettings {
  const d = MARKET_DEFAULTS[market];
  const end = todayISO();
  return {
    market, sourceKey: d.presetKey, customHoldings: [], assetTicker: "", benchmark: d.benchmark, lookback: "3Y",
    start: startFromLookback(end, "3Y"), end, confidence: 0.95, horizon: 1, positionValue: d.value, frequency: "Daily", corrType: "Pearson", extraAssets: [], factorModel: "Multi-factor",
  };
}

function readPortfolios(): RiskSource[] {
  try {
    const store = JSON.parse(localStorage.getItem(PORTFOLIOS_KEY) || "{}");
    return Object.values<any>(store).map((s) => ({
      key: `portfolio:${s.name}`, label: s.name, market: s.market === "US" ? "US" : "India", kind: "portfolio" as const,
      holdings: (s.allocations ?? []).map((a: any) => ({ ticker: a.ticker, weight: a.weight })),
    }));
  } catch { return []; }
}

export function RiskProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<RiskSettings>(() => defaultSettings("India"));
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState<RiskSource[]>([]);
  const [result, setResult] = useState<PortfolioResult | null>(null);
  const [status, setStatus] = useState<RiskCtx["status"]>("idle");
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const runId = useRef(0);

  useEffect(() => {
    setSaved(readPortfolios());
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      const country = localStorage.getItem("algolab_active_country");
      if (raw) {
        const s = JSON.parse(raw) as RiskSettings;
        // A relative lookback is re-anchored to today so a stale stored window never silently ages.
        const end = s.lookback === "Custom" ? s.end : todayISO();
        setSettings({ ...defaultSettings(s.market), ...s, end, start: s.lookback === "Custom" ? s.start : startFromLookback(end, s.lookback as Exclude<Lookback, "Custom">) });
      } else if (country === "US") setSettings(defaultSettings("US"));
    } catch { /* fall back to defaults */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* quota/private mode */ }
  }, [settings, hydrated]);

  const sources = useMemo(() => [...PRESETS, ...saved], [saved]);

  const source: RiskSource = useMemo(() => {
    const s = settings;
    if (s.sourceKey === "asset" && s.assetTicker) return { key: "asset", label: s.assetTicker, market: s.market, kind: "asset", holdings: [{ ticker: s.assetTicker, weight: 100 }] };
    if (s.sourceKey === "custom" && s.customHoldings.length) return { key: "custom", label: "Custom Portfolio", market: s.market, kind: "custom", holdings: s.customHoldings };
    return sources.find((x) => x.key === s.sourceKey) ?? sources.find((x) => x.key === MARKET_DEFAULTS[s.market].presetKey) ?? PRESETS[0];
  }, [settings, sources]);

  const holdingsKey = JSON.stringify(source.holdings);
  useEffect(() => {
    if (!hydrated) return;
    const id = ++runId.current;
    setStatus("loading");
    setError(null);
    const t = window.setTimeout(async () => {
      try {
        const r = await runPortfolio({ holdings: source.holdings, benchmark: settings.benchmark, start: settings.start, end: settings.end, initialCapital: settings.positionValue, rebalance: "Monthly" });
        if (id !== runId.current) return;
        setResult(r);
        setStatus("ready");
      } catch (e: any) {
        if (id !== runId.current) return;
        setError(e?.message || "Could not load risk data");
        setStatus("error");
      }
    }, 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, holdingsKey, settings.benchmark, settings.start, settings.end, settings.positionValue, nonce]);

  const update = useCallback((patch: Partial<RiskSettings>) => setSettings((s) => ({ ...s, ...patch })), []);
  const setLookback = useCallback((lb: Exclude<Lookback, "Custom">) => setSettings((s) => ({ ...s, lookback: lb, end: todayISO(), start: startFromLookback(todayISO(), lb) })), []);
  const setMarket = useCallback((m: Market) => {
    try { localStorage.setItem("algolab_active_country", m); window.dispatchEvent(new CustomEvent("algolab:security-change", { detail: { country: m } })); } catch { /* ignore */ }
    setSettings((s) => ({ ...defaultSettings(m), lookback: s.lookback, start: s.start, end: s.end, confidence: s.confidence, horizon: s.horizon, frequency: s.frequency, corrType: s.corrType, factorModel: s.factorModel }));
  }, []);

  const value: RiskCtx = {
    settings, update, setLookback, setMarket, sources, source, result, status, error, reload: () => setNonce((n) => n + 1),
    currency: MARKET_DEFAULTS[source.market].currency,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export { BENCHMARK_OPTIONS, HORIZONS };
