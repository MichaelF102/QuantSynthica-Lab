import { ConditionRule, IndicatorConfig } from "@/types";
import { formatIndicatorTarget } from "@/lib/formatRule";

export const PRICE_FIELDS = ["close", "open", "high", "low", "volume"] as const;

export interface OperandOption { value: string; label: string; hint: string }
export interface RuleIssue { level: "error" | "warn"; text: string; fix?: { label: string; patch: Partial<ConditionRule> } }

const leftId = (r: ConditionRule) => r.indicator_a || r.left_indicator || "";
const rightId = (r: ConditionRule) => r.indicator_b || r.right_indicator || "";
const hasThreshold = (r: ConditionRule) => r.threshold !== null && r.threshold !== undefined;

/** Everything a rule operand can refer to: price fields first, then the strategy's indicators. */
export function operandOptions(indicators: IndicatorConfig[]): OperandOption[] {
  const price: OperandOption[] = PRICE_FIELDS.map((p) => ({ value: p, label: p[0].toUpperCase() + p.slice(1), hint: p === "volume" ? "volume" : "price" }));
  const inds: OperandOption[] = indicators.map((i) => ({ value: i.id, label: formatIndicatorTarget(i.id, indicators), hint: i.id }));
  return [...price, ...inds];
}

const PLAIN: Record<string, (p: Record<string, any>) => string> = {
  SMA: (p) => `${p.period}-bar simple moving average`,
  EMA: (p) => `${p.period}-bar exponential moving average`,
  WMA: (p) => `${p.period}-bar weighted moving average`,
  RSI: (p) => `${p.period}-bar RSI`,
  MACD: (p) => `MACD line (${p.fast_period}/${p.slow_period})`,
  MACD_SIGNAL: (p) => `MACD signal line (${p.fast_period}/${p.slow_period}/${p.signal_period})`,
  MACD_HIST: (p) => `MACD histogram (${p.fast_period}/${p.slow_period}/${p.signal_period})`,
  BB_UPPER: (p) => `upper Bollinger band (${p.period}, ${p.std_dev} deviations)`,
  BB_LOWER: (p) => `lower Bollinger band (${p.period}, ${p.std_dev} deviations)`,
  BB_MIDDLE: (p) => `${p.period}-bar Bollinger middle band`,
  BB_WIDTH: (p) => `${p.period}-bar Bollinger band width`,
  ATR: (p) => `${p.period}-bar average true range`,
  ADX: (p) => `${p.period}-bar ADX`,
  STOCH_K: (p) => `${p.k_period}-bar stochastic %K`,
  STOCH_D: (p) => `stochastic %D (${p.k_period}, ${p.d_period})`,
  DONCHIAN_HIGH: (p) => `${p.period}-bar highest high`,
  DONCHIAN_LOW: (p) => `${p.period}-bar lowest low`,
  KELTNER_UPPER: (p) => `upper Keltner channel (${p.ema_period}/${p.atr_period}, ×${p.multiplier})`,
  KELTNER_LOWER: (p) => `lower Keltner channel (${p.ema_period}/${p.atr_period}, ×${p.multiplier})`,
  ROC: (p) => `${p.period}-bar rate of change`,
  WILLR: (p) => `${p.period}-bar Williams %R`,
  ZSCORE: (p) => `${p.period}-bar price z-score`,
  VWAP: () => "VWAP",
  OBV: () => "on-balance volume",
};

/** "close" -> "the close price"; "ema_1" -> "the 12-bar exponential moving average". */
export function describeOperand(id: string, indicators: IndicatorConfig[]): string {
  const key = (id || "").toLowerCase();
  if (!key) return "(nothing selected)";
  if (key === "volume") return "the volume";
  if (["close", "open", "high", "low"].includes(key)) return `the ${key} price`;
  const ind = indicators.find((i) => i.id.toLowerCase() === key);
  if (!ind) return `“${id}” (not defined)`;
  const f = PLAIN[ind.name.toUpperCase()];
  return `the ${f ? f(ind.params ?? {}) : formatIndicatorTarget(id, indicators)}`;
}

const OP_TEXT: Record<string, string> = {
  ">": "is above", "<": "is below", ">=": "is at or above", "<=": "is at or below", "==": "equals", "!=": "differs from",
  CROSS_ABOVE: "crosses above", CROSS_BELOW: "crosses below",
};

export function describeRule(rule: ConditionRule, indicators: IndicatorConfig[]): string {
  const l = describeOperand(leftId(rule), indicators);
  const op = OP_TEXT[rule.operator] ?? String(rule.operator);
  const r = hasThreshold(rule) ? String(rule.threshold) : describeOperand(rightId(rule), indicators);
  const cross = rule.operator === "CROSS_ABOVE" ? " (it was at or below on the previous bar)" : rule.operator === "CROSS_BELOW" ? " (it was at or above on the previous bar)" : "";
  return `${l} ${op} ${r}${cross}`;
}

