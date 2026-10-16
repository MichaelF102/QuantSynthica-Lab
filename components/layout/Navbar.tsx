"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaskConical, Menu, X } from "lucide-react";
import NavbarSecuritySearch from "@/components/layout/NavbarSecuritySearch";
import QSLogoMark from "@/components/brand/QSLogoMark";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = [
  { href: "/research", label: "Research" },
  { href: "/strategies", label: "Strategies" },
  { href: "/backtests", label: "Backtests" },
  { href: "/analytics", label: "Analytics" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/risk", label: "Risk" },
  { href: "/settings", label: "Settings" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => setDrawerOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#080C14]/95 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-16 w-[96%] max-w-[1720px] items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-6">
          <Link
            href="/"
            aria-label="QuantSynthica Lab home"
            className="group flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/70"
          >
            <QSLogoMark className="h-8 w-[51px] text-slate-200 transition-transform group-hover:scale-105" />
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="text-base font-bold tracking-tight text-white">QuantSynthica</span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Quantitative Lab
              </span>
            </span>
          </Link>

          <nav className="no-scrollbar hidden min-w-0 items-center gap-1 overflow-x-auto xl:flex" aria-label="Primary">
            {PRIMARY_NAV.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative px-2 py-5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/70",
                    isActive ? "font-semibold text-blue-400" : "font-medium text-slate-300 hover:text-white"
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-blue-500" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/strategies/builder"
            className="hidden items-center gap-1.5 rounded-lg border border-purple-500/40 bg-[#161028]/80 px-3 py-1.5 text-xs font-medium text-white shadow-[0_0_14px_rgba(168,85,247,0.15)] transition-colors hover:border-purple-400/70 hover:bg-[#1E1538] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400/70 lg:inline-flex"
          >
            <FlaskConical className="h-3.5 w-3.5 text-purple-300" />
            <span className="hidden min-[1760px]:inline">Strategy Lab</span>
            <span className="min-[1760px]:hidden">Lab</span>
          </Link>
          <NavbarSecuritySearch />
          <button
            type="button"
            onClick={() => setDrawerOpen((o) => !o)}
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            aria-expanded={drawerOpen}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/70 xl:hidden"
          >
            {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {drawerOpen && (
        <nav className="border-t border-slate-800/80 bg-[#0C101A] px-4 py-3 xl:hidden" aria-label="Mobile">
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
            {[...PRIMARY_NAV, { href: "/strategies/builder", label: "Strategy Lab" }].map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-3 py-2 text-xs transition-colors",
                    isActive
                      ? "bg-blue-500/10 font-semibold text-blue-400"
                      : "font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
