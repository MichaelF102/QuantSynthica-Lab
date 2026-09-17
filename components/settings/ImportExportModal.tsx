"use client";

import React, { useState } from "react";
import { Download, Upload, Copy, Check, AlertCircle, X, FileJson } from "lucide-react";
import { SystemSettings, exportSettingsJson, validateAndImportSettingsJson } from "@/lib/settings";

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: SystemSettings;
  onImportSuccess: (imported: SystemSettings) => void;
}

export default function ImportExportModal({
  isOpen,
  onClose,
  currentSettings,
  onImportSuccess,
}: ImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<"export" | "import">("export");
  const [importText, setImportText] = useState("");
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState(false);

  if (!isOpen) return null;

  const exportedJson = exportSettingsJson(currentSettings);

  const handleCopy = () => {
    navigator.clipboard.writeText(exportedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([exportedJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `algolab-settings-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleApplyImport = () => {
    setImportError(null);
    if (!importText.trim()) {
      setImportError("Please paste a JSON configuration string or upload a file.");
      return;
    }

    const res = validateAndImportSettingsJson(importText);
    if (!res.success || !res.settings) {
      setImportError(res.error || "Configuration schema validation failed.");
      return;
    }

    onImportSuccess(res.settings);
    setImportSuccessMsg(true);
    setTimeout(() => {
      setImportSuccessMsg(false);
      onClose();
    }, 1200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#090D14] border border-[#1E2C40] rounded-lg shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E2530] bg-[#0C111A]">
          <div className="flex items-center space-x-2">
            <FileJson className="w-4 h-4 text-[#38BDF8]" />
            <h3 className="text-xs font-bold font-mono text-white tracking-wide uppercase">
              System Configuration Import / Export
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

        {/* Tab switcher */}
        <div className="flex border-b border-[#1E2530] bg-[#0B0F18] px-4 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("export")}
            className={`pb-2 px-3 text-xs font-mono font-medium border-b-2 transition-colors ${
              activeTab === "export"
                ? "border-[#38BDF8] text-[#38BDF8]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Export Configuration
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("import")}
            className={`pb-2 px-3 text-xs font-mono font-medium border-b-2 transition-colors ${
              activeTab === "import"
                ? "border-[#38BDF8] text-[#38BDF8]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Import Configuration
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 space-y-3 font-mono text-xs">
          {activeTab === "export" ? (
            <div className="space-y-3">
              <p className="text-slate-400 text-[11px] font-sans">
                Export your current terminal preferences, backtest defaults, and quantitative models as a portable JSON schema. All sensitive credentials and API tokens are omitted.
              </p>
              <textarea
                readOnly
                value={exportedJson}
                rows={10}
                className="w-full bg-[#111722] border border-[#1F2B3E] rounded p-2.5 text-[11px] text-slate-300 font-mono focus:outline-none select-all"
              />
              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#16202E] hover:bg-[#1E2B3E] text-slate-200 border border-[#233348] text-xs transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied to Clipboard" : "Copy JSON"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-400 text-[11px] font-sans">
                Paste an exported QuantSynthica Lab configuration JSON or upload a `.json` file to restore terminal preferences across devices.
              </p>
              <div className="flex items-center space-x-2">
                <label className="cursor-pointer flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#16202E] hover:bg-[#1E2B3E] text-slate-300 border border-[#233348] text-[11px]">
                  <Upload className="w-3 h-3 text-[#38BDF8]" />
                  <span>Upload File</span>
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
                <span className="text-slate-500 text-[10px]">or paste JSON below</span>
              </div>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='Paste {"marketData": { ... }, "research": { ... }}'
                rows={9}
                className="w-full bg-[#111722] border border-[#1F2B3E] focus:border-[#38BDF8] rounded p-2.5 text-[11px] text-white font-mono focus:outline-none"
              />
              {importError && (
                <div className="flex items-center space-x-1.5 text-xs text-[#EF4444] bg-[#7F1D1D]/20 border border-[#991B1B]/40 p-2 rounded">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}
              {importSuccessMsg && (
                <div className="flex items-center space-x-1.5 text-xs text-[#10B981] bg-[#064E3B]/20 border border-[#065F46]/40 p-2 rounded">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Configuration validated and applied successfully!</span>
                </div>
              )}
              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyImport}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-medium transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Validate &amp; Apply</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
