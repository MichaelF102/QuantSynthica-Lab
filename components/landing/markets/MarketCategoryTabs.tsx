"use client";

import React from "react";
import { motion } from "framer-motion";
import { Layers, BarChart2, Target, Activity } from "lucide-react";

export type MarketCategoryId =
  | "us_equities"
  | "indian_equities"
  | "etfs"
  | "indices"
  | "options"
  | "economic_data";

interface CategoryItem {
  id: MarketCategoryId;
  label: string;
  flag?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const CATEGORIES: CategoryItem[] = [
  { id: "us_equities", label: "US Equities", flag: "🇺🇸" },
  { id: "indian_equities", label: "Indian Equities", flag: "🇮🇳" },
  { id: "etfs", label: "ETFs", icon: Layers },
  { id: "indices", label: "Indices", icon: BarChart2 },
  { id: "options", label: "Options", icon: Target },
  { id: "economic_data", label: "Macro & Economic Data", icon: Activity },
];

interface MarketCategoryTabsProps {
  activeCategory: MarketCategoryId;
  onSelectCategory: (id: MarketCategoryId) => void;
}

export default function MarketCategoryTabs({
  activeCategory,
  onSelectCategory,
}: MarketCategoryTabsProps) {
  return (
    <div className="relative mb-6 w-full">
      <div
        role="tablist"
        aria-label="Market Categories"
        className="no-scrollbar inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-[14px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0B1528] p-1.5 shadow-2xs"
      >
        {CATEGORIES.map((cat) => {
          const isActive = cat.id === activeCategory;
          const Icon = cat.icon;

          return (
            <button
              key={cat.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={0}
              onClick={() => onSelectCategory(cat.id)}
              className={`relative z-10 flex shrink-0 items-center gap-2 rounded-[10px] px-3.5 py-2 text-[13px] font-semibold transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#1769FF] ${
                isActive ? "text-white" : "text-[#64748B] dark:text-slate-400 hover:text-[#0B1220] dark:hover:text-white"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="market-category-tab"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  className="absolute inset-0 z-[-1] rounded-[10px] bg-[#1769FF] shadow-sm shadow-[#1769FF]/30"
                />
              )}

              {cat.flag ? (
                <span className="text-[13px] leading-none">{cat.flag}</span>
              ) : Icon ? (
                <Icon
                  className={`h-3.5 w-3.5 ${
                    isActive ? "text-white" : "text-[#64748B] dark:text-slate-400"
                  }`}
                />
              ) : null}

              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
