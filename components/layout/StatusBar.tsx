"use client";

import React, { useEffect, useState } from "react";
import { Database, Server, Clock, ShieldCheck, Zap } from "lucide-react";

export default function StatusBar() {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toTimeString().split(" ")[0] + " UTC"
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 h-6 border-t border-border bg-surface px-3 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none">
      {/* Left System Flags */}
      <div className="flex items-center space-x-5">
        <div className="flex items-center space-x-1.5">
          <Database className="h-3 w-3 text-slate-400" />
          <span className="text-slate-500">DATA:</span>
          <span className="text-slate-300">18,547 EQUITIES (US & INDIA)</span>
        </div>

        <div className="hidden sm:flex items-center space-x-1.5">
          <Server className="h-3 w-3 text-market-up" />
          <span className="text-slate-500">ENGINE:</span>
          <span className="text-market-up">READY</span>
        </div>

        <div className="hidden md:flex items-center space-x-1.5">
          <ShieldCheck className="h-3 w-3 text-slate-400" />
          <span className="text-slate-500">LOOKAHEAD:</span>
          <span className="text-slate-300">ZERO BIAS (t+1 FILLS)</span>
        </div>
      </div>

      {/* Right Execution & Clock Flags */}
      <div className="flex items-center space-x-4">
        <div className="hidden lg:flex items-center space-x-1.5">
          <Zap className="h-3 w-3 text-slate-500" />
          <span className="text-slate-500">LATENCY:</span>
          <span className="text-slate-300">~1.2ms</span>
        </div>

        <div className="flex items-center space-x-1.5">
          <Clock className="h-3 w-3 text-slate-500" />
          <span className="text-slate-300">{timeStr || "12:00:00 UTC"}</span>
        </div>
      </div>
    </footer>
  );
}
