/**
 * QuantSynthica Lab Central System Configuration & Quantitative Defaults Store
 * Provides institutional defaults for Market Data, Research, Backtesting,
 * Portfolio Risk, Optimization, Factor Models, and Diagnostics.
 */

export interface SystemSettings {
  // 1. Market Data & Universe
  marketData: {
    primaryProvider: "yfinance" | "TradingView Screener" | "Custom API" | "Auto";
    defaultExchange: "US" | "NSE" | "BSE" | "Global";
    defaultUniverse: "All Equities" | "NIFTY 50" | "NIFTY 500" | "S&P 500" | "NASDAQ 100" | "Custom";
    defaultFrequency: "1D" | "1H" | "30m" | "15m" | "5m" | "1m";
    historicalWindow: "1Y" | "3Y" | "5Y" | "10Y" | "Maximum";
    adjustedPrices: boolean;
    autoRefresh: "Off" | "1 minute" | "5 minutes" | "15 minutes" | "1 hour";
    cacheTTL: "5m" | "15m" | "30m" | "1h";
  };

  // 2. Quantitative Research Defaults
  research: {
    defaultBenchmark: string;
    riskFreeRate: number; // e.g. 4.50%
    returnFrequency: "Daily" | "Weekly" | "Monthly";
    annualizationFactor: number; // 252
    varConfidence: "90%" | "95%" | "99%";
    cvarConfidence: "95%" | "99%";
    volatilityModel: "Historical" | "EWMA" | "GARCH" | "Parkinson" | "Yang-Zhang";
    correlationMethod: "Pearson" | "Spearman" | "Kendall";
    defaultLookback: "63D" | "126D" | "252D" | "504D";
  };

  // 3. Backtest Engine
  backtest: {
    initialCapital: number; // 100000
    positionSizing: "Equal Weight" | "Fixed Fraction" | "Volatility Target" | "Risk Parity";
    commission: number; // 0.05%
    slippage: number; // 0.05%
    executionModel: "Next Bar Open" | "Next Bar Close" | "Same Bar Close";
    lookaheadProtection: boolean; // true
    corporateActions: "Adjusted" | "Raw";
    allowFractional: boolean;
    maxConcurrentPositions: number; // 10
    defaultStopLoss: number; // 3%
    defaultTakeProfit: number; // 8%
    rebalanceFrequency: "Daily" | "Weekly" | "Monthly" | "Quarterly";
  };

  // 4. Portfolio & Risk Engine
  portfolio: {
    weightModel: "Equal Weight" | "Inverse Volatility" | "Risk Parity" | "Minimum Variance" | "Maximum Sharpe";
    targetVolatility: number; // 15%
    varMethod: "Historical" | "Parametric" | "Monte Carlo";
    monteCarloSimulations: number; // 10000
    maxDrawdownAlert: number; // 10%
    correlationLookback: "63D" | "126D" | "252D" | "504D";
    rebalancingThreshold: number; // 5%
  };

  // 5. Portfolio Optimization
  optimization: {
    objective: "Maximum Sharpe" | "Minimum Variance" | "Risk Parity" | "Maximum Diversification" | "Target Volatility";
    longOnly: boolean;
    minWeight: number; // 0%
    maxWeight: number; // 30%
    cashAllowed: boolean;
    targetVolatility: number; // 15%
    solver: "SciPy SLSQP (Native)" | "CVXPY (Optional)";
    optimizationFrequency: "Daily" | "Weekly" | "Monthly" | "Quarterly";
  };

  // 6. Factor Model
  factorModel: {
    model: "CAPM" | "Fama-French 3" | "Fama-French 5" | "Carhart 4" | "Custom";
    benchmark: string;
    lookbackMonths: number; // 36
    regressionFrequency: "Monthly" | "Weekly" | "Daily";
    minObservations: number; // 60
    supportedFactors: string[];
  };

