"use client";

import React from "react";
import { motion } from "framer-motion";
import DataVisual from "./DataVisual";
import AnalysisVisual from "./AnalysisVisual";
import StrategyVisual from "./StrategyVisual";
import BacktestVisual from "./BacktestVisual";
import RiskVisual from "./RiskVisual";
import PortfolioVisual from "./PortfolioVisual";

interface WorkflowVisualProps {
  activeStage: number;
}

export default function WorkflowVisual({ activeStage }: WorkflowVisualProps) {
  const renderVisual = () => {
    switch (activeStage) {
      case 0:
        return <DataVisual key="stage-0" />;
      case 1:
        return <AnalysisVisual key="stage-1" />;
      case 2:
        return <StrategyVisual key="stage-2" />;
      case 3:
        return <BacktestVisual key="stage-3" />;
      case 4:
        return <RiskVisual key="stage-4" />;
      case 5:
        return <PortfolioVisual key="stage-5" />;
      default:
        return <DataVisual key="stage-default" />;
    }
  };

  return (
    <div className="relative h-[460px] sm:h-[490px] w-full select-none">
      <motion.div
        key={activeStage}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.22,
          ease: "easeOut",
        }}
        className="h-full w-full"
      >
        {renderVisual()}
      </motion.div>
    </div>
  );
}
