"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Check,
  Globe2,
  Sparkles,
  SlidersHorizontal,
  Layers,
  TrendingUp,
  X,
  ExternalLink,
  ChevronRight,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { StockProfile } from "@/types";
import StockSearchInput from "@/components/ui/StockSearchInput";

export interface EasyStockPickerProps {
  selectedAsset: string;
  onSelectAsset: (
    symbol: string,
    details?: {
      name?: string;
      market: "India" | "US";
      exchange?: string;
      benchmark: string;
      currency: "INR" | "USD";
    }
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

export default function EasyStockPicker({
  selectedAsset,
  onSelectAsset,
  selectedBenchmark,
  onBenchmarkChange,
  className = "",
  showUniverseModalButton = true,
}: EasyStockPickerProps) {
  // Determine market based on symbol or localStorage
  const isIndianSymbol = useMemo(() => {
    const sym = (selectedAsset || "").toUpperCase();
    return (
      sym.endsWith(".NS") ||
      sym.endsWith(".BO") ||
      INDIA_CATEGORIES.some((c) => c.stocks.some((s) => s.symbol === sym))
    );
  }, [selectedAsset]);

  const [activeMarket, setActiveMarket] = useState<"India" | "US">(() => {
    if (isIndianSymbol) return "India";
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("algolab_active_country");
      if (saved === "India" || saved === "US") return saved;
    }
    return "India";
  });

  // Track terminal active security from localStorage / navbar
  const [terminalActiveTicker, setTerminalActiveTicker] = useState<string | null>(null);
  const [terminalCountry, setTerminalCountry] = useState<"India" | "US">("India");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTicker = localStorage.getItem("algolab_active_ticker");
      const savedCountry = localStorage.getItem("algolab_active_country") as "India" | "US";
      if (savedTicker) setTerminalActiveTicker(savedTicker.toUpperCase());
      if (savedCountry) setTerminalCountry(savedCountry);
    }

    const handleExternalChange = (e: any) => {
      if (e.detail?.symbol) {
        setTerminalActiveTicker(e.detail.symbol.toUpperCase());
      }
      if (e.detail?.country) {
        setTerminalCountry(e.detail.country);
      }
    };