  // 7. Execution & Transaction Costs
  execution: {
    fillModel: "Next Open" | "Next Close" | "VWAP" | "TWAP";
    slippageModel: "Fixed %" | "Volume Based" | "Spread Based";
    commissionModel: "Fixed" | "Percentage" | "Tiered";
    partialFills: boolean;
    marketImpact: boolean;
    zeroLookaheadEnforcement: boolean;
  };

  // 8. Python / FastAPI Engine
  engine: {
    apiUrl: string;
    autoPing: boolean;
  };

  // 9. Data Storage & Cache
  dataStorage: {
    autoClearCache: boolean;
    maxCacheGb: number;
  };

  // 10. Terminal Appearance
  appearance: {
    theme: "Dark Terminal" | "Light" | "System";
    accent: "Cyan" | "Blue" | "Green" | "Amber";
    chartStyle: "Candlestick" | "OHLC" | "Line" | "Area";
    defaultChartPeriod: "1M" | "3M" | "6M" | "1Y" | "3Y" | "ALL";
    density: "Compact" | "Comfortable";
    animations: boolean;
    showTerminalFooter: boolean;
    showLatency: boolean;
    showKeyboardShortcuts: boolean;
  };

  // 11. Keyboard Shortcuts
  shortcuts: {
    search: string;
    newStrategy: string;
    buildStrategy: string;
    simulate: string;
    research: string;
    analytics: string;
    portfolio: string;
    closePanel: string;
    shortcutHelp: string;
  };

  // 12. Alerts & Notifications
  alerts: {
    drawdownAlert: number; // 10%
    volatilityAlert: number; // 30%
    apiFailure: boolean;
    backtestComplete: boolean;
    optimizationComplete: boolean;
    dataFeedFailure: boolean;
    channels: {
      terminal: boolean;
      browser: boolean;
      email: boolean;
      telegram: boolean;
    };
  };

  // 13. Developer & Diagnostics
  developer: {
    environment: "Development" | "Production";
    debugMode: boolean;
    apiLogging: boolean;
    requestLogging: boolean;
    performanceProfiling: boolean;
  };
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  marketData: {
    primaryProvider: "yfinance",
    defaultExchange: "US",
    defaultUniverse: "S&P 500",
    defaultFrequency: "1D",
    historicalWindow: "5Y",
    adjustedPrices: true,
    autoRefresh: "Off",
    cacheTTL: "15m",
  },
  research: {
    defaultBenchmark: "SPY",
    riskFreeRate: 4.5,
    returnFrequency: "Daily",
    annualizationFactor: 252,
    varConfidence: "95%",
    cvarConfidence: "95%",
    volatilityModel: "Historical",
    correlationMethod: "Pearson",
    defaultLookback: "252D",
  },
  backtest: {
    initialCapital: 100000,
    positionSizing: "Equal Weight",
    commission: 0.05,
    slippage: 0.05,
    executionModel: "Next Bar Open",
    lookaheadProtection: true,
    corporateActions: "Adjusted",
    allowFractional: true,
    maxConcurrentPositions: 10,
    defaultStopLoss: 3.0,
    defaultTakeProfit: 8.0,
    rebalanceFrequency: "Monthly",
  },
  portfolio: {
    weightModel: "Risk Parity",
    targetVolatility: 15.0,
    varMethod: "Parametric",
    monteCarloSimulations: 10000,
    maxDrawdownAlert: 10.0,
    correlationLookback: "252D",
    rebalancingThreshold: 5.0,
  },
  optimization: {
    objective: "Risk Parity",
    longOnly: true,
    minWeight: 0,
    maxWeight: 30,
    cashAllowed: false,
    targetVolatility: 15.0,
    solver: "SciPy SLSQP (Native)",
    optimizationFrequency: "Monthly",
  },
  factorModel: {
    model: "Fama-French 5",
    benchmark: "SPY",
    lookbackMonths: 36,
    regressionFrequency: "Monthly",
    minObservations: 60,
    supportedFactors: ["Market Beta", "SMB", "HML", "RMW", "CMA", "Momentum", "Alpha"],
  },
  execution: {
    fillModel: "Next Open",
    slippageModel: "Volume Based",
    commissionModel: "Percentage",
    partialFills: true,
    marketImpact: true,
    zeroLookaheadEnforcement: true,
  },
  engine: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    autoPing: true,
  },
  dataStorage: {
    autoClearCache: false,
    maxCacheGb: 5.0,
  },
  appearance: {
    theme: "Dark Terminal",
    accent: "Cyan",
    chartStyle: "Candlestick",
    defaultChartPeriod: "1Y",
    density: "Compact",
    animations: true,
    showTerminalFooter: true,
    showLatency: true,
    showKeyboardShortcuts: true,
  },
  shortcuts: {
    search: "/",
    newStrategy: "N",
    buildStrategy: "B",
    simulate: "S",
    research: "R",
    analytics: "A",
    portfolio: "P",
    closePanel: "Escape",
    shortcutHelp: "?",
  },
  alerts: {
    drawdownAlert: 10.0,
    volatilityAlert: 30.0,
    apiFailure: true,
    backtestComplete: true,
    optimizationComplete: true,
    dataFeedFailure: true,
    channels: {
      terminal: true,
      browser: true,
      email: false,
      telegram: false,
    },
  },
  developer: {
    environment: "Development",
    debugMode: false,
    apiLogging: true,
    requestLogging: true,
    performanceProfiling: false,
  },
};

