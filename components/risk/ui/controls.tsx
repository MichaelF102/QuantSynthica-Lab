"use client";

import React, { useState } from "react";
import { ChevronDown, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const FIELD = "w-full cursor-pointer appearance-none rounded-lg border border-slate-700/50 bg-[#0F172A]/70 py-2 pl-3 pr-8 text-xs text-slate-100 outline-none transition-colors hover:border-slate-600 focus:border-blue-500";

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block min-w-[120px]", className)}>
      <span className="mb-1 block text-[10px] uppercase tracking-wider text-slate-400">{label}</span>
      {children}
    </label>
  );
}

export function SelectField<T extends string | number>({ label, value, options, onChange, className }: {
  label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; className?: string;
}) {
  return (
    <Field label={label} className={className}>
      <div className="relative">
        <select value={String(value)} onChange={(e) => { const o = options.find((x) => String(x.value) === e.target.value); if (o) onChange(o.value); }} className={FIELD}>
          {options.map((o) => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
      </div>
    </Field>
  );
}

export function DateRangeField({ start, end, onApply }: { start: string; end: string; onApply: (s: string, e: string) => void }) {
  const [open, setOpen] = useState(false);
  const [s, setS] = useState(start);
  const [e, setE] = useState(end);
  const bad = !s || !e || s >= e;
  return (
    <Field label="Date range" className="relative min-w-[210px]">
      <button type="button" onClick={() => { setS(start); setE(end); setOpen((o) => !o); }} aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-700/50 bg-[#0F172A]/70 px-3 py-2 font-mono text-xs text-slate-100 transition-colors hover:border-slate-600">
        <span>{start} → {end}</span><Calendar className="h-3.5 w-3.5 text-blue-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-[60] mt-1 w-64 space-y-3 rounded-xl border border-slate-800 bg-[#0B101C] p-3 shadow-[0_18px_48px_-12px_rgba(0,0,0,0.65)]">
          {([["Start", s, setS], ["End", e, setE]] as const).map(([l, v, set]) => (
            <div key={l}><span className="mb-1 block text-[10px] text-slate-400">{l} date</span>
              <input type="date" value={v} max={new Date().toISOString().slice(0, 10)} onChange={(ev) => set(ev.target.value)} className="w-full rounded-lg border border-slate-700/50 bg-[#0F172A]/70 px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500" /></div>
          ))}
          {bad && <p className="text-[11px] text-rose-400">Start must be before end.</p>}
          <div className="flex justify-end gap-2 border-t border-slate-800 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-white">Cancel</button>
            <button type="button" disabled={bad} onClick={() => { onApply(s, e); setOpen(false); }} className="rounded-lg bg-blue-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-blue-500 disabled:opacity-50">Apply</button>
          </div>
        </div>
      )}
    </Field>
  );
}

/** DESIGN.md 7.4 segmented control. */
export function Segmented<T extends string>({ value, options, onChange, size = "md" }: { value: T; options: readonly T[]; onChange: (v: T) => void; size?: "sm" | "md" }) {
  return (
    <div className="inline-flex flex-wrap items-center rounded-lg border border-slate-800 bg-[#0b1222] p-0.5">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)} aria-pressed={value === o}
          className={cn("rounded px-2.5 py-1 transition-colors", size === "sm" ? "text-[10px]" : "text-[11px]", value === o ? "bg-blue-600 font-semibold text-white shadow-sm" : "font-medium text-slate-400 hover:text-white")}>
          {o}
        </button>
      ))}
    </div>
  );
}
