/** Research-page formatters. A missing value is always an em dash (DESIGN.md §9). */
import { isNum } from "@/lib/formatters";

export type Region = "India" | "US";
export const symbolOf = (r: Region) => (r === "India" ? "₹" : "$");

export const fmtPx = (v: unknown, region: Region) =>
  isNum(v) ? `${symbolOf(region)}${v.toLocaleString(region === "India" ? "en-IN" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";

/** Large currency amounts: INR in Cr / L Cr, USD in K/M/B/T. Input is in the currency's base unit. */
export function fmtBig(v: unknown, region: Region): string {
  if (!isNum(v) || v === 0) return "—";
  const a = Math.abs(v), sgn = v < 0 ? "-" : "", sym = symbolOf(region);
  if (region === "India") {
    const cr = a / 1e7;
    if (cr >= 1e5) return `${sgn}${sym}${(cr / 1e5).toFixed(2)} L Cr`;
    if (cr >= 1) return `${sgn}${sym}${cr.toLocaleString("en-IN", { maximumFractionDigits: cr >= 100 ? 0 : 1 })} Cr`;
    return `${sgn}${sym}${(a / 1e5).toFixed(2)} L`;
  }
  if (a >= 1e12) return `${sgn}${sym}${(a / 1e12).toFixed(2)}T`;
  if (a >= 1e9) return `${sgn}${sym}${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${sgn}${sym}${(a / 1e6).toFixed(1)}M`;
  return `${sgn}${sym}${a.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function fmtVol(v: unknown, region: Region): string {
  if (!isNum(v) || v <= 0) return "—";
  if (region === "India") {
    if (v >= 1e7) return `${(v / 1e7).toFixed(2)} Cr`;
    if (v >= 1e5) return `${(v / 1e5).toFixed(2)} L`;
    return v.toLocaleString("en-IN");
  }
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toLocaleString("en-US");
}

export const num = (v: unknown, d = 2) => (isNum(v) ? v.toFixed(d) : "—");

export function relTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  if (m < 43200) return `${Math.round(m / 1440)}d ago`;
  return new Date(iso).toISOString().slice(0, 10);
}

export const daysSince = (date: string) => Math.floor((Date.now() - new Date(date + "T00:00:00Z").getTime()) / 86400000);
