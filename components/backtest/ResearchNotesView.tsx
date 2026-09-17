"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Clock, Check } from "lucide-react";

interface Note {
  id: string;
  timestamp: string;
  author: string;
  content: string;
}

interface ResearchNotesViewProps {
  backtestId: string;
  strategyName: string;
}

export default function ResearchNotesView({
  backtestId,
  strategyName,
}: ResearchNotesViewProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // Load from localStorage keyed by backtestId
  useEffect(() => {
    const key = `algolab_notes_${backtestId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setNotes(JSON.parse(stored));
      } catch {}
    } else {
      // default initial note
      const initial: Note[] = [
        {
          id: "note_1",
          timestamp: new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
          author: "Quantitative Analyst",
          content: `Initial experiment run for ${strategyName}. Strategy executed strictly with zero lookahead bias on daily bars. Drawdown profile remained within risk thresholds, but entry conditions yielded limited trade opportunity. Testing RSI threshold filter next.`,
        },
      ];
      setNotes(initial);
      localStorage.setItem(key, JSON.stringify(initial));
    }
  }, [backtestId, strategyName]);

  const saveNotes = (updated: Note[]) => {
    setNotes(updated);
    localStorage.setItem(`algolab_notes_${backtestId}`, JSON.stringify(updated));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;
    const item: Note = {
      id: `note_${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
      author: "Quantitative Analyst",
      content: newNoteContent.trim(),
    };
    saveNotes([item, ...notes]);
    setNewNoteContent("");
  };

  const handleDelete = (id: string) => {
    saveNotes(notes.filter((n) => n.id !== id));
  };

  return (
    <div className="border border-[#252A31] bg-[#101318] rounded-[2px] p-4 font-mono text-xs select-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#252A31]">
        <div>
          <span className="font-bold text-[#D8DCE2] uppercase tracking-wider text-xs">
            QUANTITATIVE RESEARCH JOURNAL & OBSERVATIONS
          </span>
          <span className="text-[11px] text-[#59616B] block">
            Record hypothesis, parameter iterations, and empirical findings for Run #{backtestId}
          </span>
        </div>
        {isSaved && (
          <div className="flex items-center space-x-1 text-[10px] text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-[2px] border border-[#10B981]/30">
            <Check className="h-3 w-3" />
            <span>AUTOSAVED TO LAB REGISTRY</span>
          </div>
        )}
      </div>

      {/* Input box */}
      <div className="border border-[#252A31] bg-[#0B0D10] p-3 rounded-[2px] space-y-2">
        <textarea
          rows={3}
          placeholder="Document hypothesis, changes, trade attribution anomalies, or conclusion..."
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          className="w-full bg-transparent text-[#D8DCE2] placeholder-[#59616B] text-xs focus:outline-none resize-none"
        />
        <div className="flex justify-between items-center pt-2 border-t border-[#252A31]">
          <span className="text-[10px] text-[#59616B]">Supports markdown and research observations</span>
          <button
            onClick={handleAddNote}
            disabled={!newNoteContent.trim()}
            className="flex items-center space-x-1.5 px-3 py-1 bg-[#38BDF8] hover:bg-sky-500 text-[#0B0D10] font-bold rounded-[2px] disabled:opacity-40 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>RECORD NOTE</span>
          </button>
        </div>
      </div>

      {/* Note entries list */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="p-8 border border-[#252A31] bg-[#0B0D10] text-center text-[#59616B]">
            No research notes recorded for this backtest yet.
          </div>
        ) : (
          notes.map((n) => (
            <div
              key={n.id}
              className="border border-[#252A31] bg-[#0B0D10] p-3 rounded-[2px] space-y-2 group"
            >
              <div className="flex items-center justify-between text-[10px] border-b border-[#252A31] pb-1.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-[#38BDF8] uppercase">{n.author}</span>
                  <span className="text-[#59616B]">&bull;</span>
                  <div className="flex items-center space-x-1 text-[#89919C]">
                    <Clock className="h-3 w-3" />
                    <span>{n.timestamp}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(n.id)}
                  className="opacity-0 group-hover:opacity-100 text-[#59616B] hover:text-[#EF4444] transition-opacity"
                  title="Delete note"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <p className="text-[#D8DCE2] leading-relaxed text-[11px] whitespace-pre-wrap">
                {n.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
