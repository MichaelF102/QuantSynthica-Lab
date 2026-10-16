import type { LucideIcon } from "lucide-react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

// DESIGN.md §4.3 — tinted icon tile per semantic meaning.
const TONES = {
  blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  rose: "bg-rose-500/10 border-rose-500/20 text-rose-400",
  amber: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  purple: "bg-purple-500/15 border-purple-500/40 text-purple-300",
} as const;

export type CardTone = keyof typeof TONES;

interface CardProps {
  title: string;
  subtitle?: string;
  /** Explains the metric; shown as the Info icon tooltip. */
  info?: string;
  icon?: LucideIcon;
  tone?: CardTone;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/** DESIGN.md §7.1 card recipe. */
export function Card({ title, subtitle, info, icon: Icon, tone = "blue", action, className, children }: CardProps) {
  return (
    <section
      className={cn(
        "h-full rounded-xl border border-slate-800/90 bg-[#0b1222]/95 p-4 shadow-lg shadow-black/20 backdrop-blur-md",
        className
      )}
    >
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={cn("rounded-lg border p-1.5", TONES[tone])}>
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold tracking-wide text-white">{title}</h3>
              {info && (
                <span title={info} className="text-slate-500 transition-colors hover:text-slate-300">
                  <Info className="h-3.5 w-3.5" aria-label={info} />
                </span>
              )}
            </div>
            {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="min-w-0 max-w-full">{action}</div>}
      </div>
      {children}
    </section>
  );
}

/** DESIGN.md §7.2 loading skeleton — same shell as the card, never zeros. */
export function CardSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div
      className={cn(
        "h-full animate-pulse space-y-3 rounded-xl border border-slate-800/90 bg-[#0b1222]/95 p-4",
        className
      )}
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="h-4 w-40 rounded bg-slate-800" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-9 rounded bg-slate-800/50" />
        ))}
      </div>
    </div>
  );
}

/** DESIGN.md §7.13 empty state — say what is missing and why; never sample data. */
export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-800/90 bg-[#0b1222]/95 px-4 py-12 text-center">
      <Icon className="h-8 w-8 text-slate-600" />
      <p className="text-sm text-slate-300">{title}</p>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Text colour for a signed value: emerald up, rose down, slate for missing. */
export const signTone = (v: number | null | undefined) =>
  typeof v !== "number" || !Number.isFinite(v) ? "text-slate-500" : v > 0 ? "text-emerald-400" : v < 0 ? "text-rose-400" : "text-slate-200";

/** DESIGN.md §7.8 KPI tile. A value of "—" is always muted. */
export function Kpi({
  label,
  value,
  sub,
  tone = "text-white",
  icon: Icon,
  title,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  tone?: string;
  icon?: LucideIcon;
  title?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800/90 bg-[#0b1222]/95 p-3.5" title={title}>
      <div className="mb-0.5 flex items-center gap-1 text-[10px] text-slate-400">
        {Icon && <Icon className="h-3 w-3" />} {label}
      </div>
      <div className={cn("font-mono text-lg font-bold", value === "—" ? "text-slate-500" : tone)}>{value}</div>
      {sub && <div className="font-mono text-[11px] text-slate-400">{sub}</div>}
    </div>
  );
}
