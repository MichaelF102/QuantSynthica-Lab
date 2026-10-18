"use client";

import React, { useEffect, useRef, useState } from "react";
import { NotebookPen, Plus, Trash2, Clock, CloudOff } from "lucide-react";
import { Card, EmptyState } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { RunNote } from "@/types";

const stamp = () => new Date().toISOString();
const show = (t: string) => { const d = new Date(t); return Number.isNaN(d.getTime()) ? t : d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }); };

/**
 * Research journal for one run. Notes are stored with the run on the backend, so they survive clearing the browser
 * and travel with the run's JSON export. Notes an earlier version kept in this browser are moved over once.
 */
export default function ResearchNotesView({ backtestId, strategyName, initialNotes }: { backtestId: string; strategyName: string; initialNotes?: RunNote[] }) {
  const key = `algolab_notes_${backtestId}`;
  const [notes, setNotes] = useState<RunNote[]>(initialNotes ?? []);
  const [draft, setDraft] = useState("");
  const [where, setWhere] = useState<"backend" | "browser">("backend");
  const migrated = useRef(false);

  useEffect(() => {
    if (migrated.current) return;
    migrated.current = true;
    let local: RunNote[] = [];
    try { local = (JSON.parse(localStorage.getItem(key) || "[]") as RunNote[]).filter((n) => n.id !== "note_1"); } catch { local = []; }
    if (!local.length) return;
    const have = new Set((initialNotes ?? []).map((n) => n.id));
    const merged = [...(initialNotes ?? []), ...local.filter((n) => !have.has(n.id))];
    setNotes(merged);
    api.saveRunNotes(backtestId, merged).then((r) => { setWhere(r.saved); if (r.saved === "backend") { try { localStorage.removeItem(key); } catch { /* ignore */ } } });
  }, [backtestId, key, initialNotes]);

  const save = (next: RunNote[]) => { setNotes(next); api.saveRunNotes(backtestId, next).then((r) => setWhere(r.saved)); };
  const add = () => {
    const content = draft.trim();
    if (!content) return;
    save([{ id: `note_${Date.now()}`, timestamp: stamp(), content }, ...notes]);
    setDraft("");
  };

  return (
    <div className="space-y-4 font-sans">
      <Card title="Research journal" subtitle={`${strategyName} · run ${backtestId}`} info="Record hypotheses, parameter changes and findings for this run. Notes are saved with the run, so they come with its exports." icon={NotebookPen} tone="purple">
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") add(); }} rows={4} placeholder="Document a hypothesis, a change, or a conclusion…"
          className="w-full resize-y rounded-lg border border-slate-800 bg-[#080d1a] p-3 text-sm text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none" />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Ctrl + Enter to save</span>
          <button onClick={add} disabled={!draft.trim()} className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-40"><Plus className="h-3.5 w-3.5" />Add note</button>
        </div>
        {where === "browser" && <p role="status" className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-300"><CloudOff className="h-3 w-3" />The backend is not reachable, so notes are saved in this browser only and will be moved to the run when it is back.</p>}
      </Card>
      {notes.length === 0 ? (
        <EmptyState icon={NotebookPen} title="No notes yet" hint="Add the first observation for this run above." />
      ) : (
        <div className="space-y-3">{notes.map((n) => (
          <div key={n.id} className="rounded-xl border border-slate-800/90 bg-[#0b1222]/95 p-4">
            <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{show(n.timestamp)}</span>
              <button onClick={() => save(notes.filter((x) => x.id !== n.id))} aria-label="Delete note" className="text-slate-500 transition-colors hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{n.content}</p>
          </div>))}</div>
      )}
    </div>
  );
}
