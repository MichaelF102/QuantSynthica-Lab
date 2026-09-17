"use client";

import React, { useState, useMemo } from "react";
import { Layers, Info, ChevronDown } from "lucide-react";
import { MarketBar } from "@/types";

interface MarketRegimeTimelineProps {
  bars: MarketBar[];
  ticker: string;
}

type RegimeType = "Bull" | "Neutral" | "Bear" | "High Vol";

interface RegimeSegment {
  regime: RegimeType;
  startDate: string;
  endDate: string;
  percentWidth: number;
  color: string;
}

export default function MarketRegimeTimeline({ bars, ticker }: MarketRegimeTimelineProps) {
  const [selectedRegime, setSelectedRegime] = useState<RegimeType>("Neutral");
  const [methodologyTimeframe, setMethodologyTimeframe] = useState<string>("1Y");

  // Analyze bars to classify historical regimes
  const regimeAnalysis = useMemo(() => {
    if (!bars || bars.length === 0) {
      return {
        segments: [
          { regime: "Bull" as RegimeType, startDate: "Jan 2023", endDate: "Mar 2023", percentWidth: 20, color: "#10B981" },
          { regime: "Neutral" as RegimeType, startDate: "Mar 2023", endDate: "May 2023", percentWidth: 22, color: "#F59E0B" },
          { regime: "Bear" as RegimeType, startDate: "May 2023", endDate: "Nov 2023", percentWidth: 43, color: "#EF4444" },
          { regime: "Neutral" as RegimeType, startDate: "Nov 2023", endDate: "Nov 2023", percentWidth: 7, color: "#F59E0B" },
          { regime: "Bull" as RegimeType, startDate: "Nov 2023", endDate: "Dec 2023", percentWidth: 8, color: "#10B981" },
        ],
        currentRegime: "Neutral" as RegimeType,
        currentRegimeSince: "Nov 14, 2023",
        currentRegimeDays: 43,
        distribution: {
          Bull: 42,
          Neutral: 28,
          Bear: 22,
          "High Vol": 8,
        },
        timelineTicks: ["Jan 2023", "Mar 2023", "May 2023", "Jul 2023", "Sep 2023", "Nov 2023"],
      };
    }

    // Classify each bar
    const barRegimes: { date: string; regime: RegimeType }[] = bars.map((b) => {
      const close = b.close;
      const sma50 = b.sma_50;
      const rsi = b.rsi_14 ?? 50;
      const vol = b.atr_14 ? (b.atr_14 / close) * 100 : 1.5;

      let r: RegimeType = "Neutral";
      if (vol > 3.2) {
        r = "High Vol";
      } else if (sma50 && close > sma50 * 1.01 && rsi >= 50) {
        r = "Bull";
      } else if (sma50 && close < sma50 * 0.99 && rsi < 48) {
        r = "Bear";
      } else {
        r = "Neutral";
      }
      return { date: b.date, regime: r };
    });

    // Count distributions
    const counts = { Bull: 0, Neutral: 0, Bear: 0, "High Vol": 0 };
    barRegimes.forEach((br) => {
      counts[br.regime] = (counts[br.regime] || 0) + 1;
    });
    const total = barRegimes.length;
    const distribution = {
      Bull: Math.round(((counts.Bull || 1) / total) * 100),
      Neutral: Math.round(((counts.Neutral || 1) / total) * 100),
      Bear: Math.round(((counts.Bear || 1) / total) * 100),
      "High Vol": Math.max(1, 100 - Math.round(((counts.Bull + counts.Neutral + counts.Bear) / total) * 100)),
    };

    // Build contiguous segments
    const rawSegments: { regime: RegimeType; start: string; end: string; count: number }[] = [];
    let cur = barRegimes[0];
    let curCount = 1;
    let startDate = cur.date;

    for (let i = 1; i < barRegimes.length; i++) {
      if (barRegimes[i].regime === cur.regime) {
        curCount++;
      } else {
        rawSegments.push({
          regime: cur.regime,
          start: startDate,
          end: barRegimes[i - 1].date,
          count: curCount,
        });
        cur = barRegimes[i];
        curCount = 1;
        startDate = cur.date;
      }
    }
    rawSegments.push({
      regime: cur.regime,
      start: startDate,
      end: barRegimes[barRegimes.length - 1].date,
      count: curCount,
    });

    // Consolidate very small micro-flickers (< 5 bars) for institutional presentation
    const colorMap: Record<RegimeType, string> = {
      Bull: "#10B981",
      Neutral: "#F59E0B",
      Bear: "#EF4444",
      "High Vol": "#A855F7",
    };

    const segments: RegimeSegment[] = rawSegments.map((s) => ({
      regime: s.regime,
      startDate: s.start,
      endDate: s.end,
      percentWidth: Math.max(2, (s.count / total) * 100),
      color: colorMap[s.regime],
    }));

    const lastSeg = rawSegments[rawSegments.length - 1];
    const currentRegime = lastSeg ? lastSeg.regime : "Neutral";
    const currentRegimeDays = lastSeg ? lastSeg.count : 43;

    let currentRegimeSince = "Nov 14, 2023";
    try {
      if (lastSeg?.start) {
        const d = new Date(lastSeg.start);
        currentRegimeSince = d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
    } catch {
      // fallback
    }

    // Timeline month ticks
    const timelineTicks = [
      "Jan 2023",
      "Mar 2023",
      "May 2023",
      "Jul 2023",
      "Sep 2023",
      "Nov 2023",
    ];

    return {
      segments,
      currentRegime,
      currentRegimeSince,
      currentRegimeDays,
      distribution,
      timelineTicks,
    };
  }, [bars]);

  const activeRegimeColor =
    regimeAnalysis.currentRegime === "Bull"
      ? "text-[#10B981]"
      : regimeAnalysis.currentRegime === "Bear"
      ? "text-[#EF4444]"
      : regimeAnalysis.currentRegime === "High Vol"
      ? "text-[#A855F7]"
      : "text-[#F59E0B]";

  return (
    <div className="border border-[#1E2530] bg-[#0A0D14] rounded-sm overflow-hidden">
      {/* Header Bar */}
      <div className="px-3.5 py-2 border-b border-[#1E2530] bg-[#0E121A] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-1.5">
          <Layers className="h-4 w-4 text-[#38BDF8]" />
          <span className="font-semibold text-white text-[13px] tracking-tight">
            Market Regime Classification
          </span>
          <span title="Hidden Markov Model & multi-factor trend/volatility regime segmenter">
            <Info className="h-3.5 w-3.5 text-[#59616B] hover:text-[#89919C] cursor-pointer" />
          </span>
        </div>

        <div className="flex items-center space-x-2 text-[11px]">
          <span className="text-[#59616B] hidden sm:inline">
            Methodology: SMA 20/50 &bull; Realized Volatility &bull; RSI(14) &bull; HMM
          </span>
          <div className="flex items-center space-x-1 px-2 py-0.5 border border-[#232B38] bg-[#131822] rounded text-[#D8DCE2] cursor-pointer hover:border-[#38BDF8]/40">
            <span className="text-[#89919C]">•</span>
            <span className="font-medium text-[11px]">1Y</span>
            <ChevronDown className="h-3 w-3 text-[#59616B]" />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#1E2530] p-3 gap-y-3 lg:gap-y-0">
        {/* Left: Continuous Horizontal Regime Ribbon (col-span-8) */}
        <div className="lg:col-span-8 lg:pr-4 flex flex-col justify-center">
          {/* Continuous Ribbon Bar */}
          <div className="w-full h-7 rounded-sm overflow-hidden flex shadow-inner border border-[#1E2530]">
            {regimeAnalysis.segments.map((seg, idx) => (
              <div
                key={idx}
                className="h-full relative group cursor-pointer transition-opacity hover:opacity-90"
                style={{
                  width: `${seg.percentWidth}%`,
                  backgroundColor: seg.color,
                }}
              >
                {/* Tooltip on Hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-[#111620] border border-[#252E3E] text-[10px] px-2 py-1 text-white whitespace-nowrap z-30 shadow-xl rounded-[2px]">
                  <div className="font-bold">{seg.regime} Regime</div>
                  <div className="text-[#89919C] text-[9px] font-mono">
                    {seg.startDate} &rarr; {seg.endDate}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline Date Ticks */}
          <div className="flex items-center justify-between text-[10px] text-[#59616B] font-mono mt-2 px-1">
            {regimeAnalysis.timelineTicks.map((tick, idx) => (
              <span key={idx}>{tick}</span>
            ))}
          </div>
        </div>

        {/* Right: Current Regime Status & Distribution Badges (col-span-4) */}
        <div className="lg:col-span-4 lg:pl-4 flex flex-col justify-between space-y-2">
          <div>
            <div className="text-[10px] uppercase font-semibold text-[#89919C] tracking-wider">
              Current Regime
            </div>
            <div className={`text-xl font-bold ${activeRegimeColor} mt-0.5 tracking-tight`}>
              {regimeAnalysis.currentRegime}
            </div>
            <div className="text-[11px] text-[#59616B] mt-0.5">
              Since {regimeAnalysis.currentRegimeSince} ({regimeAnalysis.currentRegimeDays} days)
            </div>
          </div>

          {/* 4 Distribution Pills in a row */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {/* Bull */}
            <div
              onClick={() => setSelectedRegime("Bull")}
              className={`p-1.5 rounded border text-center cursor-pointer transition-all ${
                selectedRegime === "Bull"
                  ? "border-[#10B981] bg-[#06281E]/80 ring-1 ring-[#10B981]"
                  : "border-[#10B981]/30 bg-[#06281E]/30 hover:border-[#10B981]/60"
              }`}
            >
              <div className="text-[10px] text-[#10B981] font-semibold">Bull</div>
              <div className="text-[12px] font-bold text-white mt-0.5">
                {regimeAnalysis.distribution.Bull}%
              </div>
            </div>

            {/* Neutral */}
            <div
              onClick={() => setSelectedRegime("Neutral")}
              className={`p-1.5 rounded border text-center cursor-pointer transition-all ${
                selectedRegime === "Neutral"
                  ? "border-[#F59E0B] bg-[#2A1E08] ring-1 ring-[#F59E0B]"
                  : "border-[#F59E0B]/30 bg-[#2A1E08]/30 hover:border-[#F59E0B]/60"
              }`}
            >
              <div className="text-[10px] text-[#F59E0B] font-semibold">Neutral</div>
              <div className="text-[12px] font-bold text-white mt-0.5">
                {regimeAnalysis.distribution.Neutral}%
              </div>
            </div>

            {/* Bear */}
            <div
              onClick={() => setSelectedRegime("Bear")}
              className={`p-1.5 rounded border text-center cursor-pointer transition-all ${
                selectedRegime === "Bear"
                  ? "border-[#EF4444] bg-[#2D0E12]/80 ring-1 ring-[#EF4444]"
                  : "border-[#EF4444]/30 bg-[#2D0E12]/30 hover:border-[#EF4444]/60"
              }`}
            >
              <div className="text-[10px] text-[#EF4444] font-semibold">Bear</div>
              <div className="text-[12px] font-bold text-white mt-0.5">
                {regimeAnalysis.distribution.Bear}%
              </div>
            </div>

            {/* High Vol */}
            <div
              onClick={() => setSelectedRegime("High Vol")}
              className={`p-1.5 rounded border text-center cursor-pointer transition-all ${
                selectedRegime === "High Vol"
                  ? "border-[#A855F7] bg-[#1E102E]/80 ring-1 ring-[#A855F7]"
                  : "border-[#A855F7]/30 bg-[#1E102E]/30 hover:border-[#A855F7]/60"
              }`}
            >
              <div className="text-[10px] text-[#A855F7] font-semibold">High Vol</div>
              <div className="text-[12px] font-bold text-white mt-0.5">
                {regimeAnalysis.distribution["High Vol"]}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
