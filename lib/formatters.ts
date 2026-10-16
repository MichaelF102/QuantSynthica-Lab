// DESIGN.md §9 — a non-numeric value always renders as "—", never as a fake zero.
export const MISSING = "—";

export const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export const fmtPrice = (v: unknown) =>
  isNum(v) ? `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : MISSING;

export const fmtPct = (v: unknown, digits = 2, signed = true) =>
  isNum(v) ? `${signed && v > 0 ? "+" : ""}${v.toFixed(digits)}%` : MISSING;

export const fmtX = (v: unknown) => (isNum(v) ? `${v.toFixed(1)}x` : MISSING);

export const fmtInt = (v: unknown) => (isNum(v) ? v.toLocaleString("en-IN") : MISSING);

/** Market cap, input in ₹ Cr. */
export const fmtCapCr = (v: unknown) =>
  !isNum(v) || v <= 0
    ? MISSING
    : v >= 100000
    ? `₹${(v / 100000).toFixed(2)}T`
    : `₹${Math.round(v).toLocaleString("en-IN")} Cr`;

export function formatCurrency(
  value: number | undefined | null,
  currency: "USD" | "INR" | string = "USD"
): string {
  const isINR = currency === "INR" || currency === "₹" || currency === "India";
  const symbol = isINR ? "₹" : "$";
  if (!isNum(value)) return MISSING;
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}${symbol}${abs.toLocaleString(isINR ? "en-IN" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatMarketCap(mcap?: number | null, isIndia: boolean = false): string {
  if (!isNum(mcap) || mcap <= 0) return MISSING;
  if (isIndia) {
    const cr = mcap / 1e7;
    if (cr >= 100000) return `₹${(cr / 100000).toFixed(2)} Lakh Cr`;
    if (cr >= 1) return `₹${cr.toLocaleString("en-IN", { maximumFractionDigits: cr >= 100 ? 0 : 1 })} Cr`;
    const lakh = mcap / 1e5;
    return `₹${lakh.toFixed(1)} Lakh`;
  }
  if (mcap >= 1e12) return `$${(mcap / 1e12).toFixed(2)}T`;
  if (mcap >= 1e9) return `$${(mcap / 1e9).toFixed(2)}B`;
  if (mcap >= 1e6) return `$${(mcap / 1e6).toFixed(1)}M`;
  return `$${mcap.toLocaleString("en-US")}`;
}

export function formatPercent(
  value: number | undefined | null,
  includeSign = true,
  decimals = 2
): string {
  if (!isNum(value)) return MISSING;
  const prefix = includeSign && value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(decimals)}%`;
}

export function formatRatio(
  value: number | undefined | null,
  decimals = 2
): string {
  if (!isNum(value)) return MISSING;
  return value.toFixed(decimals);
}

export function formatNumber(
  value: number | undefined | null,
  decimals = 0
): string {
  if (!isNum(value)) return MISSING;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
