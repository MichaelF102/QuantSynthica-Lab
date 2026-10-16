"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, ChevronDown, Search } from "lucide-react";
import { BENCHMARKS } from "@/lib/constants";
import { indexName, useIndices } from "@/lib/indices";
import { useEscape } from "@/lib/useEscape";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Broad Market", "Sectoral", "Thematic", "Strategy / Factor"] as const;
const BASE = "w-full rounded-lg border border-slate-800 bg-[#080d1a] px-3 py-2 text-xs text-slate-200 transition-colors hover:border-slate-700 focus:border-blue-500 focus:outline-none";

interface Props {
  market: "India" | "US";
  value: string;
  onChange: (symbol: string) => void;
  className?: string;
  /** Extra classes for the trigger / select. */
  controlClassName?: string;
  id?: string;
}

/**
 * Benchmark picker. India searches the full index universe (data/indian_indices.csv) and flags the indices the
 * data provider has no price history for; US is a short fixed list.
 */
export default function BenchmarkSelect({ market, value, onChange, className, controlClassName, id }: Props) {
  if (market === "US") {
    const opts = BENCHMARKS.filter((b) => b.region === "US");
    return (
      <div className={cn("relative", className)}>
        <select id={id} aria-label="Benchmark" value={opts.some((o) => o.symbol === value) ? value : ""} onChange={(e) => onChange(e.target.value)} className={cn(BASE, "cursor-pointer", controlClassName)}>
          {!opts.some((o) => o.symbol === value) && <option value="">{value || "Select…"}</option>}
          {opts.map((o) => <option key={o.symbol} value={o.symbol}>{o.name} ({o.symbol})</option>)}
        </select>
      </div>
    );
  }
  return <IndiaPicker value={value} onChange={onChange} className={className} controlClassName={controlClassName} id={id} />;
}

function IndiaPicker({ value, onChange, className, controlClassName, id }: Omit<Props, "market">) {
  const { indices, probing } = useIndices();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [showAll, setShowAll] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEscape(open, () => setOpen(false));
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const current = indices.find((i) => i.symbol === value);
  const unusable = current?.available === false;
  const usable = indices.filter((i) => i.available !== false).length;
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return indices.filter((i) =>
      (showAll || i.available !== false || i.symbol === value) &&
      (cat === "All" || i.category === cat) &&
      (!needle || `${i.name} ${i.symbol} ${i.sector}`.toLowerCase().includes(needle)));
  }, [indices, q, cat, showAll, value]);

  const pick = (sym: string) => { onChange(sym); setOpen(false); setQ(""); };

  return (
    <div ref={box} className={cn("relative", className)}>
      <button id={id} type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={cn(BASE, "flex items-center justify-between gap-2 text-left", controlClassName)}>
        <span className="min-w-0 truncate">
          {current?.name ?? indexName(value) ?? value ?? "Select…"} <span className="font-mono text-slate-500">({value})</span>
          {unusable && <span className="ml-1.5 text-amber-400">· no price data</span>}
        </span>
        <ChevronDown className={cn("h-3 w-3 shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div role="listbox" aria-label="Indian indices" className="absolute left-0 top-full z-[70] mt-1 w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-slate-800 bg-[#0B101C] p-2 shadow-[0_18px_48px_-12px_rgba(0,0,0,0.65)]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && list[0] && list[0].available !== false) { e.preventDefault(); pick(list[0].symbol); } }}
              placeholder="Search indices, e.g. bank, midcap, pharma" className="w-full rounded-lg border border-slate-800 bg-[#080d1a] py-1.5 pl-8 pr-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {CATEGORIES.map((c) => <button key={c} type="button" onClick={() => setCat(c)} className={cn("rounded-md border px-2 py-0.5 text-[10px] font-semibold transition-colors", cat === c ? "border-blue-500/40 bg-blue-500/15 text-blue-300" : "border-slate-800 text-slate-400 hover:text-white")}>{c}</button>)}
          </div>
          <div className="mt-2 max-h-72 overflow-y-auto">
            {list.length === 0 ? <p className="p-4 text-center text-xs text-slate-500">No index matches.</p> : list.map((i) => {
              const off = i.available === false, on = i.symbol === value;
              return (
                <button key={i.symbol} type="button" role="option" aria-selected={on} disabled={off} onClick={() => pick(i.symbol)} title={off ? "The data provider has no price history for this index" : undefined}
                  className={cn("flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors", off ? "cursor-not-allowed opacity-40" : "hover:bg-slate-800/60", on && "bg-blue-500/10")}>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium text-white">{i.name}</span>
                    <span className="block truncate text-[10px] text-slate-500"><span className="font-mono">{i.symbol}</span> · {i.exchange} · {i.category}{i.sector && i.sector !== "Diversified / Broad Market" ? ` · ${i.sector}` : ""}</span>
                  </span>
                  {on ? <Check className="h-3.5 w-3.5 shrink-0 text-blue-400" /> : off ? <span className="shrink-0 text-[9px] uppercase text-slate-500">no data</span> : null}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-2 text-[10px] text-slate-500">
            <span>{probing ? "Checking which indices have price data…" : `${usable} of ${indices.length} indices have price data`}</span>
            <label className="flex cursor-pointer items-center gap-1.5"><input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="accent-blue-600" />Show unavailable</label>
          </div>
          {showAll && <p className="mt-1.5 flex items-start gap-1.5 text-[10px] text-amber-400"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />Greyed-out indices are in the list but cannot be used as a benchmark.</p>}
        </div>
      )}
    </div>
  );
}
