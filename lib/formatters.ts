export function formatCurrency(
  value: number | undefined | null,
  currency: "USD" | "INR" | string = "USD"
): string {
  const isINR = currency === "INR" || currency === "₹" || currency === "India";
  const symbol = isINR ? "₹" : "$";
  if (value === undefined || value === null || isNaN(value)) return `${symbol}0.00`;
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}${symbol}${abs.toLocaleString(isINR ? "en-IN" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPrice(
  value: number | undefined | null,
  isIndia: boolean = false,
  decimals: number = 2
): string {
  const symbol = isIndia ? "₹" : "$";
  if (value === undefined || value === null || isNaN(value)) return `${symbol}0.00`;
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return `${sign}${symbol}${abs.toLocaleString(isIndia ? "en-IN" : "en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatMarketCap(mcap?: number | null, isIndia: boolean = false): string {
  if (!mcap || isNaN(mcap) || mcap <= 0) return "N/A";
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
  if (value === undefined || value === null || isNaN(value)) return "0.00%";
  const prefix = includeSign && value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(decimals)}%`;
}

export function formatRatio(
  value: number | undefined | null,
  decimals = 2
): string {
  if (value === undefined || value === null || isNaN(value)) return "0.00";
  return value.toFixed(decimals);
}

export function formatNumber(
  value: number | undefined | null,
  decimals = 0
): string {
  if (value === undefined || value === null || isNaN(value)) return "0";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function getReturnColorClass(value: number | undefined | null): string {
  if (!value || value === 0) return "text-slate-300";
  return value > 0 ? "text-market-up font-medium" : "text-market-down font-medium";
}
