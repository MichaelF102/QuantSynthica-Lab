"use client";

import React from "react";
import { AlertCircle, DatabaseZap } from "lucide-react";
import { CardSkeleton, EmptyState } from "@/components/ui/Card";
import { FeedState } from "@/lib/research/feeds";
import { cn } from "@/lib/utils";

export const StatRow = ({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) => (
  <div className="flex items-center justify-between gap-3 border-b border-slate-800/50 py-1.5 text-xs last:border-0">
    <span className="text-slate-400">{label}</span>
    <span className={cn("font-mono font-semibold", value === "—" ? "text-slate-500" : tone ?? "text-slate-100")}>{value}</span>
  </div>
);

type Avail = { available: boolean; reason?: string };

/** Renders a lazy feed with consistent loading / error / "no data from the source" states. */
export function FeedGate<T extends Avail>({ state, children, rows = 4, title = "No data available" }: { state: FeedState<T>; children: (d: T) => React.ReactNode; rows?: number; title?: string }) {
  if (state.status === "idle" || state.status === "loading") return <CardSkeleton rows={rows} className="h-auto" />;
  if (state.status === "error") return <EmptyState icon={AlertCircle} title="Could not load this feed" hint={`${state.error}. Check that the backend is running and try again.`} />;
  if (!state.data || !state.data.available) return <EmptyState icon={DatabaseZap} title={title} hint={state.data?.reason ?? "The data source returned nothing for this security."} />;
  return <>{children(state.data)}</>;
}
