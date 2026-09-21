import Link from "next/link";
import DeskMarketSummary from "@/components/desk/DeskMarketSummary";

const FEATURES = [
  {
    title: "Charts",
    body: "One ticker, candles, stats, and a profile. Search US or India from the top bar.",
    href: "/research",
  },
  {
    title: "Strategies",
    body: "Entry and exit rules you can read. Templates if you want a start, builder if you don’t.",
    href: "/strategies",
  },
  {
    title: "Backtests",
    body: "Same engine as the rest of the lab: signal on close, fill at the next open, simple fees.",
    href: "/backtests",
  },
  {
    title: "Analytics",
    body: "Return, drawdown, Sharpe, regimes — after a run, not as decoration.",
    href: "/analytics",
  },
  {
    title: "Portfolio",
    body: "Mix and tail risk for a paper book. No live routing.",
    href: "/portfolio",
  },
  {
    title: "Pairs",
    body: "Hedge ratio and z-score on two names. A lab, not a black box.",
    href: "/pairs",
  },
  {
    title: "Optimization",
    body: "Grid search and walk-forward on the same strategy engine. No hidden fitness.",
    href: "/optimization",
  },
  {
    title: "Risk",
    body: "VaR, drawdown, and simple book weights from completed runs.",
    href: "/risk",
  },
];

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-[1280px] space-y-10 px-4 py-8">
      <section className="max-w-2xl">
        <p className="text-[13px] font-semibold text-[#2962FF]">QuantSynthica Lab</p>
        <h1 className="mt-2 text-[32px] font-bold leading-[1.15] tracking-tight text-white sm:text-[40px]">
          Chart a name. Test the rule. Read the risk.
        </h1>
        <p className="mt-3 text-[16px] leading-relaxed text-[#b2b5be]">
          Delayed quotes, paper fills at t+1, US and India in one search — the same desk as Charts and Backtests.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/app" className="qs-btn-primary px-5 py-2.5 text-[14px]">
            Open markets
          </Link>
          <Link href="/research" className="qs-btn-ghost px-5 py-2.5 text-[14px]">
            Open a chart
          </Link>
        </div>
      </section>

      <DeskMarketSummary
        compact
        title="Inside the lab"
        seeAllHref="/app"
        seeAllLabel="Go to markets"
      />

      <section id="features">
        <h2 className="qs-section-label">Rooms in this build</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Link key={f.title} href={f.href} className="qs-panel p-4 transition-colors hover:bg-surface-muted">
              <h3 className="text-[14px] font-semibold text-white">{f.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#787b86]">{f.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="coverage" className="qs-panel p-5">
        <h2 className="qs-section-label">How it fills</h2>
        <div className="mt-3 grid gap-4 text-[13px] text-[#b2b5be] sm:grid-cols-3">
          <p>
            <span className="block font-semibold text-white">Data</span>
            Delayed / last close via the FastAPI engine. Never labeled live.
          </p>
          <p>
            <span className="block font-semibold text-white">Execution</span>
            Signal on bar close, fill at next open. Commission and slippage are explicit.
          </p>
          <p>
            <span className="block font-semibold text-white">Scope</span>
            Paper book only. US and India symbols. No brokerage connection.
          </p>
        </div>
      </section>
    </div>
  );
}
