import type { LucideIcon } from "lucide-react";
import {
  Activity, BarChart3, Boxes, BriefcaseBusiness, CandlestickChart, FileText, FlaskConical, Flame, Gauge, GitMerge, Hammer,
  Layers, LayoutDashboard, ListChecks, Network, Newspaper, PieChart, Search, Settings, ShieldAlert, Sigma, Sliders,
  Sparkles, TrendingDown, TrendingUp, Users, Leaf, ArrowLeftRight, Landmark, Scale,
} from "lucide-react";

export interface NavChild { label: string; desc: string; icon: LucideIcon; href: string; /** Needs an active ticker; falls back to `fallback` when there is none. */ ticker?: { tab: string }; }
export interface NavItem { label: string; href: string; icon: LucideIcon; children?: NavChild[]; }

const research = (label: string, desc: string, icon: LucideIcon, tab: string): NavChild => ({ label, desc, icon, href: "/research", ticker: { tab } });

export const NAV: NavItem[] = [
  {
    label: "Research", href: "/research", icon: Search,
    children: [
      { label: "Research Home", desc: "Search any NSE, BSE or US stock", icon: Search, href: "/research" },
      research("Technicals", "Candles, indicators and overlays", CandlestickChart, "technicals"),
      research("Fundamentals", "Valuation, margins and growth", Landmark, "fundamentals"),
      research("Sentiment", "Momentum and positioning signals", Activity, "sentiment"),
      research("Options", "Option chain, put/call and expiries", Layers, "options"),
      research("Analyst Estimates", "Targets, ratings and revisions", Scale, "analyst"),
      research("News", "Headlines for the company", Newspaper, "news"),
      research("Filings", "Exchange filings and corporate actions", FileText, "filings"),
      research("Competitors", "Peers compared side by side", Users, "competitors"),
      research("Ownership", "Holders and insider activity", PieChart, "ownership"),
      research("ESG", "Environmental, social and governance", Leaf, "esg"),
    ],
  },
  {
    label: "Strategies", href: "/strategies", icon: Boxes,
    children: [
      { label: "Strategy Library", desc: "Every model you can backtest", icon: Boxes, href: "/strategies" },
      { label: "Strategy Lab", desc: "Build and test a new strategy", icon: FlaskConical, href: "/strategies/builder" },
    ],
  },
  {
    label: "Backtests", href: "/backtests", icon: ListChecks,
    children: [
      { label: "Backtest Registry", desc: "Every saved run and its results", icon: ListChecks, href: "/backtests" },
      { label: "Run from Strategy Library", desc: "Pick a model and run it on a stock", icon: Boxes, href: "/strategies" },
      { label: "Build a Strategy", desc: "Create a model in the Strategy Lab", icon: Hammer, href: "/strategies/builder" },
    ],
  },
  {
    label: "Analytics", href: "/analytics", icon: BarChart3,
    children: [
      { label: "Overview", desc: "KPIs and equity curves across runs", icon: LayoutDashboard, href: "/analytics?tab=Overview" },
      { label: "Performance", desc: "Returns, rolling metrics, annual table", icon: TrendingUp, href: "/analytics?tab=Performance" },
      { label: "Risk", desc: "VaR, drawdown and downside measures", icon: ShieldAlert, href: "/analytics?tab=Risk" },
      { label: "Trades", desc: "Win rate, payoff and exit reasons", icon: ArrowLeftRight, href: "/analytics?tab=Trades" },
      { label: "Regimes", desc: "Bull, bear and volatility regimes", icon: Gauge, href: "/analytics?tab=Regimes" },
      { label: "Factors", desc: "Factor exposure of a run", icon: Sliders, href: "/analytics?tab=Factors" },
      { label: "Robustness", desc: "Monte Carlo confidence cone", icon: Sparkles, href: "/analytics?tab=Robustness" },
      { label: "Attribution", desc: "Where the return came from", icon: GitMerge, href: "/analytics?tab=Attribution" },
    ],
  },
  {
    label: "Portfolio", href: "/portfolio", icon: BriefcaseBusiness,
    children: [
      { label: "Overview", desc: "Build and review a portfolio", icon: BarChart3, href: "/portfolio?tab=Overview" },
      { label: "Performance", desc: "Growth against a benchmark", icon: TrendingUp, href: "/portfolio?tab=Performance" },
      { label: "Risk Metrics", desc: "Volatility, VaR and drawdown", icon: ShieldAlert, href: "/portfolio?tab=Risk%20Metrics" },
      { label: "Allocation", desc: "Weights, sectors and optimisers", icon: PieChart, href: "/portfolio?tab=Allocation" },
      { label: "Correlation", desc: "How the holdings move together", icon: Network, href: "/portfolio?tab=Correlation" },
      { label: "Stress Test", desc: "Shocks applied to the portfolio", icon: Flame, href: "/portfolio?tab=Stress%20Test" },
      { label: "Scenario Analysis", desc: "Historical episodes replayed", icon: Layers, href: "/portfolio?tab=Scenario%20Analysis" },
    ],
  },
  {
    label: "Risk", href: "/risk", icon: ShieldAlert,
    children: [
      { label: "Risk Overview", desc: "Market and portfolio risk at a glance", icon: LayoutDashboard, href: "/risk?tab=overview" },
      { label: "Portfolio Risk", desc: "Monte Carlo for portfolios and assets", icon: BriefcaseBusiness, href: "/risk?tab=portfolio" },
      { label: "Value at Risk", desc: "Loss estimates by method", icon: ShieldAlert, href: "/risk?tab=var" },
      { label: "Risk Decomposition", desc: "Asset, sector and systematic risk", icon: PieChart, href: "/risk?tab=decomposition" },
      { label: "Correlation Analysis", desc: "Diversification and dependence", icon: Network, href: "/risk?tab=correlation" },
      { label: "Drawdown Analysis", desc: "Depth, duration and recovery", icon: TrendingDown, href: "/risk?tab=drawdown" },
      { label: "Scenario Analysis", desc: "Real market episodes replayed", icon: Layers, href: "/risk?tab=scenario" },
      { label: "Factor Risk", desc: "Sensitivity to proxy factors", icon: Sigma, href: "/risk?tab=factor" },
    ],
  },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const QUANTSYNTHICA_URL = "https://quant-synthica.vercel.app/";
