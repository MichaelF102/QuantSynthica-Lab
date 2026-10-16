"use client";

import React, { Suspense, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, RefreshCw, ShieldAlert } from "lucide-react";
import { RiskProvider, useRisk } from "@/lib/risk/context";
import RiskHeader from "@/components/risk/RiskHeader";
import RiskNav from "@/components/risk/RiskNav";
import { RISK_TABS, RiskTabKey } from "@/components/risk/tabs";
import { CardSkeleton, EmptyState } from "@/components/ui/Card";
import OverviewTab from "@/components/risk/tabs/OverviewTab";
import PortfolioRiskTab from "@/components/risk/tabs/PortfolioRiskTab";
import VarTab from "@/components/risk/tabs/VarTab";
import DrawdownTab from "@/components/risk/tabs/DrawdownTab";
import CorrelationTab from "@/components/risk/tabs/CorrelationTab";
import DecompositionTab from "@/components/risk/tabs/DecompositionTab";

function TabBody({ tab }: { tab: RiskTabKey }) {
  const { status, error, reload, result } = useRisk();

  if (status === "error") {
    return (
      <div className="space-y-3">
        <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</span>
          <button onClick={reload} className="inline-flex items-center gap-1 font-medium text-rose-200 hover:text-white"><RefreshCw className="h-3 w-3" />Retry</button>
        </div>
        <EmptyState icon={ShieldAlert} title="Risk data unavailable" hint="Check the ticker, date range and that the market data service is running." />
      </div>
    );
  }
  if (!result) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} rows={1} className="h-28" />)}</div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12"><div className="xl:col-span-6"><CardSkeleton rows={6} /></div><div className="xl:col-span-3"><CardSkeleton rows={6} /></div><div className="xl:col-span-3"><CardSkeleton rows={6} /></div></div>
      </div>
    );
  }
  const body = (() => {
    switch (tab) {
      case "overview": return <OverviewTab />;
      case "portfolio": return <PortfolioRiskTab />;
      case "var": return <VarTab />;
      case "drawdown": return <DrawdownTab />;
      case "correlation": return <CorrelationTab />;
      case "decomposition": return <DecompositionTab />;
      default: return <EmptyState icon={ShieldAlert} title="Coming in a later phase" hint="This section is built in the next phases." />;
    }
  })();
  return (
    <div className={status === "loading" ? "pointer-events-none opacity-60 transition-opacity" : "transition-opacity"}>
      {result.syntheticTickers.length > 0 && (
        <div role="note" className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
          <span className="mr-2 font-mono font-bold uppercase tracking-wider">Synthetic data</span>
          Price history for {result.syntheticTickers.join(", ")} could not be fetched, so a generated series was used. Treat these figures as illustrative.
        </div>
      )}
      {body}
    </div>
  );
}

function RiskContent() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const raw = sp.get("tab");
  const tab: RiskTabKey = RISK_TABS.some((t) => t.key === raw) ? (raw as RiskTabKey) : "overview";
  const setTab = useCallback((t: RiskTabKey) => {
    const p = new URLSearchParams(sp.toString());
    p.set("tab", t);
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }, [router, pathname, sp]);

  return (
    <main className="app-container min-h-screen animate-fade-up space-y-3 py-6 font-sans">
      <RiskHeader tab={tab} />
      <RiskNav active={tab} onChange={setTab} />
      <TabBody tab={tab} />
    </main>
  );
}

export default function RiskPage() {
  return (
    <RiskProvider>
      <Suspense fallback={<main className="app-container space-y-4 py-6"><CardSkeleton rows={2} className="h-24" /><CardSkeleton rows={6} /></main>}>
        <RiskContent />
      </Suspense>
    </RiskProvider>
  );
}
