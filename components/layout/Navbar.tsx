"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LineChart,
  Code2,
  Play,
  BarChart3,
  PieChart,
  Settings,
  Plus,
} from "lucide-react";
import NavbarSecuritySearch from "@/components/layout/NavbarSecuritySearch";

const PRIMARY_NAV = [
  { href: "/research", label: "Research", icon: LineChart },
  { href: "/strategies", label: "Strategies", icon: Code2 },
  { href: "/backtests", label: "Backtests", icon: Play },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/portfolio", label: "Portfolio", icon: PieChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface text-slate-200">
      <div className="flex h-11 items-center justify-between px-4">
        {/* Brand & Primary Navigation */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-semibold text-sm tracking-tight text-slate-100">
              QuantSynthica Lab
            </span>
            <span className="text-[11px] text-slate-500 font-mono tracking-normal">
              Workstation
            </span>
          </Link>

          <div className="h-4 w-px bg-border" />

          {/* Primary Navigation */}
          <nav className="flex items-center space-x-1 text-xs">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 transition-colors font-medium rounded ${
                    isActive
                      ? "bg-surface-muted text-white font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-surface-hover"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 text-slate-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Country (India/US) & Security Searchbar + New Strategy Action */}
        <div className="flex items-center space-x-3">
          <NavbarSecuritySearch />

          <Link
            href="/strategies/builder"
            className="flex items-center space-x-1 rounded bg-brand-blue hover:bg-sky-600 px-2.5 py-1 text-xs font-medium text-white transition-colors shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Strategy</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