/** Sentence for the whole rule list. The engine combines rules strictly left to right, with no AND-before-OR precedence. */
export function describeRuleSet(kind: "entry" | "exit", rules: ConditionRule[], indicators: IndicatorConfig[]): string {
  if (!rules.length) return "";
  const head = kind === "entry" ? "Buy at the next bar's open when" : "Sell at the next bar's open when";
  const parts = rules.map((r, i) => `${i > 0 ? (r.logical_operator === "OR" ? "OR " : "AND ") : ""}${describeRule(r, indicators)}`);
  const note = rules.length > 1 ? " Rules are combined one after another, left to right." : "";
  return `${head} ${parts.join(", ")}.${note}`;
}

// ---- checks ----
function lev(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

export function closestOperand(text: string, indicators: IndicatorConfig[]): OperandOption | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;
  let best: { o: OperandOption; score: number } | null = null;
  for (const o of operandOptions(indicators)) {
    const cands = [o.value.toLowerCase(), o.label.toLowerCase().replace(/[()\s,]/g, "")];
    const score = Math.min(...cands.map((c) => (c.includes(t) || t.includes(c) ? 1 : lev(t, c))));
    if (!best || score < best.score) best = { o, score };
  }
  return best && best.score <= Math.max(2, Math.floor(t.length / 3)) ? best.o : null;
}

type Unit = "price" | "oscillator" | "volume" | "other";
function unitOf(id: string, indicators: IndicatorConfig[]): Unit {
  const k = (id || "").toLowerCase();
  if (["close", "open", "high", "low"].includes(k)) return "price";
  if (k === "volume") return "volume";
  const name = indicators.find((i) => i.id.toLowerCase() === k)?.name.toUpperCase() ?? "";
  if (["SMA", "EMA", "WMA", "BB_UPPER", "BB_LOWER", "BB_MIDDLE", "VWAP", "DONCHIAN_HIGH", "DONCHIAN_LOW", "KELTNER_UPPER", "KELTNER_LOWER"].includes(name)) return "price";
  if (["RSI", "STOCH_K", "STOCH_D", "ADX"].includes(name)) return "oscillator";
  if (name === "OBV") return "volume";
  return "other";
}

const BOUNDS: Record<string, [number, number]> = { RSI: [0, 100], STOCH_K: [0, 100], STOCH_D: [0, 100], ADX: [0, 100], WILLR: [-100, 0] };

export function ruleIssues(rule: ConditionRule, indicators: IndicatorConfig[]): RuleIssue[] {
  const out: RuleIssue[] = [];
  const known = new Set<string>([...PRICE_FIELDS, ...indicators.map((i) => i.id.toLowerCase())]);
  const l = leftId(rule), r = rightId(rule);
  const unknown = (side: "left" | "right", id: string) => {
    if (!id) { out.push({ level: "error", text: `Pick what the ${side} side compares.` }); return; }
    if (known.has(id.toLowerCase())) return;
    const s = closestOperand(id, indicators);
    const patch = side === "left" ? { indicator_a: s?.value, left_indicator: s?.value } : { indicator_b: s?.value, right_indicator: s?.value };
    out.push({ level: "error", text: `“${id}” is not a price or an indicator in this strategy.${s ? ` Did you mean ${s.label}?` : " Add the indicator first."}`, fix: s ? { label: `Use ${s.label}`, patch } : undefined });
  };
  unknown("left", l);
  if (hasThreshold(rule)) {
    if (!Number.isFinite(Number(rule.threshold))) out.push({ level: "error", text: "The value is not a number." });
  } else unknown("right", r);
  if (out.some((x) => x.level === "error")) return out;

  if (!hasThreshold(rule) && l.toLowerCase() === r.toLowerCase()) {
    out.push({ level: "warn", text: "Both sides are the same series, so this is " + (["CROSS_ABOVE", "CROSS_BELOW", ">", "<", "!="].includes(rule.operator) ? "never true." : "always true.") });
  }
  if (rule.operator === "==") out.push({ level: "warn", text: "“equals” on continuous values almost never triggers. Use ‘at or above’ or ‘crosses above’ instead.", fix: { label: "Use ≥", patch: { operator: ">=" } } });

  const lu = unitOf(l, indicators);
  if (!hasThreshold(rule)) {
    const ru = unitOf(r, indicators);
    if (lu !== "other" && ru !== "other" && lu !== ru) out.push({ level: "warn", text: `This compares ${lu === "oscillator" ? "a 0–100 oscillator" : lu} with ${ru === "oscillator" ? "a 0–100 oscillator" : ru}: the units differ, so the rule will almost always be true or false.` });
  } else {
    const name = indicators.find((i) => i.id.toLowerCase() === l.toLowerCase())?.name.toUpperCase();
    const b = name ? BOUNDS[name] : undefined;
    const v = Number(rule.threshold);
    if (b && (v < b[0] || v > b[1])) out.push({ level: "warn", text: `${name} only ranges from ${b[0]} to ${b[1]}, so a value of ${v} can never be reached.` });
    if (lu === "price" && Math.abs(v) < 1 && v !== 0) out.push({ level: "warn", text: "A price compared with a number below 1 is unusual. Did you mean to compare with an indicator?" });
  }
  return out;
}
