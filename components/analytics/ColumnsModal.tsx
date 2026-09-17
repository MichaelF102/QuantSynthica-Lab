"use client";

import React from "react";
import { X, Check } from "lucide-react";

interface ColumnsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allColumns: { id: string; label: string }[];
  visibleColumns: string[];
  onToggleColumn: (colId: string) => void;
}

export default function ColumnsModal({
  isOpen,
  onClose,
  allColumns,
  visibleColumns,
  onToggleColumn,
}: ColumnsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0C1017] border border-[#202C3F] rounded-lg shadow-2xl max-w-sm w-full p-4 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#1E2530]">
          <h3 className="text-sm font-semibold text-white">Customize Table Columns</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {allColumns.map((col) => {
            const isChecked = visibleColumns.includes(col.id);
            return (
              <label
                key={col.id}
                className="flex items-center justify-between p-2 rounded hover:bg-[#131822] cursor-pointer text-xs"
              >
                <span className="text-slate-200">{col.label}</span>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleColumn(col.id)}
                  className="rounded bg-[#131822] border-[#252E3E] text-[#0284C7] focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </label>
            );
          })}
        </div>

        <div className="flex justify-end pt-2 border-t border-[#1E2530]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold rounded"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
