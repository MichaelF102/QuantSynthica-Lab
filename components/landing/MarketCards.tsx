"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { REAL_UNIVERSE_MAP } from "@/lib/marketUniverseData";

interface MarketCardItem {
  id: string;
  name: string;
  country: "US" | "India";
  flag: string;
  price: string;
  change: string;
  isPositive: boolean;
  sparkline: string;
  positionClass: string;
  floatDelay: number;
}

const spy = REAL_UNIVERSE_MAP["SPY"];
const nsei = REAL_UNIVERSE_MAP["^NSEI"];
const qqq = REAL_UNIVERSE_MAP["QQQ"];

const CARDS: MarketCardItem[] = [
  {
    id: "sp500",
    name: "S&P 500 (SPY)",
    country: "US",
    flag: "🇺🇸",
    price: spy ? `$${spy.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$765.61",
    change: spy ? `${spy.change_pct >= 0 ? "+" : ""}${spy.change_pct.toFixed(2)}%` : "-0.74%",
    isPositive: spy ? spy.is_positive : false,
    sparkline: spy?.sparkline_d || "M0 10 Q 30 14, 60 18 T 110 24",
    positionClass: "left-[4%] sm:left-[8%] top-[2%] sm:top-[6%]",
    floatDelay: 0,
  },
  {
    id: "nifty50",
    name: "NIFTY 50",
    country: "India",
    flag: "🇮🇳",
    price: nsei ? `₹${nsei.price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "₹22,629.55",
    change: nsei ? `${nsei.change_pct >= 0 ? "+" : ""}${nsei.change_pct.toFixed(2)}%` : "-0.66%",
    isPositive: nsei ? nsei.is_positive : false,
    sparkline: nsei?.sparkline_d || "M0 8 Q 20 12, 60 16 T 110 22",
    positionClass: "left-[36%] sm:left-[38%] top-[-2%] sm:top-[2%]",
    floatDelay: 1.5,
  },
  {
    id: "nasdaq100",
    name: "NASDAQ 100 (QQQ)",
    country: "US",
    flag: "🇺🇸",
    price: qqq ? `$${qqq.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$736.53",
    change: qqq ? `${qqq.change_pct >= 0 ? "+" : ""}${qqq.change_pct.toFixed(2)}%` : "-1.07%",
    isPositive: qqq ? qqq.is_positive : false,
    sparkline: qqq?.sparkline_d || "M0 6 Q 30 12, 70 18 T 110 25",
    positionClass: "right-[2%] sm:right-[6%] top-[8%] sm:top-[12%]",
    floatDelay: 0.8,
  },
];

export default function MarketCards() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-visible">
      {CARDS.map((card) => (
        <motion.div
          key={card.id}
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            delay: card.floatDelay,
            ease: "easeInOut",
          }}
          className={`pointer-events-auto absolute ${card.positionClass} rounded-2xl border border-slate-200/80 bg-white/95 p-3.5 shadow-xl shadow-slate-200/50 backdrop-blur-md transition-transform hover:scale-105 sm:min-w-[190px] dark:border-slate-800 dark:bg-[#0B1528]/95 dark:shadow-black/60`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] leading-none">{card.flag}</span>
              <span className="text-[12px] font-semibold text-[#526174] dark:text-slate-400">
                {card.name}
              </span>
            </div>
            <div
              className={`flex items-center gap-0.5 text-[11px] font-bold ${
                card.isPositive ? "text-[#00A878]" : "text-[#EF4444]"
              }`}
            >
              {card.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{card.change}</span>
            </div>
          </div>

          <div className="mt-1 flex items-end justify-between gap-4">
            <div className="font-mono text-[17px] font-bold tracking-tight text-[#0B1220] dark:text-white">
              {card.price}
            </div>

            {/* Sparkline Vector */}
            <div className="h-7 w-20 shrink-0">
              <svg
                viewBox="0 0 110 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-full w-full overflow-visible"
              >
                <path
                  d={card.sparkline}
                  stroke={card.isPositive ? "#00A878" : "#EF4444"}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="110"
                  cy="2"
                  r="2.8"
                  fill={card.isPositive ? "#00A878" : "#EF4444"}
                />
              </svg>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