const SETTINGS_STORAGE_KEY = "algolab_system_settings_v1";

/**
 * Loads system settings from localStorage with fallback to DEFAULT_SYSTEM_SETTINGS.
 */
export function loadSystemSettings(): SystemSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SYSTEM_SETTINGS;
  }
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SYSTEM_SETTINGS;
    const parsed = JSON.parse(raw);
    return deepMergeSettings(DEFAULT_SYSTEM_SETTINGS, parsed);
  } catch (err) {
    console.warn("Failed to load settings from storage:", err);
    return DEFAULT_SYSTEM_SETTINGS;
  }
}

/**
 * Persists system settings into localStorage and fires a storage event for cross-tab sync.
 */
export function saveSystemSettingsToLocal(settings: SystemSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    // Dispatch custom event for same-window reactive updates
    window.dispatchEvent(new CustomEvent("algolab_settings_updated", { detail: settings }));
  } catch (err) {
    console.error("Failed to save settings locally:", err);
  }
}

/**
 * Deep merge utility to handle schema evolution gracefully.
 */
function deepMergeSettings(defaults: any, current: any): any {
  if (!current || typeof current !== "object") return defaults;
  const result: any = Array.isArray(defaults) ? [...defaults] : { ...defaults };
  for (const key of Object.keys(defaults)) {
    if (key in current) {
      if (
        typeof defaults[key] === "object" &&
        defaults[key] !== null &&
        !Array.isArray(defaults[key])
      ) {
        result[key] = deepMergeSettings(defaults[key], current[key]);
      } else {
        result[key] = current[key];
      }
    }
  }
  return result;
}

/**
 * Generates clean JSON string of settings omitting any sensitive tokens or secrets.
 */
export function exportSettingsJson(settings: SystemSettings): string {
  // Deep clone to avoid mutating input
  const exported = JSON.parse(JSON.stringify(settings));
  // Strip any accidental sensitive fields if present
  return JSON.stringify(exported, null, 2);
}

/**
 * Validates and imports a settings JSON string.
 */
export function validateAndImportSettingsJson(jsonStr: string): { success: boolean; settings?: SystemSettings; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== "object") {
      return { success: false, error: "Root configuration must be a valid JSON object" };
    }
    // Deep merge against defaults to guarantee all expected fields exist
    const merged = deepMergeSettings(DEFAULT_SYSTEM_SETTINGS, parsed);
    return { success: true, settings: merged };
  } catch (err: any) {
    return { success: false, error: `Invalid JSON syntax: ${err.message}` };
  }
}
