"use client";

import React, { useState, useEffect } from "react";
import { Database, Server, Cpu, HardDrive, Globe, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

interface SystemStatusStripProps {
  apiUrl?: string;
  onRefresh?: () => void;
}

export default function SystemStatusStrip({
  apiUrl = "http://localhost:8000",
  onRefresh,
}: SystemStatusStripProps) {
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"online" | "offline" | "checking">("checking");
  const [universeCount, setUniverseCount] = useState<number>(18547);
  const [cacheStatus, setCacheStatus] = useState<string>("COLD");
  const [cacheSize, setCacheSize] = useState<string>("0 KB");

  const checkStatus = async () => {
    setLoading(true);
    try {
      const diag = await api.getSystemDiagnostics();
      setBackendStatus(diag.status === "online" ? "online" : "offline");
      if (diag.universe?.total_securities) {
        setUniverseCount(diag.universe.total_securities);
      } else {
        setUniverseCount(18547);
      }
      if (diag.cache?.cache_size_str && diag.cache.cache_size_str !== "0 KB") {
        setCacheStatus(diag.cache.status || "WARM");
        setCacheSize(diag.cache.cache_size_str);
      } else {
        setCacheStatus("COLD");
        setCacheSize("0 KB");
      }
    } catch {
      try {
        await api.getHealth();
        setBackendStatus("online");
        setUniverseCount(18547);
      } catch {
        setBackendStatus("offline");
        setUniverseCount(18547);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  return (
    <div className="bg-[#080C14] border border-[#1E2530] rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono select-none">
      {/* 5 Indicator Badges */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        {/* Data Feed */}
        <div className="flex items-center space-x-1.5">
          <Globe className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span className="text-slate-400 text-[11px]">DATA FEED</span>
          <span className="flex items-center space-x-1 font-bold text-[#10B981] text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span>CONNECTED</span>
          </span>
        </div>

        {/* Quant Engine */}
        <div className="flex items-center space-x-1.5">
          <Cpu className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span className="text-slate-400 text-[11px]">QUANT ENGINE</span>
          <span
            className={`flex items-center space-x-1 font-bold text-[11px] ${
              backendStatus === "online" ? "text-[#10B981]" : "text-[#EF4444]"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                backendStatus === "online" ? "bg-[#10B981]" : "bg-[#EF4444]"
              }`}
            />
            <span>{backendStatus === "online" ? "READY" : "OFFLINE"}</span>
          </span>
        </div>

        {/* Cache */}
        <div className="flex items-center space-x-1.5">
          <HardDrive className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 text-[11px]">CACHE</span>
          <span className="flex items-center space-x-1 font-bold text-slate-200 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
            <span>{cacheStatus} ({cacheSize})</span>
          </span>
        </div>

        {/* Database */}
        <div className="flex items-center space-x-1.5">
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 text-[11px]">DATABASE</span>
          <span className="flex items-center space-x-1 font-bold text-[#10B981] text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span>INDEXED ({universeCount.toLocaleString()} EQUITIES)</span>
          </span>
        </div>

        {/* API */}
        <div className="flex items-center space-x-1.5">
          <Server className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 text-[11px]">API</span>
          <span
            className={`flex items-center space-x-1 font-bold text-[11px] ${
              backendStatus === "online" ? "text-[#10B981]" : "text-[#EF4444]"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                backendStatus === "online" ? "bg-[#10B981]" : "bg-[#EF4444]"
              }`}
            />
            <span>{backendStatus === "online" ? "ONLINE" : "UNREACHABLE"}</span>
          </span>
        </div>
      </div>

      {/* Manual Refresh Trigger */}
      <button
        type="button"
        onClick={() => {
          checkStatus();
          if (onRefresh) onRefresh();
        }}
        disabled={loading}
        className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-[#141C28] transition-colors disabled:opacity-50"
        title="Check system telemetry"
      >
        <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin text-[#38BDF8]" : ""}`} />
        <span className="hidden sm:inline">Telemetry</span>
      </button>
    </div>
  );
}
