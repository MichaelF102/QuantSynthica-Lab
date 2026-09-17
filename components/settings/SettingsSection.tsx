"use client";

import React from "react";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";

interface SettingsSectionProps {
  id: string;
  numberStr: string;
  title: string;
  description: string;
  statusBadge?: string;
  isModified?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onReset?: () => void;
  children: React.ReactNode;
}

export default function SettingsSection({
  id,
  numberStr,
  title,
  description,
  statusBadge = "CONFIGURED",
  isModified = false,
  isOpen,
  onToggle,
  onReset,
  children,
}: SettingsSectionProps) {
  return (
    <div
      id={id}
      className="bg-[#090D14] border border-[#1E2530] rounded-lg overflow-hidden transition-all duration-200 hover:border-[#2A374A]"
    >
      {/* Clickable Header */}
      <div
        onClick={onToggle}
        className="p-3.5 flex items-center justify-between cursor-pointer select-none bg-[#0B0F18] border-b border-[#1A2230] hover:bg-[#0E1522] transition-colors"
      >
        <div className="flex items-start space-x-3 pr-2">
          {/* Section Number Badge */}
          <span className="font-mono text-xs font-bold text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/25 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
            {numberStr}
          </span>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase font-mono">
                {title}
              </h2>
              {isModified && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" title="Section has unsaved edits" />
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5 line-clamp-1">
              {description}
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Status Badge */}
          <span className="hidden sm:flex items-center space-x-1.5 text-[10px] font-mono px-2 py-0.5 rounded bg-[#131C28] text-slate-300 border border-[#1F2C3E]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span>{statusBadge}</span>
          </span>

          {/* Optional Reset Section Action */}
          {onReset && isModified && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReset();
              }}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1A2535] transition-colors"
              title="Reset this section to defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Chevron */}
          <div className="text-slate-400 p-1">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Expandable Section Body */}
      {isOpen && (
        <div className="p-3.5 sm:p-4 space-y-3.5 bg-[#090D14] animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
}
