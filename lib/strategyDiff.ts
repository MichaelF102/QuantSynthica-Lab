import { StrategyConfig } from "@/types";
import { formatRuleSet } from "@/lib/formatRule";

/** Short human list of what differs between two versions of a strategy. */
export function describeChanges(a: StrategyConfig, b: StrategyConfig): string[] {
  const out: string[] = [];
  const cmp = (label: string, x: unknown, y: unknown) => { if (JSON.stringify(x) !== JSON.stringify(y)) out.push(`${label}: ${x ?? "—"} → ${y ?? "—"}`); };
  cmp("Name", a.name, b.name); cmp("Asset", a.asset, b.asset); cmp("Timeframe", a.timeframe, b.timeframe); cmp("Style", a.strategy_type, b.strategy_type);
  const sig = (s: StrategyConfig) => s.indicators.map((i) => `${i.name}(${Object.values(i.params).join(",")})`).join(" ") || "none";
  cmp("Indicators", sig(a), sig(b));
  cmp("Entry rules", formatRuleSet(a.entry_rules, a.indicators) || "none", formatRuleSet(b.entry_rules, b.indicators) || "none");
  cmp("Exit rules", formatRuleSet(a.exit_rules, a.indicators) || "none", formatRuleSet(b.exit_rules, b.indicators) || "none");
  (Object.keys({ ...a.risk, ...b.risk }) as (keyof StrategyConfig["risk"])[]).forEach((k) => cmp(`Risk · ${String(k).replace(/_/g, " ")}`, a.risk[k], b.risk[k]));
  (Object.keys({ ...a.execution, ...b.execution }) as (keyof StrategyConfig["execution"])[]).forEach((k) => cmp(`Execution · ${String(k).replace(/_/g, " ")}`, a.execution[k], b.execution[k]));
  return out;
}
