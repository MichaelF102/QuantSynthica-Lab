"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ResearchSearchLanding from "@/components/research/ResearchSearchLanding";
import ResearchWorkspace from "@/components/research/ResearchWorkspace";

function ResearchRouteController() {
  const searchParams = useSearchParams();
  const queryTicker = searchParams.get("ticker");

  // If no ticker provided in URL parameters -> Render the Search-First Discovery Landing page
  if (!queryTicker) {
    return <ResearchSearchLanding />;
  }

  // Ticker is present in URL (e.g. /research?ticker=RELIANCE&country=India) -> Render the active Research Workspace
  return <ResearchWorkspace />;
}

export default function ResearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#06090E] text-slate-100 flex items-center justify-center font-mono text-xs">
          INITIALIZING RESEARCH TERMINAL...
        </div>
      }
    >
      <ResearchRouteController />
    </Suspense>
  );
}
