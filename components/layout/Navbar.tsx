"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NavbarSecuritySearch from "@/components/layout/NavbarSecuritySearch";
import QuantSynthicaLogo from "@/components/branding/QuantSynthicaLogo";
import { cn } from "@/lib/cn";

const PRIMARY_NAV = [
  { href: "/research", label: "Charts" },
  { href: "/strategies", label: "Strategies" },
  { href: "/backtests", label: "Backtests" },
  { href: "/analytics", label: "Analytics" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/settings", label: "Settings" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[#1e222d]">
      <div className="flex h-14 items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-6">
          <QuantSynthicaLogo variant="compact" size="sm" priority theme="dark" />

          <nav className="no-scrollbar hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto text-[14px] md:flex">
            {PRIMARY_NAV.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 font-semibold transition-colors",
                    isActive ? "bg-surface-muted text-white" : "text-[#b2b5be] hover:bg-surface-muted/70 hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <NavbarSecuritySearch />
        </div>
      </div>
    </header>
  );
}
