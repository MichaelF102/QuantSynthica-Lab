"use client";

import React, { useState, useEffect } from "react";
import { Terminal, RefreshCw, CheckCircle2, AlertCircle, X, Copy, Check } from "lucide-react";
import { api } from "@/lib/api";

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DiagnosticsModal({ isOpen, onClose }: DiagnosticsModalProps) {
  const [running, setRunning] = useState(false);
  const [diagData, setDiagData] = useState<any>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const runDiagnostics = async () => {
    setRunning(true);
    const t0 = performance.now();
    try {
      const res = await api.getSystemDiagnostics();
      const t1 = performance.now();
      setLatencyMs(Math.round(t1 - t0));
      setDiagData(res);
    } catch (err: any) {
      setDiagData({ status: "offline", error: err.message });
      setLatencyMs(null);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!diagData) return;
    navigator.clipboard.writeText(JSON.stringify(diagData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#090D14] border border-[#1E2C40] rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E2530] bg-[#0C111A]">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-[#38BDF8]" />
            <h3 className="text-xs font-bold font-mono text-white tracking-wide uppercase">
              Full System Telemetry &amp; Diagnostics
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#151C28]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 font-mono text-xs text-slate-200">
          {/* Top telemetry bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="bg-[#111722] p-2.5 rounded border border-[#1E2B3E]">
              <span className="text-slate-500 block text-[10px]">ENGINE STATUS</span>
              <span className="text-[#10B981] font-bold">
                {diagData?.status === "online" ? "● ACTIVE" : "● OFFLINE"}
              </span>
            </div>
            <div className="bg-[#111722] p-2.5 rounded border border-[#1E2B3E]">
              <span className="text-slate-500 block text-[10px]">API LATENCY</span>
              <span className="text-[#38BDF8] font-bold">
                {latencyMs !== null ? `~${latencyMs} ms` : "—"}
              </span>
            </div>
            <div className="bg-[#111722] p-2.5 rounded border border-[#1E2B3E]">
              <span className="text-slate-500 block text-[10px]">PYTHON RUNTIME</span>
              <span className="text-slate-200 font-bold">
                {diagData?.python_version ? `v${diagData.python_version}` : "Python 3.12"}
              </span>
            </div>
            <div className="bg-[#111722] p-2.5 rounded border border-[#1E2B3E]">
              <span className="text-slate-500 block text-[10px]">PLATFORM</span>
              <span className="text-slate-200 font-bold uppercase">
                {diagData?.platform || "Linux x86_64"}
              </span>
            </div>
          </div>

          {/* Dependencies Grid */}
          <div className="bg-[#0B0F18] border border-[#1C2636] rounded-lg p-3 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quantitative Dependencies &amp; Solvers
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              {diagData?.dependencies ? (
                Object.entries(diagData.dependencies).map(([pkg, info]: [string, any]) => (
                  <div
                    key={pkg}
                    className="flex items-center justify-between p-2 rounded bg-[#101622] border border-[#192434]"
                  >
                    <span className="text-slate-300 font-medium">{pkg}</span>
                    <span
                      className={`text-[10px] font-bold flex items-center space-x-1 ${
                        info.available ? "text-[#10B981]" : "text-slate-500"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          info.available ? "bg-[#10B981]" : "bg-slate-600"
                        }`}
                      />
                      <span>
                        {info.available
                          ? info.version
                            ? `v${info.version}`
                            : "READY"
                          : "NOT INSTALLED"}
                      </span>
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 col-span-3 py-2">Loading package status...</div>
              )}
            </div>
          </div>

          {/* Storage & Database Diagnostics */}
          <div className="bg-[#0B0F18] border border-[#1C2636] rounded-lg p-3 space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Equities Universe &amp; Cache Storage
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[#161F2C]">
                <span className="text-slate-400">Indexed Securities (CSV Universe)</span>
                <span className="font-bold text-white">
                  {diagData?.universe?.total_securities?.toLocaleString() || "18,546"} equities
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#161F2C]">
                <span className="text-slate-400">US Equities / India Equities</span>
                <span className="text-slate-300">
                  {diagData?.universe?.us_equities?.toLocaleString() || "10,936"} /{" "}
                  {diagData?.universe?.india_equities?.toLocaleString() || "7,610"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#161F2C]">
                <span className="text-slate-400">Parquet Cache Directory</span>
                <span className="text-slate-400 font-mono text-[10px] truncate max-w-xs">
                  {diagData?.cache?.directory || "backend/data/cache"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Cached Data Volume</span>
                <span className="text-slate-300">
                  {diagData?.cache?.total_cached_files || 0} files ({diagData?.cache?.cache_size_str || "0 KB"})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#1E2530] bg-[#0C111A]">
          <button
            type="button"
            onClick={runDiagnostics}
            disabled={running}
            className="flex items-center space-x-1.5 text-xs text-[#38BDF8] hover:text-white px-3 py-1.5 rounded bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 border border-[#38BDF8]/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${running ? "animate-spin" : ""}`} />
            <span>{running ? "Scanning..." : "Re-Run Diagnostics"}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded bg-[#16202E] hover:bg-[#1E2B3E] border border-[#233348] transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy JSON"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs bg-[#0284C7] hover:bg-[#0369A1] text-white font-medium rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
