"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Unavailable { symbol: string; available: false; reason: string }
export interface AnalystFeed {
  symbol: string; available: true; currency?: string;
  price_targets: { current?: number | null; high?: number | null; low?: number | null; mean?: number | null; median?: number | null };
  recommendation: { key?: string | null; mean?: number | null; analysts?: number | null };
  trend: { period: string; strongBuy: number; buy: number; hold: number; sell: number; strongSell: number }[];
  eps_estimates: Record<string, any>[]; revenue_estimates: Record<string, any>[];
  actions: { date: string | null; firm: string | null; to_grade: string | null; from_grade: string | null; action: string | null; target_action: string | null; target: number | null }[];
}
export interface NewsFeed { symbol: string; available: true; items: { title: string; publisher: string | null; link: string | null; published: string | null; summary: string | null }[] }
export interface OwnershipFeed { symbol: string; available: true; major: Record<string, number | null>; institutions: Record<string, any>[]; insiders: Record<string, any>[] }
export interface FilingsFeed { symbol: string; available: true; items: { date: string | null; type: string | null; title: string | null; url: string | null }[] }
export interface CorporateFeed { symbol: string; available: true; calendar: Record<string, any>; dividends: { date: string; amount: number }[] }
export interface PeersFeed { symbol: string; available: boolean; reason?: string; sector?: string; note?: string; peers: { symbol: string; name: string; price: number | null; change_1d: number | null; market_cap: number | null; pe_ratio: number | null; currency: string | null; exchange: string | null }[] }
export interface OptionsFeed {
  symbol: string; available: boolean; reason?: string; underlyingPrice?: number; selectedExpiration?: string; daysToExpiration?: number; expirations: string[];
  calls: OptionRow[]; puts: OptionRow[]; maxPain?: number; putCallRatioVol?: number | null; putCallRatioOI?: number | null;
}
export interface OptionRow { strike: number; lastPrice: number; bid: number; ask: number; volume: number; openInterest: number; impliedVolatility: number; inTheMoney: boolean; delta?: number; gamma?: number; theta?: number; vega?: number }

const cache = new Map<string, Promise<any>>();

export function fetchFeed<T>(path: string, timeoutMs = 20000): Promise<T> {
  let p = cache.get(path);
  if (!p) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    p = fetch(`${API_BASE}${path}`, { signal: ctl.signal })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .finally(() => clearTimeout(t))
      .catch((e) => { cache.delete(path); throw e; });
    cache.set(path, p);
  }
  return p;
}

export type FeedState<T> = { status: "idle" | "loading" | "ready" | "error"; data: T | null; error: string | null };

/** Lazy feed loader: nothing is fetched until `enabled` (e.g. the tab is opened). */
export function useFeed<T>(path: string | null, enabled = true): FeedState<T> {
  const [state, setState] = useState<FeedState<T>>({ status: "idle", data: null, error: null });
  useEffect(() => {
    if (!enabled || !path) return;
    let live = true;
    setState((s) => ({ ...s, status: "loading", error: null }));
    fetchFeed<T>(path)
      .then((d) => live && setState({ status: "ready", data: d, error: null }))
      .catch((e) => live && setState({ status: "error", data: null, error: e?.message || "Request failed" }));
    return () => { live = false; };
  }, [path, enabled]);
  return state;
}

export const researchPath = (symbol: string, kind: string) => `/market/research/${encodeURIComponent(symbol)}/${kind}`;
