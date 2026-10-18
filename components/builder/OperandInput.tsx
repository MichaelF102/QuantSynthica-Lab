"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { IndicatorConfig } from "@/types";
import { OperandOption, closestOperand, operandOptions } from "@/lib/ruleLanguage";
import { cn } from "@/lib/utils";
import { INPUT } from "./fields";

/** Type-ahead picker for a rule operand: price fields and the strategy's own indicators. */
export default function OperandInput({ value, indicators, onChange, label }: { value: string; indicators: IndicatorConfig[]; onChange: (v: string) => void; label: string }) {
  const options = operandOptions(indicators);
  const current = options.find((o) => o.value.toLowerCase() === (value || "").toLowerCase());
  const [text, setText] = useState(current ? current.label : value || "");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const editing = useRef(false);

  // keep the box in step with outside changes (undo, preset, indicator edits) while not typing
  useEffect(() => { if (!editing.current) setText(current ? current.label : value || ""); }, [value, current?.label]); // eslint-disable-line react-hooks/exhaustive-deps

  const q = text.trim().toLowerCase();
  const matches = (q && !(current && q === current.label.toLowerCase()) ? options.filter((o) => o.value.toLowerCase().includes(q) || o.label.toLowerCase().includes(q)) : options);
  const known = !!current;

  const commit = (v: string, display?: string) => { editing.current = false; onChange(v); setText(display ?? v); setOpen(false); };
  const finish = () => {
    editing.current = false;
    const exact = options.find((o) => o.value.toLowerCase() === q || o.label.toLowerCase() === q);
    if (exact) commit(exact.value, exact.label);
    else if (text !== (current?.label ?? value)) onChange(text.trim());
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) finish(); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setHi((i) => Math.min(matches.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); const m: OperandOption | undefined = open ? matches[hi] : undefined; if (m) commit(m.value, m.label); else finish(); }
    else if (e.key === "Escape") { setOpen(false); }
    else if (e.key === "Tab") finish();
  };

  const guess = !known && value ? closestOperand(value, indicators) : null;

  return (
    <div ref={root} className="relative">
      <input
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={!known}
        autoComplete="off"
        value={text}
        placeholder="Type a price or indicator…"
        onFocus={() => { editing.current = true; setOpen(true); setHi(0); }}
        onChange={(e) => { editing.current = true; setText(e.target.value); setOpen(true); setHi(0); }}
        onKeyDown={onKey}
        className={cn(INPUT, "font-mono", !known && "border-rose-500/60 text-rose-300")}
      />
      {open && (
        <ul id={listId} role="listbox" className="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-auto rounded-lg border border-slate-700 bg-[#0b1222] py-1 shadow-xl">
          {matches.length === 0 && <li className="px-3 py-1.5 text-[11px] text-slate-500">No match{guess ? ` — did you mean ${guess.label}?` : ""}</li>}
          {matches.map((o, i) => (
            <li key={o.value} role="option" aria-selected={i === hi} onMouseEnter={() => setHi(i)} onMouseDown={(e) => { e.preventDefault(); commit(o.value, o.label); }}
              className={cn("flex cursor-pointer items-center justify-between gap-2 px-3 py-1.5 text-xs", i === hi ? "bg-slate-800 text-white" : "text-slate-300")}>
              <span className="font-mono">{o.label}</span><span className="text-[10px] text-slate-500">{o.hint}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
