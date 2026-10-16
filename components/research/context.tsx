"use client";

import { createContext, useContext } from "react";
import { MarketBar, MarketDataResponse, StockFundamentals } from "@/types";
import { Region } from "@/lib/research/format";
import { keyStats } from "@/lib/research/derive";

export interface ResearchCtx {
  ticker: string; region: Region; bars: MarketBar[]; bench: MarketBar[] | null; benchSymbol: string; benchLabel: string;
  summary: MarketDataResponse["summary"]; fundamentals: StockFundamentals | null; fundamentalsLoading: boolean;
  stats: NonNullable<ReturnType<typeof keyStats>>; setTab: (t: string) => void;
  /** Incremented by the header Compare button; the price chart turns benchmark comparison on when it changes. */
  compareRequest: number;
}
const Ctx = createContext<ResearchCtx | null>(null);
export const ResearchProvider = Ctx.Provider;
export const useResearch = () => { const c = useContext(Ctx); if (!c) throw new Error("useResearch outside provider"); return c; };
