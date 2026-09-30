import { api } from "@/lib/api";
import { StockProfile } from "@/types";

export type MarketFilter = "ALL" | "India" | "US";

const KNOWN_ALIASES: Record<string, { symbol: string; country: "India" | "US" }> = {
  reliance: { symbol: "RELIANCE", country: "India" },
  "reliance industries": { symbol: "RELIANCE", country: "India" },
  tcs: { symbol: "TCS", country: "India" },
  "tata consultancy": { symbol: "TCS", country: "India" },
  "tata consultancy services": { symbol: "TCS", country: "India" },
  infy: { symbol: "INFY", country: "India" },
  infosys: { symbol: "INFY", country: "India" },
  "infosys limited": { symbol: "INFY", country: "India" },
  hdfc: { symbol: "HDFCBANK", country: "India" },
  "hdfc bank": { symbol: "HDFCBANK", country: "India" },
  hdfcbank: { symbol: "HDFCBANK", country: "India" },
  tata: { symbol: "TATAMOTORS", country: "India" },
  "tata motors": { symbol: "TATAMOTORS", country: "India" },
  tatamotors: { symbol: "TATAMOTORS", country: "India" },
  genus: { symbol: "GENUSPOWER", country: "India" },
  genuspower: { symbol: "GENUSPOWER", country: "India" },
  kaynes: { symbol: "KAYNES", country: "India" },
  apple: { symbol: "AAPL", country: "US" },
  nvidia: { symbol: "NVDA", country: "US" },
  microsoft: { symbol: "MSFT", country: "US" },
  amazon: { symbol: "AMZN", country: "US" },
  tesla: { symbol: "TSLA", country: "US" },
  spy: { symbol: "SPY", country: "US" },
  qqq: { symbol: "QQQ", country: "US" },
};

export function inferCountryFromTicker(
  ticker: string,
  hint?: "India" | "US" | "ALL"
): "India" | "US" {
  if (hint === "India" || hint === "US") return hint;

  const t = ticker.toUpperCase().trim();
  if (t.endsWith(".NS") || t.endsWith(".BO")) return "India";
  if (
    [
      "RELIANCE",
      "TCS",
      "INFY",
      "HDFCBANK",
      "TATAMOTORS",
      "GENUSPOWER",
      "KAYNES",
      "NIFTY50",
      "NIFTY",
      "BANKNIFTY",
      "ICICIBANK",
      "SBIN",
      "BHARTIARTL",
      "ITC",
      "KOTAKBANK",
      "LT",
      "HINDUNILVR",
      "AXISBANK",
    ].includes(t)
  ) {
    return "India";
  }

  return "US";
}

export async function searchTickersUnified(
  query: string,
  market: MarketFilter = "ALL",
  limit = 20
): Promise<StockProfile[]> {
  const cleanQ = query.trim().toLowerCase();

  try {
    const rawResults = await api.searchTickers({
      query: cleanQ || undefined,
      market: market === "ALL" ? undefined : market,
      limit: limit * 2,
    });

    const seen = new Set<string>();
    const filtered: StockProfile[] = [];

    // Prioritize alias match if exact or close
    if (cleanQ && KNOWN_ALIASES[cleanQ]) {
      const alias = KNOWN_ALIASES[cleanQ];
      const match = rawResults.find((s) => s.symbol.toUpperCase() === alias.symbol);
      if (match) {
        seen.add(match.symbol.toUpperCase());
        filtered.push(match);
      }
    }

    for (const stock of rawResults) {
      const sym = stock.symbol.toUpperCase();
      if (!seen.has(sym)) {
        seen.add(sym);
        filtered.push(stock);
      }
    }

    // Sort order: exact symbol matches first, then prefix, then others
    filtered.sort((a, b) => {
      const aSym = a.symbol.toUpperCase();
      const bSym = b.symbol.toUpperCase();
      const qUpper = cleanQ.toUpperCase();

      if (aSym === qUpper) return -1;
      if (bSym === qUpper) return 1;

      const aStarts = aSym.startsWith(qUpper);
      const bStarts = bSym.startsWith(qUpper);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // Prefer selected market
      if (market === "India") {
        const aInd = a.market === "India" || a.currency === "INR";
        const bInd = b.market === "India" || b.currency === "INR";
        if (aInd && !bInd) return -1;
        if (!aInd && bInd) return 1;
      } else if (market === "US") {
        const aUS = a.market === "US" || a.currency === "USD";
        const bUS = b.market === "US" || b.currency === "USD";
        if (aUS && !bUS) return -1;
        if (!aUS && bUS) return 1;
      }

      return (b.market_cap || 0) - (a.market_cap || 0);
    });

    return filtered.slice(0, limit);
  } catch (err) {
    console.error("Unified ticker search failed:", err);
    return [];
  }
}

export function navigateToResearchWorkspace(
  stockOrTicker: StockProfile | string,
  router: { push: (url: string) => void },
  countryHint?: "India" | "US" | "ALL"
) {
  let sym: string;
  let country: "India" | "US";
  let stockObj: StockProfile | undefined;

  if (typeof stockOrTicker === "string") {
    sym = stockOrTicker.toUpperCase().trim();
    country = inferCountryFromTicker(sym, countryHint);
  } else {
    sym = stockOrTicker.symbol.toUpperCase().trim();
    country =
      stockOrTicker.market === "India" || stockOrTicker.currency === "INR"
        ? "India"
        : (stockOrTicker.market as "US" | "India") || "US";
    stockObj = stockOrTicker;
  }

  if (typeof window !== "undefined") {
    localStorage.setItem("algolab_active_ticker", sym);
    localStorage.setItem("algolab_active_country", country);

    window.dispatchEvent(
      new CustomEvent("algolab:country-change", { detail: { country } })
    );

    window.dispatchEvent(
      new CustomEvent("algolab:security-change", {
        detail: {
          symbol: sym,
          country,
          stock: stockObj,
        },
      })
    );
  }

  const targetUrl = `/research?ticker=${encodeURIComponent(sym)}&country=${encodeURIComponent(country)}`;
  router.push(targetUrl);
}
