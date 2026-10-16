"use client";

import React, { useEffect, useState } from "react";
import { NotebookPen, Plus, Trash2, Clock } from "lucide-react";
import { Card, EmptyState } from "@/components/ui/Card";

interface Note { id: string; timestamp: string; content: string }

/** Research journal for one run. Notes are yours and stay in this browser (localStorage). */
export default function ResearchNotesView({ backtestId, strategyName }: { backtestId: string; strategyName: string }) {
  const key = `algolab_notes_${backtestId}`;
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    try {
      const raw: Note[] = JSON.parse(localStorage.getItem(key) || "[]");
      // Earlier versions seeded a placeholder note; drop it.
      setNotes(raw.filter((n) => n.id !== "note_1"));
    } catch { setNotes([]); }
  }, [key]);

  const save = (next: Note[]) => {
    setNotes(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* storage unavailable */ }
  };
  const add = () => {
    const content = draft.trim();
    if (!content) return;
    save([{ id: `note_${Date.now()}`, timestamp: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }), content }, ...notes]);
    setDraft("");
  };

  return (
    <div className="space-y-4 font-sans">
      <Card title="Research journal" subtitle={`${strategyName} · run ${backtestId}`} info="Record hypotheses, parameter changes and findings for this run. Notes are saved in this browser only." icon={NotebookPen} tone="purple">
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") add(); }} rows={4} placeholder="Document a hypothesis, a change, or a conclusion…"
          className="w-full resize-y rounded-lg border border-slate-800 bg-[#080d1a] p-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none" />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Ctrl + Enter to save</span>
          <button onClick={add} disabled={!draft.trim()} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-40"><Plus className="h-3.5 w-3.5" />Add note</button>
        </div>
      </Card>
      {notes.length === 0 ? (
        <EmptyState icon={NotebookPen} title="No notes yet" hint="Add the first observation for this run above." />
      ) : (
        <div className="space-y-3">{notes.map((n) => (
          <div key={n.id} className="rounded-xl border border-slate-800/90 bg-[#0b1222]/95 p-4">
            <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{n.timestamp}</span>
              <button onClick={() => save(notes.filter((x) => x.id !== n.id))} aria-label="Delete note" className="text-slate-500 transition-colors hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{n.content}</p>
          </div>))}</div>
      )}
    </div>
  );
}
