import Link from "next/link";
import MiniSparkline from "@/components/charts/MiniSparkline";
import { DESK_INDICES, DESK_NAMES } from "@/lib/constants";
import { ArrowRight } from "lucide-react";

function Change({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className={`font-semibold tabular-nums ${up ? "text-market-up" : "text-market-down"}`}>
      {up ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

export default function DeskMarketSummary({
  title,
  seeAllHref,
  seeAllLabel,
  compact = false,
}: {
  title: string;
  seeAllHref: string;
  seeAllLabel: string;
  compact?: boolean;
}) {
  const featured = DESK_INDICES[0];
  const indexRows = compact ? DESK_INDICES.slice(1) : DESK_INDICES;
  const nameRows = compact ? DESK_NAMES.filter((n) => n.symbol !== "MSFT" && n.symbol !== "INFY") : DESK_NAMES;

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="qs-section-label">{title}</h2>
        <Link href={seeAllHref} className="qs-link">
          {seeAllLabel}
          {!compact && <ArrowRight className="h-3.5 w-3.5" />}
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-12">
        <Link href={`/research?ticker=${featured.symbol}`} className="qs-panel p-5 md:col-span-5">
          <div className="text-[13px] text-[#787b86]">
            {compact ? `${featured.name} · ${featured.symbol}` : featured.name}
          </div>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-[28px] font-bold tabular-nums text-white">
              {featured.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <Change value={featured.change} />
          </div>
          <div className="mt-4">
            <MiniSparkline positive={featured.change >= 0} width={compact ? 240 : 220} height={compact ? 52 : 48} />
          </div>
          {!compact && <div className="mt-3 text-[13px] text-[#787b86]">{featured.symbol}</div>}
        </Link>

        <div className="qs-panel md:col-span-3">
          <div className="border-b border-border px-4 py-2.5 text-[13px] font-semibold text-white">
            {compact ? "Indices" : "Major indices"}
          </div>
          <ul>
            {indexRows.map((item) => (
              <li key={item.symbol}>
                <Link
                  href={`/research?ticker=${encodeURIComponent(item.symbol)}`}
                  className="flex items-center justify-between px-4 py-2.5 text-[13px] hover:bg-surface-muted"
                >
                  <span>
                    <span className="block font-semibold text-white">{item.name}</span>
                    <span className="text-[11px] text-[#787b86]">{item.symbol}</span>
                  </span>
                  {compact ? (
                    <Change value={item.change} />
                  ) : (
                    <span className="text-right">
                      <span className="block tabular-nums text-white">
                        {item.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                      <Change value={item.change} />
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="qs-panel md:col-span-4">
          <div className="border-b border-border px-4 py-2.5 text-[13px] font-semibold text-white">
            {compact ? "Watchlist" : "Stocks"}
          </div>
          <ul>
            {nameRows.map((item) => (
              <li key={item.symbol}>
                <Link
                  href={`/research?ticker=${item.symbol}`}
                  className="flex items-center justify-between px-4 py-2 text-[13px] hover:bg-surface-muted"
                >
                  {compact ? (
                    <>
                      <span className="font-semibold text-white">{item.symbol}</span>
                      <Change value={item.change} />
                    </>
                  ) : (
                    <>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-white">{item.symbol}</span>
                        <span className="truncate text-[11px] text-[#787b86]">{item.name}</span>
                      </span>
                      <span className="ml-3 text-right">
                        <span className="block tabular-nums text-white">{item.price.toFixed(2)}</span>
                        <Change value={item.change} />
                      </span>
                    </>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
