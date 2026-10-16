"use client";

import React, { useState } from "react";
import { Flame, Play } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useRisk } from "@/lib/risk/context";
import { HISTORICAL } from "@/lib/risk/scenarios";
import { useScenarioRuns } from "@/lib/risk/useScenarios";
import { fmtPct, fmtInt, cn } from "@/lib/utils";
import { signTone } from "@/components/ui/Card";

const KEYS: Record<"India" | "US", string[]> = { India: ["gfc", "taper", "ilfs", "covid", "rates"], US: ["dotcom", "gfc", "covid", "rates", "ukraine"] };

/** Historical stress results; runs on demand because each scenario fetches years of prices. */
export default function StressTestCard() {
  const { source, settings } = useRisk();
  const [run, setRun] = useState(false);
  const defs = KEYS[source.market].map((k) => HISTORICAL.find((d) => d.key === k)!);
  const { results, pending } = useScenarioRuns(defs, source.holdings, settings.benchmark, run);

  return (
    <Card title="Stress test results" subtitle="Current weights replayed through real crises" info="Each row re-runs your current weights through a real historical episode (buy-and-hold from the start of the episode). Holdings without price history then are excluded and the rest renormalised; the row is marked partial. Recovery time is trough to the prior peak."
      icon={Flame} tone="rose" action={!run ? <button type="button" onClick={() => setRun(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-500"><Play className="h-3 w-3 fill-current" /> Run stress tests</button> : pending > 0 ? <span className="text-[11px] text-slate-400">Running… {defs.length - pending}/{defs.length}</span> : undefined}>
      {!run ? <p className="py-8 text-center text-xs text-slate-500">Replays fetch several years of prices per scenario, so they run on request.</p> : (
        <div className="w-full overflow-x-auto"><table className="w-full border-collapse text-xs">
          <thead><tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400"><th className="py-1.5 text-left">Scenario</th><th className="py-1.5 text-right">Portfolio return</th><th className="py-1.5 text-right">Max drawdown</th><th className="py-1.5 text-right">Recovery</th></tr></thead>
          <tbody className="divide-y divide-slate-800/50">
            {defs.map((d) => {
              const r = results[d.key];
              return (
                <tr key={d.key} className="transition-colors hover:bg-slate-800/30">
                  <td className="py-2 text-slate-200">{d.label}{r?.status === "partial" && <span title={`Excluded (no history): ${r.excluded.join(", ")}`} className="ml-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 font-mono text-[9px] text-amber-400">partial</span>}</td>
                  {!r ? <td colSpan={3} className="py-2"><div className="h-4 animate-pulse rounded bg-slate-800/60" /></td> : r.status === "unavailable" ? <td colSpan={3} className="py-2 text-right text-slate-500">— {r.error}</td> : (
                    <>
                      <td className={cn("py-2 text-right font-mono font-semibold", signTone(r.totalReturn))}>{fmtPct(r.totalReturn)}</td>
                      <td className="py-2 text-right font-mono text-rose-400">{fmtPct(-r.maxDD)}</td>
                      <td className={cn("py-2 text-right font-mono", r.recoveryDays === null ? "text-amber-400" : "text-slate-200")}>{r.maxDD === 0 ? "—" : r.recoveryDays === null ? "not within 3Y" : `${fmtInt(r.recoveryDays)} days`}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table></div>
      )}
    </Card>
  );
}
