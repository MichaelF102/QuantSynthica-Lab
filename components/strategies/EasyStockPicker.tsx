"use client";

import React, { useState, useEffect } from "react";
import { Search, Globe2, Layers, Zap, X, Check } from "lucide-react";
import { api } from "@/lib/api";
import { StockProfile } from "@/types";
import StockSearchInput from "@/components/ui/StockSearchInput";
import { MarketRegion, marketOfTicker, registerTicker } from "@/lib/market";
import { useEscape } from "@/lib/useEscape";
import { cn } from "@/lib/utils";

export interface EasyStockPickerProps {
  selectedAsset: string;
  onSelectAsset: (
    symbol: string,
    details?: { name?: string; market: MarketRegion; exchange?: string; benchmark: string; currency: "INR" | "USD" }
  ) => void;
  selectedBenchmark?: string;
  onBenchmarkChange?: (benchmark: string) => void;
  className?: string;
  showUniverseModalButton?: boolean;
}

// Institutional curated categories
const INDIA_CATEGORIES: { id: string; label: string; stocks: { symbol: string; name: string; sector: string }[] }[] = [
  {
    id: "top",
    label: "⭐ Top Institutional & Liquid",
    stocks: [
      { symbol: "GENUSPOWER", name: "Genus Power Infrastructures", sector: "Power / Smart Metering" },
      { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd", sector: "Telecommunication" },
      { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy / Retail / Telecom" },
      { symbol: "TCS", name: "Tata Consultancy Services", sector: "IT Services" },
      { symbol: "HDFCBANK", name: "HDFC Bank Ltd", sector: "Private Banking" },
      { symbol: "INFY", name: "Infosys Ltd", sector: "IT Services" },
      { symbol: "TATAMOTORS", name: "Tata Motors Ltd", sector: "Automobile" },
      { symbol: "ICICIBANK", name: "ICICI Bank Ltd", sector: "Private Banking" },
      { symbol: "ITC", name: "ITC Ltd", sector: "FMCG / Diversified" },
      { symbol: "SBIN", name: "State Bank of India", sector: "Public Banking" },
    ],
  },
  {
    id: "banking",
    label: "🏦 Banking & NBFC",
    stocks: [
      { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking" },
      { symbol: "ICICIBANK", name: "ICICI Bank", sector: "Banking" },
      { symbol: "SBIN", name: "State Bank of India", sector: "Banking" },
      { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", sector: "Banking" },
      { symbol: "AXISBANK", name: "Axis Bank", sector: "Banking" },
      { symbol: "BAJFINANCE", name: "Bajaj Finance", sector: "NBFC" },
    ],
  },
  {
    id: "tech",
    label: "💻 IT & Tech Services",
    stocks: [
      { symbol: "TCS", name: "Tata Consultancy", sector: "IT Services" },
      { symbol: "INFY", name: "Infosys", sector: "IT Services" },
      { symbol: "WIPRO", name: "Wipro Ltd", sector: "IT Services" },
      { symbol: "HCLTECH", name: "HCL Technologies", sector: "IT Services" },
      { symbol: "TECHM", name: "Tech Mahindra", sector: "IT Services" },
      { symbol: "LTIM", name: "LTIMindtree", sector: "IT Services" },
    ],
  },
  {
    id: "power",
    label: "⚡ Power, Clean Energy & Infra",
    stocks: [
      { symbol: "GENUSPOWER", name: "Genus Power Infra", sector: "Smart Metering / Grid" },
      { symbol: "TATAPOWER", name: "Tata Power", sector: "Power Generation" },
      { symbol: "POWERGRID", name: "Power Grid Corp", sector: "Transmission" },
      { symbol: "NTPC", name: "NTPC Ltd", sector: "Power Generation" },
      { symbol: "ADANIGREEN", name: "Adani Green Energy", sector: "Renewables" },
      { symbol: "RELIANCE", name: "Reliance Industries", sector: "Oil to Chem & Solar" },
    ],
  },
  {
    id: "auto",
    label: "🚗 Automotive & EV",
    stocks: [
      { symbol: "TATAMOTORS", name: "Tata Motors", sector: "EV & Commercial" },
      { symbol: "MARUTI", name: "Maruti Suzuki", sector: "Passenger Auto" },
      { symbol: "M&M", name: "Mahindra & Mahindra", sector: "SUVs & Tractors" },
      { symbol: "BAJAJ-AUTO", name: "Bajaj Auto", sector: "2-Wheelers" },
      { symbol: "HEROMOTOCO", name: "Hero MotoCorp", sector: "2-Wheelers" },
    ],
  },
];

const US_CATEGORIES: { id: string; label: string; stocks: { symbol: string; name: string; sector: string }[] }[] = [
  {
    id: "top",
    label: "⭐ Mega-Cap Tech Titans",
    stocks: [
      { symbol: "AAPL", name: "Apple Inc.", sector: "Consumer Tech" },
      { symbol: "NVDA", name: "NVIDIA Corporation", sector: "AI & Semiconductors" },
      { symbol: "TSLA", name: "Tesla Inc.", sector: "EV & Clean Tech" },
      { symbol: "MSFT", name: "Microsoft Corporation", sector: "Cloud & Software" },
      { symbol: "AMZN", name: "Amazon.com Inc.", sector: "E-Commerce & AWS" },
      { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Search & Cloud" },
      { symbol: "META", name: "Meta Platforms", sector: "Social & AI" },
      { symbol: "SPY", name: "SPDR S&P 500 ETF", sector: "Core US Equity ETF" },
      { symbol: "QQQ", name: "Invesco QQQ Trust", sector: "Nasdaq 100 ETF" },
    ],
  },
  {
    id: "semis",
    label: "🔬 Semiconductors & AI Hardware",
    stocks: [
      { symbol: "NVDA", name: "NVIDIA", sector: "GPUs & AI" },
      { symbol: "AMD", name: "Advanced Micro Devices", sector: "CPUs & GPUs" },
      { symbol: "AVGO", name: "Broadcom Inc.", sector: "Networking & AI" },
      { symbol: "INTC", name: "Intel Corporation", sector: "Semiconductors" },
      { symbol: "QCOM", name: "Qualcomm Inc.", sector: "Mobile / AI" },
      { symbol: "TSM", name: "Taiwan Semiconductor", sector: "Foundry" },
    ],
  },
  {
    id: "etfs",
    label: "📈 Core Benchmark ETFs",
    stocks: [
      { symbol: "SPY", name: "SPDR S&P 500", sector: "Large Cap Index" },
      { symbol: "QQQ", name: "Invesco QQQ", sector: "Tech 100 Index" },
      { symbol: "IWM", name: "iShares Russell 2000", sector: "Small Cap Index" },
      { symbol: "DIA", name: "SPDR Dow Jones Industrial", sector: "Dow 30" },
      { symbol: "SOXX", name: "iShares Semiconductor ETF", sector: "Chip Index" },
    ],
  },
  {
    id: "finance",
    label: "💳 Wall Street & Finance",
    stocks: [
      { symbol: "JPM", name: "JPMorgan Chase", sector: "Investment Banking" },
      { symbol: "BAC", name: "Bank of America", sector: "Consumer Banking" },
      { symbol: "GS", name: "Goldman Sachs", sector: "Capital Markets" },
      { symbol: "MS", name: "Morgan Stanley", sector: "Wealth & Trading" },
      { symbol: "V", name: "Visa Inc.", sector: "Payments" },
    ],
  },
];

const field = "rounded-lg border border-slate-800 bg-[#080d1a] text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none";

export default function EasyStockPicker({
  selectedAsset,
  onSelectAsset,
  selectedBenchmark,
  onBenchmarkChange,
  className = "",
  showUniverseModalButton = true,
}: EasyStockPickerProps) {
  // The market of the chosen stock drives everything; the tab only decides which baskets are listed.
  const assetMarket = marketOfTicker(selectedAsset);
  const [activeMarket, setActiveMarket] = useState<MarketRegion>(assetMarket);
  useEffect(() => setActiveMarket(assetMarket), [assetMarket]);

  // Active security from the navbar search (read after mount so server and client HTML match).
  const [terminal, setTerminal] = useState<{ ticker: string; country: MarketRegion } | null>(null);
  useEffect(() => {
    const read = () => {
      try {
        const t = localStorage.getItem("algolab_active_ticker");
        const c = localStorage.getItem("algolab_active_country");
        if (t) setTerminal({ ticker: t.toUpperCase(), country: c === "India" || c === "US" ? c : marketOfTicker(t) });
      } catch { /* storage unavailable */ }
    };
    read();
    const onChange = (e: any) => {
      const d = e.detail ?? {};
      if (d.symbol) setTerminal({ ticker: String(d.symbol).toUpperCase(), country: d.country === "India" || d.country === "US" ? d.country : marketOfTicker(d.symbol) });
    };
    window.addEventListener("algolab:security-change", onChange);
    return () => window.removeEventListener("algolab:security-change", onChange);
  }, []);

  const [category, setCategory] = useState("top");
  useEffect(() => setCategory("top"), [activeMarket]);

  const [browseOpen, setBrowseOpen] = useState(false);
  useEscape(browseOpen, () => setBrowseOpen(false));
  const [browseQuery, setBrowseQuery] = useState("");
  const [browseSector, setBrowseSector] = useState("ALL");
  const [browseResults, setBrowseResults] = useState<StockProfile[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseError, setBrowseError] = useState(false);
  const [sectors, setSectors] = useState<string[]>([]);

  useEffect(() => {
    setBrowseSector("ALL");
    api.getSectors(activeMarket).then(setSectors).catch(() => setSectors([]));
  }, [activeMarket]);

  useEffect(() => {
    if (!browseOpen) return;
    setBrowseLoading(true); setBrowseError(false);
    let live = true;
    const timer = setTimeout(() => {
      api.searchTickers({ query: browseQuery.trim(), market: activeMarket, sector: browseSector !== "ALL" ? browseSector : undefined, limit: 50 })
        .then((r) => live && setBrowseResults(r))
        .catch(() => live && (setBrowseResults([]), setBrowseError(true)))
        .finally(() => live && setBrowseLoading(false));
    }, 150);
    return () => { live = false; clearTimeout(timer); };
  }, [browseOpen, browseQuery, browseSector, activeMarket]);

  const pick = (symbol: string, market: MarketRegion, name?: string) => {
    const sym = symbol.trim().toUpperCase();
    registerTicker(sym, market);
    const benchmark = market === "India" ? "^NSEI" : "SPY";
    onSelectAsset(sym, { name, market, exchange: market === "India" ? "NSE" : "NASDAQ", benchmark, currency: market === "India" ? "INR" : "USD" });
    onBenchmarkChange?.(benchmark);
    try {
      localStorage.setItem("algolab_active_ticker", sym);
      localStorage.setItem("algolab_active_country", market);
      window.dispatchEvent(new CustomEvent("algolab:security-change", { detail: { symbol: sym, country: market } }));
    } catch { /* storage unavailable */ }
  };
  const marketOfProfile = (p?: StockProfile, fallback?: string): MarketRegion =>
    p?.market === "India" || p?.market === "US" ? p.market : marketOfTicker(fallback ?? p?.symbol);

  const categories = activeMarket === "India" ? INDIA_CATEGORIES : US_CATEGORIES;
  const current = categories.find((c) => c.id === category) ?? categories[0];
  const sel = (selectedAsset || "").toUpperCase();
  const tab = (m: MarketRegion, label: string) => (
    <button type="button" onClick={() => setActiveMarket(m)} aria-pressed={activeMarket === m}
      className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors", activeMarket === m ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200")}>
      {label}
    </button>
  );

  return (
    <div className={cn("space-y-4 font-sans text-xs", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex gap-1 rounded-lg border border-slate-800/80 bg-[#0b1120]/80 p-1">
          {tab("India", "🇮🇳 India · NSE / BSE · ₹")}
          {tab("US", "🇺🇸 United States · NYSE / NASDAQ · $")}
        </div>
        {showUniverseModalButton && (
          <button type="button" onClick={() => setBrowseOpen(true)} className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0b1222] px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:text-white">
            <Layers className="h-3.5 w-3.5 text-blue-400" />Browse the full universe
          </button>
        )}
      </div>

      {terminal && terminal.ticker !== sel && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-2.5">
          <span className="flex items-center gap-2 text-slate-300"><Zap className="h-3.5 w-3.5 text-amber-400" />Active in the navbar search: <b className="font-mono text-white">{terminal.ticker}</b> ({terminal.country})</span>
          <button type="button" onClick={() => pick(terminal.ticker, terminal.country)} className="rounded-lg bg-blue-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-blue-500">Use {terminal.ticker}</button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-[#080d1a] p-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-slate-400">Selected <span className="ml-1 rounded-md border border-blue-500/40 bg-blue-500/10 px-2 py-0.5 font-mono font-bold text-blue-300">{selectedAsset || "None"}</span></span>
          <span className="text-slate-400">Market <b className="font-semibold text-slate-200">{assetMarket === "India" ? "🇮🇳 India (NSE/BSE)" : "🇺🇸 US (NYSE/NASDAQ)"}</b></span>
          <span className="text-slate-400">Currency <b className="font-semibold text-emerald-400">{assetMarket === "India" ? "₹ INR" : "$ USD"}</b></span>
        </div>
        <span className="text-slate-400">Benchmark <b className="ml-1 rounded-md border border-slate-800 bg-[#0b1222] px-2 py-0.5 font-mono text-blue-300">{selectedBenchmark || (assetMarket === "India" ? "^NSEI" : "SPY")}</b></span>
      </div>

      <div>
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Search any listed stock</label>
        <StockSearchInput
          id="builder-stock-search"
          value={selectedAsset}
          placeholder={activeMarket === "India" ? "Symbol or name, e.g. GENUSPOWER, RELIANCE, TCS" : "Symbol or name, e.g. AAPL, NVDA, SPY"}
          onChange={(sym, profile) => pick(sym, marketOfProfile(profile, sym), profile?.name)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Quick-select baskets ({activeMarket})</span><span className="text-[10px] text-slate-500">Click a stock to select it</span></div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button key={c.id} type="button" onClick={() => setCategory(c.id)} className={cn("rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors", c.id === current.id ? "border-blue-500/40 bg-blue-500/15 text-blue-300" : "border-slate-800 bg-[#080d1a] text-slate-400 hover:text-white")}>{c.label}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-3 xl:grid-cols-5">
          {current.stocks.map((st) => {
            const on = st.symbol.toUpperCase() === sel;
            return (
              <button key={st.symbol} type="button" onClick={() => pick(st.symbol, activeMarket, st.name)} aria-pressed={on}
                className={cn("group rounded-xl border p-2.5 text-left transition-colors", on ? "border-blue-500/60 bg-blue-500/10 ring-1 ring-blue-500/40" : "border-slate-800 bg-[#080d1a] hover:border-slate-700 hover:bg-[#0b1222]")}>
                <div className="flex items-center justify-between"><span className={cn("font-mono text-xs font-bold", on ? "text-blue-300" : "text-white")}>{st.symbol}</span>{on && <Check className="h-3.5 w-3.5 text-blue-400" />}</div>
                <div className="mt-0.5 truncate text-[11px] text-slate-300" title={st.name}>{st.name}</div>
                <div className="mt-0.5 truncate text-[10px] text-slate-500">{st.sector}</div>
              </button>
            );
          })}
        </div>
      </div>

      {browseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && setBrowseOpen(false)}>
          <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-800/90 bg-[#0b1222] shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between border-b border-slate-800 p-4">
              <div className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-blue-400" /><h3 className="text-sm font-bold text-white">Security universe</h3><span className="rounded-md border border-slate-800 bg-[#080d1a] px-2 py-0.5 text-[10px] text-blue-300">{activeMarket === "India" ? "NSE & BSE" : "NYSE & NASDAQ"}</span></div>
              <button type="button" aria-label="Close" onClick={() => setBrowseOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800/60 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-1 gap-2 border-b border-slate-800 p-3 sm:grid-cols-3">
              <div className="relative"><Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" /><input autoFocus value={browseQuery} onChange={(e) => setBrowseQuery(e.target.value)} placeholder="Filter by symbol or company" className={cn(field, "w-full py-1.5 pl-8 pr-2")} /></div>
              <select value={browseSector} onChange={(e) => setBrowseSector(e.target.value)} className={cn(field, "px-2 py-1.5")}><option value="ALL">All sectors ({sectors.length})</option>{sectors.map((x) => <option key={x} value={x}>{x}</option>)}</select>
              <div className="flex gap-1">{(["India", "US"] as MarketRegion[]).map((m) => <button key={m} type="button" onClick={() => setActiveMarket(m)} className={cn("flex-1 rounded-lg py-1.5 text-xs font-semibold", activeMarket === m ? "bg-blue-600 text-white" : "border border-slate-800 bg-[#080d1a] text-slate-400 hover:text-white")}>{m === "India" ? "🇮🇳 India" : "🇺🇸 US"}</button>)}</div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {browseLoading ? <div className="p-8 text-center text-slate-400">Searching…</div>
                : browseError ? <div className="p-8 text-center text-rose-300">The security search is unavailable. Check that the backend is running.</div>
                : browseResults.length === 0 ? <div className="p-8 text-center text-slate-400">No securities matched.</div> : (
                <table className="w-full border-collapse text-left">
                  <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="px-3 py-2">Symbol</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Sector</th><th className="px-3 py-2">Exchange</th><th className="px-3 py-2 text-right">Price</th><th className="px-3 py-2" /></tr></thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {browseResults.map((r) => {
                      const on = r.symbol.toUpperCase() === sel, ind = r.market === "India" || r.currency === "INR";
                      return (
                        <tr key={`${r.market}-${r.exchange}-${r.yf_symbol || r.symbol}`} className={cn("transition-colors hover:bg-slate-800/30", on && "bg-blue-500/10")}>
                          <td className="px-3 py-2 font-mono font-semibold text-blue-300">{r.symbol}</td><td className="px-3 py-2 text-slate-200">{r.name}</td>
                          <td className="px-3 py-2 text-[11px] text-slate-400">{r.sector || "—"}</td><td className="px-3 py-2 text-[11px] text-slate-500">{r.exchange}</td>
                          <td className="px-3 py-2 text-right font-mono text-slate-200">{typeof r.price === "number" ? `${ind ? "₹" : "$"}${r.price.toFixed(2)}` : "—"}</td>
                          <td className="px-3 py-2 text-right"><button type="button" onClick={() => { pick(r.symbol, marketOfProfile(r), r.name); setBrowseOpen(false); }} className={cn("rounded-lg px-3 py-1 text-xs font-semibold", on ? "bg-emerald-600 text-white" : "bg-blue-600 text-white hover:bg-blue-500")}>{on ? "Selected" : "Select"}</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-slate-800 p-3 text-[11px] text-slate-500"><span>Up to 50 results</span><button type="button" onClick={() => setBrowseOpen(false)} className="rounded-lg border border-slate-800 bg-[#080d1a] px-3 py-1 text-slate-300 hover:text-white">Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
