/**
 * QuantSynthica Lab — Centralized Market Universe Symbol Configuration
 * Defines supported assets, benchmark groupings, and context-aware sidebar lists.
 */

export interface TickerConfig {
  symbol: string;
  name: string;
  displayName?: string;
  exchange: string;
  currency: string;
  flag: string;
  category?: string;
  classification?: string;
}

export const US_EQUITIES: TickerConfig[] = [
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", currency: "$", flag: "🇺🇸" },
  { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", currency: "$", flag: "🇺🇸" },
  { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", currency: "$", flag: "🇺🇸" },
  { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ", currency: "$", flag: "🇺🇸" },
  { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", currency: "$", flag: "🇺🇸" },
  { symbol: "META", name: "Meta Platforms Inc.", exchange: "NASDAQ", currency: "$", flag: "🇺🇸" },
  { symbol: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ", currency: "$", flag: "🇺🇸" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", exchange: "NYSE", currency: "$", flag: "🇺🇸" },
  { symbol: "JNJ", name: "Johnson & Johnson", exchange: "NYSE", currency: "$", flag: "🇺🇸" },
  { symbol: "XOM", name: "Exxon Mobil Corp.", exchange: "NYSE", currency: "$", flag: "🇺🇸" },
  { symbol: "AVGO", name: "Broadcom Inc.", exchange: "NASDAQ", currency: "$", flag: "🇺🇸" },
];

export const INDIAN_EQUITIES: TickerConfig[] = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries Ltd.", displayName: "RELIANCE", exchange: "NSE", currency: "₹", flag: "🇮🇳" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services", displayName: "TCS", exchange: "NSE", currency: "₹", flag: "🇮🇳" },
  { symbol: "INFY.NS", name: "Infosys Ltd.", displayName: "INFY", exchange: "NSE", currency: "₹", flag: "🇮🇳" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank Ltd.", displayName: "HDFC BANK", exchange: "NSE", currency: "₹", flag: "🇮🇳" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank Ltd.", displayName: "ICICI BANK", exchange: "NSE", currency: "₹", flag: "🇮🇳" },
  { symbol: "SBIN.NS", name: "State Bank of India", displayName: "SBI", exchange: "NSE", currency: "₹", flag: "🇮🇳" },
  { symbol: "ITC.NS", name: "ITC Ltd.", displayName: "ITC", exchange: "NSE", currency: "₹", flag: "🇮🇳" },
  { symbol: "LT.NS", name: "Larsen & Toubro Ltd.", displayName: "L&T", exchange: "NSE", currency: "₹", flag: "🇮🇳" },
];

export const ETFS: TickerConfig[] = [
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", exchange: "NYSE Arca", currency: "$", flag: "🇺🇸", classification: "Broad Market ETF", category: "Core" },
  { symbol: "QQQ", name: "Invesco QQQ Trust (Nasdaq 100)", exchange: "NASDAQ", currency: "$", flag: "🇺🇸", classification: "Technology ETF", category: "Core" },
  { symbol: "IWM", name: "iShares Russell 2000 ETF", exchange: "NYSE Arca", currency: "$", flag: "🇺🇸", classification: "Small Cap ETF", category: "Core" },
  { symbol: "DIA", name: "SPDR Dow Jones Industrial ETF", exchange: "NYSE Arca", currency: "$", flag: "🇺🇸", classification: "Mega Cap Value", category: "Core" },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", exchange: "NYSE Arca", currency: "$", flag: "🇺🇸", classification: "S&P 500 Blend", category: "Core" },
  { symbol: "VTI", name: "Vanguard Total Stock Market", exchange: "NYSE Arca", currency: "$", flag: "🇺🇸", classification: "Total US Market", category: "Core" },
  { symbol: "XLK", name: "Technology Select Sector SPDR", exchange: "NYSE Arca", currency: "$", flag: "🇺🇸", classification: "Tech Sector ETF", category: "Thematic" },
  { symbol: "XLF", name: "Financial Select Sector SPDR", exchange: "NYSE Arca", currency: "$", flag: "🇺🇸", classification: "Financial Sector", category: "Thematic" },
  { symbol: "XLE", name: "Energy Select Sector SPDR", exchange: "NYSE Arca", currency: "$", flag: "🇺🇸", classification: "Energy Sector", category: "Thematic" },
  { symbol: "GLD", name: "SPDR Gold Shares", exchange: "NYSE Arca", currency: "$", flag: "🇺🇸", classification: "Commodity (Gold)", category: "Thematic" },
  { symbol: "TLT", name: "iShares 20+ Year Treasury Bond", exchange: "NASDAQ", currency: "$", flag: "🇺🇸", classification: "Fixed Income (Bonds)", category: "Thematic" },
];

export const INDICES: TickerConfig[] = [
  { symbol: "^GSPC", name: "S&P 500 Index", displayName: "S&P 500", exchange: "CBOE", currency: "", flag: "🇺🇸", category: "US" },
  { symbol: "^IXIC", name: "Nasdaq Composite", displayName: "NASDAQ", exchange: "NASDAQ", currency: "", flag: "🇺🇸", category: "US" },
  { symbol: "^DJI", name: "Dow Jones Industrial Average", displayName: "DOW JONES", exchange: "DJI", currency: "", flag: "🇺🇸", category: "US" },
  { symbol: "^RUT", name: "Russell 2000 Index", displayName: "RUSSELL 2000", exchange: "FTSE Russell", currency: "", flag: "🇺🇸", category: "US" },
  { symbol: "^NSEI", name: "NIFTY 50 Index", displayName: "NIFTY 50", exchange: "NSE", currency: "₹", flag: "🇮🇳", category: "India" },
  { symbol: "^BSESN", name: "S&P BSE SENSEX", displayName: "SENSEX", exchange: "BSE", currency: "₹", flag: "🇮🇳", category: "India" },
  { symbol: "^NSEBANK", name: "NIFTY Bank Index", displayName: "BANK NIFTY", exchange: "NSE", currency: "₹", flag: "🇮🇳", category: "India" },
];

export const OPTIONS_UNDERLYINGS: TickerConfig[] = [
  { symbol: "SPY", name: "S&P 500 ETF Trust", exchange: "CBOE", currency: "$", flag: "🇺🇸" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", exchange: "NASDAQ", currency: "$", flag: "🇺🇸" },
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", currency: "$", flag: "🇺🇸" },
  { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", currency: "$", flag: "🇺🇸" },
  { symbol: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ", currency: "$", flag: "🇺🇸" },
  { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", currency: "$", flag: "🇺🇸" },
  { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ", currency: "$", flag: "🇺🇸" },
  { symbol: "META", name: "Meta Platforms Inc.", exchange: "NASDAQ", currency: "$", flag: "🇺🇸" },
];

export const MACRO_INSTRUMENTS = {
  rates: [
    { symbol: "^IRX", name: "13-Week Treasury Bill", displayName: "3M Treasury", unit: "%", flag: "🇺🇸" },
    { symbol: "^FVX", name: "5-Year Treasury Yield", displayName: "5Y Treasury", unit: "%", flag: "🇺🇸" },
    { symbol: "^TNX", name: "10-Year Treasury Yield", displayName: "10Y Treasury", unit: "%", flag: "🇺🇸" },
    { symbol: "^TYX", name: "30-Year Treasury Yield", displayName: "30Y Treasury", unit: "%", flag: "🇺🇸" },
  ],
  commodities: [
    { symbol: "GC=F", name: "Gold Futures", displayName: "Gold", unit: "$/oz", flag: "🌐" },
    { symbol: "CL=F", name: "WTI Crude Oil Futures", displayName: "Crude Oil", unit: "$/bbl", flag: "🌐" },
    { symbol: "SI=F", name: "Silver Futures", displayName: "Silver", unit: "$/oz", flag: "🌐" },
    { symbol: "NG=F", name: "Natural Gas Futures", displayName: "Natural Gas", unit: "$/MMBtu", flag: "🌐" },
  ],
  fx: [
    { symbol: "DX-Y.NYB", name: "US Dollar Index", displayName: "Dollar Index", unit: "USD", flag: "🇺🇸" },
    { symbol: "EURUSD=X", name: "Euro / US Dollar", displayName: "EUR / USD", unit: "USD", flag: "🇪🇺" },
    { symbol: "JPY=X", name: "US Dollar / Japanese Yen", displayName: "USD / JPY", unit: "JPY", flag: "🇯🇵" },
    { symbol: "GBPUSD=X", name: "British Pound / US Dollar", displayName: "GBP / USD", unit: "USD", flag: "🇬🇧" },
    { symbol: "INR=X", name: "US Dollar / Indian Rupee", displayName: "USD / INR", unit: "INR", flag: "🇮🇳" },
  ],
};

/**
 * Contextual Right Sidebar Configurations
 * Each tab renders two specific contextual panels.
 */
export const CONTEXTUAL_SIDEBAR_CONFIG = {
  us_equities: {
    panel1: {
      title: "US BENCHMARKS",
      tag: "INDEXES",
      symbols: ["^GSPC", "^IXIC", "^DJI", "^RUT"],
    },
    panel2: {
      title: "US WATCHLIST",
      tag: "TECH LEADERS",
      symbols: ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL"],
    },
  },
  indian_equities: {
    panel1: {
      title: "INDIAN BENCHMARKS",
      tag: "NSE / BSE",
      symbols: ["^NSEI", "^BSESN", "^NSEBANK"],
    },
    panel2: {
      title: "INDIAN WATCHLIST",
      tag: "NIFTY HEAVYWEIGHTS",
      symbols: ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS"],
    },
  },
  etfs: {
    panel1: {
      title: "BENCHMARK ETFs",
      tag: "CORE INDEX",
      symbols: ["SPY", "QQQ", "IWM", "DIA"],
    },
    panel2: {
      title: "ETF WATCHLIST",
      tag: "THEMATIC / SECTORS",
      symbols: ["XLK", "XLF", "XLE", "GLD", "TLT"],
    },
  },
  indices: {
    panel1: {
      title: "US INDICES",
      tag: "WALL STREET",
      symbols: ["^GSPC", "^IXIC", "^DJI", "^RUT"],
    },
    panel2: {
      title: "INDIA INDICES",
      tag: "DALAL STREET",
      symbols: ["^NSEI", "^BSESN", "^NSEBANK"],
    },
  },
  options: {
    panel1: {
      title: "UNDERLYING",
      tag: "SPOT DESK",
      isUnderlyingPanel: true,
    },
    panel2: {
      title: "EXPIRATIONS",
      tag: "SERIES SELECTOR",
      isExpirationsPanel: true,
    },
  },
  economic_data: {
    panel1: {
      title: "RATES",
      tag: "US TREASURY",
      symbols: ["^TNX", "^FVX", "^TYX", "^IRX"],
    },
    panel2: {
      title: "CROSS-ASSET",
      tag: "MACRO COMMODITIES / FX",
      symbols: ["GC=F", "CL=F", "DX-Y.NYB", "^GSPC"],
    },
  },
};
