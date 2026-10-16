/** Sector lookup from the stock universe (backend). Never fabricates: unknown tickers are "Unclassified". */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const cache = new Map<string, Promise<string>>();

export function sectorOf(ticker: string): Promise<string> {
  let p = cache.get(ticker);
  if (!p) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 4000);
    p = fetch(`${API_BASE}/market/stock/${encodeURIComponent(ticker)}`, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => (j && typeof j.sector === "string" && j.sector.trim() && !/custom/i.test(j.sector) ? j.sector.trim() : "Unclassified"))
      .catch(() => "Unclassified")
      .finally(() => clearTimeout(t));
    cache.set(ticker, p);
  }
  return p;
}

export async function sectorsOf(tickers: string[]): Promise<string[]> {
  return Promise.all(tickers.map((t) => (t.startsWith("^") || /BEES|ETF/i.test(t) ? Promise.resolve("Index / ETF") : sectorOf(t))));
}
