"use client";

import { useEffect, useState } from "react";
import type { IndexProfile, IndicesResponse } from "@/types";

const row = (symbol: string, name: string, exchange: "NSE" | "BSE", category = "Broad Market"): IndexProfile =>
  ({ symbol, name, exchange, category, sector: "", industry: "", segment: "", style: "", family: "", available: null });

/** Used only when the backend is unreachable. */
export const INDIA_FALLBACK: IndexProfile[] = [
  row("^NSEI", "Nifty 50", "NSE"), row("^BSESN", "BSE SENSEX", "BSE"), row("^NSEBANK", "Nifty Bank", "NSE", "Sectoral"),
  row("^CNXIT", "Nifty IT", "NSE", "Sectoral"), row("^CNXPHARMA", "Nifty Pharma", "NSE", "Sectoral"),
];

let cache: IndicesResponse | null = null;
let inflight: Promise<IndicesResponse> | null = null;
const names = new Map<string, string>(INDIA_FALLBACK.map((i) => [i.symbol, i.name]));
const listeners = new Set<(r: IndicesResponse) => void>();

function publish(r: IndicesResponse) {
  cache = r;
  r.indices.forEach((i) => names.set(i.symbol, i.name));
  listeners.forEach((l) => l(r));
}

async function load(force = false): Promise<IndicesResponse> {
  if (cache && !force) return cache;
  if (!inflight) {
    const { api } = await import("@/lib/api");
    inflight = api.getIndices().then((r) => { publish(r); return r; }).finally(() => { inflight = null; });
  }
  return inflight;
}

/** Name of an index we know about (synchronous; falls back to the symbol). */
export const indexName = (symbol: string): string | undefined => names.get(symbol);

const INDIA_INDEX_RE = /^\^(NSE|CNX|BSE|NV|CRSL|NSMID)|\.NS$|\.BO$|^NIFTY|^BSE-/i;
/** True when the symbol is one of the Indian indices (loaded list, or by naming convention before it loads). */
export const isIndianIndex = (symbol: string): boolean => names.has(symbol) || INDIA_INDEX_RE.test(symbol);

/** Indian benchmark universe from data/indian_indices.csv. Re-polls while the backend is still probing availability. */
export function useIndices() {
  const [data, setData] = useState<IndicesResponse | null>(cache);
  useEffect(() => {
    let live = true, timer: ReturnType<typeof setTimeout> | undefined, polls = 0;
    const on = (r: IndicesResponse) => live && setData(r);
    listeners.add(on);
    const tick = (force: boolean) => load(force).then((r) => {
      if (!live) return;
      setData(r);
      if (r.probing && polls++ < 12) timer = setTimeout(() => tick(true), 6000);
    });
    tick(false);
    return () => { live = false; listeners.delete(on); if (timer) clearTimeout(timer); };
  }, []);
  return { indices: data?.indices ?? INDIA_FALLBACK, probing: !!data?.probing, loading: !data };
}