    window.addEventListener("algolab:security-change", handleExternalChange);
    return () => window.removeEventListener("algolab:security-change", handleExternalChange);
  }, []);

  // Category tab state
  const [selectedCategory, setSelectedCategory] = useState<string>("top");

  // Browse modal state
  const [isBrowseModalOpen, setIsBrowseModalOpen] = useState(false);
  const [browseQuery, setBrowseQuery] = useState("");
  const [browseSector, setBrowseSector] = useState("ALL");
  const [browseResults, setBrowseResults] = useState<StockProfile[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [sectorsList, setSectorsList] = useState<string[]>([]);

  // Load sectors
  useEffect(() => {
    api.getSectors(activeMarket).then(setSectorsList).catch(console.error);
  }, [activeMarket]);

  // Load browse modal results
  useEffect(() => {
    if (!isBrowseModalOpen) return;
    setBrowseLoading(true);
    const timer = setTimeout(() => {
      api
        .searchTickers({
          query: browseQuery.trim(),
          market: activeMarket,
          sector: browseSector !== "ALL" ? browseSector : undefined,
          limit: 50,
        })
        .then(setBrowseResults)
        .catch(console.error)
        .finally(() => setBrowseLoading(false));
    }, 150);

    return () => clearTimeout(timer);
  }, [isBrowseModalOpen, browseQuery, browseSector, activeMarket]);

  // Handle stock selection
  const handlePickStock = (symbol: string, name?: string, sector?: string) => {
    const isIndia = activeMarket === "India";
    const benchmark = isIndia ? "^NSEI" : "SPY";
    const currency = isIndia ? "INR" : "USD";

    onSelectAsset(symbol, {
      name,
      market: activeMarket,
      exchange: isIndia ? "NSE" : "NASDAQ",
      benchmark,
      currency,
    });

    if (onBenchmarkChange) {
      onBenchmarkChange(benchmark);
    }

    // Update terminal session
    if (typeof window !== "undefined") {
      localStorage.setItem("algolab_active_ticker", symbol);
      localStorage.setItem("algolab_active_country", activeMarket);
      window.dispatchEvent(
        new CustomEvent("algolab:security-change", {
          detail: { symbol, country: activeMarket },
        })
      );
    }
  };

  const categories = activeMarket === "India" ? INDIA_CATEGORIES : US_CATEGORIES;
  const currentCategoryObj = categories.find((c) => c.id === selectedCategory) || categories[0];

  return (
    <div className={`space-y-3.5 font-mono text-xs ${className}`}>
      {/* 1. MARKET SWITCHER & CONTROLS HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-[#252A31]">
        {/* Market Switcher Tabs */}
        <div className="inline-flex rounded-[2px] p-0.5 bg-[#0B0D10] border border-[#252A31]">
          <button
            type="button"
            onClick={() => {
              setActiveMarket("India");
              setSelectedCategory("top");
            }}
            className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-bold rounded-[2px] transition-all cursor-pointer ${
              activeMarket === "India"
                ? "bg-[#10B981] text-black shadow-sm"
                : "text-[#89919C] hover:text-[#D8DCE2] hover:bg-[#141820]"
            }`}
          >
            <span>🇮🇳</span>
            <span>INDIA (NSE / BSE & ₹)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMarket("US");
              setSelectedCategory("top");
            }}
            className={`flex items-center space-x-1.5 px-3 py-1 text-xs font-bold rounded-[2px] transition-all cursor-pointer ${
              activeMarket === "US"
                ? "bg-[#38BDF8] text-black shadow-sm"
                : "text-[#89919C] hover:text-[#D8DCE2] hover:bg-[#141820]"
            }`}
          >
            <span>🇺🇸</span>
            <span>UNITED STATES (NYSE/NASDAQ & $)</span>
          </button>
        </div>

        {/* Action button: Full Universe Browser */}
        {showUniverseModalButton && (
          <button
            type="button"
            onClick={() => setIsBrowseModalOpen(true)}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-[2px] border border-[#252A31] bg-[#141820] text-[#D8DCE2] hover:border-[#38BDF8]/60 hover:text-white transition-colors cursor-pointer text-xs"
          >
            <Layers className="h-3 w-3 text-[#38BDF8]" />
            <span>Browse 18,500+ Stocks Universe</span>
          </button>
        )}
      </div>

      {/* 2. ACTIVE TERMINAL STOCK QUICK SHORTCUT BANNER */}
      {terminalActiveTicker && terminalActiveTicker !== selectedAsset && (
        <div className="flex items-center justify-between p-2 rounded-[2px] bg-[#141820] border border-[#38BDF8]/30 text-xs">
          <div className="flex items-center space-x-2">
            <Zap className="h-3.5 w-3.5 text-[#F59E0B] animate-pulse" />
            <span className="text-[#89919C]">
              Active in Terminal Search:{" "}
              <strong className="text-white font-mono">{terminalActiveTicker}</strong>{" "}
              ({terminalCountry === "India" ? "🇮🇳 India NSE/BSE" : "🇺🇸 US"})
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveMarket(terminalCountry);
              handlePickStock(terminalActiveTicker);
            }}
            className="px-2 py-0.5 rounded-[2px] bg-[#38BDF8] hover:bg-sky-400 text-black font-bold text-[11px] transition-colors cursor-pointer"
          >
            Use {terminalActiveTicker} for Backtest →
          </button>
        </div>
      )}

      {/* 3. CURRENT SELECTED ASSET STATUS STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-[2px] bg-[#0B0D10] border border-[#252A31]">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] text-[#59616B] uppercase">Selected Stock:</span>
            <span className="px-2 py-0.5 rounded-[2px] bg-[#38BDF8]/20 border border-[#38BDF8] text-[#38BDF8] font-bold text-xs font-mono">
              {selectedAsset || "NONE"}
            </span>
          </div>
          <span className="text-[#59616B]">│</span>
          <div className="flex items-center space-x-1 text-[11px]">
            <span className="text-[#89919C]">Market:</span>
            <span className="font-semibold text-[#D8DCE2]">
              {isIndianSymbol ? "🇮🇳 India (NSE)" : "🇺🇸 US (NYSE/NASDAQ)"}
            </span>
          </div>
          <span className="text-[#59616B]">│</span>
          <div className="flex items-center space-x-1 text-[11px]">
            <span className="text-[#89919C]">Currency:</span>
            <span className="font-semibold text-[#10B981]">
              {isIndianSymbol ? "₹ INR" : "$ USD"}
            </span>
          </div>
        </div>

        {/* Benchmark Auto-Alignment Notification */}
        <div className="flex items-center space-x-1.5 text-[11px] font-mono">
          <span className="text-[#59616B]">Benchmark:</span>
          <span className="px-1.5 py-0.5 rounded-[2px] bg-[#141820] border border-[#252A31] text-[#38BDF8] font-bold">
            {selectedBenchmark || (isIndianSymbol ? "^NSEI (NIFTY 50)" : "SPY (S&P 500)")}
          </span>
          <span className="text-[10px] text-[#10B981]">✓ Aligned</span>
        </div>
      </div>

      {/* 4. SEARCH BOX & AUTOCOMPLETE */}
      <div>
        <label className="block text-[10px] text-[#89919C] uppercase font-bold mb-1 tracking-wider">
          Search Any Stock (18,500+ Listed Equities in India & US):
        </label>
        <StockSearchInput
          value={selectedAsset}
          placeholder={
            activeMarket === "India"
              ? "Type Indian symbol or name (e.g. GENUSPOWER, BHARTIARTL, RELIANCE, TCS)..."
              : "Type US symbol or name (e.g. AAPL, NVDA, TSLA, MSFT, SPY)..."
          }
          onChange={(sym, profile) => {
            handlePickStock(
              sym,
              profile?.name,
              profile?.sector || undefined
            );
          }}
        />
      </div>

      {/* 5. SECTOR / THEME CATEGORY TABS */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#89919C] uppercase font-bold tracking-wider">
            Quick-Select Institutional Baskets ({activeMarket}):
          </span>
          <span className="text-[10px] text-[#59616B]">1-Click to Test</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const isActive = cat.id === selectedCategory;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-[2px] text-xs font-semibold transition-colors cursor-pointer ${
                  isActive
                    ? activeMarket === "India"
                      ? "bg-[#10B981] text-black font-bold"
                      : "bg-[#38BDF8] text-black font-bold"
                    : "bg-[#0B0D10] border border-[#252A31] text-[#89919C] hover:text-white hover:bg-[#141820]"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* 6. QUICK PICK STOCKS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
          {currentCategoryObj.stocks.map((stock) => {
            const isSelected = stock.symbol.toUpperCase() === selectedAsset.toUpperCase();
            return (
              <button
                key={stock.symbol}
                type="button"
                onClick={() => handlePickStock(stock.symbol, stock.name, stock.sector)}
                className={`p-2 rounded-[2px] border text-left flex flex-col justify-between transition-all cursor-pointer group ${
                  isSelected
                    ? "bg-[#141820] border-[#38BDF8] shadow-[0_0_12px_rgba(56,189,248,0.25)] ring-1 ring-[#38BDF8]"
                    : "bg-[#0E1116] border-[#252A31] hover:border-[#38BDF8]/60 hover:bg-[#12161E]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono font-bold text-xs ${
                      isSelected ? "text-[#38BDF8]" : "text-white group-hover:text-[#38BDF8]"
                    }`}
                  >
                    {stock.symbol}
                  </span>
                  {isSelected && (
                    <span className="h-3.5 w-3.5 rounded-full bg-[#38BDF8] text-black flex items-center justify-center text-[9px] font-bold">
                      ✓
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[#89919C] truncate mt-0.5" title={stock.name}>
                  {stock.name}
                </div>
                <div className="text-[9px] text-[#59616B] truncate mt-1">
                  {stock.sector}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. FULL UNIVERSE BROWSER MODAL (18,500+ STOCKS)                            */}
      {/* ========================================================================= */}
      {isBrowseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0E1116] border border-[#252A31] rounded-[2px] w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#252A31] flex items-center justify-between bg-[#0B0D10]">
              <div className="flex items-center space-x-2">
                <Globe2 className="h-4 w-4 text-[#38BDF8]" />
                <span className="font-bold text-sm text-white tracking-wide uppercase">
                  Institutional Security Universe (18,500+ Equities)
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-[#141820] text-[#38BDF8] rounded border border-[#252A31]">
                  {activeMarket === "India" ? "🇮🇳 National & Bombay Stock Exchanges" : "🇺🇸 NYSE & NASDAQ"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsBrowseModalOpen(false)}
                className="text-[#89919C] hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Filter controls */}
            <div className="p-3 border-b border-[#252A31] bg-[#12161E] grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-2 text-[#59616B]" />
                <input
                  type="text"
                  placeholder="Filter by symbol, company name..."
                  value={browseQuery}
                  onChange={(e) => setBrowseQuery(e.target.value)}
                  className="w-full pl-8 pr-2 py-1 bg-[#0B0D10] border border-[#252A31] rounded-[2px] text-xs text-white placeholder-[#59616B] focus:outline-none focus:border-[#38BDF8]"
                />
              </div>

              <div>
                <select
                  value={browseSector}
                  onChange={(e) => setBrowseSector(e.target.value)}
                  className="w-full px-2 py-1 bg-[#0B0D10] border border-[#252A31] rounded-[2px] text-xs text-[#D8DCE2] focus:outline-none focus:border-[#38BDF8]"
                >
                  <option value="ALL">All Sectors ({sectorsList.length})</option>
                  {sectorsList.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setActiveMarket("India")}
                  className={`flex-1 py-1 rounded-[2px] text-xs font-bold text-center ${
                    activeMarket === "India" ? "bg-[#10B981] text-black" : "bg-[#0B0D10] text-[#89919C]"
                  }`}
                >
                  🇮🇳 India
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMarket("US")}
                  className={`flex-1 py-1 rounded-[2px] text-xs font-bold text-center ${
                    activeMarket === "US" ? "bg-[#38BDF8] text-black" : "bg-[#0B0D10] text-[#89919C]"
                  }`}
                >
                  🇺🇸 US
                </button>
              </div>
            </div>

            {/* Results Table */}
            <div className="flex-1 overflow-y-auto p-2">
              {browseLoading ? (
                <div className="p-8 text-center text-[#89919C]">Searching 18,500+ listed equities...</div>
              ) : browseResults.length === 0 ? (
                <div className="p-8 text-center text-[#89919C]">No securities matched your criteria.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#252A31] text-[10px] text-[#59616B] uppercase">
                      <th className="py-2 px-3">Symbol</th>
                      <th className="py-2 px-3">Company Name</th>
                      <th className="py-2 px-3">Sector</th>
                      <th className="py-2 px-3">Exchange</th>
                      <th className="py-2 px-3 text-right">Price</th>
                      <th className="py-2 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#252A31]/50 text-xs">
                    {browseResults.map((s) => {
                      const isSelected = s.symbol === selectedAsset;
                      const isInd = s.market === "India" || s.currency === "INR";
                      return (
                        <tr
                          key={`${s.market}-${s.symbol}`}
                          className={`hover:bg-[#141820] transition-colors ${
                            isSelected ? "bg-[#141820] font-bold" : ""
                          }`}
                        >
                          <td className="py-2 px-3 font-mono text-[#38BDF8]">{s.symbol}</td>
                          <td className="py-2 px-3 text-[#D8DCE2]">{s.name}</td>
                          <td className="py-2 px-3 text-[#89919C] text-[11px]">{s.sector || "—"}</td>
                          <td className="py-2 px-3 text-[#59616B] text-[11px]">{s.exchange}</td>
                          <td className="py-2 px-3 text-right font-mono text-[#D8DCE2]">
                            {s.price !== undefined && s.price !== null
                              ? `${isInd ? "₹" : "$"}${Number(s.price).toFixed(2)}`
                              : "—"}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                handlePickStock(s.symbol, s.name, s.sector);
                                setIsBrowseModalOpen(false);
                              }}
                              className={`px-2.5 py-1 rounded-[2px] text-xs font-bold transition-colors ${
                                isSelected
                                  ? "bg-[#10B981] text-black"
                                  : "bg-[#38BDF8] hover:bg-sky-400 text-black cursor-pointer"
                              }`}
                            >
                              {isSelected ? "Selected" : "Select Stock"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[#252A31] bg-[#0B0D10] flex items-center justify-between text-[11px] text-[#59616B]">
              <span>Showing up to 50 results matching filter</span>
              <button
                type="button"
                onClick={() => setIsBrowseModalOpen(false)}
                className="px-3 py-1 bg-[#141820] hover:bg-[#1C222C] text-[#D8DCE2] rounded-[2px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
