"use client";

import React, { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useRisk } from "@/lib/risk/context";
import { BENCHMARK_OPTIONS, HORIZONS, LOOKBACKS, CONFIDENCE_LABEL, Lookback } from "@/lib/risk/presets";
import { DateRangeField, Field, SelectField } from "./ui/controls";
import { RISK_TABS, RiskField, RiskTabKey } from "./tabs";
import PortfolioStockBasketModal from "@/components/portfolio/PortfolioStockBasketModal";
import { AssetAllocation } from "@/components/portfolio/PortfolioAllocationWidget";
import { SERIES_COLORS } from "@/lib/chartTheme";
import { cn } from "@/lib/utils";

const ASSET = "__asset__", CUSTOM = "__custom__";
const CONF_OPTIONS = [0.9, 0.95, 0.975, 0.99].map((c) => ({ value: c, label: `${(c * 100).toString().replace(/\.0$/, "")}%` }));

export default function RiskHeader({ tab }: { tab: RiskTabKey }) {
  const { settings, update, setLookback, setMarket, sources, source } = useRisk();
  const cfg = RISK_TABS.find((t) => t.key === tab)!;
  const [basketOpen, setBasketOpen] = useState(false);
  const market = settings.market;
  const has = (f: RiskField) => cfg.fields.includes(f);

  const options = useMemo(() => {
    const own = sources.filter((s) => s.market === market);
    return [
      ...own.map((s) => ({ value: s.key, label: `${s.kind === "portfolio" ? "★ " : ""}${s.label}` })),
      { value: ASSET, label: "Single asset…" },
      { value: CUSTOM, label: "Custom basket…" },
    ];
  }, [sources, market]);

  const current = settings.sourceKey === "asset" ? ASSET : settings.sourceKey === "custom" ? CUSTOM : source.key;
  const allocations: AssetAllocation[] = source.holdings.map((h, i) => ({
    ticker: h.ticker, weight: h.weight, targetWeight: h.weight, drift: 0, color: SERIES_COLORS[i % SERIES_COLORS.length], value: Math.round((settings.positionValue * h.weight) / 100),
  }));
  const sym = market === "India" ? "₹" : "$";

  return (
    <header className="relative flex flex-col justify-between gap-4 pb-1 xl:flex-row xl:items-start">
      <div className="pointer-events-none absolute left-1/4 top-0 -z-10 h-24 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 top-0 -z-10 h-24 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
      <div className="flex min-w-0 items-start gap-3 xl:max-w-md">
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-2.5 text-blue-400"><ShieldCheck className="h-8 w-8" /></div>
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">{cfg.title}</h1>
          <p className="mt-1 text-xs leading-relaxed text-secondary">{cfg.desc}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Field label="Market">
          <div className="inline-flex rounded-lg border border-slate-800 bg-[#0b1222] p-0.5 text-[11px]">
            {(["India", "US"] as const).map((m) => (
              <button key={m} type="button" onClick={() => m !== market && setMarket(m)} aria-pressed={market === m}
                className={cn("rounded px-2.5 py-1.5 font-mono transition-colors", market === m ? "bg-blue-600 font-semibold text-white" : "text-slate-400 hover:text-white")}>
                {m === "India" ? "🇮🇳 India" : "🇺🇸 US"}
              </button>
            ))}
          </div>
        </Field>

        {has("source") && (
          <div className="flex items-end gap-2">
            <SelectField label="Portfolio / Asset" value={current} options={options} className="min-w-[170px]"
              onChange={(v) => {
                if (v === ASSET) update({ sourceKey: "asset", assetTicker: settings.assetTicker || (market === "India" ? "RELIANCE" : "AAPL") });
                else if (v === CUSTOM) { setBasketOpen(true); }
                else update({ sourceKey: String(v) });
              }} />
            {current === ASSET && (
              <Field label="Ticker" className="min-w-[110px]">
                <input value={settings.assetTicker} onChange={(e) => update({ assetTicker: e.target.value.toUpperCase().trim() })} placeholder="RELIANCE" aria-label="Asset ticker"
                  className="w-full rounded-lg border border-slate-700/50 bg-[#0F172A]/70 px-3 py-2 font-mono text-xs font-bold text-white outline-none focus:border-blue-500" />
              </Field>
            )}
          </div>
        )}
        {has("benchmark") && (
          <SelectField label="Benchmark" value={settings.benchmark} options={BENCHMARK_OPTIONS[market].map((b) => ({ value: b.symbol, label: b.label }))} onChange={(v) => update({ benchmark: v })} />
        )}
        {has("dates") && <DateRangeField start={settings.start} end={settings.end} onApply={(s, e) => update({ start: s, end: e, lookback: "Custom" })} />}
        {has("confidence") && <SelectField label="Confidence level" value={settings.confidence} options={CONF_OPTIONS} onChange={(v) => update({ confidence: v })} className="min-w-[110px]" />}
        {has("lookback") && (
          <SelectField label="Lookback period" value={settings.lookback} options={LOOKBACKS.map((l) => ({ value: l, label: l === "Custom" ? "Custom" : l.replace("M", " Months").replace("Y", " Year") }))}
            onChange={(v) => v !== "Custom" && setLookback(v as Exclude<Lookback, "Custom">)} className="min-w-[120px]" />
        )}
        {has("horizon") && <SelectField label="Time horizon" value={settings.horizon} options={HORIZONS.map((h) => ({ value: h, label: h === 1 ? "1 Day" : `${h} Days` }))} onChange={(v) => update({ horizon: v })} className="min-w-[110px]" />}
        {has("frequency") && <SelectField label="Time horizon" value={settings.frequency} options={(["Daily", "Weekly", "Monthly"] as const).map((f) => ({ value: f, label: f }))} onChange={(v) => update({ frequency: v })} className="min-w-[110px]" />}
        {has("value") && (
          <Field label={`Portfolio value (${sym})`} className="min-w-[130px]">
            <input type="number" min={1} value={settings.positionValue} onChange={(e) => update({ positionValue: Math.max(1, Number(e.target.value) || 1) })} aria-label="Portfolio value"
              className="w-full rounded-lg border border-slate-700/50 bg-[#0F172A]/70 px-3 py-2 font-mono text-xs text-white outline-none focus:border-blue-500" />
          </Field>
        )}
      </div>

      <PortfolioStockBasketModal
        isOpen={basketOpen}
        onClose={() => setBasketOpen(false)}
        market={market}
        onMarketChange={setMarket}
        allocations={allocations}
        onSaveAllocations={(next) => { update({ sourceKey: "custom", customHoldings: next.map((a) => ({ ticker: a.ticker, weight: a.weight })) }); setBasketOpen(false); }}
        initialCapital={settings.positionValue}
        currency={market === "India" ? "INR" : "USD"}
      />
    </header>
  );
}
