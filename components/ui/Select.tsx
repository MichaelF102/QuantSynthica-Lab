"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption { value: string; label: string }

/** Design-system dropdown: keyboard operable (Up/Down/Enter/Esc), closes on outside click. */
export default function Select({ value, onChange, options, label, className }: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const openList = () => { setHi(Math.max(0, options.findIndex((o) => o.value === value))); setOpen(true); };
  const choose = (v: string) => { onChange(v); setOpen(false); };

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); openList(); }
      return;
    }
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setHi((i) => Math.min(options.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(options[hi].value); }
  };

  return (
    <div ref={root} className={cn("relative", className)}>
      <button
        type="button"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKey}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-800 bg-[#080d1a] px-3 py-2 text-left text-xs text-slate-200 transition-colors hover:border-slate-700 focus:border-blue-500 focus:outline-none"
      >
        <span className="truncate">{current?.label ?? value}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul id={listId} role="listbox" className="absolute left-0 right-0 z-30 mt-1 max-h-60 overflow-auto rounded-lg border border-slate-700 bg-[#0b1222] py-1 shadow-xl">
          {options.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              onMouseEnter={() => setHi(i)}
              onMouseDown={(e) => { e.preventDefault(); choose(o.value); }}
              className={cn("flex cursor-pointer items-center justify-between px-3 py-1.5 text-xs", i === hi ? "bg-slate-800 text-white" : "text-slate-300")}
            >
              <span>{o.label}</span>
              {o.value === value && <Check className="h-3.5 w-3.5 text-blue-400" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
