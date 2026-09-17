import { ConditionRule, IndicatorConfig, RuleOperator } from "@/types";

/**
 * Maps rule operators to human-readable quantitative text
 */
export function formatOperator(op: RuleOperator | string): string {
  switch (op) {
    case ">":
    case "GT":
      return ">";
    case "<":
    case "LT":
      return "<";
    case ">=":
    case "GTE":
      return "≥";
    case "<=":
    case "LTE":
      return "≤";
    case "==":
    case "EQ":
      return "=";
    case "!=":
    case "NEQ":
      return "≠";
    case "CROSS_ABOVE":
      return "crosses above";
    case "CROSS_BELOW":
      return "crosses below";
    default:
      return String(op || ">");
  }
}

/**
 * Resolves an indicator ID or price series to a readable label with params
 * e.g., "fast_ema" with params {period: 12} -> "EMA(12)"
 * "close" -> "Close"
 */
export function formatIndicatorTarget(
  targetId?: string | null,
  indicators: IndicatorConfig[] = []
): string {
  if (!targetId || targetId === "null" || targetId === "undefined") {
    return "—";
  }

  const normalized = targetId.toLowerCase();
  if (normalized === "close") return "Close";
  if (normalized === "open") return "Open";
  if (normalized === "high") return "High";
  if (normalized === "low") return "Low";
  if (normalized === "volume") return "Volume";

  // Look up in indicator configuration list
  const found = indicators.find(
    (ind) => ind.id.toLowerCase() === targetId.toLowerCase()
  );

  if (found) {
    const params = found.params || {};
    if (params.period) {
      return `${found.name}(${params.period})`;
    }
    if (params.fast_period && params.slow_period) {
      return `${found.name}(${params.fast_period}, ${params.slow_period})`;
    }
    if (params.k_period) {
      return `${found.name}(${params.k_period})`;
    }
    return found.name;
  }

  // Fallback heuristic for common naming conventions
  const parts = targetId.split("_");
  if (parts.length >= 2) {
    const base = parts[0].toUpperCase();
    const num = parts[1];
    if (!isNaN(Number(num))) {
      return `${base}(${num})`;
    }
  }

  return targetId;
}

/**
 * Formats a full ConditionRule into natural quantitative language.
 * Never outputs "undefined", "null", or "[object Object]".
 * Example: "EMA(12) crosses above EMA(26)" or "RSI(14) < 30"
 */
export function formatConditionRule(
  rule?: ConditionRule | null,
  indicators: IndicatorConfig[] = []
): string {
  if (!rule) return "—";

  // Gracefully handle both indicator_a and left_indicator
  const leftId = rule.indicator_a || rule.left_indicator;
  const leftText = formatIndicatorTarget(leftId, indicators);

  const opText = formatOperator(rule.operator);

  // Gracefully handle both indicator_b and right_indicator vs numeric threshold
  const rightId = rule.indicator_b || rule.right_indicator;
  let rightText: string;

  if (rightId && rightId !== "null" && rightId !== "undefined") {
    rightText = formatIndicatorTarget(rightId, indicators);
  } else if (rule.threshold !== undefined && rule.threshold !== null && !isNaN(Number(rule.threshold))) {
    rightText = Number(rule.threshold).toString();
  } else {
    rightText = "0";
  }

  if (leftText === "—" && rightText === "0") {
    return "Unconditional";
  }

  return `${leftText} ${opText} ${rightText}`;
}

/**
 * Formats an array of rules joined by their logical operators
 */
export function formatRuleSet(
  rules: ConditionRule[] = [],
  indicators: IndicatorConfig[] = []
): string {
  if (!rules || rules.length === 0) return "—";

  return rules
    .map((r, i) => {
      const text = formatConditionRule(r, indicators);
      if (i > 0) {
        const logic = r.logical_operator || "AND";
        return `${logic} ${text}`;
      }
      return text;
    })
    .join(" ");
}
