"use client";

import React from "react";
import { Sliders } from "lucide-react";
import { BacktestResult } from "@/types";
import { EmptyState } from "@/components/ui/Card";

interface AnalyticsFactorsTabProps {
  selectedBacktests: BacktestResult[];
}

// Factor regression (Fama-French / momentum loadings) is not computed by the backend yet.
// Showing hard-coded betas here would present invented numbers as analysis, so say so instead.
export default function AnalyticsFactorsTab({ selectedBacktests }: AnalyticsFactorsTabProps) {
  return (
    <EmptyState
      icon={Sliders}
      title="Factor regression not available"
      hint={
        selectedBacktests.length
          ? "Factor loadings, alpha and R² need a factor-return dataset, which this engine does not compute yet."
          : "Select a backtest to analyse."
      }
    />
  );
}
