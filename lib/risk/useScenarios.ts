"use client";

import { useEffect, useRef, useState } from "react";
import { Holding } from "@/lib/portfolio/engine";
import { ScenarioDef, ScenarioResult, empiricalWindows, replayScenario } from "./scenarios";

const cache = new Map<string, ScenarioResult>();
const inflight = new Map<string, Promise<ScenarioResult>>();

const keyOf = (d: ScenarioDef, h: Holding[], b: string) => `${d.key}|${d.start}|${d.end}|${b}|${h.map((x) => `${x.ticker}:${x.weight}`).join(",")}`;

/** Replays scenarios with at most `limit` in flight; results appear one by one as they complete. */
export function useScenarioRuns(defs: ScenarioDef[], holdings: Holding[], benchmark: string, enabled = true, limit = 3) {
  const [, bump] = useState(0);
  const sig = JSON.stringify([defs.map((d) => [d.key, d.start, d.end]), holdings, benchmark, enabled]);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  useEffect(() => {
    if (!enabled) return;
    const todo = defs.filter((d) => !cache.has(keyOf(d, holdings, benchmark)));
    let next = 0;
    const worker = async () => {
      while (next < todo.length) {
        const def = todo[next++];
        const k = keyOf(def, holdings, benchmark);
        let p = inflight.get(k);
        if (!p) { p = replayScenario(def, holdings, benchmark).finally(() => inflight.delete(k)); inflight.set(k, p); }
        const res = await p;
        cache.set(k, res);
        if (alive.current) bump((n) => n + 1);
      }
    };
    Promise.all(Array.from({ length: Math.min(limit, todo.length) }, worker));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const results: Record<string, ScenarioResult | undefined> = {};
  defs.forEach((d) => (results[d.key] = cache.get(keyOf(d, holdings, benchmark))));
  return { results, pending: enabled ? defs.filter((d) => !results[d.key]).length : 0 };
}

export function useEmpirical(benchmark: string) {
  const [data, setData] = useState<Awaited<ReturnType<typeof empiricalWindows>> | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    let live = true;
    setState("loading");
    empiricalWindows(benchmark).then((d) => { if (live) { setData(d); setState(d ? "ready" : "error"); } }).catch(() => live && setState("error"));
    return () => { live = false; };
  }, [benchmark]);
  return { data, state };
}
