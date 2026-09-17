"use client";

import React, { useState } from "react";
import { BacktestResult, StrategyConfig } from "@/types";
import { api } from "@/lib/api";
import { BENCHMARKS } from "@/lib/constants";
import { X, Play, RefreshCw, AlertCircle } from "lucide-react";

interface ReRunModalProps {
  backtest: BacktestResult;
  strategy?: StrategyConfig | null;
  onClose: () => void;
  onSuccess: (newBacktestId: string) => void;
}

export default function BacktestReRunModal({
  backtest,
  strategy,
  onClose,
  onSuccess,
}: ReRunModalProps) {
  const [startDate, setStartDate] = useState(backtest.start_date || "2022-01-01");
  const [endDate, setEndDate] = useState(backtest.end_date || "2024-01-01");
  const [benchmark, setBenchmark] = useState(backtest.benchmark || "SPY");
  const [capital, setCapital] = useState(100000);
  const [commission, setCommission] = useState(0.05);
  const [slippage, setSlippage] = useState(0.05);

  const [status, setStatus] = useState<"IDLE" | "QUEUED" | "RUNNING" | "CALCULATING" | "COMPLETE" | "ERROR">("IDLE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stratToRun = strategy || backtest.strategy_config;

  const handleExecute = async () => {
    if (!stratToRun) {
      setErrorMessage("No strategy configuration found to execute.");
      return;
    }

    setStatus("QUEUED");
    setErrorMessage(null);

    try {
      // Simulate visual progression of the execution state machine while running
      setTimeout(() => setStatus("RUNNING"), 400);
      setTimeout(() => setStatus("CALCULATING"), 1000);

      const res = await api.runBacktest(stratToRun, startDate, endDate, benchmark);
      setStatus("COMPLETE");
      setTimeout(() => {
        onSuccess(res.id);
      }, 500);
    } catch (err: any) {
      setStatus("ERROR");
      setErrorMessage(err.message || "Failed to execute backtest");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-xl border border-[#252A31] bg-[#101318] rounded-[2px] shadow-2xl flex flex-col font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#252A31] bg-[#0B0D10]">
          <div>
            <span className="font-bold text-[#D8DCE2] uppercase tracking-wider text-xs">
              RE-RUN BACKTEST SIMULATION
            </span>
            <span className="text-[10px] text-[#59616B] block">
              {backtest.strategy_name} &bull; {backtest.ticker}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[2px] text-[#89919C] hover:text-[#D8DCE2] hover:bg-[#252A31]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Form */}
        <div className="p-4 space-y-4">
          {/* Current Strategy Info Strip */}
          <div className="border border-[#252A31] bg-[#0B0D10] p-2.5 rounded-[2px] space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#59616B]">ASSET & TIMEFRAME:</span>
              <span className="text-[#D8DCE2] font-semibold">{backtest.ticker} &bull; 1D</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#59616B]">MODEL:</span>
              <span className="text-[#38BDF8]">{backtest.strategy_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#59616B]">EXECUTION TIMING:</span>
              <span className="text-[#10B981]">Next Bar Open (Zero Bias)</span>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[10px] text-[#59616B] uppercase mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#0B0D10] border border-[#252A31] rounded-[2px] px-2.5 py-1.5 text-[#D8DCE2] focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-[#59616B] uppercase mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#0B0D10] border border-[#252A31] rounded-[2px] px-2.5 py-1.5 text-[#D8DCE2] focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-[#59616B] uppercase mb-1">Benchmark</label>
              <select
                value={benchmark}
                onChange={(e) => setBenchmark(e.target.value)}
                className="w-full bg-[#0B0D10] border border-[#252A31] rounded-[2px] px-2 py-1.5 text-[#D8DCE2] focus:outline-none focus:border-[#38BDF8]"
              >
                {BENCHMARKS.map((b) => (
                  <option key={b.symbol} value={b.symbol}>
                    {b.symbol} ({b.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-[#59616B] uppercase mb-1">Initial Capital ($)</label>
              <input
                type="number"
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value))}
                className="w-full bg-[#0B0D10] border border-[#252A31] rounded-[2px] px-2.5 py-1.5 text-[#D8DCE2] focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-[#59616B] uppercase mb-1">Commission (%)</label>
              <input
                type="number"
                step="0.01"
                value={commission}
                onChange={(e) => setCommission(Number(e.target.value))}
                className="w-full bg-[#0B0D10] border border-[#252A31] rounded-[2px] px-2.5 py-1.5 text-[#D8DCE2] focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-[#59616B] uppercase mb-1">Slippage (%)</label>
              <input
                type="number"
                step="0.01"
                value={slippage}
                onChange={(e) => setSlippage(Number(e.target.value))}
                className="w-full bg-[#0B0D10] border border-[#252A31] rounded-[2px] px-2.5 py-1.5 text-[#D8DCE2] focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
          </div>

          {/* State Indicator */}
          {status !== "IDLE" && (
            <div className="border border-[#252A31] bg-[#0B0D10] p-2.5 rounded-[2px] flex items-center justify-between text-[11px]">
              <div className="flex items-center space-x-2">
                <RefreshCw className={`h-3.5 w-3.5 ${status !== "COMPLETE" && status !== "ERROR" ? "animate-spin text-[#38BDF8]" : "text-[#10B981]"}`} />
                <span className="text-[#89919C]">STATUS:</span>
                <span className="font-bold text-[#D8DCE2] uppercase">{status}</span>
              </div>
              <span className="text-[10px] text-[#59616B]">
                {status === "QUEUED" && "Dispatched to engine queue..."}
                {status === "RUNNING" && "Evaluating signal transitions..."}
                {status === "CALCULATING" && "Computing metrics & risk..."}
                {status === "COMPLETE" && "Backtest simulation ready."}
                {status === "ERROR" && "Execution failed."}
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="p-2 border border-[#EF4444]/40 bg-[#EF4444]/10 text-[#EF4444] rounded-[2px] flex items-center space-x-2 text-[11px]">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end space-x-2 px-4 py-3 border-t border-[#252A31] bg-[#0B0D10]">
          <button
            onClick={onClose}
            disabled={status === "RUNNING" || status === "CALCULATING"}
            className="px-3 py-1.5 rounded-[2px] border border-[#252A31] bg-[#101318] hover:bg-[#141820] text-[#89919C] hover:text-[#D8DCE2] transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleExecute}
            disabled={status === "RUNNING" || status === "CALCULATING"}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-[2px] bg-[#38BDF8] hover:bg-sky-500 text-[#0B0D10] font-bold transition-colors disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>RUN BACKTEST</span>
          </button>
        </div>
      </div>
    </div>
  );
}
