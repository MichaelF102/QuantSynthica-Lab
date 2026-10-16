"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ResearchSearchLanding from "@/components/research/ResearchSearchLanding";
import ResearchWorkspace from "@/components/research/ResearchWorkspace";
import { CardSkeleton } from "@/components/ui/Card";

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
        <main className="app-container min-h-screen space-y-4 py-6" aria-busy="true">
          <CardSkeleton rows={2} className="h-32" />
          <CardSkeleton rows={5} />
        </main>
      }
    >
      <ResearchRouteController />
    </Suspense>
  );
}
