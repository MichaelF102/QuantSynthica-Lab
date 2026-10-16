"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { StockProfile } from "@/types";
import { MarketFilter, searchTickersUnified, navigateToResearchWorkspace } from "@/lib/tickerSearch";
import { fmtBig } from "@/lib/research/format";
import { cn } from "@/lib/utils";

const MARKETS: MarketFilter[] = ["ALL", "India", "US"];

/** Security search with debounced lookups against the stock universe and full keyboard support. */
export default function ResearchSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [market, setMarket] = useState<MarketFilter>("ALL");
  const [results, setResults] = useState<StockProfile[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => { try { const m = localStorage.getItem("algolab_search_market"); if (m === "ALL" || m === "India" || m === "US") setMarket(m); } catch { /* ignore */ } }, []);
  useEffect(() => {
    const away = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);
  useEffect(() => {
    if (!open) return;
    let live = true;
    const t = setTimeout(async () => {
      setLoading(true); setError(false);
      try { const r = await searchTickersUnified(query, market, 10); if (live) { setResults(r); setActive(-1); } }
      catch { if (live) setError(true); }
      finally { if (live) setLoading(false); }
    }, 150);
    return () => { live = false; clearTimeout(t); };
  }, [query, market, open]);

  const choose = (s: StockProfile) => { setOpen(false); navigateToResearchWorkspace(s, router, market); };
  const submit = () => {
    if (active >= 0 && results[active]) return choose(results[active]);
    if (results[0] && query.trim()) return choose(results[0]);
    if (query.trim()) navigateToResearchWorkspace(query.trim(), router, market);
  };
  const key = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => (results.length ? (i + 1) % results.length : -1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => (results.length ? (i <= 0 ? results.length - 1 : i - 1) : -1)); }
    else if (e.key === "Enter") { e.preventDefault(); submit(); }
    else if (e.key === "Escape") { setOpen(false); input.current?.blur(); }
  };

  return (
    <div ref={box} className="relative w-full">
      <div className="flex items-center gap-2 rounded-xl border border-slate-700/50 bg-[#0F172A]/70 p-1.5 transition-colors focus-within:border-blue-500 hover:border-slate-600">
        <Search className="ml-2.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        <input ref={input} value={query} onChange={(e) => { setQuery(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={key} placeholder="Search a company, ticker or keyword (e.g. RELIANCE, AAPL)"
          role="combobox" aria-expanded={open} aria-controls="research-results" aria-autocomplete="list" aria-label="Search securities" className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500" />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
        <div className="hidden items-center rounded-lg border border-slate-800 bg-[#0b1222] p-0.5 sm:flex" role="group" aria-label="Market filter">
          {MARKETS.map((m) => (
            <button key={m} type="button" onClick={() => { setMarket(m); try { localStorage.setItem("algolab_search_market", m); } catch { /* ignore */ } setOpen(true); input.current?.focus(); }} aria-pressed={market === m}
              className={cn("rounded px-2.5 py-1 font-mono text-[11px] transition-colors", market === m ? "bg-blue-600 font-semibold text-white shadow-sm" : "text-slate-400 hover:text-white")}>{m === "ALL" ? "All" : m}</button>
          ))}
        </div>
        <button type="button" onClick={submit} aria-label="Open research" className="rounded-lg bg-blue-600 p-2.5 text-white shadow-md shadow-blue-600/20 transition-colors hover:bg-blue-500"><ArrowRight className="h-4 w-4" /></button>
      </div>
      {open && (
        <ul id="research-results" role="listbox" className="absolute left-0 right-0 top-full z-[60] mt-1 max-h-80 overflow-y-auto rounded-xl border border-slate-800 bg-[#0B101C] p-1.5 shadow-[0_18px_48px_-12px_rgba(0,0,0,0.65)]">
          {error && <li className="px-3 py-3 text-xs text-rose-300">Search is unavailable. Check that the backend is running; you can still press Enter to open a ticker directly.</li>}
          {!error && !loading && results.length === 0 && <li className="px-3 py-3 text-xs text-slate-400">{query.trim() ? "No matching security in the universe. Press Enter to try the ticker directly." : "Start typing to search."}</li>}
          {results.map((r, i) => (
            <li key={`${r.symbol}-${i}`} role="option" aria-selected={i === active}>
              <button type="button" onMouseEnter={() => setActive(i)} onClick={() => choose(r)} className={cn("flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left", i === active ? "bg-slate-800/70" : "hover:bg-slate-800/50")}>
                <span className="min-w-0"><span className="font-mono text-sm font-bold text-slate-100">{r.symbol}</span><span className="ml-2 truncate text-xs text-slate-400">{r.name}</span></span>
                <span className="shrink-0 text-right font-mono text-[10px] text-slate-500">{r.exchange} · {r.market}{r.market_cap ? ` · ${fmtBig(r.market_cap, r.market === "India" ? "India" : "US")}` : ""}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
