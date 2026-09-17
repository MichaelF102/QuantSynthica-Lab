"use client";

import React, { useState } from "react";
import { AlertTriangle, Trash2, X, Check } from "lucide-react";
import { api } from "@/lib/api";

interface ClearCacheModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ClearCacheModal({
  isOpen,
  onClose,
  onSuccess,
}: ClearCacheModalProps) {
  const [clearing, setClearing] = useState(false);
  const [clearedMsg, setClearedMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setClearing(true);
    try {
      const res = await api.clearMarketCache();
      setClearedMsg(res.message || `Cleared ${res.cleared_files} files.`);
      setTimeout(() => {
        onSuccess();
        onClose();
        setClearedMsg(null);
      }, 1400);
    } catch (err: any) {
      setClearedMsg(`Error: ${err.message}`);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#090D14] border border-[#DC2626]/50 rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E2530] bg-[#140A0F]">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
            <h3 className="text-xs font-bold font-mono text-white tracking-wide uppercase">
              Confirm Clear Market Cache
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#1C1217]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 font-mono text-xs text-slate-200">
          <p className="text-slate-300 font-sans leading-relaxed">
            Are you sure you want to clear all cached Parquet market data files from local disk storage?
          </p>
          <div className="p-2.5 rounded bg-[#1A0E13] border border-[#7F1D1D]/40 text-[11px] text-red-300">
            Subsequent backtest simulations and research chart loads will re-fetch data from external providers or synthesize as needed.
          </div>

          {clearedMsg && (
            <div className="flex items-center space-x-1.5 text-xs text-[#10B981] bg-[#064E3B]/20 border border-[#065F46]/40 p-2 rounded">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{clearedMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 px-4 py-3 border-t border-[#1E2530] bg-[#0C111A]">
          <button
            type="button"
            onClick={onClose}
            disabled={clearing}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={clearing}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{clearing ? "Clearing..." : "Clear Market Cache"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
