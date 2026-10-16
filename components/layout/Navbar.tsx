"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ExternalLink, Globe2, Menu, Moon, Settings, Sun, X } from "lucide-react";
import NavbarSecuritySearch from "@/components/layout/NavbarSecuritySearch";
import QSLogoMark from "@/components/brand/QSLogoMark";
import { useTheme } from "@/components/providers/ThemeProvider";
import { NAV, NavChild, NavItem, QUANTSYNTHICA_URL } from "@/components/layout/navConfig";
import { cn } from "@/lib/utils";

/** The security the user is currently looking at (set by the navbar search and the research page). */
function useActiveSecurity() {
  const [sec, setSec] = useState<{ ticker: string; country: string } | null>(null);
  useEffect(() => {
    const read = () => {
      try {
        const t = localStorage.getItem("algolab_active_ticker");
        const c = localStorage.getItem("algolab_active_country") || "US";
        setSec(t ? { ticker: t, country: c } : null);
      } catch { setSec(null); }
    };
    read();
    const onChange = (e: any) => { const d = e.detail ?? {}; if (d.symbol) setSec({ ticker: String(d.symbol).toUpperCase(), country: d.country || "US" }); };
    window.addEventListener("algolab:security-change", onChange);
    window.addEventListener("storage", read);
    return () => { window.removeEventListener("algolab:security-change", onChange); window.removeEventListener("storage", read); };
  }, []);
  return sec;
}

const hrefFor = (c: NavChild, sec: { ticker: string; country: string } | null) =>
  c.ticker && sec ? `/research?ticker=${encodeURIComponent(sec.ticker)}&country=${sec.country}&tab=${c.ticker.tab}` : c.href;

function DropdownPanel({ item, sec, onNavigate, id }: { item: NavItem; sec: ReturnType<typeof useActiveSecurity>; onNavigate: () => void; id: string }) {
  return (
    <div id={id} role="menu" aria-label={item.label} className="absolute left-0 top-full z-50 w-[300px] pt-1.5">
      <div className="max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-slate-800 bg-[#0B101C] p-1.5 shadow-[0_18px_48px_-12px_rgba(0,0,0,0.65)]">
        {item.label === "Research" && (
          <p className="px-3 pb-1.5 pt-1 text-[10px] uppercase tracking-wider text-slate-500">{sec ? <>Opens on <span className="font-mono text-slate-300">{sec.ticker}</span></> : "Search a stock first to open a tab on it"}</p>
        )}
        {item.children!.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} href={hrefFor(c, sec)} role="menuitem" onClick={onNavigate} className="group flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-slate-800/60 focus-visible:bg-slate-800/60 focus-visible:outline-none">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-blue-400" />
              <span className="min-w-0">
                <span className="block text-[13px] font-medium leading-tight text-white">{c.label}</span>
                <span className="mt-0.5 block text-[11px] leading-tight text-slate-500">{c.desc}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function NavTab({ item, active, open, setOpen, sec }: { item: NavItem; active: boolean; open: boolean; setOpen: (v: boolean) => void; sec: ReturnType<typeof useActiveSecurity> }) {
  const Icon = item.icon;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMenu = !!item.children;
  const id = `nav-menu-${item.label}`;
  const enter = () => { if (timer.current) clearTimeout(timer.current); if (hasMenu) setOpen(true); };
  const leave = () => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setOpen(false), 140); };
  const cls = cn(
    "relative flex items-center gap-1.5 px-2 py-5 text-[13px] min-[1700px]:px-3.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/70",
    active || open ? "font-semibold text-blue-400" : "font-medium text-slate-300 hover:text-white"
  );
  const underline = (active || open) && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-blue-500" />;
  return (
    <div className="relative" onMouseEnter={enter} onMouseLeave={leave} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false); }}>
      {hasMenu ? (
        <>
          <button type="button" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined} aria-current={active ? "page" : undefined}
            onClick={() => setOpen(!open)}
            onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setTimeout(() => (document.querySelector(`#${CSS.escape(id)} a`) as HTMLElement | null)?.focus(), 0); } }}
            className={cls}>
            <Icon className="hidden h-3.5 w-3.5 min-[1700px]:block" />{item.label}<ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />{underline}
          </button>
          {open && <DropdownPanel item={item} sec={sec} id={id} onNavigate={() => setOpen(false)} />}
        </>
      ) : (
        <Link href={item.href} aria-current={active ? "page" : undefined} className={cls}><Icon className="hidden h-3.5 w-3.5 min-[1700px]:block" />{item.label}{underline}</Link>
      )}
    </div>
  );
}

/**
 * The one platform navbar. `public` (landing, about, docs) adds the light/dark toggle, because those
 * pages support both themes; app routes are dark-only so they omit it.
 */
