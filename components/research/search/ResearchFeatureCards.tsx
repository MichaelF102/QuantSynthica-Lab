"use client";

import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  BarChart2,
  FlaskConical,
  PieChart,
  BookOpen,
} from "lucide-react";

interface FeatureCard {
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  borderColor: string;
}

const FEATURES: FeatureCard[] = [
  {
    title: "Advanced Screeners",
    subtitle: "Find opportunities faster",
    href: "/analytics",
    icon: <TrendingUp className="h-5 w-5" />,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10 border-blue-500/20",
    borderColor: "hover:border-blue-500/40 hover:shadow-blue-500/10",
  },
  {
    title: "Technical Analysis",
    subtitle: "50+ indicators and tools",
    href: "/research?ticker=RELIANCE&country=India",
    icon: <BarChart2 className="h-5 w-5" />,
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/10 border-cyan-500/20",
    borderColor: "hover:border-cyan-500/40 hover:shadow-cyan-500/10",
  },
  {
    title: "Quantitative Models",
    subtitle: "Backtest and research",
    href: "/backtests",
    icon: <FlaskConical className="h-5 w-5" />,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/10 border-purple-500/20",
    borderColor: "hover:border-purple-500/40 hover:shadow-purple-500/10",
  },
  {
    title: "Portfolio Analytics",
    subtitle: "Optimize and manage risk",
    href: "/portfolio",
    icon: <PieChart className="h-5 w-5" />,
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/10 border-indigo-500/20",
    borderColor: "hover:border-indigo-500/40 hover:shadow-indigo-500/10",
  },
  {
    title: "Insights & Learning",
    subtitle: "Build your market knowledge",
    href: "/docs",
    icon: <BookOpen className="h-5 w-5" />,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    borderColor: "hover:border-emerald-500/40 hover:shadow-emerald-500/10",
  },
];

export default function ResearchFeatureCards() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 mt-12 sm:mt-16 pb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {FEATURES.map((feat) => (
          <Link
            key={feat.title}
            href={feat.href}
            className={`group relative flex items-center gap-3.5 rounded-2xl border border-slate-800/80 bg-[#0B1325]/70 p-3.5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-[#0E1A33]/90 active:scale-98 ${feat.borderColor}`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${feat.iconBg} ${feat.iconColor} transition-transform group-hover:scale-110`}
            >
              {feat.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-slate-100 group-hover:text-white">
                {feat.title}
              </div>
              <div className="truncate text-[11px] text-slate-400">
                {feat.subtitle}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
