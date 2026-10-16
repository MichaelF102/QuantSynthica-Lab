"use client";

import React from "react";
import { Leaf } from "lucide-react";
import { Card, EmptyState } from "@/components/ui/Card";
import { useResearch } from "../context";

/** Environmental, social and governance ratings: our data source returns no ESG scores, so this says so rather than inventing any. */
export default function EsgTab() {
  const { ticker, setTab } = useResearch();
  return (
    <Card title="ESG ratings" subtitle="Environmental, social and governance" info="ESG scores come from specialist rating agencies. The market-data provider we use returns no sustainability scores for this security, so none are shown." icon={Leaf} tone="emerald">
      <EmptyState icon={Leaf} title="ESG ratings are not available" hint={`Our data source has no sustainability scores for ${ticker.replace(/\.(NS|BO)$/, "")}. For ownership and governance context see the Ownership tab.`}
        action={<button type="button" onClick={() => setTab("ownership")} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800">Open Ownership</button>} />
    </Card>
  );
}