export default function Navbar({ variant = "app" }: { variant?: "app" | "public" }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const sec = useActiveSecurity();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const closeAll = useCallback(() => { setOpenMenu(null); setDrawerOpen(false); }, []);
  useEffect(() => { closeAll(); }, [pathname, closeAll]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAll();
    const onDown = (e: MouseEvent) => { if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null); };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); };
  }, [closeAll]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#080C14]/95 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-16 w-[96%] max-w-[1660px] items-center justify-between gap-3 sm:gap-4">
        <div className="flex shrink-0 items-center gap-4 xl:min-w-0 xl:flex-1 min-[1700px]:gap-7">
          <Link href="/" aria-label="QuantSynthica Lab home" className="group flex shrink-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/70">
            <QSLogoMark className="h-8 w-[51px] text-slate-200 transition-transform group-hover:scale-105" />
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="text-base font-bold tracking-tight text-white">QuantSynthica</span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">Quantitative Lab</span>
            </span>
          </Link>

          <nav ref={navRef} className="hidden items-center xl:flex" aria-label="Primary">
            {NAV.filter((item) => item.label !== "Settings").map((item) => (
              <NavTab key={item.label} item={item} active={pathname.startsWith(item.href)} open={openMenu === item.label} setOpen={(v) => setOpenMenu(v ? item.label : null)} sec={sec} />
            ))}
          </nav>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none sm:shrink-0 sm:gap-2.5">
          <a href={QUANTSYNTHICA_URL} target="_blank" rel="noopener noreferrer" aria-label="Open QuantSynthica in a new tab"
            className="group hidden items-center gap-2.5 rounded-lg border border-purple-500/40 bg-[#161028]/80 px-2.5 py-1.5 min-[1700px]:px-3 shadow-[0_0_14px_rgba(168,85,247,0.15)] transition-colors hover:border-purple-400/70 hover:bg-[#1E1538] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-400/70 lg:flex">
            <Globe2 className="h-4 w-4 text-purple-300" />
            <span className="hidden flex-col leading-tight min-[1700px]:flex">
              <span className="text-xs font-semibold text-white">QuantSynthica</span>
              <span className="hidden text-[10px] text-slate-400 min-[1840px]:block">Open the platform</span>
            </span>
            <ExternalLink className="hidden h-3 w-3 text-purple-300 transition-transform min-[1700px]:block group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
          <NavbarSecuritySearch />
          {variant === "public" && (
            <button type="button" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="rounded-lg border border-slate-700/60 p-2 text-slate-300 transition-colors hover:bg-slate-800/60 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/70">
              {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>
          )}
          <Link href="/settings" aria-label="Settings" title="Settings" aria-current={pathname.startsWith("/settings") ? "page" : undefined}
            className={cn("hidden rounded-lg border p-2 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/70 xl:inline-flex", pathname.startsWith("/settings") ? "border-blue-500/40 bg-blue-500/10 text-blue-400" : "border-slate-700/60 text-slate-300 hover:bg-slate-800/60 hover:text-white")}>
            <Settings className="h-4 w-4" />
          </Link>
          <button type="button" onClick={() => setDrawerOpen((o) => !o)} aria-label={drawerOpen ? "Close menu" : "Open menu"} aria-expanded={drawerOpen}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/70 xl:hidden">
            {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {drawerOpen && (
        <nav className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-slate-800/80 bg-[#0C101A] px-4 py-3 xl:hidden" aria-label="Mobile">
          <div className="space-y-0.5">
            {NAV.map((item) => {
              const Icon = item.icon, isActive = pathname.startsWith(item.href), expanded = mobileOpen === item.label;
              if (!item.children) {
                return <Link key={item.label} href={item.href} aria-current={isActive ? "page" : undefined} className={cn("flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm", isActive ? "bg-blue-500/10 font-semibold text-blue-400" : "font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white")}><Icon className="h-4 w-4" />{item.label}</Link>;
              }
              return (
                <div key={item.label}>
                  <button type="button" aria-expanded={expanded} onClick={() => setMobileOpen(expanded ? null : item.label)} className={cn("flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm", isActive ? "font-semibold text-blue-400" : "font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white")}>
                    <span className="flex items-center gap-2"><Icon className="h-4 w-4" />{item.label}</span><ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
                  </button>
                  {expanded && (
                    <div className="mb-1 ml-4 space-y-0.5 border-l border-slate-800 pl-2">
                      {item.children.map((c) => <Link key={c.label} href={hrefFor(c, sec)} className="block rounded-lg px-3 py-2 hover:bg-slate-800/60"><span className="block text-[13px] font-medium text-white">{c.label}</span><span className="block text-[11px] text-slate-500">{c.desc}</span></Link>)}
                    </div>
                  )}
                </div>
              );
            })}
            <a href={QUANTSYNTHICA_URL} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center justify-between rounded-lg border border-purple-500/40 bg-[#161028]/80 px-3 py-2.5 text-sm font-semibold text-white"><span className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-purple-300" />QuantSynthica</span><ExternalLink className="h-3.5 w-3.5 text-purple-300" /></a>
          </div>
        </nav>
      )}
    </header>
  );
}
