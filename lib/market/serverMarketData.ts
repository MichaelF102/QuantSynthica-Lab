import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import liveSnapshot from "@/data/market_universe_live.json";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Quick in-memory cache for Next.js server runtime
const memoryCache = new Map<string, { data: any; timestamp: number }>();

function getCache(key: string, ttlMs = 45000) {
  const item = memoryCache.get(key);
  if (item && Date.now() - item.timestamp < ttlMs) {
    return item.data;
  }
  return null;
}

function setCache(key: string, data: any) {
  memoryCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Execute Python yfinance CLI command with fallback
 */
function runPythonCli(args: string[]): Promise<any> {
  return new Promise((resolve) => {
    const projectRoot = process.cwd();
    const venvPython = path.join(projectRoot, ".venv", "bin", "python");
    const pythonExe = fs.existsSync(venvPython) ? venvPython : "python3";
    const scriptPath = path.join(projectRoot, "backend", "services", "yfinance_cli.py");

    if (!fs.existsSync(scriptPath)) {
      return resolve(null);
    }

    execFile(pythonExe, [scriptPath, ...args], { timeout: 8000 }, (error, stdout) => {
      if (error || !stdout) {
        return resolve(null);
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch {
        resolve(null);
      }
    });
  });
}

/**
 * Fetch asset quote and historical bars
 */
export async function getAssetData(symbol: string, timeframe = "6M"): Promise<any> {
  const cacheKey = `asset_${symbol.toUpperCase()}_${timeframe}`;
  const cached = getCache(cacheKey, 60000);
  if (cached) return cached;

  // 1. Try FastAPI backend if reachable
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${API_BASE}/market/universe/asset?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      setCache(cacheKey, data);
      return data;
    }
  } catch {
    // Backend offline, proceed to fallback
  }

  // 2. Try Python CLI if not in static build
  const cliData = await runPythonCli(["asset", symbol, timeframe]);
  if (cliData && !cliData.error) {
    setCache(cacheKey, cliData);
    return cliData;
  }

  // 3. Fallback to authentic pre-generated snapshot
  const symUpper = symbol.toUpperCase();
  const snapshotAssets = (liveSnapshot as any)?.assets || {};
  if (snapshotAssets[symUpper]) {
    return snapshotAssets[symUpper];
  }
  // Try mapping common variations like RELIANCE -> RELIANCE.NS
  if (snapshotAssets[`${symUpper}.NS`]) {
    return snapshotAssets[`${symUpper}.NS`];
  }

  return snapshotAssets["SPY"] || null;
}

/**
 * Fetch option chain data
 */
export async function getOptionsData(symbol: string, expiration?: string): Promise<any> {
  const cacheKey = `options_${symbol.toUpperCase()}_${expiration || "first"}`;
  const cached = getCache(cacheKey, 120000);
  if (cached) return cached;

  // 1. Try FastAPI
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const expQuery = expiration ? `&expiration=${encodeURIComponent(expiration)}` : "";
    const res = await fetch(`${API_BASE}/market/universe/options?symbol=${encodeURIComponent(symbol)}${expQuery}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      setCache(cacheKey, data);
      return data;
    }
  } catch {
    // Backend offline
  }

  // 2. Try Python CLI
  const cliData = await runPythonCli(["options", symbol, expiration || "null"]);
  if (cliData && !cliData.error) {
    setCache(cacheKey, cliData);
    return cliData;
  }

  // 3. Fallback to authentic snapshot
  const symUpper = symbol.toUpperCase();
  const snapshotOptions = (liveSnapshot as any)?.options || {};
  if (snapshotOptions[symUpper]) {
    return snapshotOptions[symUpper];
  }

  return {
    symbol,
    available: false,
    reason: "Options data unavailable for this instrument through Yahoo Finance.",
    expirations: [],
    calls: [],
    puts: [],
  };
}

/**
 * Fetch market benchmarks list
 */
export async function getBenchmarksData(): Promise<any[]> {
  const cacheKey = "benchmarks_list";
  const cached = getCache(cacheKey, 45000);
  if (cached) return cached;

  // 1. Try FastAPI
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${API_BASE}/market/universe/benchmarks`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      setCache(cacheKey, data);
      return data;
    }
  } catch {
    // Backend offline
  }

  // 2. Try Python CLI
  const cliData = await runPythonCli(["benchmarks"]);
  if (Array.isArray(cliData) && cliData.length > 0) {
    setCache(cacheKey, cliData);
    return cliData;
  }

  // 3. Fallback to authentic snapshot
  return (liveSnapshot as any)?.benchmarks || [];
}

/**
 * Fetch watchlist items
 */
export async function getWatchlistData(): Promise<any[]> {
  const cacheKey = "watchlist_list";
  const cached = getCache(cacheKey, 45000);
  if (cached) return cached;

  // 1. Try FastAPI
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${API_BASE}/market/universe/watchlist`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      setCache(cacheKey, data);
      return data;
    }
  } catch {
    // Backend offline
  }

  // 2. Try Python CLI
  const cliData = await runPythonCli(["watchlist"]);
  if (Array.isArray(cliData) && cliData.length > 0) {
    setCache(cacheKey, cliData);
    return cliData;
  }

  // 3. Fallback to authentic snapshot
  return (liveSnapshot as any)?.watchlist || [];
}

/**
 * Fetch Macro & Cross-Asset categories
 */
export async function getMacroData(): Promise<any> {
  const cacheKey = "macro_cross_asset";
  const cached = getCache(cacheKey, 90000);
  if (cached) return cached;

  // 1. Try FastAPI
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${API_BASE}/market/universe/macro`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      setCache(cacheKey, data);
      return data;
    }
  } catch {
    // Backend offline
  }

  // 2. Try Python CLI
  const cliData = await runPythonCli(["macro"]);
  if (cliData && !cliData.error) {
    setCache(cacheKey, cliData);
    return cliData;
  }

  // 3. Fallback to authentic snapshot
  return (liveSnapshot as any)?.macro || { rates: [], currencies: [], commodities: [] };
}
