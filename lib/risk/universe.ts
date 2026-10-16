"use client";

import { useEffect, useState } from "react";
import { loadAligned } from "@/lib/portfolio/engine";

export interface Universe { labels: string[]; tickers: string[]; rows: number[][]; dates: string[]; synthetic: string[] }

/** Daily-return matrix for any list of tickers, aligned on common trading days. */
export function useUniverse(tickers: string[], labels: string[], start: string, end: string) {
  const [data, setData] = useState<Universe | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify([tickers, labels, start, end]);

  useEffect(() => {
    let live = true;
    setStatus("loading");
    setError(null);
    loadAligned(tickers, start, end)
      .then((a) => {
        if (!live) return;
        const rows = tickers.map((t) => a.prices[t].slice(1).map((p, i) => p / a.prices[t][i] - 1));
        setData({ labels, tickers, rows, dates: a.dates, synthetic: a.synthetic });
        setStatus("ready");
      })
      .catch((e) => { if (live) { setError(e?.message || "Could not load prices"); setStatus("error"); } });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, status, error };
}

export const EXTRA_SUGGESTIONS: Record<"India" | "US", { ticker: string; label: string }[]> = {
  India: [{ ticker: "GOLDBEES.NS", label: "GOLD" }, { ticker: "INR=X", label: "USDINR" }, { ticker: "BZ=F", label: "BRENT" }, { ticker: "^NSEBANK", label: "NIFTY BANK" }, { ticker: "^CNXIT", label: "NIFTY IT" }, { ticker: "^BSESN", label: "SENSEX" }],
  US: [{ ticker: "GLD", label: "GOLD" }, { ticker: "TLT", label: "TLT" }, { ticker: "BZ=F", label: "BRENT" }, { ticker: "QQQ", label: "QQQ" }, { ticker: "IWM", label: "IWM" }, { ticker: "INR=X", label: "USDINR" }],
};
export const labelFor = (ticker: string) => [...EXTRA_SUGGESTIONS.India, ...EXTRA_SUGGESTIONS.US].find((x) => x.ticker === ticker)?.label ?? ticker.replace(".NS", "");
