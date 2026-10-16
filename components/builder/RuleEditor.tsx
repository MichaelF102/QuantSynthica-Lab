"use client";

import React from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { ConditionRule, IndicatorConfig } from "@/types";
import { formatConditionRule } from "@/lib/formatRule";
import { INPUT, SELECT } from "./fields";
import { cn } from "@/lib/utils";

const PRICE = [["close", "Close price"], ["open", "Open price"], ["high", "High price"], ["low", "Low price"], ["volume", "Volume"]] as const;
const OPERATORS = [[">", "> greater than"], ["<", "< less than"], [">=", "≥ greater or equal"], ["<=", "≤ less or equal"], ["==", "= equal to"], ["CROSS_ABOVE", "crosses above"], ["CROSS_BELOW", "crosses below"]] as const;

export const leftOf = (r: ConditionRule) => r.indicator_a || r.left_indicator || "";
export const rightOf = (r: ConditionRule) => r.indicator_b || r.right_indicator || "";
const hasThreshold = (r: ConditionRule) => r.threshold !== null && r.threshold !== undefined;

/** Operand dropdown that also surfaces a reference to a removed indicator instead of silently showing another value. */
function Operand({ value, indicators, onChange, label }: { value: string; indicators: IndicatorConfig[]; onChange: (v: string) => void; label: string }) {
  const known = PRICE.some(([v]) => v === value) || indicators.some((i) => i.id === value);
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={cn(SELECT, !known && "border-rose-500/60 text-rose-300")}>
      {!known && <option value={value}>{value ? `Missing: ${value}` : "Select…"}</option>}
      {PRICE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      {indicators.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.id})</option>)}
    </select>
  );
}

interface Props {
  kind: "entry" | "exit";
  rules: ConditionRule[];
  indicators: IndicatorConfig[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<ConditionRule>) => void;
  emptyHint: string;
  emptyIsError?: boolean;
}

export default function RuleEditor({ kind, rules, indicators, onAdd, onRemove, onUpdate, emptyHint, emptyIsError }: Props) {
  const tone = kind === "entry" ? "text-emerald-400" : "text-rose-400";
  return (
    <div className="space-y-3">
      {rules.length === 0 ? (
        <div className={cn("rounded-lg border border-dashed p-4 text-center text-xs", emptyIsError ? "border-rose-500/40 text-rose-300" : "border-slate-800 text-slate-500")}>
          {emptyIsError && <AlertTriangle className="mr-1.5 inline h-3.5 w-3.5" />}{emptyHint}
        </div>
      ) : rules.map((rule, idx) => {
        const thr = hasThreshold(rule);
        return (
          <div key={rule.id} className="space-y-2 rounded-xl border border-slate-800 bg-[#080d1a] p-3">
            {idx > 0 && (
              <select aria-label="Logical operator" value={rule.logical_operator || "AND"} onChange={(e) => onUpdate(rule.id, { logical_operator: e.target.value as "AND" | "OR" })} className="rounded-md border border-slate-800 bg-[#0b1222] px-2 py-1 text-[10px] font-bold text-amber-400 focus:outline-none">
                <option value="AND">AND — all must match</option>
                <option value="OR">OR — any can match</option>
              </select>
            )}
            <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-12">
              <div className="sm:col-span-4"><Operand label="Left operand" value={leftOf(rule)} indicators={indicators} onChange={(v) => onUpdate(rule.id, { indicator_a: v, left_indicator: v })} /></div>
              <div className="sm:col-span-3">
                <select aria-label="Operator" value={rule.operator} onChange={(e) => onUpdate(rule.id, { operator: e.target.value as ConditionRule["operator"] })} className={cn(SELECT, "text-center font-semibold text-blue-300")}>
                  {OPERATORS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="sm:col-span-4">
                {thr ? (
                  <div className="flex items-center gap-1.5">
                    <input type="number" step="any" aria-label="Threshold" value={Number.isFinite(rule.threshold as number) ? (rule.threshold as number) : ""} onChange={(e) => onUpdate(rule.id, { threshold: e.target.value === "" ? 0 : Number(e.target.value) })} className={INPUT} placeholder="Value" />
                    <button type="button" title="Compare with an indicator or price instead" onClick={() => onUpdate(rule.id, { threshold: null, indicator_b: indicators[0]?.id ?? "close", right_indicator: indicators[0]?.id ?? "close" })} className="whitespace-nowrap rounded-md border border-slate-800 px-1.5 py-1 text-[10px] font-semibold text-blue-300 hover:bg-slate-800/50">Indicator</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Operand label="Right operand" value={rightOf(rule)} indicators={indicators} onChange={(v) => onUpdate(rule.id, { indicator_b: v, right_indicator: v })} />
                    <button type="button" title="Compare with a number instead" onClick={() => onUpdate(rule.id, { indicator_b: null, right_indicator: null, threshold: 50 })} className="whitespace-nowrap rounded-md border border-slate-800 px-1.5 py-1 text-[10px] font-semibold text-amber-300 hover:bg-slate-800/50">Number</button>
                  </div>
                )}
              </div>
              <div className="text-right sm:col-span-1"><button type="button" aria-label="Remove rule" onClick={() => onRemove(rule.id)} className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button></div>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400"><span className={cn("font-bold", tone)}>Reads as</span><span>{formatConditionRule(rule, indicators)}</span></div>
          </div>
        );
      })}
      <button type="button" onClick={onAdd} className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors", kind === "entry" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20")}>
        <Plus className="h-3.5 w-3.5" />Add {kind} rule
      </button>
    </div>
  );
}
