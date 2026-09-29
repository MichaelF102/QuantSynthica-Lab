"use client";

import React from "react";
import { TickerConfig } from "@/lib/market/symbols";

interface TerminalTickerStripProps {
  tickers: TickerConfig[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  secondaryTickers?: TickerConfig[];
}

export const TerminalTickerStrip: React.FC<TerminalTickerStripProps> = ({
  tickers,
  selectedSymbol,
  onSelectSymbol,
  secondaryTickers,
}) => {
  return (
    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 border-b border-border/50 text-xs font-mono select-none">
      <span className="text-[10px] uppercase font-sans tracking-widest text-muted-foreground px-2 hidden sm:inline-block">
        TICKER:
      </span>

      <div className="flex items-center gap-1">
        {tickers.map((t, idx) => {
          const isSelected = selectedSymbol.toUpperCase() === t.symbol.toUpperCase();
          const label = t.displayName || t.symbol;

          return (
            <React.Fragment key={t.symbol}>
              {idx > 0 && <span className="text-border select-none text-[10px]">|</span>}
              <button
                type="button"
                onClick={() => onSelectSymbol(t.symbol)}
                className={`px-2.5 py-1 text-xs font-mono font-medium transition-all duration-150 relative ${
                  isSelected
                    ? "text-primary font-bold bg-primary/10 shadow-sm border border-primary/30 rounded-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-sm border border-transparent"
                }`}
                title={t.name}
              >
                <span>{label}</span>
                {isSelected && (
                  <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {secondaryTickers && secondaryTickers.length > 0 && (
        <>
          <span className="text-border select-none text-xs mx-1">‖</span>
          <span className="text-[10px] uppercase font-sans tracking-wider text-muted-foreground/60 hidden md:inline-block">
            MORE:
          </span>
          <div className="flex items-center gap-1">
            {secondaryTickers.map((t, idx) => {
              const isSelected = selectedSymbol.toUpperCase() === t.symbol.toUpperCase();
              const label = t.displayName || t.symbol;

              return (
                <React.Fragment key={t.symbol}>
                  {idx > 0 && <span className="text-border select-none text-[10px]">|</span>}
                  <button
                    type="button"
                    onClick={() => onSelectSymbol(t.symbol)}
                    className={`px-2 py-1 text-xs font-mono transition-all duration-150 relative ${
                      isSelected
                        ? "text-primary font-bold bg-primary/10 border border-primary/30 rounded-sm"
                        : "text-muted-foreground/80 hover:text-foreground hover:bg-muted/40 rounded-sm border border-transparent"
                    }`}
                    title={t.name}
                  >
                    <span>{label}</span>
                    {isSelected && (
                      <span className="absolute bottom-0 left-1 right-1 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
