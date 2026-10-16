import { LayoutDashboard, Briefcase, ShieldAlert, PieChart, Network, TrendingDown, Layers, Sigma } from "lucide-react";
import type { ComponentType } from "react";

export type RiskTabKey = "overview" | "portfolio" | "var" | "decomposition" | "correlation" | "drawdown" | "scenario" | "factor";
export type RiskField = "source" | "benchmark" | "dates" | "confidence" | "lookback" | "horizon" | "value";

export const RISK_TABS: { key: RiskTabKey; label: string; icon: ComponentType<{ className?: string }>; title: string; desc: string; fields: RiskField[] }[] = [
  { key: "overview", label: "Risk Overview", icon: LayoutDashboard, title: "Risk Analytics Lab", desc: "Measure, monitor and analyse market and portfolio risk using quantitative techniques.", fields: ["source", "dates", "confidence", "lookback"] },
  { key: "portfolio", label: "Portfolio Risk", icon: Briefcase, title: "Portfolio Risk", desc: "Advanced risk measurement and Monte Carlo analysis for portfolios and individual assets.", fields: ["source", "benchmark", "dates", "confidence", "lookback"] },
  { key: "var", label: "Value at Risk", icon: ShieldAlert, title: "Value at Risk (VaR)", desc: "Estimate potential losses at a confidence level using multiple methods and compare risk measures.", fields: ["source", "dates", "confidence", "horizon"] },
  { key: "decomposition", label: "Risk Decomposition", icon: PieChart, title: "Risk Decomposition", desc: "Break total portfolio risk into asset, sector and systematic contributions.", fields: ["source", "benchmark", "dates", "confidence"] },
  { key: "correlation", label: "Correlation Analysis", icon: Network, title: "Correlation Analysis", desc: "Analyse relationships between assets to understand diversification benefits and risk dynamics.", fields: ["source", "dates", "lookback"] },
  { key: "drawdown", label: "Drawdown Analysis", icon: TrendingDown, title: "Drawdown Analysis", desc: "Analyse drawdowns, recovery periods and underwater performance to understand downside risk.", fields: ["source", "benchmark", "dates"] },
  { key: "scenario", label: "Scenario Analysis", icon: Layers, title: "Scenario Analysis", desc: "Replay real historical market episodes against the current portfolio weights.", fields: ["source", "benchmark", "value"] },
  { key: "factor", label: "Factor Risk", icon: Sigma, title: "Factor Risk Analysis", desc: "Analyse sensitivity to systematic risk factors using ETF and index proxy factors.", fields: ["source", "dates"] },
];
