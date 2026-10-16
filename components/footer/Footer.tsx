"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import QuantSynthicaLogo from "@/components/branding/QuantSynthicaLogo";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const PLATFORM_LINKS = [
    { label: "Markets / Charts", href: "/research" },
    { label: "Strategies", href: "/strategies" },
    { label: "Backtests", href: "/backtests" },
    { label: "Analytics", href: "/analytics" },
    { label: "Portfolio", href: "/portfolio" },
    { label: "Risk Observatory", href: "/risk" },
  ];

  const RESOURCE_LINKS = [
    { label: "Research Engine", href: "/research" },
    { label: "Platform Resources", href: "/settings" },
    { label: "Documentation", href: "/docs" },
  ];

  return (
    <footer className="relative z-20 w-full border-t border-slate-200/80 bg-slate-50/90 text-slate-600 transition-colors duration-300 dark:border-slate-800/80 dark:bg-[#060D17] dark:text-slate-400">
      <div className="mx-auto max-w-[1520px] px-4 py-12 sm:px-6 lg:px-8">
        {/* 1. Subtle Pre-Footer Platform CTA */}
        <div className="mb-10 flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white/70 p-5 backdrop-blur-sm sm:flex-row sm:items-center dark:border-slate-800/70 dark:bg-slate-900/40">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#1769FF] dark:text-blue-400">
              Research Platform
            </div>
            <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
              Explore the research platform.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Zero-lookahead backtesting, factor signals, and covariance optimization.
            </p>
          </div>
          <Link
            href="/research"
            className="group inline-flex items-center gap-2 rounded-lg bg-[#1769FF] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-600 active:scale-[0.98] dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            <span>Explore QuantSynthicaLab</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* 2. Structured Multi-Column Grid */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
          {/* Brand Identity & Mission (Takes 2 cols on lg) */}
          <div className="flex flex-col sm:col-span-2">
            <div className="mb-4">
              <QuantSynthicaLogo variant="full" size="default" />
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Quantitative research and analytics for modern markets. Empowering researchers and algorithmic traders with rigorous backtesting and risk analytics.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <span className="rounded bg-slate-200/60 px-2 py-0.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Research
              </span>
              <span>•</span>
              <span className="rounded bg-slate-200/60 px-2 py-0.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Models
              </span>
              <span>•</span>
              <span className="rounded bg-slate-200/60 px-2 py-0.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Risk
              </span>
              <span>•</span>
              <span className="rounded bg-slate-200/60 px-2 py-0.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Portfolio
              </span>
            </div>
          </div>

          {/* Column 1: PLATFORM */}
          <div className="flex flex-col">
            <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Platform
            </h4>
            <ul className="mt-3.5 space-y-2.5 text-xs">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="inline-block transition-colors duration-150 hover:text-[#1769FF] dark:hover:text-blue-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: RESOURCES */}
          <div className="flex flex-col">
            <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Resources
            </h4>
            <ul className="mt-3.5 space-y-2.5 text-xs">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="inline-block transition-colors duration-150 hover:text-[#1769FF] dark:hover:text-blue-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 3. Bottom Bar: Copyright & Direct Links */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-6 text-center sm:flex-row sm:text-left dark:border-slate-800/60">
          <p className="text-[12px] text-slate-500 dark:text-slate-500">
            © {currentYear} <span className="font-semibold text-slate-700 dark:text-slate-300">QuantSynthicaLab</span>. Quantitative research and analytics for modern markets.
          </p>
          <p className="max-w-md text-[11px] text-slate-500 dark:text-slate-500 sm:text-right">
            A research and paper-trading tool. Market data may be delayed. Nothing here is investment advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
