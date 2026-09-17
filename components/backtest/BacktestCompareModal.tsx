"use client";

import React, { useState, useEffect } from "react";
import { BacktestResult } from "@/types";
import { api } from "@/lib/api";
import { formatCurrency, formatPercent, formatRatio } from "@/lib/formatters";
import { X, Check, ArrowRight } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface CompareModalProps {
  currentBacktest: BacktestResult;
  onClose: () => void;
  onSelectCompare?: (backtestId: string) => void;
}

export default function BacktestCompareModal({
  currentBacktest,
  onClose,
  onSelectCompare,
}: CompareModalProps) {
  const [availableBacktests, setAvailableBacktests] = useState<BacktestResult[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([currentBacktest.id]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBacktests()
      .then((bts) => {
        // filter completed runs with metrics
        const valid = bts.filter((b) => b.metrics && b.status === "COMPLETED");
        setAvailableBacktests(valid);
        if (valid.length > 1) {
          const second = valid.find((b) => b.id !== currentBacktest.id);
          if (second) {
            setSelectedIds([currentBacktest.id, second.id]);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentBacktest.id]);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter((item) => item !== id));
      }
    } else {
      if (selectedIds.length < 4) {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  const comparedRuns = availableBacktests.filter((b) => selectedIds.includes(b.id));

  // Normalized equity curves starting at 100
  const normalizedChartData = React.useMemo(() => {
    if (comparedRuns.length === 0) return [];
    
    // Pick the run with the longest date series or first
    const primary = comparedRuns[0];
    if (!primary.equity_curve || primary.equity_curve.length === 0) return [];

    const dateMap = new Map<string, any>();

    comparedRuns.forEach((run, idx) => {
      if (!run.equity_curve || run.equity_curve.length === 0) return;
      const baseVal = run.equity_curve[0].portfolio_value || 100000;
      run.equity_curve.forEach((pt) => {
        const existing = dateMap.get(pt.date) || { date: pt.date };
        existing[`run_${run.id}`] = ((pt.portfolio_value - baseVal) / baseVal) * 100;
        dateMap.set(pt.date, existing);
      });
    });

    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [comparedRuns]);

  const colors = ["#38BDF8", "#10B981", "#F59E0B", "#8B5CF6"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-5xl border border-[#252A31] bg-[#101318] rounded-[2px] shadow-2xl flex flex-col max-h-[90vh] font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#252A31] bg-[#0B0D10]">
          <div>
            <span className="font-bold text-[#D8DCE2] uppercase tracking-wider text-xs">
              MULTI-STRATEGY COMPARATIVE ANALYSIS
            </span>
            <span className="text-[10px] text-[#59616B] block">
              Evaluate risk-adjusted return characteristics across simulation runs
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[2px] text-[#89919C] hover:text-[#D8DCE2] hover:bg-[#252A31]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Selector Strip */}
          <div className="border border-[#252A31] bg-[#0B0D10] p-2.5 rounded-[2px] space-y-2">
            <span className="text-[10px] text-[#59616B] block uppercase tracking-wider">
              SELECT RUNS TO COMPARE (UP TO 4)
            </span>
            <div className="flex flex-wrap gap-2">
              {availableBacktests.map((b) => {
                const isSelected = selectedIds.includes(b.id);
                return (
                  <button
                    key={b.id}
                    onClick={() => toggleSelect(b.id)}
                    className={`flex items-center space-x-1.5 px-2 py-1 rounded-[2px] border text-[11px] transition-colors ${
                      isSelected
                        ? "bg-[#252A31] border-[#38BDF8] text-[#D8DCE2]"
                        : "border-[#252A31] bg-[#101318] text-[#89919C] hover:border-[#59616B]"
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-[1px] border flex items-center justify-center ${isSelected ? "border-[#38BDF8] bg-[#38BDF8] text-[#0B0D10]" : "border-[#59616B]"}`}>
                      {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                    </div>
                    <span>{b.strategy_name}</span>
                    <span className="text-[#59616B]">({b.ticker})</span>
                    <span className={`text-[10px] ${b.metrics && b.metrics.total_return >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                      {b.metrics ? formatPercent(b.metrics.total_return) : "—"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Synchronized Relative Returns Chart */}
          <div className="border border-[#252A31] bg-[#0B0D10] rounded-[2px] p-3 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-[#252A31]">
              <span className="text-[10px] text-[#59616B] uppercase tracking-wider">
                NORMALIZED CUMULATIVE RETURN COMPARISON (%)
              </span>
              <div className="flex items-center space-x-3 text-[11px]">
                {comparedRuns.map((r, i) => (
                  <div key={r.id} className="flex items-center space-x-1">
                    <span className="w-2.5 h-0.5 inline-block" style={{ backgroundColor: colors[i % colors.length] }}></span>
                    <span className="text-[#D8DCE2]">{r.strategy_name} ({r.ticker})</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-[240px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={normalizedChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="#1E232B" strokeDasharray="1 1" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#59616B"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis
                    stroke="#59616B"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(0)}%`}
                  />
                  <Tooltip
                    isAnimationActive={false}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="border border-[#252A31] bg-[#101318] p-2 rounded-[2px] font-mono text-[11px] space-y-1 shadow-lg">
                          <div className="text-[#89919C] text-[10px] pb-1 border-b border-[#252A31]">{d.date}</div>
                          {comparedRuns.map((r, i) => {
                            const val = d[`run_${r.id}`];
                            return (
                              <div key={r.id} className="flex justify-between space-x-4">
                                <span style={{ color: colors[i % colors.length] }}>{r.strategy_name}:</span>
                                <span className={val >= 0 ? "text-[#10B981] font-bold" : "text-[#EF4444] font-bold"}>
                                  {val !== undefined ? `${val >= 0 ? "+" : ""}${val.toFixed(2)}%` : "N/A"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }}
                  />
                  {comparedRuns.map((r, i) => (
                    <Line
                      key={r.id}
                      type="monotone"
                      dataKey={`run_${r.id}`}
                      stroke={colors[i % colors.length]}
                      strokeWidth={1.8}
                      dot={false}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comparative Metrics Table */}
          <div className="border border-[#252A31] overflow-x-auto">
            <table className="w-full font-mono text-[11px] text-right border-collapse">
              <thead>
                <tr className="border-b border-[#252A31] bg-[#0B0D10] text-[#89919C] text-[10px] uppercase">
                  <th className="py-2 px-3 text-left">METRIC</th>
                  {comparedRuns.map((r, i) => (
                    <th key={r.id} className="py-2 px-3" style={{ color: colors[i % colors.length] }}>
                      {r.strategy_name} ({r.ticker})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252A31]/50">
                <tr>
                  <td className="py-1.5 px-3 text-left text-[#89919C]">Total Return</td>
                  {comparedRuns.map((r) => (
                    <td key={r.id} className={`py-1.5 px-3 font-bold ${r.metrics && r.metrics.total_return >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                      {r.metrics ? formatPercent(r.metrics.total_return) : "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-3 text-left text-[#89919C]">CAGR</td>
                  {comparedRuns.map((r) => (
                    <td key={r.id} className="py-1.5 px-3 text-[#D8DCE2]">
                      {r.metrics ? formatPercent(r.metrics.cagr) : "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-3 text-left text-[#89919C]">Sharpe Ratio</td>
                  {comparedRuns.map((r) => (
                    <td key={r.id} className="py-1.5 px-3 text-[#D8DCE2] font-semibold">
                      {r.metrics ? formatRatio(r.metrics.sharpe_ratio) : "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-3 text-left text-[#89919C]">Sortino Ratio</td>
                  {comparedRuns.map((r) => (
                    <td key={r.id} className="py-1.5 px-3 text-[#D8DCE2]">
                      {r.metrics ? formatRatio(r.metrics.sortino_ratio) : "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-3 text-left text-[#89919C]">Maximum Drawdown</td>
                  {comparedRuns.map((r) => (
                    <td key={r.id} className="py-1.5 px-3 text-[#EF4444] font-semibold">
                      {r.metrics ? `-${Math.abs(r.metrics.max_drawdown).toFixed(2)}%` : "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-3 text-left text-[#89919C]">Annualized Volatility</td>
                  {comparedRuns.map((r) => (
                    <td key={r.id} className="py-1.5 px-3 text-[#D8DCE2]">
                      {r.metrics ? `${r.metrics.annualized_volatility.toFixed(2)}%` : "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-3 text-left text-[#89919C]">Win Rate</td>
                  {comparedRuns.map((r) => (
                    <td key={r.id} className="py-1.5 px-3 text-[#D8DCE2]">
                      {r.metrics ? `${r.metrics.win_rate.toFixed(1)}%` : "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-3 text-left text-[#89919C]">Profit Factor</td>
                  {comparedRuns.map((r) => (
                    <td key={r.id} className="py-1.5 px-3 text-[#D8DCE2]">
                      {r.metrics ? formatRatio(r.metrics.profit_factor) : "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 px-3 text-left text-[#89919C]">Total Trades Executed</td>
                  {comparedRuns.map((r) => (
                    <td key={r.id} className="py-1.5 px-3 text-[#38BDF8]">
                      {r.metrics ? r.metrics.num_trades : r.trades.length}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#252A31] bg-[#0B0D10]">
          <span className="text-[10px] text-[#59616B]">
            Quantitative Comparison: Performance metrics are strictly objective and non-predictive.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-[2px] bg-[#252A31] hover:bg-[#38BDF8] hover:text-[#0B0D10] text-[#D8DCE2] font-bold transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
