export interface AssetClassConfig {
  id: "equity" | "factors" | "options" | "cash";
  label: string;
  weight: number; // percentage, e.g. 55.2
  color: string;
  glowColor: string;
  accentColor: string;
  topSector?: string;
  topHolding?: string;
  assetCount?: number;
  description: string;
}

export interface SectorConfig {
  id: string;
  name: string;
  weight: number; // percentage within equity, e.g. 31.0
  color: string;
  glowColor: string;
  holdings: string[]; // ticker IDs
}

export interface PortfolioAssetDetail {
  id: string;
  name: string;
  company: string;
  assetClass: "equity" | "factors" | "options" | "cash";
  sector: string;
  weight: number; // portfolio percentage, e.g. 18.4
  amount: number; // in INR
  currency: string;
  color: string;
  riskContrib: number;
  volatility: number;
  correlation: number;
  expectedReturn: number;
  sharpe: number;
}

export const PORTFOLIO_VISUAL_CONFIG = {
  totalPortfolioValue: 1000000, // ₹10,00,000 base
  currencySymbol: "₹",
  
  assetClasses: {
    equity: {
      id: "equity",
      label: "Equity",
      weight: 55.2,
      color: "#1769FF",
      glowColor: "#00E5FF",
      accentColor: "#38BDF8",
      topSector: "Technology",
      topHolding: "RELIANCE",
      assetCount: 6,
      description: "Direct listed equities and market core holdings",
    } as AssetClassConfig,
    factors: {
      id: "factors",
      label: "Factors",
      weight: 20.1,
      color: "#8B5CF6",
      glowColor: "#C084FC",
      accentColor: "#A855F7",
      topSector: "Momentum / Quality",
      topHolding: "MOMENTUM_ALPHA",
      assetCount: 3,
      description: "Factor tilts: Momentum, Value, Low Volatility",
    } as AssetClassConfig,
    options: {
      id: "options",
      label: "Options",
      weight: 15.2,
      color: "#F59E0B",
      glowColor: "#FBBF24",
      accentColor: "#F97316",
      topSector: "Hedging & Volatility",
      topHolding: "NIFTY_COLLAR",
      assetCount: 2,
      description: "Derivative overlays, covered calls & tail hedges",
    } as AssetClassConfig,
    cash: {
      id: "cash",
      label: "Cash",
      weight: 9.5,
      color: "#10B981",
      glowColor: "#34D399",
      accentColor: "#06B6D4",
      topSector: "Yield Reserves",
      topHolding: "TREASURY_LIQUID",
      assetCount: 1,
      description: "Liquid reserve & collateral yield overnight repos",
    } as AssetClassConfig,
  },

  sectors: [
    {
      id: "technology",
      name: "Technology",
      weight: 31.0,
      color: "#00E5FF",
      glowColor: "#38BDF8",
      holdings: ["TCS", "INFY", "AAPL", "NVDA", "MSFT"],
    },
    {
      id: "financials",
      name: "Financials",
      weight: 23.0,
      color: "#3B82F6",
      glowColor: "#60A5FA",
      holdings: ["HDFC"],
    },
    {
      id: "consumer",
      name: "Consumer",
      weight: 15.0,
      color: "#F59E0B",
      glowColor: "#FBBF24",
      holdings: [],
    },
    {
      id: "healthcare",
      name: "Healthcare",
      weight: 11.0,
      color: "#10B981",
      glowColor: "#34D399",
      holdings: [],
    },
    {
      id: "industrials",
      name: "Industrials",
      weight: 8.0,
      color: "#EC4899",
      glowColor: "#F472B6",
      holdings: [],
    },
    {
      id: "energy",
      name: "Energy",
      weight: 7.0,
      color: "#6366F1",
      glowColor: "#818CF8",
      holdings: ["RELIANCE"],
    },
    {
      id: "other",
      name: "Other",
      weight: 5.0,
      color: "#64748B",
      glowColor: "#94A3B8",
      holdings: ["SPY"],
    },
  ] as SectorConfig[],

  defaultAssets: [
    {
      id: "RELIANCE",
      name: "RELIANCE",
      company: "Reliance Industries",
      assetClass: "equity",
      sector: "Energy",
      weight: 18.4,
      amount: 184000,
      currency: "₹",
      color: "#10B981",
      riskContrib: 12.7,
      volatility: 24.1,
      correlation: 0.62,
      expectedReturn: 16.4,
      sharpe: 1.28,
    },
    {
      id: "NVDA",
      name: "NVDA",
      company: "NVIDIA Corp.",
      assetClass: "equity",
      sector: "Technology",
      weight: 12.4,
      amount: 124000,
      currency: "$",
      color: "#F59E0B",
      riskContrib: 18.2,
      volatility: 38.4,
      correlation: 0.54,
      expectedReturn: 28.5,
      sharpe: 1.45,
    },
    {
      id: "HDFC",
      name: "HDFC",
      company: "HDFC Bank",
      assetClass: "equity",
      sector: "Financials",
      weight: 11.6,
      amount: 116000,
      currency: "₹",
      color: "#06B6D4",
      riskContrib: 9.8,
      volatility: 19.5,
      correlation: 0.58,
      expectedReturn: 14.2,
      sharpe: 1.15,
    },
    {
      id: "SPY",
      name: "SPY",
      company: "S&P 500 ETF",
      assetClass: "equity",
      sector: "Other",
      weight: 10.2,
      amount: 102000,
      currency: "$",
      color: "#6366F1",
      riskContrib: 8.4,
      volatility: 16.2,
      correlation: 0.72,
      expectedReturn: 11.8,
      sharpe: 1.05,
    },
    {
      id: "AAPL",
      name: "AAPL",
      company: "Apple Inc.",
      assetClass: "equity",
      sector: "Technology",
      weight: 9.1,
      amount: 91000,
      currency: "$",
      color: "#8B5CF6",
      riskContrib: 8.9,
      volatility: 21.0,
      correlation: 0.68,
      expectedReturn: 15.6,
      sharpe: 1.22,
    },
    {
      id: "TCS",
      name: "TCS",
      company: "Tata Consultancy",
      assetClass: "equity",
      sector: "Technology",
      weight: 8.7,
      amount: 87000,
      currency: "₹",
      color: "#3B82F6",
      riskContrib: 6.5,
      volatility: 18.2,
      correlation: 0.48,
      expectedReturn: 13.9,
      sharpe: 1.18,
    },
    {
      id: "INFY",
      name: "INFY",
      company: "Infosys Ltd",
      assetClass: "equity",
      sector: "Technology",
      weight: 7.3,
      amount: 73000,
      currency: "₹",
      color: "#EF4444",
      riskContrib: 5.8,
      volatility: 20.4,
      correlation: 0.52,
      expectedReturn: 14.5,
      sharpe: 1.12,
    },
  ] as PortfolioAssetDetail[],
};
