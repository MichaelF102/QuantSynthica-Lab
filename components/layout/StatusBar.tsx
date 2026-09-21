"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

export default function StatusBar() {
  const [timeStr, setTimeStr] = useState("");
  const [engineReady, setEngineReady] = useState(false);
  const [latency, setLatency] = useState("—");

  useEffect(() => {
    const updateTime = () => {
      setTimeStr(new Date().toTimeString().split(" ")[0]);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const check = async () => {
      const t0 = performance.now();
      try {
        const health = await api.getHealth();
        setEngineReady(health.status === "online" || health.engine === "ready");
        setLatency(`${Math.round(performance.now() - t0)} ms`);
      } catch {
        setEngineReady(false);
        setLatency("offline");
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 flex h-7 items-center justify-between border-t border-border bg-[#1e222d] px-4 text-[11px] text-[#787b86]">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className={cn("h-1.5 w-1.5 rounded-full", engineReady ? "bg-market-up" : "bg-brand-amber")} />
          {engineReady ? "Engine connected" : "Frontend only"}
        </span>
        <span className="hidden sm:inline">Fills at next open · t+1</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden md:inline">{latency}</span>
        <span className="tabular-nums text-[#d1d4dc]">{timeStr}</span>
      </div>
    </footer>
  );
}
