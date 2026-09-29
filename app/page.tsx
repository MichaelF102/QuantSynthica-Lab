import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HeroSection from "@/components/landing/HeroSection";
import WorkflowSection from "@/components/landing/workflow/WorkflowSection";
import ResearchWorkspace from "@/components/landing/research-workspace/ResearchWorkspace";
import StrategyBacktestSection from "@/components/landing/strategy-backtest/StrategyBacktestSection";
import QuantResearchLabs from "@/components/landing/quant-research-labs/QuantResearchLabs";
import CoveredMarketsSection from "@/components/landing/markets/CoveredMarketsSection";
import RiskIntelligenceSection from "@/components/landing/risk-intelligence/RiskIntelligenceSection";
import PortfolioIntelligenceSection from "@/components/landing/portfolio-intelligence/PortfolioIntelligenceSection";
import FinalCTA from "@/components/landing/final-cta/FinalCTA";
import SectionBackground from "@/components/backgrounds/SectionBackground";

export default function LandingPage() {
  return (
    <div className="w-full bg-[var(--background)] transition-colors duration-300">
      {/* 1. Master Redesigned Hero Section */}
      <HeroSection />

      {/* 2. Interactive Quantitative Workflow Section (DATA → ANALYSE → STRATEGY → BACKTEST → RISK → PORTFOLIO) */}
      <WorkflowSection />

      {/* 3. Interactive Security Research Terminal & Workspace (Everything you need to research a market) */}
      <div id="features">
        <ResearchWorkspace />
      </div>

      {/* 4. Strategy -> Backtest Research Journey (Build -> Test -> Evaluate) */}
      <StrategyBacktestSection />

      {/* 5. Specialized Quantitative Research Environments (Quant Research Labs) */}
      <QuantResearchLabs />

      {/* 6. Covered Markets & Assets Universe Section */}
      <CoveredMarketsSection />

      {/* 7. Risk Intelligence (Interactive Risk Observatory) */}
      <RiskIntelligenceSection />

      {/* 8. Portfolio Intelligence (Interactive Portfolio Construction & Allocation) */}
      <PortfolioIntelligenceSection />

      {/* 9. Methodology & Rigor Section */}
      <section id="coverage" className="relative border-t border-slate-200/80 dark:border-slate-800 bg-[var(--bg-methodology)] py-16 overflow-hidden transition-colors duration-500">
        {/* Component-Specific Semantic Methodology Background */}
        <SectionBackground variant="methodology" />
        <div className="mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8">
          <div className="text-[12px] font-bold tracking-[0.2em] text-[#1769FF] uppercase">
            EXECUTION METHODOLOGY
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0B1220] dark:text-white">
            Built with Quantitative Rigor
          </h2>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-[#0B1528]">
              <div className="text-xs font-bold text-[#1769FF] uppercase tracking-wider mb-2">
                01 • ZERO LOOKAHEAD BIAS
              </div>
              <h4 className="text-base font-bold text-[#0B1220] dark:text-white">Next-Open Fills (t+1)</h4>
              <p className="mt-2 text-xs leading-relaxed text-[#526174] dark:text-slate-400">
                Trading signals compute strictly on candle close. Fills execute at the subsequent bar&apos;s open price, ensuring backtest realism matches real-world execution.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-[#0B1528]">
              <div className="text-xs font-bold text-[#1769FF] uppercase tracking-wider mb-2">
                02 • REALISTIC FRICTION
              </div>
              <h4 className="text-base font-bold text-[#0B1220] dark:text-white">Commissions & Slippage</h4>
              <p className="mt-2 text-xs leading-relaxed text-[#526174] dark:text-slate-400">
                Every simulation accounts for configurable bps commissions and market slippage modeling so paper profitability holds up in live paper desks.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-[#0B1528]">
              <div className="text-xs font-bold text-[#1769FF] uppercase tracking-wider mb-2">
                03 • DUAL MARKET COVERAGE
              </div>
              <h4 className="text-base font-bold text-[#0B1220] dark:text-white">US (NYSE/NASDAQ) & India (NSE/BSE)</h4>
              <p className="mt-2 text-xs leading-relaxed text-[#526174] dark:text-slate-400">
                Seamlessly cross-analyze S&P 500 tech leaders alongside Indian blue-chips like Reliance, TCS, and high-growth mid-caps with native currency units.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Master Final CTA: Research Universe (Research with purpose. Decide with evidence.) & Institutional Footer */}
      <FinalCTA />
    </div>
  );
}
