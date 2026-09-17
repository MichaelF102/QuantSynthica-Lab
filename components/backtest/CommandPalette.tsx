"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Play,
  RotateCcw,
  BarChart2,
  FileText,
  Settings,
  X,
  BookOpen,
  PieChart,
  ListFilter
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onRunReRun?: () => void;
  onRunCompare?: () => void;
  onSelectTab?: (tabName: string) => void;
  onExportTrades?: () => void;
  onExportEquity?: () => void;
  onOpenReport?: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onRunReRun,
  onRunCompare,
  onSelectTab,
  onExportTrades,
  onExportEquity,
  onOpenReport,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    {
      id: "rerun",
      label: "Re-run Current Backtest",
      shortcut: "R",
      icon: RotateCcw,
      action: () => {
        onClose();
        if (onRunReRun) onRunReRun();
      },
    },
    {
      id: "compare",
      label: "Compare Backtests",
      shortcut: "C",
      icon: BarChart2,
      action: () => {
        onClose();
        if (onRunCompare) onRunCompare();
      },
    },
    {
      id: "tab-overview",
      label: "Switch to: Overview",
      shortcut: "1",
      icon: PieChart,
      action: () => {
        onClose();
        if (onSelectTab) onSelectTab("overview");
      },
    },
    {
      id: "tab-performance",
      label: "Switch to: Performance",
      shortcut: "2",
      icon: BarChart2,
      action: () => {
        onClose();
        if (onSelectTab) onSelectTab("performance");
      },
    },
    {
      id: "tab-trades",
      label: "Switch to: Trades Analysis",
      shortcut: "3 / T",
      icon: ListFilter,
      action: () => {
        onClose();
        if (onSelectTab) onSelectTab("trades");
      },
    },
    {
      id: "tab-risk",
      label: "Switch to: Risk & Tail Analysis",
      shortcut: "4",
      icon: PieChart,
      action: () => {
        onClose();
        if (onSelectTab) onSelectTab("risk");
      },
    },
    {
      id: "tab-notes",
      label: "Switch to: Research Notes",
      shortcut: "N",
      icon: BookOpen,
      action: () => {
        onClose();
        if (onSelectTab) onSelectTab("notes");
      },
    },
    {
      id: "export-trades",
      label: "Export Trade Log CSV",
      shortcut: "E",
      icon: FileText,
      action: () => {
        onClose();
        if (onExportTrades) onExportTrades();
      },
    },
    {
      id: "export-equity",
      label: "Export Equity Curve CSV",
      shortcut: "",
      icon: FileText,
      action: () => {
        onClose();
        if (onExportEquity) onExportEquity();
      },
    },
    {
      id: "tearsheet",
      label: "Generate Quantitative Tearsheet",
      shortcut: "",
      icon: FileText,
      action: () => {
        onClose();
        if (onOpenReport) onOpenReport();
      },
    },
    {
      id: "goto-strategies",
      label: "Navigate to Strategies Lab",
      shortcut: "",
      icon: Settings,
      action: () => {
        onClose();
        router.push("/strategies");
      },
    },
    {
      id: "goto-research",
      label: "Navigate to Security Research Terminal",
      shortcut: "",
      icon: Search,
      action: () => {
        onClose();
        router.push("/research");
      },
    },
  ];

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/80 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-lg border border-[#252A31] bg-[#101318] rounded-[2px] shadow-2xl overflow-hidden font-mono text-xs">
        {/* Search header */}
        <div className="flex items-center px-3 py-2.5 border-b border-[#252A31] bg-[#0B0D10]">
          <Search className="h-4 w-4 text-[#59616B] mr-2" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command or search actions... (Esc to cancel)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-[#D8DCE2] placeholder-[#59616B] text-xs focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded-[2px] bg-[#252A31] text-[10px] text-[#89919C]">
            ESC
          </kbd>
        </div>

        {/* Command list */}
        <div className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-[#59616B]">No matching commands found</div>
          ) : (
            filtered.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#141820] text-left transition-colors group"
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="h-3.5 w-3.5 text-[#89919C] group-hover:text-[#38BDF8]" />
                    <span className="text-[#D8DCE2] group-hover:text-white">{cmd.label}</span>
                  </div>
                  {cmd.shortcut && (
                    <kbd className="px-1.5 py-0.5 rounded-[2px] bg-[#0B0D10] border border-[#252A31] text-[10px] text-[#89919C]">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="px-3 py-1.5 border-t border-[#252A31] bg-[#0B0D10] flex justify-between text-[10px] text-[#59616B]">
          <span>AlgoLab Terminal Command Palette</span>
          <span>Press Enter to select</span>
        </div>
      </div>
    </div>
  );
}
